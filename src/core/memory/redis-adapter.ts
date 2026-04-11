import Redis from 'ioredis';
import { EventEmitter } from 'events';

export interface IMemoryStorage {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  flush(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export class RedisMemoryAdapter extends EventEmitter implements IMemoryStorage {
  private client: Redis | null = null;
  private isConnected = false;
  private fallbackStorage = new Map<string, { value: unknown; expiresAt?: number }>();
  private tenantId: string;
  private useRedis: boolean;
  public config: { url: string; keyPrefix?: string };

  constructor(
    tenantIdOrOptions:
      | string
      | {
          tenantId?: string;
          url?: string;
          keyPrefix?: string;
        } = 'default'
  ) {
    super();
    const tenantId =
      typeof tenantIdOrOptions === 'string' ? tenantIdOrOptions : tenantIdOrOptions.tenantId || 'default';
    const url =
      (typeof tenantIdOrOptions === 'object' && tenantIdOrOptions.url) ||
      process.env.REDIS_URL ||
      'redis://localhost:6379';
    const keyPrefix =
      typeof tenantIdOrOptions === 'object' ? tenantIdOrOptions.keyPrefix : undefined;

    this.tenantId = tenantId;
    this.config = { url, keyPrefix };
    this.useRedis = !!process.env.REDIS_URL && process.env.MEMORY_BACKEND === 'redis';
  }

  /**
   * Alias for connect() to satisfy integration tests.
   */
  async initialize(url?: string): Promise<void> {
    return this.connect(url);
  }

  /**
   * Check if the adapter is ready (connected to Redis or in fallback mode).
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Alias for disconnect() to satisfy integration tests.
   */
  async close(): Promise<void> {
    return this.disconnect();
  }

  async connect(url?: string): Promise<void> {
    if (!this.useRedis) {
      this.isConnected = true;
      return;
    }

    const redisUrl = url || this.config.url;
    try {
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });

      await this.client.connect();
      this.isConnected = true;
      console.log(`Redis connected to ${redisUrl}`);

      // Auto-create RediSearch index if it doesn't exist
      await this._ensureSearchIndex();
    } catch (error: unknown) {
      const err = error as Error;
      console.warn(
        `Failed to connect to Redis: ${err.message}. Falling back to in-memory storage.`
      );
      this.useRedis = false;
      this.isConnected = true;
    }
  }

  /**
   * Ensure the RediSearch index exists for text/vector search.
   * Creates it if missing. Non-blocking — failures are logged and ignored.
   */
  private async _ensureSearchIndex(): Promise<void> {
    if (!this.client) return;

    const indexName = `idx:ultra-dex:${this.tenantId}:memory`;

    try {
      // Check if index exists via FT.INFO
      await this.client.call('FT.INFO', indexName);
      return; // Index already exists
    } catch {
      // Index doesn't exist — create it
    }

    try {
      // Create a RediSearch index on HASH documents with the ultra-dex key prefix.
      // Schema: 'data' field as TEXT (stores JSON-serialized memory values).
      // This enables FT.SEARCH for text-based semantic matching.
      // For full vector search, add a FLOAT32 vector field to the schema.
      await this.client.call(
        'FT.CREATE',
        indexName,
        'ON',
        'HASH',
        'PREFIX',
        '1',
        `ultra-dex:${this.tenantId}:memory:`,
        'SCHEMA',
        'data', 'TEXT'
      );
      console.log(`RediSearch index '${indexName}' created`);
    } catch (error: unknown) {
      const err = error as Error;
      // Non-fatal: search will fall back to SCAN-based text matching
      console.warn(`RediSearch index creation failed: ${err.message}. SCAN fallback will be used.`);
    }
  }

  private getKey(memoryType: string, key: string): string {
    if (this.config.keyPrefix) {
      return `${this.config.keyPrefix}${key}`;
    }
    return `ultra-dex:${this.tenantId}:${memoryType}:${key}`;
  }

  async store(entry: { id: string; [key: string]: unknown }): Promise<void> {
    await this.set(entry.id, entry);
  }

  async retrieveById(id: string): Promise<unknown> {
    return this.get(id);
  }

  async get(key: string): Promise<unknown> {
    if (!this.isConnected) await this.connect();

    if (this.useRedis && this.client) {
      try {
        const start = Date.now();
        const value = await this.client.get(this.getKey('memory', key));
        const elapsed = Date.now() - start;

        if (elapsed > 10) {
          console.warn(`Redis get operation took ${elapsed}ms (target <10ms)`);
        }

        return value ? JSON.parse(value) : null;
      } catch (error: unknown) {
        const err = error as Error;
        console.warn(`Redis get failed: ${err.message}. Falling back.`);
        this.useRedis = false;
      }
    }

    const entry = this.fallbackStorage.get(key);
    if (!entry) return null;

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.fallbackStorage.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (!this.isConnected) await this.connect();

    const serialized = JSON.stringify(value);

    if (this.useRedis && this.client) {
      try {
        const redisKey = this.getKey('memory', key);

        if (ttl) {
          await this.client.setex(redisKey, Math.floor(ttl / 1000), serialized);
        } else {
          await this.client.set(redisKey, serialized);
        }
        return;
      } catch (error: unknown) {
        const err = error as Error;
        console.warn(`Redis set failed: ${err.message}. Falling back.`);
        this.useRedis = false;
      }
    }

    const expiresAt = ttl ? Date.now() + ttl : undefined;
    this.fallbackStorage.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isConnected) await this.connect();

