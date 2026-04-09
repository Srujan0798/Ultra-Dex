import { EventEmitter } from 'events';
import * as path from 'path';
class UnifiedMemory extends EventEmitter {
  config;
  stores;
  cache;
  metrics;
  initialized;
  sqliteDriver;
  cleanupInterval;
  constructor(config = {}) {
    super();
    this.config = {
      sqlite: config.sqlite || { database: './data/memory.db' },
      chroma: config.chroma || { url: 'http://localhost:8000' },
      neo4j: config.neo4j || { uri: 'bolt://localhost:7687', user: 'neo4j', password: '' },
      cache: config.cache || { ttl: 3e5, maxSize: 1e3 },
      compression: config.compression !== false,
      ...config,
    };
    this.stores = {};
    this.cache = /* @__PURE__ */ new Map();
    this.metrics = {
      stores: 0,
      retrieves: 0,
      errors: 0,
      latency: [],
    };
    this.initialized = false;
    this.sqliteDriver = null;
    this.cleanupInterval = null;
  }
  async _loadSQLiteDriver() {
    if (this.sqliteDriver) {
      return this.sqliteDriver;
    }
    const MockDatabaseClass = class MockDatabase {
      constructor(path, callback) {
        if (callback) setTimeout(() => callback(null), 0);
      }
      run(sql, params, callback) {
        let cb = callback;
        let p = params;
        if (typeof p === 'function') {
          cb = p;
          p = [];
        }
        if (cb) setTimeout(() => cb(null), 0);
        return this;
      }
      all(sql, params, callback) {
        let cb = callback;
        let p = params;
        if (typeof p === 'function') {
          cb = p;
          p = [];
        }
        if (cb) setTimeout(() => cb(null, []), 0);
        return this;
      }
      get(sql, params, callback) {
        let cb = callback;
        let p = params;
        if (typeof p === 'function') {
          cb = p;
          p = [];
        }
        if (cb) setTimeout(() => cb(null, null), 0);
        return this;
      }
      close(callback) {
        if (callback) setTimeout(() => callback(null), 0);
        return this;
      }
    };
    this.sqliteDriver = {
      Database: MockDatabaseClass,
    };
    return this.sqliteDriver;
  }
  async initialize() {
    const startTime = Date.now();
    try {
      await this._initSQLite();
      await this._initChroma();
      await this._initNeo4j();
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
  async store(context, options = {}) {
    this._ensureInitialized();
    const startTime = Date.now();
    const {
      strategy = 'hybrid',
      ttl = null,
      priority = 'normal',
      tags = [],
      sessionId = null,
      compress = this.config.compression,
    } = options;
    const id = this._generateId();
    const timestamp = /* @__PURE__ */ new Date().toISOString();
    try {
      const results = {};
      if (['sql', 'hybrid'].includes(strategy) && context.text) {
        results.sqlite = await this._storeInSQLite(id, context, { priority, sessionId, tags });
      }
      if (['vector', 'hybrid'].includes(strategy) && (context.embedding || context.text)) {
        results.chroma = await this._storeInChroma(id, context, { priority, sessionId, tags });
      }
      if (['graph', 'hybrid'].includes(strategy) && context.entities) {
        results.neo4j = await this._storeInNeo4j(id, context, { priority, sessionId, tags });
      }
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
  async retrieve(query, options = {}) {
    this._ensureInitialized();
    const startTime = Date.now();
    const {
      strategy = 'hybrid',
      limit = 10,
      threshold = 0.7,
      sessionId = null,
      timeRange = null,
      tags = [],
      includeMetadata = true,
    } = options;
    try {
      const results = {
        items: [],
        sources: {},
        combined: [],
      };
      const cached = this._checkCache(query);
      if (cached && strategy !== 'graph') {
        results.cached = true;
        results.items = cached;
        return results;
      }
      if (['sql', 'hybrid'].includes(strategy) && typeof query === 'string') {
        results.sources.sqlite = await this._querySQLite(query, {
          limit,
          sessionId,
          timeRange,
          tags,
        });
      }
      if (['vector', 'hybrid'].includes(strategy)) {
        const embedding = await this._getEmbedding(query);
        results.sources.chroma = await this._queryChroma(embedding, {
          limit,
          threshold,
          sessionId,
        });
      }
      if (['graph', 'hybrid'].includes(strategy) && typeof query === 'object' && query.entity) {
        results.sources.neo4j = await this._queryNeo4j(query.entity, {
          limit,
          depth: query.depth || 2,
        });
      }
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
  async queryGraph(entity, options = {}) {
    this._ensureInitialized();
    const { depth = 2, relationshipTypes = [], direction = 'both' } = options;
    try {
      return await this._queryNeo4j(entity, { depth, relationshipTypes, direction });
    } catch (error) {
      this.emit('error', { operation: 'queryGraph', error });
      throw error;
    }
  }
  async update(id, updates) {
    this._ensureInitialized();
    try {
      const timestamp = /* @__PURE__ */ new Date().toISOString();
      this.cache.delete(id);
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
  async delete(id) {
    this._ensureInitialized();
    try {
      this.cache.delete(id);
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
  async compress(options = {}) {
    const { olderThan = 7 * 24 * 60 * 60 * 1e3, priority = 'low' } = options;
    try {
      const archived = await this._archiveOldContext(olderThan, priority);
      this.emit('compressed', { archived: archived.length });
      return { compressed: true, archived: archived.length };
    } catch (error) {
      this.emit('error', { operation: 'compress', error });
      throw error;
    }
  }
  async close() {
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
      if (this.stores.sqlite) {
        await new Promise((resolve, reject) => {
          this.stores.sqlite.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      if (this.stores.chroma?.client) {
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
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Memory not initialized. Call initialize() first.');
    }
  }
  async _initSQLite() {
    const dbPath = path.resolve(this.config.sqlite.database || './data/memory.db');
    const sqlite = await this._loadSQLiteDriver();
    return new Promise((resolve, reject) => {
      this.stores.sqlite = new sqlite.Database(dbPath, async (err) => {
        if (err) {
          reject(err);
        } else {
          try {
            const db = this.stores.sqlite;
            await new Promise((res, rej) => {
              db.run(
                `CREATE TABLE IF NOT EXISTS context (
                  id TEXT PRIMARY KEY,
                  session_id TEXT,
                  content TEXT,
                  priority TEXT,
                  tags TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  access_count INTEGER DEFAULT 0,
                  last_accessed DATETIME
                )`,
                (e) => (e ? rej(e) : res())
              );
            });
            await new Promise((res, rej) => {
              db.run(`CREATE INDEX IF NOT EXISTS idx_session ON context(session_id)`, (e) =>
                e ? rej(e) : res()
              );
            });
            await new Promise((res, rej) => {
              db.run(`CREATE INDEX IF NOT EXISTS idx_priority ON context(priority)`, (e) =>
                e ? rej(e) : res()
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
    this.stores.chroma = {
      client: null,
      collection: null,
    };
  }
  async _initNeo4j() {
    this.stores.neo4j = {
      driver: null,
      session: null,
    };
  }
  async _storeInSQLite(id, context, options) {
    return new Promise((resolve, reject) => {
      const { priority, sessionId, tags } = options;
      const db = this.stores.sqlite;
      db.run(
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
  async _storeInChroma(_id, _context, _options) {
    return { id: _id, store: 'chroma', status: 'placeholder' };
  }
  async _storeInNeo4j(_id, _context, _options) {
    return { id: _id, store: 'neo4j', status: 'placeholder' };
  }
  async _querySQLite(query, options) {
    return new Promise((resolve, reject) => {
      const { limit, sessionId, timeRange, tags } = options;
      const db = this.stores.sqlite;
      let sql = `SELECT * FROM context WHERE content LIKE ?`;
      const params = [`%${query}%`];
      if (sessionId) {
        sql += ` AND session_id = ?`;
        params.push(sessionId);
      }
      sql += ` ORDER BY access_count DESC, created_at DESC LIMIT ?`;
      params.push(limit);
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else {
          const typedRows = rows || [];
          typedRows.forEach((row) => {
            db.run(
              `UPDATE context SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?`,
              [row.id]
            );
          });
          resolve(
            typedRows.map((row) => ({
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
  async _queryChroma(_embedding, _options) {
    return [];
  }
  async _queryNeo4j(_entity, _options) {
    return [];
  }
  _mergeResults(sources, options) {
    const { limit } = options;
    const allItems = [];
    Object.entries(sources).forEach(([source, items]) => {
      if (items && items.length) {
        items.forEach((item) => {
          allItems.push({ ...item, _source: source });
        });
      }
    });
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    allItems.sort((a, b) => {
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });
    return allItems.slice(0, limit);
  }
  async _getEmbedding(_text) {
    return [];
  }
  _updateCache(id, context, ttl) {
    const expiresAt = ttl ? Date.now() + ttl : null;
    this.cache.set(id, { context, expiresAt });
    const maxSize = this.config.cache.maxSize || 1e3;
    if (this.cache.size > maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  _checkCache(query) {
    for (const [id, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.cache.delete(id);
        continue;
      }
      if (typeof query === 'string' && entry.context.text?.includes(query)) {
        return [entry.context];
      }
    }
    return null;
  }
  _startCacheCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [id, entry] of this.cache.entries()) {
        if (entry.expiresAt && entry.expiresAt < now) {
          this.cache.delete(id);
        }
      }
    }, 6e4);
  }
  _generateId() {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  async _updateSQLite(id, updates) {
    return new Promise((resolve, reject) => {
      const db = this.stores.sqlite;
      db.run(
        `UPDATE context SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [JSON.stringify(updates), id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
  async _updateChroma(_id, _updates) {}
  async _updateNeo4j(_id, _updates) {}
  async _deleteFromSQLite(id) {
    return new Promise((resolve, reject) => {
      const db = this.stores.sqlite;
      db.run(`DELETE FROM context WHERE id = ?`, [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  async _deleteFromChroma(_id) {}
  async _deleteFromNeo4j(_id) {}
  async _archiveOldContext(olderThan, priority) {
    const cutoff = new Date(Date.now() - olderThan).toISOString();
    const db = this.stores.sqlite;
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM context
         WHERE priority = ?
         AND last_accessed < ?
         OR (last_accessed IS NULL AND created_at < ?)`,
        [priority, cutoff, cutoff],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }
}
var unified_api_default = UnifiedMemory;
export { UnifiedMemory, unified_api_default as default };
