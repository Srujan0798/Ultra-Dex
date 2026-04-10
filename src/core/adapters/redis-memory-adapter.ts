/**
 * Redis Memory Adapter
 * Provides Redis-backed storage for L1/L2 memory tiers
 */

import { Redis } from 'ioredis';
import { EventEmitter } from 'events';

export interface RedisMemoryConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number;
}

export interface MemoryEntry {
  id: string;
  content: string;
  metadata: {
    type?: string;
    source?: string;
    importance?: number;
    sessionId?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
  vector?: number[];
}

export interface SearchOptions {
  limit?: number;
  tags?: string[];
  sessionId?: string;
}

export interface SearchResult {
  items: MemoryEntry[];
  total: number;
}

/**
 * Redis-backed memory adapter for high-performance L1/L2 storage
 */
export class RedisMemoryAdapter extends EventEmitter {
  private redis: Redis | null = null;
  private config: Required<RedisMemoryConfig>;
  private initialized = false;

  constructor(config: RedisMemoryConfig = {}) {
    super();
    this.config = {
      url: config.url || process.env.REDIS_URL || 'redis://localhost:6379',
      host: config.host || 'localhost',
      port: config.port || 6379,
      password: config.password || process.env.REDIS_PASSWORD || '',
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'ultra-dex:memory:',
      ttl: config.ttl || 86400 * 7, // 7 days default
    };
  }

  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.redis = new Redis(this.config.url, {
        host: this.config.host,
        port: this.config.port,
        password: this.config.password || undefined,
        db: this.config.db,
        retryStrategy: (times) => {
          if (times > 3) {
            this.emit('error', new Error('Redis connection failed after 3 retries'));
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        maxRetriesPerRequest: 3,
      });

      this.redis.on('error', (err) => {
        this.emit('error', err);
      });

      this.redis.on('connect', () => {
        this.emit('connect');
      });

      // Test connection
      await this.redis.ping();
      this.initialized = true;
      this.emit('ready');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Check if adapter is ready
   */
  isReady(): boolean {
    return this.initialized && this.redis?.status === 'ready';
  }

  /**
   * Store a memory entry
   */
  async store(entry: MemoryEntry, options: { priority?: string; tags?: string[]; sessionId?: string } = {}): Promise<MemoryEntry> {
    if (!this.redis || !this.initialized) {
      throw new Error('Redis adapter not initialized');
    }

    const key = `${this.config.keyPrefix}${entry.id}`;
    const data = JSON.stringify({
      ...entry,
      _storedAt: new Date().toISOString(),
      _tags: options.tags || [],
      _priority: options.priority || 'normal',
    });

    // Store main data with TTL
    await this.redis.setex(key, this.config.ttl, data);

    // Add to tag indices
    if (options.tags) {
      for (const tag of options.tags) {
        await this.redis.sadd(`${this.config.keyPrefix}tag:${tag}`, entry.id);
      }
    }

    // Add to session index
    if (options.sessionId || entry.metadata?.sessionId) {
      const sessionId = options.sessionId || entry.metadata?.sessionId;
      await this.redis.sadd(`${this.config.keyPrefix}session:${sessionId}`, entry.id);
    }

    // Add to sorted set for time-based queries
    await this.redis.zadd(
      `${this.config.keyPrefix}timeline`,
      Date.now(),
      entry.id
    );

    this.emit('stored', entry);
    return entry;
  }

  /**
   * Retrieve a memory entry by ID
   */
  async retrieveById(id: string): Promise<MemoryEntry | null> {
    if (!this.redis || !this.initialized) {
      throw new Error('Redis adapter not initialized');
    }

    const data = await this.redis.get(`${this.config.keyPrefix}${id}`);
    if (!data) return null;

    const parsed = JSON.parse(data);
    delete parsed._storedAt;
    delete parsed._tags;
    delete parsed._priority;
    return parsed;
  }

  /**
   * Search memory entries
   * Note: This does vector search - for vector similarity, use the vector store
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    if (!this.redis || !this.initialized) {
      throw new Error('Redis adapter not initialized');
    }

    const { limit = 10, tags, sessionId } = options;
    let ids: string[] = [];

    if (sessionId) {
      // Get by session
      ids = await this.redis.smembers(`${this.config.keyPrefix}session:${sessionId}`);
    } else if (tags && tags.length > 0) {
      // Get by tags (union)
      const tagKeys = tags.map(t => `${this.config.keyPrefix}tag:${t}`);
      ids = await this.redis.sunion(...tagKeys);
    } else {
      // Get recent entries from timeline
      ids = await this.redis.zrevrange(`${this.config.keyPrefix}timeline`, 0, limit * 2);
    }

    // Fetch entries
    const entries: MemoryEntry[] = [];
    for (const id of ids.slice(0, limit)) {
      const entry = await this.retrieveById(id);
      if (entry) entries.push(entry);
    }

    return { items: entries, total: ids.length };
  }

  /**
   * Get entries by tag
   */
  async getByTag(tag: string, limit = 100): Promise<MemoryEntry[]> {
    if (!this.redis || !this.initialized) {
      throw new Error('Redis adapter not initialized');
    }

    const ids = await this.redis.smembers(`${this.config.keyPrefix}tag:${tag}`);
    const entries: MemoryEntry[] = [];

    for (const id of ids.slice(0, limit)) {
      const entry = await this.retrieveById(id);
      if (entry) entries.push(entry);
    }

    return entries;
  }

  /**
   * Delete a memory entry
   */
  async delete(id: string): Promise<boolean> {
    if (!this.redis || !this.initialized) {
      throw new Error('Redis adapter not initialized');
    }

    const entry = await this.retrieveById(id);
    if (!entry) return false;

    const key = `${this.config.keyPrefix}${id}`;
    
    // Remove from tag indices
    const data = await this.redis.get(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed._tags) {
        for (const tag of parsed._tags) {
          await this.redis.srem(`${this.config.keyPrefix}tag:${tag}`, id);
        }
      }
    }

    // Remove from session index
    if (entry.metadata?.sessionId) {
      await this.redis.srem(`${this.config.keyPrefix}session:${entry.metadata.sessionId}`, id);
    }

    // Remove from timeline
    await this.redis.zrem(`${this.config.keyPrefix}timeline`, id);

    // Delete main entry
    await this.redis.del(key);

    this.emit('deleted', id);
    return true;
  }

  /**
   * Clear all memory entries
   */
  async clear(): Promise<void> {
    if (!this.redis || !this.initialized) {
      throw new Error('Redis adapter not initialized');
    }

    const keys = await this.redis.keys(`${this.config.keyPrefix}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    this.emit('cleared');
  }

  /**
   * Get memory stats
   */
  async getStats(): Promise<{ total: number; byTag: Record<string, number> }> {
    if (!this.redis || !this.initialized) {
      throw new Error('Redis adapter not initialized');
    }

    const keys = await this.redis.keys(`${this.config.keyPrefix}[^:]*`);
    const tagKeys = await this.redis.keys(`${this.config.keyPrefix}tag:*`);
    const byTag: Record<string, number> = {};

    for (const tagKey of tagKeys) {
      const tag = tagKey.replace(`${this.config.keyPrefix}tag:`, '');
      byTag[tag] = await this.redis.scard(tagKey);
    }

    return { total: keys.length, byTag };
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.initialized = false;
      this.emit('closed');
    }
  }
}

// Singleton instance
let redisAdapterInstance: RedisMemoryAdapter | null = null;

export function getRedisAdapter(config?: RedisMemoryConfig): RedisMemoryAdapter {
  if (!redisAdapterInstance) {
    redisAdapterInstance = new RedisMemoryAdapter(config);
  }
  return redisAdapterInstance;
}

export function resetRedisAdapter(): void {
  redisAdapterInstance = null;
}

export default RedisMemoryAdapter;