    if (this.useRedis && this.client) {
      try {
        const redisKey = this.getKey('memory', key);
        const result = await this.client.del(redisKey);
        return result > 0;
      } catch (error: unknown) {
        const err = error as Error;
        console.warn(`Redis delete failed: ${err.message}. Falling back.`);
        this.useRedis = false;
      }
    }

    const existed = this.fallbackStorage.has(key);
    this.fallbackStorage.delete(key);
    return existed;
  }

  async flush(): Promise<void> {
    if (!this.isConnected) await this.connect();

    if (this.useRedis && this.client) {
      try {
        const pattern = `ultra-dex:${this.tenantId}:*`;
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
        return;
      } catch (error: unknown) {
        const err = error as Error;
        console.warn(`Redis flush failed: ${err.message}. Falling back.`);
        this.useRedis = false;
      }
    }

    this.fallbackStorage.clear();
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isConnected) await this.connect();

    if (this.useRedis && this.client) {
      try {
        const start = Date.now();
        await this.client.ping();
        const elapsed = Date.now() - start;
        return elapsed < 100;
      } catch (error: unknown) {
        const err = error as Error;
        console.warn(`Redis health check failed: ${err.message}`);
        return false;
      }
    }

    return true;
  }

  async search(
    query: string,
    topK = 10
  ): Promise<Array<{ id: string; score: number; value: unknown }>> {
    if (!this.isConnected) await this.connect();

    if (!this.useRedis || !this.client) {
      return this._searchFallback(query, topK);
    }

    try {
      const indexName = `idx:ultra-dex:${this.tenantId}:memory`;

      // Attempt RediSearch text query on the 'data' field
      const searchQuery = `@data:(${query})`;
      const results = await this.client.call(
        'FT.SEARCH',
        indexName,
        searchQuery,
        'LIMIT',
        '0',
        String(topK)
      ) as any[];

      if (!results || results.length <= 1) {
        return this._searchFallback(query, topK);
      }

      const formattedResults: Array<{ id: string; score: number; value: unknown }> = [];
      // FT.SEARCH returns [count, key1, [field1, val1, ...], key2, ...]
      for (let i = 1; i < results.length && formattedResults.length < topK; i += 2) {
        const key = results[i];
        const fields = results[i + 1];
        const entry: any = {};
        for (let j = 0; j < fields.length; j += 2) {
          entry[fields[j]] = fields[j + 1];
        }

        let parsedValue: unknown = entry.data;
        try {
          parsedValue = entry.data ? JSON.parse(entry.data) : entry;
        } catch {
          // Keep raw string if not valid JSON
        }

        formattedResults.push({
          id: key.replace(`ultra-dex:${this.tenantId}:memory:`, ''),
          score: 1.0,
          value: parsedValue,
        });
      }

      return formattedResults;
    } catch (error: unknown) {
      const err = error as Error;
      console.warn(`RediSearch failed: ${err.message}. Falling back to SCAN.`);
      return this._searchScanFallback(query, topK);
    }
  }

  /**
   * SCAN-based text search fallback: iterates keys matching the pattern,
   * fetches values, and filters by substring match.
   */
  private async _searchScanFallback(
    query: string,
    topK: number
  ): Promise<Array<{ id: string; score: number; value: unknown }>> {
    if (!this.client) return this._searchFallback(query, topK);

    const pattern = `ultra-dex:${this.tenantId}:memory:*`;
    const queryLower = query.toLowerCase();
    const results: Array<{ id: string; score: number; value: unknown }> = [];

    try {
      // Use SCAN for safe iteration over large key spaces
      let cursor = '0';
      do {
        const scanResult = await this.client.call('SCAN', cursor, 'MATCH', pattern, 'COUNT', '100') as [string, string[]];
        cursor = scanResult[0];
        const keys = scanResult[1];

        for (const key of keys) {
          const val = await this.client.get(key);
          if (!val) continue;

          const valLower = val.toLowerCase();
          if (valLower.includes(queryLower)) {
            let parsed: unknown = val;
            try {
              parsed = JSON.parse(val);
            } catch {
              // Keep raw string
            }

            results.push({
              id: key.replace(`ultra-dex:${this.tenantId}:memory:`, ''),
              score: 1.0,
              value: parsed,
            });

            if (results.length >= topK) return results;
          }
        }
      } while (cursor !== '0');
    } catch (error: unknown) {
      const err = error as Error;
      console.warn(`SCAN search failed: ${err.message}. Using in-memory fallback.`);
    }

    // Final fallback: in-memory store
    return this._searchFallback(query, topK);
  }

  /**
   * In-memory fallback search: searches the fallbackStorage Map.
   */
  private _searchFallback(
    query: string,
    topK: number
  ): Array<{ id: string; score: number; value: unknown }> {
    const results: Array<{ id: string; score: number; value: unknown }> = [];
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter((t) => t.length > 1);

    for (const [key, entry] of this.fallbackStorage.entries()) {
      const valueStr = JSON.stringify(entry.value).toLowerCase();

      let matchScore = 0;
      if (valueStr.includes(queryLower)) {
        matchScore += 10;
      }
      for (const term of queryTerms) {
        if (valueStr.includes(term)) {
          matchScore += 1;
        }
      }

      if (matchScore > 0) {
        results.push({
          id: key,
          score: Math.min(matchScore / (queryTerms.length + 1), 1.0),
          value: entry.value,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
    this.isConnected = false;
  }
}
