import path from 'path';
import fs from 'fs/promises';
import crypto from 'node:crypto';
import VectorStore from './vector-store.js';

export class WarmTier {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.resolve(process.cwd(), '.ultra-dex', 'memory', 'warm.db');
    this.vectorStore = new VectorStore({ storagePath: this.storagePath });
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await this.vectorStore.init();
    this.initialized = true;
  }

  async add(entry) {
    await this.init();
    const record = {
      id: entry.id || crypto.randomUUID(),
      content: entry.content,
      type: entry.type || 'note',
      timestamp: entry.timestamp || new Date().toISOString(),
      source: entry.source || { agent: 'system' },
      relations: entry.relations || []
    };
    await this.vectorStore.add(record.id, record.content, record);
    return record;
  }

  async search(query, limit = 5) {
    await this.init();
    const results = await this.vectorStore.query(query, limit);
    return results.map((row) => ({
      id: row.id,
      content: row.text,
      score: row.score,
      ...row.metadata
    }));
  }

  async list(limit = 50) {
    await this.init();
    const rows = await this.vectorStore.list(limit);
    return rows.map((row) => ({
      id: row.id,
      content: row.text,
      ...row.metadata
    }));
  }

  async indexProjectDocs() {
    await this.init();
    const docs = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md'];
    for (const doc of docs) {
      try {
        const content = await fs.readFile(path.resolve(process.cwd(), doc), 'utf8');
        await this.add({
          id: `doc-${doc}`,
          content,
          type: 'document',
          source: { agent: 'system', file: doc }
        });
      } catch {
        // ignore missing docs
      }
    }
  }
}

export default WarmTier;
