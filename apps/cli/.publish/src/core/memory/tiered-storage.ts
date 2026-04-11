import { singleton } from 'tsyringe';
import { RedisMemoryAdapter } from './redis-adapter.js';

export interface TieredStorageOptions {
  hotLimit?: number;
  warmLimit?: number;
  accessThreshold?: number;
  ageThreshold?: number;
}

interface StorageEntry {
  key: string;
  data: unknown;
  metadata: {
    created: Date;
    lastAccessed: Date;
    accessCount: number;
  };
}

@singleton()
export class TieredStorage {
  private hotStorage: Map<string, StorageEntry>;
  private warmStorage: Map<string, StorageEntry>;
  private coldStorage: Map<string, StorageEntry>;
  private hotLimit: number;
  private warmLimit: number;
  private accessThreshold: number;
  private ageThreshold: number;
  private redisAdapter: RedisMemoryAdapter | null;
  private useRedis: boolean;

  constructor(options: TieredStorageOptions = {}) {
    this.hotStorage = new Map();
    this.warmStorage = new Map();
    this.coldStorage = new Map();
    this.hotLimit = options.hotLimit || 1000;
    this.warmLimit = options.warmLimit || 10000;
    this.accessThreshold = options.accessThreshold || 10;
    this.ageThreshold = options.ageThreshold || 24 * 60 * 60 * 1000;

    this.useRedis = process.env.MEMORY_BACKEND === 'redis' && !!process.env.REDIS_URL;
    this.redisAdapter = null;
  }

  private async getAdapter(): Promise<RedisMemoryAdapter> {
    if (!this.redisAdapter && this.useRedis) {
      this.redisAdapter = new RedisMemoryAdapter();
      await this.redisAdapter.connect();
    }
    return this.redisAdapter!;
  }

  async store(key: string, data: unknown, metadata = {}): Promise<StorageEntry> {
    const entry: StorageEntry = {
      key,
      data,
      metadata: {
        ...metadata,
        created: new Date(),
        lastAccessed: new Date(),
        accessCount: 1,
      },
    };

    this.hotStorage.set(key, entry);

    if (this.useRedis) {
      try {
        const adapter = await this.getAdapter();
        await adapter.set(`warm:${key}`, entry, 7 * 24 * 60 * 60 * 1000);
        await adapter.set(`cold:${key}`, entry, 30 * 24 * 60 * 60 * 1000);
      } catch (error) {
        console.warn('Redis store failed, using in-memory fallback:', error);
      }
    }

    await this.rebalance();
    return entry;
  }

  async get(key: string): Promise<unknown> {
    if (this.hotStorage.has(key)) {
      const entry = this.hotStorage.get(key)!;
      entry.metadata.lastAccessed = new Date();
      entry.metadata.accessCount++;
      return entry.data;
    }

    if (this.warmStorage.has(key)) {
      const entry = this.warmStorage.get(key)!;
      entry.metadata.lastAccessed = new Date();
      entry.metadata.accessCount++;
      if (entry.metadata.accessCount >= this.accessThreshold) {
        this.warmStorage.delete(key);
        this.hotStorage.set(key, entry);
        await this.rebalance();
      }
      return entry.data;
    }

    if (this.coldStorage.has(key)) {
      const entry = this.coldStorage.get(key)!;
      entry.metadata.lastAccessed = new Date();
      entry.metadata.accessCount++;
      this.coldStorage.delete(key);
      this.warmStorage.set(key, entry);
      await this.rebalance();
      return entry.data;
    }

    if (this.useRedis) {
      try {
        const adapter = await this.getAdapter();
        const redisEntry = await adapter.get(`cold:${key}`);
        if (redisEntry) {
          this.warmStorage.set(key, redisEntry as StorageEntry);
          return (redisEntry as StorageEntry).data;
        }
      } catch (error) {
        console.warn('Redis get failed:', error);
      }
    }

    return null;
  }

  async rebalance(): Promise<void> {
    while (this.hotStorage.size > this.hotLimit) {
      const lruEntry = this.getLeastRecentlyUsed(this.hotStorage);
      if (lruEntry) {
        const [key, entry] = lruEntry;
        this.hotStorage.delete(key);
        this.warmStorage.set(key, entry);
      }
    }

    while (this.warmStorage.size > this.warmLimit) {
      const lruEntry = this.getLeastRecentlyUsed(this.warmStorage);
      if (lruEntry) {
        const [key, entry] = lruEntry;
        this.warmStorage.delete(key);
        this.coldStorage.set(key, entry);
      }
    }

    await this.archiveOldItems();
  }

  private getLeastRecentlyUsed(storage: Map<string, StorageEntry>): [string, StorageEntry] | null {
    let lruEntry: [string, StorageEntry] | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of storage) {
      if (entry.metadata.lastAccessed.getTime() < lruTime) {
        lruTime = entry.metadata.lastAccessed.getTime();
        lruEntry = [key, entry];
      }
    }
    return lruEntry;
  }

  async archiveOldItems(): Promise<void> {
    const cutoff = Date.now() - this.ageThreshold;
    const toArchive: string[] = [];

    for (const [key, entry] of this.coldStorage) {
      if (entry.metadata.lastAccessed.getTime() < cutoff) {
        toArchive.push(key);
      }
    }

    for (const key of toArchive) {
      this.coldStorage.delete(key);
    }
  }

  getStats(): {
    hot: number;
    warm: number;
    cold: number;
    total: number;
    limits: { hot: number; warm: number };
  } {
    return {
      hot: this.hotStorage.size,
      warm: this.warmStorage.size,
      cold: this.coldStorage.size,
      total: this.hotStorage.size + this.warmStorage.size + this.coldStorage.size,
      limits: {
        hot: this.hotLimit,
        warm: this.warmLimit,
      },
    };
  }
}

export default TieredStorage;
