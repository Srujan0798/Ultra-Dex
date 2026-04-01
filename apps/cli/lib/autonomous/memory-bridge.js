// Copyright (c) 2026 Ultra-Dex
// Memory Bridge - Connects autonomous loop to Ultra-Dex memory systems

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

/**
 * @typedef {Object} LoopContext
 * @property {string} sessionId - Unique session identifier
 * @property {string} goal - Current goal being pursued
 * @property {Object} plan - Current plan
 * @property {Array} taskResults - Results from executed tasks
 * @property {Array} learnings - Extracted learnings/insights
 * @property {Date} startedAt - Session start time
 * @property {Date} updatedAt - Last update time
 * @property {Object} metadata - Additional session metadata
 */

/**
 * @typedef {Object} ContextSearchResult
 * @property {string} sessionId - Session ID
 * @property {string} goal - Goal from session
 * @property {number} relevanceScore - Relevance to search query
 * @property {string} summary - Brief summary of session
 */

/**
 * MemoryBridge - Connects autonomous loop to persistent memory systems
 * 
 * Provides context persistence across loop iterations:
 * - Save/load session state
 * - Store task results and learnings
 * - Search relevant past context
 * - Integration with memex indexing (when available)
 * 
 * @extends EventEmitter
 * @example
 * const bridge = new MemoryBridge({ dataDir: './data/autonomous' });
 * await bridge.saveContext(context);
 * const history = await bridge.searchRelevant('authentication refactor');
 */
export class MemoryBridge extends EventEmitter {
  /**
   * Create a new MemoryBridge
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.dataDir] - Directory for persistent storage
   * @param {number} [options.maxHistoryItems=100] - Max items to keep in memory
   * @param {number} [options.maxCacheSize=50] - Max items in LRU cache
   * @param {boolean} [options.enableMemex=false] - Enable memex integration
   * @param {Object} [options.memexClient] - Memex client instance
   */
  constructor(options = {}) {
    super();
    this.options = {
      dataDir: options.dataDir || path.join(process.cwd(), '.ultra', 'autonomous'),
      maxHistoryItems: options.maxHistoryItems ?? 100,
      maxCacheSize: options.maxCacheSize ?? 50,
      enableMemex: options.enableMemex ?? false,
      ...options
    };

    // In-memory cache with LRU eviction
    this._cache = new Map();
    this._cacheOrder = []; // Track access order for LRU eviction
    this._cacheStats = { hits: 0, misses: 0 };
    this._history = [];
    this._initialized = false;
    this._memexClient = options.memexClient || null;
  }

  /**
   * Initialize storage directory
   * @private
   */
  async _ensureDataDir() {
    if (!existsSync(this.options.dataDir)) {
      await fs.mkdir(this.options.dataDir, { recursive: true });
    }
  }

  /**
   * Generate session file path
   * @private
   * @param {string} sessionId - Session ID
   * @returns {string} File path
   */
  _getSessionPath(sessionId) {
    return path.join(this.options.dataDir, `session_${sessionId}.json`);
  }

