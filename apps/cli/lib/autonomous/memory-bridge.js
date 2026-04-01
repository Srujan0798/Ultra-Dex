/**
 * Memory Bridge
 * Connects autonomous loop to memory systems for context persistence
 * @module autonomous/memory-bridge
 */

/**
 * Memory Bridge for autonomous loop context management
 */
export class MemoryBridge {
  /**
   * @param {object} options - Bridge options
   * @param {object} options.memoryManager - Memory manager instance
   * @param {string} options.sessionId - Session identifier
   * @param {number} options.maxContextSize - Max context entries (default: 100)
   */
  constructor(options = {}) {
    this.memoryManager = options.memoryManager || null;
    this.sessionId = options.sessionId || `session-${Date.now()}`;
    this.maxContextSize = options.maxContextSize || 100;
    
    // In-memory context store (fallback when no memoryManager)
    this.contextStore = {
      goals: [],
      plans: [],
      taskResults: [],
      learnings: [],
      metadata: {}
    };
  }

  /**
   * Save context to memory
   * @param {string} type - Context type: 'goal', 'plan', 'result', 'learning'
   * @param {any} data - Context data
   * @returns {Promise<string>} Context entry ID
   */
  async saveContext(type, data) {
    const entry = {
      id: `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    };

    // Store in appropriate bucket
    switch (type) {
      case 'goal':
        this.contextStore.goals.push(entry);
        break;
      case 'plan':
        this.contextStore.plans.push(entry);
        break;
      case 'result':
        this.contextStore.taskResults.push(entry);
        break;
      case 'learning':
        this.contextStore.learnings.push(entry);
        break;
      default:
        if (!this.contextStore[type]) {
          this.contextStore[type] = [];
        }
        this.contextStore[type].push(entry);
    }

    // Persist to memory manager if available
    if (this.memoryManager) {
      try {
        await this.memoryManager.store({
          key: entry.id,
          value: entry,
          namespace: `autonomous/${this.sessionId}`
        });
      } catch (error) {
        console.warn('Failed to persist to memory manager:', error.message);
      }
    }

    // Enforce max context size
    this.pruneContext();

    return entry.id;
  }

  /**
   * Load context from memory
   * @param {object} filter - Filter options
   * @returns {Promise<object>} Loaded context
   */
  async loadContext(filter = {}) {
    let context = { ...this.contextStore };

    // If we have a memory manager, try to load persisted context
    if (this.memoryManager && filter.sessionId) {
      try {
        const persisted = await this.memoryManager.retrieve({
          namespace: `autonomous/${filter.sessionId}`,
          limit: this.maxContextSize
        });
        
        if (persisted && persisted.length > 0) {
          context = this.mergeContext(context, persisted);
        }
      } catch (error) {
        console.warn('Failed to load from memory manager:', error.message);
      }
    }

    // Apply filters
    if (filter.type) {
      return {
        [filter.type]: context[filter.type] || context[`${filter.type}s`] || []
      };
    }

    if (filter.since) {
      const sinceTime = new Date(filter.since).getTime();
      for (const key of Object.keys(context)) {
        if (Array.isArray(context[key])) {
          context[key] = context[key].filter(
            e => new Date(e.timestamp).getTime() >= sinceTime
          );
        }
      }
    }

    return context;
  }

  /**
   * Search for relevant context
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<Array>} Matching context entries
   */
  async searchRelevant(query, options = {}) {
    const results = [];
    const limit = options.limit || 10;
    const types = options.types || ['goals', 'plans', 'taskResults', 'learnings'];
    const queryLower = query.toLowerCase();

    for (const type of types) {
      const entries = this.contextStore[type] || [];
      
      for (const entry of entries) {
        const dataStr = JSON.stringify(entry.data).toLowerCase();
        if (dataStr.includes(queryLower)) {
          results.push({
            ...entry,
            relevanceScore: this.calculateRelevance(queryLower, dataStr)
          });
        }
      }
    }

    // Sort by relevance and recency
    results.sort((a, b) => {
      const relevanceDiff = b.relevanceScore - a.relevanceScore;
      if (relevanceDiff !== 0) return relevanceDiff;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return results.slice(0, limit);
  }

  /**
   * Clear session context
   * @param {boolean} persistedToo - Also clear persisted context
   * @returns {Promise<void>}
   */
  async clearSession(persistedToo = false) {
    this.contextStore = {
      goals: [],
      plans: [],
      taskResults: [],
      learnings: [],
      metadata: {}
    };

    if (persistedToo && this.memoryManager) {
      try {
        await this.memoryManager.clear({
          namespace: `autonomous/${this.sessionId}`
        });
      } catch (error) {
        console.warn('Failed to clear persisted context:', error.message);
      }
    }
  }

  /**
   * Get session summary
   * @returns {object} Session summary
   */
  getSummary() {
    return {
      sessionId: this.sessionId,
      goalCount: this.contextStore.goals.length,
      planCount: this.contextStore.plans.length,
      resultCount: this.contextStore.taskResults.length,
      learningCount: this.contextStore.learnings.length,
      oldestEntry: this.getOldestTimestamp(),
      newestEntry: this.getNewestTimestamp()
    };
  }

  /**
   * Export session for persistence
   * @returns {object} Exportable session data
   */
  exportSession() {
    return {
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString(),
      context: { ...this.contextStore }
    };
  }

  /**
   * Import session from export
   * @param {object} sessionData - Exported session data
   */
  importSession(sessionData) {
    if (sessionData.sessionId) {
      this.sessionId = sessionData.sessionId;
    }
    if (sessionData.context) {
      this.contextStore = { ...this.contextStore, ...sessionData.context };
    }
  }

  /**
   * Calculate simple relevance score
   * @param {string} query - Query string
   * @param {string} text - Text to match
   * @returns {number} Relevance score 0-1
   */
  calculateRelevance(query, text) {
    const words = query.split(/\s+/);
    let matches = 0;
    
    for (const word of words) {
      if (text.includes(word)) {
        matches++;
      }
    }
    
    return words.length > 0 ? matches / words.length : 0;
  }

  /**
   * Prune context to stay within size limits
   */
  pruneContext() {
    for (const key of Object.keys(this.contextStore)) {
      if (Array.isArray(this.contextStore[key])) {
        const arr = this.contextStore[key];
        if (arr.length > this.maxContextSize) {
          // Keep most recent entries
          this.contextStore[key] = arr.slice(-this.maxContextSize);
        }
      }
    }
  }

  /**
   * Merge persisted context with in-memory
   * @param {object} current - Current context
   * @param {Array} persisted - Persisted entries
   * @returns {object} Merged context
   */
  mergeContext(current, persisted) {
    for (const entry of persisted) {
      const type = entry.type || 'misc';
      const bucket = `${type}s`;
      
      if (!current[bucket]) {
        current[bucket] = [];
      }
      
      // Avoid duplicates
      if (!current[bucket].find(e => e.id === entry.id)) {
        current[bucket].push(entry);
      }
    }
    
    return current;
  }

  /**
   * Get oldest timestamp from context
   * @returns {string|null}
   */
  getOldestTimestamp() {
    let oldest = null;
    
    for (const key of Object.keys(this.contextStore)) {
      if (Array.isArray(this.contextStore[key])) {
        for (const entry of this.contextStore[key]) {
          if (entry.timestamp) {
            if (!oldest || entry.timestamp < oldest) {
              oldest = entry.timestamp;
            }
          }
        }
      }
    }
    
    return oldest;
  }

  /**
   * Get newest timestamp from context
   * @returns {string|null}
   */
  getNewestTimestamp() {
    let newest = null;
    
    for (const key of Object.keys(this.contextStore)) {
      if (Array.isArray(this.contextStore[key])) {
        for (const entry of this.contextStore[key]) {
          if (entry.timestamp) {
            if (!newest || entry.timestamp > newest) {
              newest = entry.timestamp;
            }
          }
        }
      }
    }
    
    return newest;
  }
}

export default MemoryBridge;
