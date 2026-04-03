// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Storage module with atomic writes and corruption recovery
 * @module ledger/storage
 */

import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { atomicWriteSync, safeReadJSONL } from '../../../../src/core/utils/safe-fs.js';
import {
  CURRENT_SCHEMA_VERSION,
  detectLedgerVersion,
  ledgerMigrator,
} from '../../../../src/core/utils/schema-migrator.js';

const LEDGER_PATH = path.resolve(process.cwd(), '.ultra', 'ledger.jsonl');
const BACKUP_PATH = `${LEDGER_PATH}.bak`;

export class CorruptionError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'CorruptionError';
    this.recovered = options.recovered || false;
    this.backupUsed = options.backupUsed || false;
  }
}

export function computeChecksum(entry) {
  const payload = JSON.stringify({ ...entry, checksum: undefined });
  return `sha256:${crypto.createHash('sha256').update(payload).digest('hex')}`;
}

async function createBackup() {
  try {
    const content = await fs.readFile(LEDGER_PATH, 'utf8');
    await fs.writeFile(BACKUP_PATH, content, 'utf8');
  } catch {
    // Backup creation is best-effort
  }
}

async function recoverFromBackup() {
  try {
    const backupContent = await fs.readFile(BACKUP_PATH, 'utf8');
    await fs.writeFile(LEDGER_PATH, backupContent, 'utf8');
    const entries = safeReadJSONL(LEDGER_PATH, []);
    return entries;
  } catch {
    throw new CorruptionError(
      'Ledger corrupted and no valid backup available for recovery',
      { recovered: false, backupUsed: false }
    );
  }
}

export async function appendEntry(entry) {
  const existingEntries = await readLedger();
  const record = {
    _v: CURRENT_SCHEMA_VERSION,
    id: entry.id || `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    block_id: entry.block_id || entry.blockId,
    task_id: entry.task_id || entry.taskId,
    timestamp: entry.timestamp || new Date().toISOString(),
    agent: entry.agent || 'unknown',
    action: entry.action || 'decision',
    input: entry.input || '',
    output: entry.output || '',
    rationale: entry.rationale || '',
    decision: entry.decision || null,
    constraints_checked: entry.constraints_checked || entry.constraintsChecked || [],
    artifacts: entry.artifacts || [],
    affected_files: entry.affected_files || [],
    metadata: entry.metadata || {},
  };
  record.checksum = computeChecksum(record);

  await createBackup();
  atomicWriteSync(LEDGER_PATH, serializeLedgerEntries([...existingEntries, record]));
  return record;
}

export async function readLedger() {
  let entries;
  try {
    entries = safeReadJSONL(LEDGER_PATH, []);
  } catch {
    entries = await recoverFromBackup();
    return entries;
  }

  // Check if ledger is corrupted (partial JSON, etc.)
  if (entries.length === 0) {
    const rawContent = await fs.readFile(LEDGER_PATH, 'utf8').catch(() => null);
    if (rawContent && rawContent.trim()) {
      // File has content but couldn't parse it - likely corrupted
      entries = await recoverFromBackup();
      return entries;
    }
  }

  const version = detectLedgerVersion(entries);
  if (version < CURRENT_SCHEMA_VERSION) {
    const migrated = ledgerMigrator.migrate(entries, version, CURRENT_SCHEMA_VERSION, {
      recomputeChecksum: computeChecksum,
    });
    await createBackup();
    atomicWriteSync(LEDGER_PATH, serializeLedgerEntries(migrated));
    return migrated;
  }

  return entries;
}

export async function verifyLedger() {
  const entries = await readLedger();
  const invalid = entries.filter((entry) => computeChecksum(entry) !== entry.checksum);
  return { valid: invalid.length === 0, invalid };
}

function serializeLedgerEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return '';
  }

  return `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`;
}

export const ledgerPath = LEDGER_PATH;
