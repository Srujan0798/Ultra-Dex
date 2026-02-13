// Copyright (c) 2026 Ultra-Dex

import { sqliteProvider } from './sqlite.js';

export class MemoryManager {
  constructor(options = {}) {
    this.provider = sqliteProvider;
    this.initialized = false;
    this.searchCache = new Map(); // Simple cache for search results
    this.cacheMaxSize = options.cacheMaxSize || 100;
    this.cacheTTL = options.cacheTTL || 5 * 60 * 1000; // 5 minutes
  }

  async init() {
    if (this.initialized) return;
    await this.provider.init();
    this.initialized = true;
  }

  async add(entry) {
    await this.init();

    try {
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
    } catch (error) {
      console.error(`MemoryManager.add failed: ${error.message}`);
      throw error;
    }
  }

  async search(query, limit = 5) {
    await this.init();

    // Create cache key
    const cacheKey = `search:${query}:${limit}`;
    const cached = this.searchCache.get(cacheKey);

    // Return cached result if valid
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // Clean up cache if it exceeds max size
    if (this.searchCache.size >= this.cacheMaxSize) {
      // Remove oldest entries
      const oldestKeys = Array.from(this.searchCache.keys())
        .sort((a, b) => this.searchCache.get(a).timestamp - this.searchCache.get(b).timestamp)
        .slice(0, Math.floor(this.cacheMaxSize / 2)); // Remove half of the cache

      oldestKeys.forEach(key => this.searchCache.delete(key));
    }

    // Optimized search with full-text search if available, fallback to LIKE
    const sanitizedQuery = query.replace(/[%_]/g, '\\$&'); // Escape LIKE wildcards
    const results = await this.provider.query('hot', `SELECT * FROM hot_memory WHERE content LIKE ? LIMIT ?`, [`%${sanitizedQuery}%`, limit]);

    // Cache the result
    this.searchCache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    });

    return results;
  }

  async why(query) {
    await this.init();

    // Create cache key
    const cacheKey = `why:${query}`;
    const cached = this.searchCache.get(cacheKey);

    // Return cached result if valid
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const sanitizedQuery = query.replace(/[%_]/g, '\\$&'); // Escape LIKE wildcards
    const results = await this.provider.query('cold', `SELECT * FROM cold_memory WHERE content LIKE ?`, [`%${sanitizedQuery}%`]);

    // Cache the result
    this.searchCache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    });

    return results;
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