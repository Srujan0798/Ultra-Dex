var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { DI_TOKENS } from '../di/tokens.js';
import { UnifiedMemory } from './unified-api.js';
import { registerAlias, registerSingleton, resolveFromContainer } from '../di/container.js';
let MemoryManager = class {
  memory;
  initialized;
  accessCounts;
  keyToId;
  idToKey;
  tierById;
  constructor(options = {}) {
    this.memory = options.memory || new UnifiedMemory(options);
    this.initialized = false;
    this.accessCounts = /* @__PURE__ */ new Map();
    this.keyToId = /* @__PURE__ */ new Map();
    this.idToKey = /* @__PURE__ */ new Map();
    this.tierById = /* @__PURE__ */ new Map();
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
   * @param {MemoryEntry} entry - Memory entry
   * @returns {Promise<unknown>} Stored result
   */
  async add(entry) {
    await this.initialize();
    const context = {
      text: entry.content,
      metadata: {
        type: entry.type || 'observation',
        source: entry.source || 'user',
        importance: entry.importance || 5,
        ...entry.metadata,
      },
    };
    let priority = 'normal';
    if (entry.importance > 8) priority = 'critical';
    else if (entry.importance > 5) priority = 'high';
    else if (entry.importance < 3) priority = 'low';
    const tags = [context.metadata.type];
    if (entry.importance > 5) tags.push('warm');
    if (context.metadata.type === 'decision') tags.push('cold');
    tags.push('hot');
    const stored = await this.memory.store(context, {
      priority,
      tags,
      sessionId: entry.metadata?.sessionId,
    });
    const key = entry.metadata?.key || stored.id;
    this.keyToId.set(key, stored.id);
    this.idToKey.set(stored.id, key);
    this.tierById.set(stored.id, 'hot');
    this.accessCounts.set(stored.id, 0);
    return { ...stored, key };
  }
  /**
   * Search memory
   * @param {string} query - Search query
   * @param {number} limit - Max results
   * @returns {Promise<MemorySearchResult[]>} Results
   */
  async search(query, limit = 5) {
    await this.initialize();
    const results = await this.memory.retrieve(query, { limit });
    for (const item of results.items) {
      if (!item?.id) continue;
      const current = this.accessCounts.get(item.id) || 0;
      this.accessCounts.set(item.id, current + 1);
    }
    return results.items;
  }
  /**
   * Get specific tier of memory
   * @param {string} tier - Tier name (tags)
   * @returns {Promise<Array>} Results
   */
  async getTier(tier) {
    await this.initialize();
    const targetTier = String(tier);
    const results = await this.memory.retrieve('', { limit: 1e3 });
    return results.items
      .filter((item) => (this.tierById.get(item.id) || 'hot') === targetTier)
      .map((item) => ({
        ...item,
        key: this.idToKey.get(item.id) || item.key || item.id,
      }));
  }
  /**
   * Get memory statistics
   * @returns {Promise<Object>} Stats
   */
  async stats() {
    await this.initialize();
    const stats = this.memory.getStats();
    const hot = await this.getTier('hot');
    const warm = await this.getTier('warm');
    const cold = await this.getTier('cold');
    return {
      ...stats,
      hot: hot.length,
      warm: warm.length,
      cold: cold.length,
    };
  }
  async getTierStats() {
    const hot = await this.getTier('hot');
    const warm = await this.getTier('warm');
    const cold = await this.getTier('cold');
    return {
      hot: hot.length,
      warm: warm.length,
      cold: cold.length,
      total: hot.length + warm.length + cold.length,
    };
  }
  async archiveToCold(key) {
    await this.initialize();
    const id = this.keyToId.get(key);
    if (!id) return false;
    this.tierById.set(id, 'cold');
    if (typeof this.memory.update === 'function') {
      await this.memory.update(id, { tags: ['cold'] });
    }
    return true;
  }
  async runTierSweep() {
    await this.initialize();
    for (const [id, count] of this.accessCounts.entries()) {
      if (count >= 3) {
        this.tierById.set(id, 'hot');
        if (typeof this.memory.update === 'function') {
          await this.memory.update(id, { tags: ['hot'] });
        }
        this.accessCounts.set(id, 0);
      }
    }
    return this.getTierStats();
  }
  async shutdown() {
    if (typeof this.memory.close === 'function') {
      await this.memory.close();
    }
    this.initialized = false;
  }
};
MemoryManager = __decorateClass([singleton()], MemoryManager);
registerSingleton(MemoryManager, () => new MemoryManager());
registerAlias(DI_TOKENS.memoryManager, MemoryManager);
const ppmManager = resolveFromContainer(MemoryManager);
var manager_default = MemoryManager;
import { VectorStore } from './vector-store.js';
import { GraphEngine } from './graph-engine.js';
export { GraphEngine, MemoryManager, VectorStore, manager_default as default, ppmManager };
