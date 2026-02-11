/**
 * @fileoverview Cache Redis module
 * @module features/cache-redis
 */

// Multi-layer cache template (L1 + L2)

type CacheEntry<T> = { value: T; expiresAt: number };

export class L1Cache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  constructor(private ttlMs = 30_000) {}

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs = this.ttlMs) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

export class MultiLayerCache<T = unknown> {
  constructor(
    private l1 = new L1Cache<T>(),
    private redis?: { get: (key: string) => Promise<string | null>; setex: (key: string, ttl: number, value: string) => Promise<void> }
  ) {}

  async get(key: string): Promise<T | null> {
    const inMemory = this.l1.get(key);
    if (inMemory) return inMemory;

    if (!this.redis) return null;
    const raw = await this.redis.get(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as T;
    this.l1.set(key, value);
    return value;
  }

  async set(key: string, value: T, ttlSeconds = 60) {
    this.l1.set(key, value, ttlSeconds * 1000);
    if (this.redis) {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    }
  }
}

/**
 * Error handler for cache-redis
 * @param {Error} error - Error to handle
 */
function handleCacheredisError(error) {
  try {
    console.error('[cache-redis]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
