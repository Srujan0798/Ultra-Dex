/**
 * Ultra-Dex LRU Cache
 *
 * In-memory Least Recently Used cache with TTL support.
 * Used for workflow contexts, task outputs, and frequently accessed data.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Cache Entry
// ──────────────────────────────────────────────────────────────────────────────

interface CacheEntry<V> {
  value: V;
  expiresAt?: number;
  lastAccessed: number;
  accessCount: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Cache Options
// ──────────────────────────────────────────────────────────────────────────────

export interface LRUCacheOptions {
  /** Maximum number of items */
  maxSize: number;
  /** Default TTL in milliseconds */
  defaultTTL?: number;
  /** Function called when item is evicted */
  onEvict?: (key: string, value: unknown) => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// LRU Cache
// ──────────────────────────────────────────────────────────────────────────────

export class LRUCache<V> {
  private cache = new Map<string, CacheEntry<V>>();
  private maxSize: number;
  private defaultTTL?: number;
  private onEvict?: (key: string, value: V) => void;
  private hitCount = 0;
  private missCount = 0;

  constructor(options: LRUCacheOptions) {
    this.maxSize = options.maxSize;
    this.defaultTTL = options.defaultTTL;
    this.onEvict = options.onEvict as (key: string, value: V) => void;
  }

  /**
   * Get item from cache
   */
  get(key: string): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return undefined;
    }

    // Check TTL
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.missCount++;
      return undefined;
    }

    // Update access stats
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    this.hitCount++;
    return entry.value;
  }

  /**
   * Set item in cache
   */
  set(key: string, value: V, ttl?: number): void {
    const effectiveTTL = ttl ?? this.defaultTTL;
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<V> = {
      value,
      expiresAt: effectiveTTL ? Date.now() + effectiveTTL : undefined,
      lastAccessed: Date.now(),
      accessCount: 0,
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.onEvict?.(key, entry.value);
      return true;
    }
    return false;
  }

  /**
   * Get or compute value
   */
  async getOrSet(key: string, factory: () => Promise<V>, ttl?: number): Promise<V> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Clear all items
   */
  clear(): void {
    if (this.onEvict) {
      for (const [key, entry] of this.cache) {
        this.onEvict(key, entry.value);
      }
    }
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get all keys (non-expired only)
   */
  keys(): string[] {
    this.cleanupExpired();
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    hitCount: number;
    missCount: number;
  } {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? this.hitCount / total : 0,
      hitCount: this.hitCount,
      missCount: this.missCount,
    };
  }

  /**
   * Peek at value without updating LRU order
   */
  peek(key: string): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  private evictLRU(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      const entry = this.cache.get(firstKey);
      this.cache.delete(firstKey);
      if (entry) {
        this.onEvict?.(firstKey, entry.value);
      }
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Namespaced Cache
// ──────────────────────────────────────────────────────────────────────────────

export class NamespacedCache<V> {
  private cache: LRUCache<V>;
  private namespace: string;

  constructor(namespace: string, options: LRUCacheOptions) {
    this.namespace = namespace;
    this.cache = new LRUCache<V>(options);
  }

  private key(key: string): string {
    return `${this.namespace}:${key}`;
  }

  get(key: string): V | undefined {
    return this.cache.get(this.key(key));
  }

  set(key: string, value: V, ttl?: number): void {
    this.cache.set(this.key(key), value, ttl);
  }

  has(key: string): boolean {
    return this.cache.has(this.key(key));
  }

  delete(key: string): boolean {
    return this.cache.delete(this.key(key));
  }

  getOrSet(key: string, factory: () => Promise<V>, ttl?: number): Promise<V> {
    return this.cache.getOrSet(this.key(key), factory, ttl);
  }

  clear(): void {
    // Only clear keys in this namespace
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${this.namespace}:`)) {
        this.cache.delete(key);
      }
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Multi-Level Cache
// ──────────────────────────────────────────────────────────────────────────────

export interface CacheTier {
  name: string;
  cache: LRUCache<unknown>;
}

export class MultiLevelCache<V> {
  private tiers: CacheTier[];

  constructor(tiers: CacheTier[]) {
    this.tiers = tiers;
  }

  async get(key: string): Promise<V | undefined> {
    for (let i = 0; i < this.tiers.length; i++) {
      const value = this.tiers[i].cache.get(key) as V | undefined;
      if (value !== undefined) {
        // Promote to higher tiers
        for (let j = 0; j < i; j++) {
          this.tiers[j].cache.set(key, value);
        }
        return value;
      }
    }
    return undefined;
  }

  set(key: string, value: V, tierIndex = 0): void {
    for (let i = tierIndex; i < this.tiers.length; i++) {
      this.tiers[i].cache.set(key, value);
    }
  }
}
