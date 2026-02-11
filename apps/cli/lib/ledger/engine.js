// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Decision Ledger Engine
 * Immutable append-only log for architectural decisions
 */
export class DecisionLedger {
  constructor() {
    this.ledgerPath = path.resolve(process.cwd(), '.ultra/ledger.jsonl');
  }

  async append(entry) {
    const block = {
      block_id: crypto
        .createHash('sha256')
        .update(JSON.stringify(entry) + Date.now())
        .digest('hex'),
      timestamp: new Date().toISOString(),
      agent_id: entry.agent_id || 'human',
      decision: entry.decision,
      rationale: entry.rationale,
      hash: crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex'),
    };

    await fs.mkdir(path.dirname(this.ledgerPath), { recursive: true });
    await fs.appendFile(this.ledgerPath, JSON.stringify(block) + '\n');
    return block.block_id;
  }

  async search(query) {
    try {
      const content = await fs.readFile(this.ledgerPath, 'utf8');
      const lines = content.trim().split('\n');
      return lines
        .map((l) => JSON.parse(l))
        .filter((b) => JSON.stringify(b).toLowerCase().includes(query.toLowerCase()));
    } catch {
      return [];
    }
  }
}