  /**
   * Generate unique session ID
   * @private
   * @returns {string} Session ID
   */
  _generateSessionId() {
    return `auto_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Evict oldest entries from cache to stay within maxCacheSize limit
   * @private
   */
  _evictOldest() {
    while (this._cache.size > this.options.maxCacheSize) {
      const oldest = this._cacheOrder.shift();
      this._cache.delete(oldest);
    }
  }

  /**
   * Initialize the memory bridge
   * Loads history index if available
   */
  async initialize() {
    if (this._initialized) return;
    
    await this._ensureDataDir();
    
    // Load history index
    const indexPath = path.join(this.options.dataDir, 'history_index.json');
    if (existsSync(indexPath)) {
      try {
        const data = await fs.readFile(indexPath, 'utf8');
        this._history = JSON.parse(data).slice(-this.options.maxHistoryItems);
      } catch (e) {
        this._history = [];
      }
    }
    
    this._initialized = true;
    this.emit('initialized', { dataDir: this.options.dataDir });
  }

  /**
   * Save loop context to persistent storage
   * 
   * @param {LoopContext} context - Context to save
   * @returns {Promise<{sessionId: string, path: string}>} Save result
   * 
   * @example
   * await bridge.saveContext({
   *   sessionId: 'auto_123',
   *   goal: 'Refactor auth',
   *   plan: { tasks: [...] },
   *   taskResults: [...]
   * });
   */
  async saveContext(context) {
    await this.initialize();
    
    if (!context.sessionId) {
      context.sessionId = this._generateSessionId();
    }
    
    context.updatedAt = new Date().toISOString();
    if (!context.startedAt) {
      context.startedAt = context.updatedAt;
    }

    const sessionPath = this._getSessionPath(context.sessionId);

    // Save to file
    await fs.writeFile(sessionPath, JSON.stringify(context, null, 2), 'utf8');

    // Update cache with LRU tracking
    this._cache.set(context.sessionId, context);
    // Remove from order if exists, then add to end (most recently used)
    const orderIndex = this._cacheOrder.indexOf(context.sessionId);
    if (orderIndex >= 0) {
      this._cacheOrder.splice(orderIndex, 1);
    }
    this._cacheOrder.push(context.sessionId);
    // Evict oldest if over limit
    this._evictOldest();
    
    // Update history index
    const historyEntry = {
      sessionId: context.sessionId,
      goal: context.goal || '',
      startedAt: context.startedAt,
      updatedAt: context.updatedAt,
      taskCount: context.plan?.tasks?.length || 0,
      completedCount: context.taskResults?.filter(r => r?.success)?.length || 0
    };
    
    const existingIndex = this._history.findIndex(h => h.sessionId === context.sessionId);
    if (existingIndex >= 0) {
      this._history[existingIndex] = historyEntry;
    } else {
      this._history.push(historyEntry);
      if (this._history.length > this.options.maxHistoryItems) {
        this._history.shift();
      }
    }
    
    // Save history index
    const indexPath = path.join(this.options.dataDir, 'history_index.json');
    await fs.writeFile(indexPath, JSON.stringify(this._history, null, 2), 'utf8');
    
    // Index in memex if enabled
    if (this.options.enableMemex && this._memexClient) {
      try {
        await this._memexClient.index({
          id: `autonomous:${context.sessionId}`,
          content: `${context.goal}\n${context.plan?.metadata?.summary || ''}`,
          metadata: { type: 'autonomous-session', sessionId: context.sessionId }
        });
      } catch (e) {
        this.emit('memex:error', { error: e.message });
      }
    }
    
    this.emit('context:saved', { sessionId: context.sessionId });
    
    return { sessionId: context.sessionId, path: sessionPath };
  }

  /**
   * Load loop context from storage
   * 
   * @param {string} sessionId - Session ID to load
   * @returns {Promise<LoopContext|null>} Loaded context or null if not found
   * 
   * @example
   * const context = await bridge.loadContext('auto_123');
   */
  async loadContext(sessionId) {
    await this.initialize();

    // Check cache first
    if (this._cache.has(sessionId)) {
      this._cacheStats.hits++;
      // Update LRU order - move to end (most recently used)
      const orderIndex = this._cacheOrder.indexOf(sessionId);
      if (orderIndex >= 0) {
        this._cacheOrder.splice(orderIndex, 1);
        this._cacheOrder.push(sessionId);
      }
      return this._cache.get(sessionId);
    }

    this._cacheStats.misses++;
    
    const sessionPath = this._getSessionPath(sessionId);
    
    if (!existsSync(sessionPath)) {
      return null;
    }
    
    try {
      const data = await fs.readFile(sessionPath, 'utf8');
      const context = JSON.parse(data);
      this._cache.set(sessionId, context);
      // Update LRU order
      const orderIndex = this._cacheOrder.indexOf(sessionId);
      if (orderIndex >= 0) {
        this._cacheOrder.splice(orderIndex, 1);
      }
      this._cacheOrder.push(sessionId);
      this._evictOldest();
      this.emit('context:loaded', { sessionId });
      return context;
    } catch (e) {
      this.emit('context:error', { sessionId, error: e.message });
      return null;
    }
  }

  /**
   * Search for relevant past contexts
   * 
   * @param {string} query - Search query
   * @param {Object} [options={}] - Search options
   * @param {number} [options.limit=5] - Maximum results
   * @param {boolean} [options.includeTaskResults=false] - Include full task results
   * @returns {Promise<ContextSearchResult[]>} Search results
   * 
   * @example
   * const results = await bridge.searchRelevant('authentication', { limit: 3 });
   */
  async searchRelevant(query, options = {}) {
    await this.initialize();
    
    const { limit = 5, includeTaskResults = false } = options;
    const queryLower = query.toLowerCase();
    const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 2);
    
    // Score each history item by relevance
    const scored = this._history.map(entry => {
      let score = 0;
      const goalLower = (entry.goal || '').toLowerCase();
      
      // Exact substring match
      if (goalLower.includes(queryLower)) {
        score += 10;
      }
      
      // Token matching
      for (const token of queryTokens) {
        if (goalLower.includes(token)) {
          score += 2;
        }
      }
      
      // Recency boost (newer = higher)
      const age = Date.now() - new Date(entry.updatedAt).getTime();
      const dayAge = age / (1000 * 60 * 60 * 24);
      score += Math.max(0, 5 - dayAge * 0.5);
      
      // Completion rate boost
      if (entry.taskCount > 0) {
        score += (entry.completedCount / entry.taskCount) * 2;
      }
      
      return { ...entry, relevanceScore: score };
    });
    
    // Sort by score and take top results
    const results = scored
      .filter(r => r.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
    
    // Optionally load full context for top results
    if (includeTaskResults) {
      for (const result of results) {
        const context = await this.loadContext(result.sessionId);
        if (context) {
          result.taskResults = context.taskResults;
          result.learnings = context.learnings;
        }
      }
    }
    
    return results;
  }

  /**
   * Get most recent session context
   * 
   * @returns {Promise<LoopContext|null>} Most recent context
   */
  async getLatestContext() {
    await this.initialize();
    
    if (this._history.length === 0) return null;
    
    const latest = this._history[this._history.length - 1];
    return this.loadContext(latest.sessionId);
  }

  /**
   * Clear a specific session
   * 
   * @param {string} sessionId - Session to clear
   * @returns {Promise<boolean>} True if cleared
   */
  async clearSession(sessionId) {
    await this.initialize();

    const sessionPath = this._getSessionPath(sessionId);

    // Remove from cache and order
    this._cache.delete(sessionId);
    const orderIndex = this._cacheOrder.indexOf(sessionId);
    if (orderIndex >= 0) {
      this._cacheOrder.splice(orderIndex, 1);
    }
    
    // Remove from history
    this._history = this._history.filter(h => h.sessionId !== sessionId);
    const indexPath = path.join(this.options.dataDir, 'history_index.json');
    await fs.writeFile(indexPath, JSON.stringify(this._history, null, 2), 'utf8');
    
    // Remove file
    if (existsSync(sessionPath)) {
      await fs.unlink(sessionPath);
      this.emit('context:cleared', { sessionId });
      return true;
    }
    
    return false;
  }

  /**
   * Clear all session data
   * 
   * @returns {Promise<number>} Number of sessions cleared
   */
  async clearAll() {
    await this.initialize();

    const count = this._history.length;

    // Clear all session files
    for (const entry of this._history) {
      const sessionPath = this._getSessionPath(entry.sessionId);
      if (existsSync(sessionPath)) {
        await fs.unlink(sessionPath);
      }
    }

    // Clear cache, order, and stats
    this._cache.clear();
    this._cacheOrder = [];
    this._cacheStats = { hits: 0, misses: 0 };
    this._history = [];
    
    // Clear index
    const indexPath = path.join(this.options.dataDir, 'history_index.json');
    await fs.writeFile(indexPath, '[]', 'utf8');
    
    this.emit('context:clearedAll', { count });
    return count;
  }

  /**
   * Add a learning/insight to current context
   * 
   * @param {string} sessionId - Session ID
   * @param {Object} learning - Learning to add
   * @param {string} learning.type - Learning type (success, failure, insight)
   * @param {string} learning.content - Learning content
   * @param {string} [learning.taskId] - Related task ID
   */
  async addLearning(sessionId, learning) {
    const context = await this.loadContext(sessionId);
    if (!context) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    if (!context.learnings) {
      context.learnings = [];
    }
    
    context.learnings.push({
      ...learning,
      timestamp: new Date().toISOString()
    });
    
    await this.saveContext(context);
    this.emit('learning:added', { sessionId, learning });
  }

  /**
   * Get session history summary
   * 
   * @returns {Array} History entries
   */
  getHistory() {
    return [...this._history];
  }

  /**
   * Get memory usage stats
   *
   * @returns {Object} Stats object
   */
  getStats() {
    const totalRequests = this._cacheStats.hits + this._cacheStats.misses;
    const hitRate = totalRequests > 0 ? (this._cacheStats.hits / totalRequests) : 0;
    const missRate = totalRequests > 0 ? (this._cacheStats.misses / totalRequests) : 0;

    return {
      cachedSessions: this._cache.size,
      maxCacheSize: this.options.maxCacheSize,
      totalSessions: this._history.length,
      dataDir: this.options.dataDir,
      initialized: this._initialized,
      cacheStats: {
        hits: this._cacheStats.hits,
        misses: this._cacheStats.misses,
        hitRate: Math.round(hitRate * 100) / 100,
        missRate: Math.round(missRate * 100) / 100
      }
    };
  }
}

export default MemoryBridge;

