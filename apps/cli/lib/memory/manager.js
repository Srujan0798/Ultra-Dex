// Copyright (c) 2026 Ultra-Dex

import { sqliteProvider } from './sqlite.js';

export class MemoryManager {
  constructor(options = {}) {
    this.provider = sqliteProvider;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await this.provider.init();
    this.initialized = true;
  }

  async add(entry) {
    await this.init();
    const record = {
      id: entry.id || `mem_${Date.now()}`,
      content: entry.content,
      type: entry.type || 'observation',
      source: entry.source || 'user',
      metadata: entry.metadata || {},
    };

    // Auto-tiering logic
    await this.provider.add('hot', record);

    if (entry.importance > 5 || record.type === 'decision') {
      await this.provider.add('warm', record);
    }

    if (record.type === 'decision' || record.type === 'constraint') {
      await this.provider.add('cold', record);
    }

    return record;
  }

  async search(query, limit = 5) {
    await this.init();
    // Simple search implementation (to be replaced with vector search later)
    return await this.provider.query(
      'hot',
      `SELECT * FROM hot_memory WHERE content LIKE ? LIMIT ?`,
      [`%${query}%`, limit]
    );
  }

  async why(query) {
    await this.init();
    return await this.provider.query('cold', `SELECT * FROM cold_memory WHERE content LIKE ?`, [
      `%${query}%`,
    ]);
  }

  async getTier(tier) {
    await this.init();
    return await this.provider.list(tier);
  }

  async stats() {
    await this.init();
    const hot = await this.provider.list('hot');
    const warm = await this.provider.list('warm');
    const cold = await this.provider.list('cold');
    return { hot: hot.length, warm: warm.length, cold: cold.length };
  }
}

export const ppmManager = new MemoryManager();
