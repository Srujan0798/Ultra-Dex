/**
 * Unified Memory API - The Core Memory Interface
 * Provides single interface for SQLite (relational), ChromaDB (vector), Neo4j (graph)
 *
 * @module UnifiedMemory
 * @author Ultra-Dex Team
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import path from 'path';

class UnifiedMemory extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      sqlite: config.sqlite || { database: './data/memory.db' },
      chroma: config.chroma || { url: 'http://localhost:8000' },
      neo4j: config.neo4j || { uri: 'bolt://localhost:7687', user: 'neo4j', password: '' },
      cache: config.cache || { ttl: 300000, maxSize: 1000 }, // 5min default
      compression: config.compression !== false,
      ...config,
    };

    this.stores = {};
    this.cache = new Map();
    this.metrics = {
      stores: 0,
      retrieves: 0,
      errors: 0,
      latency: [],
    };

    this.initialized = false;
  }

  async _loadSQLiteDriver() {
    if (this.sqliteDriver) {
      return this.sqliteDriver;
    }

    const sqlite3 = await import('sqlite3');
    this.sqliteDriver = sqlite3.default.verbose();
    return this.sqliteDriver;
  }

  /**
   * Initialize all memory stores
   */
  async initialize() {
    const startTime = Date.now();

    try {
      // Initialize SQLite (relational)
      await this._initSQLite();

      // Initialize ChromaDB (vector)
      await this._initChroma();

      // Initialize Neo4j (graph)
      await this._initNeo4j();

      // Start cache cleanup
      this._startCacheCleanup();

      this.initialized = true;
      this.emit('initialized', { duration: Date.now() - startTime });

      return true;
    } catch (error) {
      this.metrics.errors++;
      this.emit('error', error);
      throw new Error(`Memory initialization failed: ${error.message}`);
    }
  }

  /**
   * Store context across all appropriate stores
   * @param {Object} context - Context to store
   * @param {Object} options - Storage options
   * @returns {Promise<Object>} Storage result
   */
  async store(context, options = {}) {
    this._ensureInitialized();
    const startTime = Date.now();

    const {
      strategy = 'hybrid', // 'sql', 'vector', 'graph', 'hybrid'
      ttl = null,
      priority = 'normal', // 'low', 'normal', 'high', 'critical'
      tags = [],
      sessionId = null,
      compress = this.config.compression,
    } = options;

    const id = this._generateId();
    const timestamp = new Date().toISOString();

    try {
      let results = {};

      // Store in SQLite (relational/context)
      if (['sql', 'hybrid'].includes(strategy) && context.text) {
        results.sqlite = await this._storeInSQLite(id, context, { priority, sessionId, tags });
      }

      // Store in ChromaDB (vector/semantic)
      if (['vector', 'hybrid'].includes(strategy) && (context.embedding || context.text)) {
        results.chroma = await this._storeInChroma(id, context, { priority, sessionId, tags });
      }

      // Store in Neo4j (graph/relationships)
      if (['graph', 'hybrid'].includes(strategy) && context.entities) {
        results.neo4j = await this._storeInNeo4j(id, context, { priority, sessionId, tags });
      }

      // Update cache
      if (priority === 'high' || priority === 'critical') {
        this._updateCache(id, context, ttl);
      }

      this.metrics.stores++;
      this.metrics.latency.push(Date.now() - startTime);

      this.emit('stored', { id, strategy, duration: Date.now() - startTime });

      return {
        id,
        timestamp,
        strategy,
        storedIn: Object.keys(results),
        latency: Date.now() - startTime,
      };
    } catch (error) {
      this.metrics.errors++;
      this.emit('error', { operation: 'store', error });
      throw error;
    }
  }

  /**
   * Retrieve context using hybrid strategy
   * @param {string|Object} query - Query string or object
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} Retrieved context
   */
  async retrieve(query, options = {}) {
    this._ensureInitialized();
    const startTime = Date.now();

    const {
      strategy = 'hybrid', // 'sql', 'vector', 'graph', 'hybrid'
      limit = 10,
      threshold = 0.7,
      sessionId = null,
      timeRange = null, // { from: Date, to: Date }
      tags = [],
      includeMetadata = true,
    } = options;

    try {
      let results = {
        items: [],
        sources: {},
        combined: [],
      };

      // Check cache first for exact match
      const cached = this._checkCache(query);
      if (cached && strategy !== 'graph') {
        results.cached = true;
        results.items = cached;
        return results;
      }

      // Query SQLite (relational/context search)
      if (['sql', 'hybrid'].includes(strategy) && typeof query === 'string') {
        results.sources.sqlite = await this._querySQLite(query, {
          limit,
          sessionId,
          timeRange,
          tags,
        });
      }

      // Query ChromaDB (vector/semantic search)
      if (['vector', 'hybrid'].includes(strategy)) {
        const embedding = await this._getEmbedding(query);
        results.sources.chroma = await this._queryChroma(embedding, {
          limit,
          threshold,
          sessionId,
        });
      }

      // Query Neo4j (graph/relationship search)
      if (['graph', 'hybrid'].includes(strategy) && typeof query === 'object' && query.entity) {
        results.sources.neo4j = await this._queryNeo4j(query.entity, {
          limit,
          depth: query.depth || 2,
        });
      }

      // Merge and rank results
      results.combined = this._mergeResults(results.sources, { limit, strategy });
      results.items = results.combined;
      results.total = results.items.length;
      results.latency = Date.now() - startTime;

      this.metrics.retrieves++;
      this.metrics.latency.push(Date.now() - startTime);

      this.emit('retrieved', {
        query,
        resultCount: results.total,
        duration: Date.now() - startTime,
      });

      return results;
    } catch (error) {
      this.metrics.errors++;
      this.emit('error', { operation: 'retrieve', error });
      throw error;
    }
  }

  /**
   * Query graph relationships
   * @param {string} entity - Entity to query
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Graph results
   */
  async queryGraph(entity, options = {}) {
    this._ensureInitialized();

    const {
      depth = 2,
      relationshipTypes = [],
      direction = 'both', // 'in', 'out', 'both'
    } = options;

    try {
      return await this._queryNeo4j(entity, { depth, relationshipTypes, direction });
    } catch (error) {
      this.emit('error', { operation: 'queryGraph', error });
      throw error;
    }
  }

  /**
   * Update existing context
   * @param {string} id - Context ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Update result
   */
  async update(id, updates) {
    this._ensureInitialized();

    try {
      const timestamp = new Date().toISOString();

      // Invalidate cache
      this.cache.delete(id);

      // Update in all stores
      const promises = [];
      if (this.stores.sqlite) promises.push(this._updateSQLite(id, updates));
      if (this.stores.chroma) promises.push(this._updateChroma(id, updates));
      if (this.stores.neo4j) promises.push(this._updateNeo4j(id, updates));

      await Promise.all(promises);

      this.emit('updated', { id, timestamp });

      return { id, updated: true, timestamp };
    } catch (error) {
      this.emit('error', { operation: 'update', error });
      throw error;
    }
  }

  /**
   * Delete context
   * @param {string} id - Context ID
   * @returns {Promise<Object>} Delete result
   */
  async delete(id) {
    this._ensureInitialized();

    try {
      // Remove from cache
      this.cache.delete(id);

      // Delete from all stores
      const promises = [];
      if (this.stores.sqlite) promises.push(this._deleteFromSQLite(id));
      if (this.stores.chroma) promises.push(this._deleteFromChroma(id));
      if (this.stores.neo4j) promises.push(this._deleteFromNeo4j(id));

      await Promise.all(promises);

      this.emit('deleted', { id });

      return { id, deleted: true };
    } catch (error) {
      this.emit('error', { operation: 'delete', error });
      throw error;
    }
  }

  /**
   * Get memory statistics
   * @returns {Object} Memory metrics
   */
  getStats() {
    const avgLatency =
      this.metrics.latency.length > 0
        ? this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length
        : 0;

    return {
      stores: this.metrics.stores,
      retrieves: this.metrics.retrieves,
      errors: this.metrics.errors,
      avgLatency: Math.round(avgLatency),
      cacheSize: this.cache.size,
      initialized: this.initialized,
    };
  }

  /**
   * Compress old/low-priority context
   * @param {Object} options - Compression options
   * @returns {Promise<Object>} Compression result
   */
  async compress(options = {}) {
    const {
      olderThan = 7 * 24 * 60 * 60 * 1000, // 7 days
      priority = 'low',
    } = options;

    try {
      // Archive old context
      const archived = await this._archiveOldContext(olderThan, priority);

      this.emit('compressed', { archived: archived.length });

      return { compressed: true, archived: archived.length };
    } catch (error) {
      this.emit('error', { operation: 'compress', error });
      throw error;
    }
  }

  /**
   * Close all connections
   */
  async close() {
    try {
      if (this.stores.sqlite) {
        await new Promise((resolve, reject) => {
          this.stores.sqlite.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      if (this.stores.chroma?.client) {
        // ChromaDB cleanup if needed
      }

      if (this.stores.neo4j?.session) {
        await this.stores.neo4j.session.close();
        await this.stores.neo4j.driver.close();
      }

      this.initialized = false;
      this.emit('closed');
    } catch (error) {
      this.emit('error', { operation: 'close', error });
      throw error;
    }
  }

  // Private methods
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Memory not initialized. Call initialize() first.');
    }
  }

  async _initSQLite() {
    const dbPath = path.resolve(this.config.sqlite.database);
    const sqlite = await this._loadSQLiteDriver();

    return new Promise((resolve, reject) => {
      this.stores.sqlite = new sqlite.Database(dbPath, async (err) => {
        if (err) {
          reject(err);
        } else {
          try {
            // Create tables sequentially
            await new Promise((res, rej) => {
              this.stores.sqlite.run(
                `
                CREATE TABLE IF NOT EXISTS context (
                  id TEXT PRIMARY KEY,
                  session_id TEXT,
                  content TEXT,
                  priority TEXT,
                  tags TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  access_count INTEGER DEFAULT 0,
                  last_accessed DATETIME
                )
              `,
                (err) => (err ? rej(err) : res())
              );
            });

            await new Promise((res, rej) => {
              this.stores.sqlite.run(
                `
                CREATE INDEX IF NOT EXISTS idx_session ON context(session_id)
              `,
                (err) => (err ? rej(err) : res())
              );
            });

            await new Promise((res, rej) => {
              this.stores.sqlite.run(
                `
                CREATE INDEX IF NOT EXISTS idx_priority ON context(priority)
              `,
                (err) => (err ? rej(err) : res())
              );
            });

            resolve();
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  async _initChroma() {
    // Placeholder for ChromaDB initialization
    // In production, use proper ChromaDB client
    this.stores.chroma = {
      client: null, // Initialize ChromaDB client here
      collection: null,
    };
  }

  async _initNeo4j() {
    // Placeholder for Neo4j initialization
    // In production, use neo4j-driver
    this.stores.neo4j = {
      driver: null,
      session: null,
    };
  }

  async _storeInSQLite(id, context, options) {
    return new Promise((resolve, reject) => {
      const { priority, sessionId, tags } = options;

      this.stores.sqlite.run(
        `INSERT INTO context (id, session_id, content, priority, tags) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, sessionId, JSON.stringify(context), priority, JSON.stringify(tags)],
        (err) => {
          if (err) reject(err);
          else resolve({ id, store: 'sqlite' });
        }
      );
    });
  }

  async _storeInChroma(id, context, options) {
    // Placeholder for ChromaDB storage
    return { id, store: 'chroma', status: 'placeholder' };
  }

  async _storeInNeo4j(id, context, options) {
    // Placeholder for Neo4j storage
    return { id, store: 'neo4j', status: 'placeholder' };
  }

  async _querySQLite(query, options) {
    return new Promise((resolve, reject) => {
      const { limit, sessionId, timeRange, tags } = options;

      let sql = `SELECT * FROM context WHERE content LIKE ?`;
      const params = [`%${query}%`];

      if (sessionId) {
        sql += ` AND session_id = ?`;
        params.push(sessionId);
      }

      sql += ` ORDER BY access_count DESC, created_at DESC LIMIT ?`;
      params.push(limit);

      this.stores.sqlite.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else {
          // Update access count
          rows.forEach((row) => {
            this.stores.sqlite.run(
              `UPDATE context SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?`,
              [row.id]
            );
          });

          resolve(
            rows.map((row) => ({
              id: row.id,
              content: JSON.parse(row.content),
              priority: row.priority,
              tags: JSON.parse(row.tags || '[]'),
              createdAt: row.created_at,
              source: 'sqlite',
            }))
          );
        }
      });
    });
  }

  async _queryChroma(embedding, options) {
    // Placeholder for ChromaDB query
    return [];
  }

  async _queryNeo4j(entity, options) {
    // Placeholder for Neo4j query
    return [];
  }

  _mergeResults(sources, options) {
    const { limit } = options;
    const allItems = [];

    // Collect all results with source attribution
    Object.entries(sources).forEach(([source, items]) => {
      if (items && items.length) {
        items.forEach((item) => {
          allItems.push({ ...item, _source: source });
        });
      }
    });

    // Sort by relevance/priority (simplified)
    allItems.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return allItems.slice(0, limit);
  }

  async _getEmbedding(text) {
    // Placeholder for embedding generation
    // In production, use proper embedding model
    return [];
  }

  _updateCache(id, context, ttl) {
    const expiresAt = ttl ? Date.now() + ttl : null;
    this.cache.set(id, { context, expiresAt });

    // Enforce max cache size
    if (this.cache.size > this.config.cache.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  _checkCache(query) {
    // Simple cache check - in production, use proper cache key generation
    for (const [id, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.cache.delete(id);
        continue;
      }
      // Check if query matches cached content (simplified)
      if (typeof query === 'string' && entry.context.text?.includes(query)) {
        return [entry.context];
      }
    }
    return null;
  }

  _startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [id, entry] of this.cache.entries()) {
        if (entry.expiresAt && entry.expiresAt < now) {
          this.cache.delete(id);
        }
      }
    }, 60000); // Cleanup every minute
  }

  _generateId() {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async _updateSQLite(id, updates) {
    return new Promise((resolve, reject) => {
      this.stores.sqlite.run(
        `UPDATE context SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [JSON.stringify(updates), id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async _updateChroma(id, updates) {
    // Placeholder
  }

  async _updateNeo4j(id, updates) {
    // Placeholder
  }

  async _deleteFromSQLite(id) {
    return new Promise((resolve, reject) => {
      this.stores.sqlite.run(`DELETE FROM context WHERE id = ?`, [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async _deleteFromChroma(id) {
    // Placeholder
  }

  async _deleteFromNeo4j(id) {
    // Placeholder
  }

  async _archiveOldContext(olderThan, priority) {
    const cutoff = new Date(Date.now() - olderThan).toISOString();

    return new Promise((resolve, reject) => {
      this.stores.sqlite.all(
        `SELECT * FROM context 
         WHERE priority = ? 
         AND last_accessed < ? 
         OR (last_accessed IS NULL AND created_at < ?)`,
        [priority, cutoff, cutoff],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

export { UnifiedMemory };
export default UnifiedMemory;
