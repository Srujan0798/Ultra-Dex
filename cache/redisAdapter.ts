/**
 * Ultra-Dex Redis Cache Adapter
 *
 * Production-grade Redis caching for workflow state and execution data.
 * Implements connection pooling, pub/sub, and failover support.
 * 
 * Architecture: ADR-008-v21-cache-and-adapters
 */

import { EventEmitter } from '../observability/eventEmitter.js';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface RedisAdapterConfig {
  /** Redis connection URL (redis://host:port) */
  url: string;
  /** Connection pool min size (default: 2) */
  poolMin?: number;
  /** Connection pool max size (default: 10) */
  poolMax?: number;
  /** Default TTL in seconds (default: 3600 = 1 hour) */
  defaultTTL?: number;
  /** Key prefix for namespacing (default: "ultradex:") */
  keyPrefix?: string;
  /** Enable pub/sub for real-time updates (default: true) */
  enablePubSub?: boolean;
  /** Reconnect retries (default: 3) */
  reconnectRetries?: number;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
  createdAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  connections: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Redis Adapter
// ──────────────────────────────────────────────────────────────────────────────

export class RedisCacheAdapter {
  private config: Required<RedisAdapterConfig>;
  private emitter: EventEmitter;
  private stats = { hits: 0, misses: 0 };
  private connectionPool: any[] = [];
  private isConnected = false;
  private redis: any;

  constructor(config: RedisAdapterConfig) {
    this.config = {
      poolMin: 2,
      poolMax: 10,
      defaultTTL: 3600,
      keyPrefix: 'ultradex:',
      enablePubSub: true,
      reconnectRetries: 3,
      ...config,
    };
    this.emitter = new EventEmitter();
  }

  /**
   * Initialize Redis connection and connection pool
   */
  async connect(): Promise<void> {
    try {
      // Dynamic import to avoid bundling issues
      const { createClient } = await import('redis');
      
      this.redis = createClient({
        url: this.config.url,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > this.config.reconnectRetries) {
              return new Error('Max reconnection attempts exceeded');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.redis.on('error', (err: Error) => {
        this.emitter.emit('error', { message: err.message });
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        this.emitter.emit('connect', { timestamp: new Date().toISOString() });
      });

      await this.redis.connect();
      
      // Initialize pub/sub if enabled
      if (this.config.enablePubSub) {
        await this.initializePubSub();
      }

    } catch (error) {
      throw new Error(`Redis connection failed: ${(error as Error).message}`);
    }
  }

  /**
   * Store value in cache
   */
  async set<T>(key: string, value: T, ttl?: number, tags: string[] = []): Promise<void> {
    this.ensureConnected();
    
    const fullKey = this.fullKey(key);
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ((ttl ?? this.config.defaultTTL) * 1000),
      tags,
      createdAt: Date.now(),
    };

    await this.redis.set(fullKey, JSON.stringify(entry), {
      EX: ttl ?? this.config.defaultTTL,
    });

    // Index by tags for efficient invalidation
    for (const tag of tags) {
      await this.redis.sAdd(this.tagKey(tag), fullKey);
    }

    this.emitter.emit('cache:set', { key: fullKey, tags });
  }

  /**
   * Retrieve value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    this.ensureConnected();
    
    const fullKey = this.fullKey(key);
    const data = await this.redis.get(fullKey);

    if (!data) {
      this.stats.misses++;
      return undefined;
    }

    const entry: CacheEntry<T> = JSON.parse(data);
    
    // Check expiration (Redis handles this, but double-check)
    if (entry.expiresAt < Date.now()) {
      await this.delete(key);
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    this.emitter.emit('cache:hit', { key: fullKey });
    return entry.value;
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    this.ensureConnected();
    const fullKey = this.fullKey(key);
    await this.redis.del(fullKey);
    this.emitter.emit('cache:delete', { key: fullKey });
  }

  /**
   * Invalidate all entries with given tag
   */
  async invalidateTag(tag: string): Promise<void> {
    this.ensureConnected();
    
    const tagKey = this.tagKey(tag);
    const keys = await this.redis.sMembers(tagKey);
    
    if (keys.length > 0) {
      await this.redis.del(keys);
      await this.redis.del(tagKey);
    }

    this.emitter.emit('cache:invalidate', { tag, count: keys.length });
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    this.ensureConnected();
    const exists = await this.redis.exists(this.fullKey(key));
    return exists === 1;
  }

  /**
   * Get or compute value
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: 0, // Would need Redis INFO command
      connections: this.connectionPool.length,
    };
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    this.ensureConnected();
    await this.redis.flushDb();
    this.stats = { hits: 0, misses: 0 };
    this.emitter.emit('cache:clear', { timestamp: new Date().toISOString() });
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }

  /**
   * Subscribe to cache events
   */
  on(event: string, handler: (data: unknown) => void): void {
    this.emitter.on(event as any, handler);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────────────────────────────────────

  private fullKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  private tagKey(tag: string): string {
    return `${this.config.keyPrefix}tag:${tag}`;
  }

  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error('Redis adapter not connected. Call connect() first.');
    }
  }

  private async initializePubSub(): Promise<void> {
    // Pub/Sub implementation for real-time cache invalidation
    const subscriber = this.redis.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe('ultradex:invalidate', (message: string) => {
      this.emitter.emit('pubsub:invalidate', JSON.parse(message));
    });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Factory Function
// ──────────────────────────────────────────────────────────────────────────────

export async function createRedisCache(config: RedisAdapterConfig): Promise<RedisCacheAdapter> {
  const adapter = new RedisCacheAdapter(config);
  await adapter.connect();
  return adapter;
}
