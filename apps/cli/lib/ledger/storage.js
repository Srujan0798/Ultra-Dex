// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Storage module
 * @module ledger/storage
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { atomicWriteFile, safeJsonlRead } from '../utils/atomic-fs.js';
import { CURRENT_SCHEMA_VERSION, schemaMigrator } from '../../../../src/core/utils/schema-migrator.js';

const LEDGER_PATH = path.resolve(process.cwd(), '.ultra', 'ledger.jsonl');

export function computeChecksum(entry) {
  const payload = JSON.stringify({ ...entry, checksum: undefined });
  return `sha256:${crypto.createHash('sha256').update(payload).digest('hex')}`;
}

export async function appendEntry(entry) {
  const existingEntries = await readLedger();
  const record = {
    _version: CURRENT_SCHEMA_VERSION,
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

  await fs.mkdir(path.dirname(LEDGER_PATH), { recursive: true });
  await atomicWriteFile(LEDGER_PATH, serializeLedgerEntries([...existingEntries, record]));
  return record;
}

export async function readLedger() {
  const entries = await safeJsonlRead(LEDGER_PATH, []);
  const migration = schemaMigrator.migrate('ledger', entries, { recomputeChecksum: computeChecksum });

  if (migration.migrated) {
    await atomicWriteFile(LEDGER_PATH, serializeLedgerEntries(migration.data));
  }

  return migration.data;
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
