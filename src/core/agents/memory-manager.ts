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
import { UnifiedMemory } from '../memory/unified-api.js';
let AgentMemoryManager = class {
  constructor(config = {}) {
    this.memory = new UnifiedMemory(config);
    this.initialized = false;
    this.config = {
      maxContextTokens: config.maxContextTokens || 8192,
      pruneThreshold: config.pruneThreshold || 0.8,
      ...config,
    };
  }
  async initialize() {
    if (this.initialized) return;
    await this.memory.initialize();
    this.initialized = true;
  }
  /**
   * Store information in a specific tier
   * @param {string} tier - 'hot', 'warm', or 'cold'
   * @param {string} key - Memory key
   * @param {any} value - Value to store
   * @param {Object} options - Additional options
   */
  async store(tier, key, value, options = {}) {
    const priorityMap = {
      hot: 'high',
      warm: 'normal',
      cold: 'low',
    };
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    const tokens = options.tokens || this._estimateTokens(text);
    const context = {
      text,
      tokens,
      metadata: {
        key,
        tier,
        originalValue: value,
        ...options.metadata,
      },
    };
    const result = await this.memory.store(context, {
      priority: priorityMap[tier] || 'normal',
      tags: [tier, ...(options.tags || [])],
      ...options,
    });
    if (tier === 'hot') {
      await this.checkAndPrune();
    }
    return result;
  }
  /**
   * Retrieve information from memory
   * @param {string} query - Search query
   * @param {Object} options - Retrieval options
   */
  async retrieve(query, options = {}) {
    return await this.memory.retrieve(query, options);
  }
  /**
   * Check if pruning is needed and perform it if necessary
   */
  async checkAndPrune() {
    const stats = await this.getTierStats();
    const threshold = this.config.maxContextTokens * this.config.pruneThreshold;
    if (stats.hot.tokens > threshold) {
      return await this.prune('hot', 'warm');
    }
    return false;
  }
  /**
   * Prune items from one tier to another
   * @param {string} fromTier - Tier to prune from
   * @param {string} toTier - Tier to move to
   * @param {Object} options - Pruning options
   */
  async prune(fromTier, toTier, options = {}) {
    const { force = false, amount = 0.2 } = options;
    const stats = await this.getTierStats();
    const threshold = this.config.maxContextTokens * this.config.pruneThreshold;
    if (!force && stats[fromTier].tokens <= threshold) {
      return false;
    }
    const items = await this.retrieve('', {
      tags: [fromTier],
      limit: 1e3,
      sort: 'created_at_asc',
    });
    if (items.items.length === 0) return false;
    const itemsToMoveCount = Math.ceil(items.items.length * amount);
    const itemsToMove = items.items.slice(0, itemsToMoveCount);
    const priorityMap = {
      hot: 'high',
      warm: 'normal',
      cold: 'low',
    };
    for (const item of itemsToMove) {
      await this.memory.update(item.id, {
        priority: priorityMap[toTier] || 'normal',
        tags: [toTier],
      });
    }
    return true;
  }
  /**
   * Get statistics for each tier
   */
  async getTierStats() {
    const tiers = ['hot', 'warm', 'cold'];
    const result = {};
    for (const tier of tiers) {
      const items = await this.retrieve('', { tags: [tier], limit: 1e3 });
      const tokens = items.items.reduce((sum, item) => sum + (item.content.tokens || 0), 0);
      result[tier] = {
        count: items.items.length,
        tokens,
      };
    }
    return result;
  }
  /**
   * Specifically get "hot" (high priority/recent) context
   * @param {string} query - Search query
   */
  async getHotContext(query) {
    return await this.retrieve(query, {
      priority: 'high',
      tags: ['hot'],
      limit: 5,
    });
  }
  /**
   * Specifically get "warm" (medium priority) context
   * @param {string} query - Search query
   */
  async getWarmContext(query) {
    return await this.retrieve(query, {
      priority: 'normal',
      tags: ['warm'],
      limit: 10,
    });
  }
  /**
   * Specifically get "cold" (low priority/historical) context
   * @param {string} query - Search query
   */
  async getColdContext(query) {
    return await this.retrieve(query, {
      priority: 'low',
      tags: ['cold'],
      limit: 20,
    });
  }
  /**
   * Promote an item to a higher tier
   * @param {string} id - Context ID
   * @param {string} newTier - 'hot' or 'warm'
   */
  async promote(id, newTier) {
    const priorityMap = {
      hot: 'high',
      warm: 'normal',
    };
    return await this.memory.update(id, {
      priority: priorityMap[newTier],
      tags: [newTier],
    });
  }
  /**
   * Demote an item to a lower tier
   * @param {string} id - Context ID
   * @param {string} newTier - 'warm' or 'cold'
   */
  async demote(id, newTier) {
    const priorityMap = {
      warm: 'normal',
      cold: 'low',
    };
    return await this.memory.update(id, {
      priority: priorityMap[newTier],
      tags: [newTier],
    });
  }
  /**
   * Get stats for the memory system
   */
  getStats() {
    return this.memory.getStats();
  }
  _estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
};
AgentMemoryManager = __decorateClass([singleton()], AgentMemoryManager);
const memoryManager = new AgentMemoryManager();
var memory_manager_default = AgentMemoryManager;
export { AgentMemoryManager, memory_manager_default as default, memoryManager };
