/**
 * Memory Manager - Persistent Project Memory (PPM)
 * Single source of truth for core memory operations.
 */

import { UnifiedMemory } from './unified-api.js';
import {
  registerAlias,
  registerSingleton,
  resolveFromContainer,
} from '../di/container.js';
import { DI_TOKENS } from '../di/tokens.js';

export class MemoryManager {
  constructor(options = {}) {
    this.memory = new UnifiedMemory(options);
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    await this.memory.initialize();
    this.initialized = true;
  }

  /**
   * Alias for initialize to support legacy calls
   */
  async init() {
    return this.initialize();
  }

  /**
   * Add a memory entry
   * @param {Object} entry - Memory entry
   * @returns {Promise<Object>} Stored result
   */
  async add(entry) {
    await this.initialize();
    
    const context = {
      text: entry.content,
      metadata: {
        type: entry.type || 'observation',
        source: entry.source || 'user',
        importance: entry.importance || 5,
        ...entry.metadata
      }
    };

    // Auto-tiering based on importance
    let priority = 'normal';
    if (entry.importance > 8) priority = 'critical';
    else if (entry.importance > 5) priority = 'high';
    else if (entry.importance < 3) priority = 'low';

    const tags = [context.metadata.type];
    if (entry.importance > 5) tags.push('warm');
    if (context.metadata.type === 'decision') tags.push('cold');
    tags.push('hot'); // All new entries are hot by default

    return await this.memory.store(context, {
      priority,
      tags,
      sessionId: entry.metadata?.sessionId
    });
  }

  /**
   * Search memory
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Results
   */
  async search(query, limit = 5) {
    await this.initialize();
    const results = await this.memory.retrieve(query, { limit });
    return results.items;
  }

  /**
   * Get specific tier of memory
   * @param {string} tier - Tier name (tags)
   * @returns {Promise<Array>} Results
   */
  async getTier(tier) {
    await this.initialize();
    const results = await this.memory.retrieve('', { tags: [tier], limit: 1000 });
    return results.items;
  }

  /**
   * Get memory statistics
   * @returns {Promise<Object>} Stats
   */
  async stats() {
    await this.initialize();
    const stats = this.memory.getStats();
    
    // Supplement with tier counts if possible
    const hot = await this.getTier('hot');
    const warm = await this.getTier('warm');
    const cold = await this.getTier('cold');
    
    return {
      ...stats,
      hot: hot.length,
      warm: warm.length,
      cold: cold.length
    };
  }
}

registerSingleton(MemoryManager, () => new MemoryManager());
registerAlias(DI_TOKENS.memoryManager, MemoryManager);

export const ppmManager = resolveFromContainer(MemoryManager);
export default MemoryManager;

// Re-export VectorStore and GraphEngine for tests
export { VectorStore } from './vector-store.js';
export { GraphEngine } from './graph-engine.js';
