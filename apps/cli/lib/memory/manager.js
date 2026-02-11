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
      id: entry.id || \`mem_\${Date.now()}\`,
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
    return await this.provider.query('hot', \`SELECT * FROM hot_memory WHERE content LIKE ? LIMIT ?\`, [\`%\${query}%\`, limit]);
  }

  async why(query) {
    await this.init();
    return await this.cold.why(query);
  }

  async getTier(tier) {
    await this.init();
    if (tier === 'hot') return await this.hot.list();
    if (tier === 'warm') return await this.warm.list();
    if (tier === 'cold') return await this.cold.list();
    return [];
  }

  async stats() {
    await this.init();
    const hot = await this.hot.list();
    const warm = await this.warm.list();
    const cold = await this.cold.list();
    return { hot: hot.length, warm: warm.length, cold: cold.length };
  }
}

export const ppmManager = new MemoryManager();

/**
 * Safe execution wrapper with error handling for manager
 * @param {Function} fn - Async function to execute
 * @param {string} [context='manager'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'manager') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
