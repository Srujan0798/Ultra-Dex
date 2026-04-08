// Copyright (c) 2026 Ultra-Dex

/**
 * Decision Ledger Schema & Persistence
 * Provides immutable audit trail for agent decisions
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

export interface LedgerBlock {
  block_id: string;
  timestamp: string;
  task_id: string;
  agent: string;
  decision: unknown;
  constraints_checked: string[];
  previous_hash: string;
  hash: string;
}

const LEDGER_PATH = path.resolve(process.cwd(), '.ultra/ledger.jsonl');

/**
 * Generate a hash for a ledger block
 */
function calculateHash(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

/**
 * Append a new block to the immutable ledger
 */
export async function appendBlock(
  data: Omit<LedgerBlock, 'block_id' | 'timestamp' | 'hash' | 'previous_hash'>
): Promise<LedgerBlock> {
  const ultraDir = path.dirname(LEDGER_PATH);

  // Ensure storage directory exists
  try {
    await fs.mkdir(ultraDir, { recursive: true });
  } catch (_e) {
    // Ignore if exists
  }

  // Get last hash
  let previousHash = '0'.repeat(64);
  try {
    const content = await fs.readFile(LEDGER_PATH, 'utf8');
    const lines = content.trim().split('\n');
    if (lines.length > 0) {
      const lastBlock = JSON.parse(lines[lines.length - 1]);
      previousHash = lastBlock.hash;
    }
  } catch (_e) {
    // First block
  }

  const block: LedgerBlock = {
    block_id: Math.random().toString(36).substring(2, 15),
    timestamp: new Date().toISOString(),
    ...data,
    previous_hash: previousHash,
    hash: '',
  };

  block.hash = calculateHash(block);

  await fs.appendFile(LEDGER_PATH, JSON.stringify(block) + '\n');
  return block;
}
