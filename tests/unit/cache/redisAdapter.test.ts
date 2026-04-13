/**
 * Redis Cache Adapter Tests
 *
 * Tests for RedisCacheAdapter with connection pooling,
 * CRUD operations, tags, and pub/sub functionality.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { RedisCacheAdapter, createRedisCache } from '../../../cache/redisAdapter.js';

// Skip tests if Redis is not available
const skipIfNoRedis = process.env.SKIP_REDIS_TESTS === 'true';

describe('RedisCacheAdapter', { skip: skipIfNoRedis }, () => {
  let cache: RedisCacheAdapter;
  const testURL = process.env.REDIS_URL || 'redis://localhost:6379';

  before(async () => {
    try {
      cache = await createRedisCache({
        url: testURL,
        keyPrefix: 'test:',
        defaultTTL: 60,
      });
    } catch (err) {
      console.warn('Redis not available, skipping tests:', (err as Error).message);
      process.env.SKIP_REDIS_TESTS = 'true';
    }
  });

  after(async () => {
    if (cache) {
      await cache.clear();
      await cache.disconnect();
    }
  });

  describe('Basic CRUD Operations', () => {
    it('should set and get a value', async () => {
      const key = 'test-key-1';
      const value = { foo: 'bar', num: 42 };

      await cache.set(key, value);
      const retrieved = await cache.get<typeof value>(key);

      assert.deepStrictEqual(retrieved, value);
    });

    it('should return undefined for non-existent key', async () => {
      const result = await cache.get('non-existent-key');
      assert.strictEqual(result, undefined);
    });

    it('should check if key exists', async () => {
      const key = 'exists-test';
      await cache.set(key, 'value');

      assert.strictEqual(await cache.has(key), true);
      assert.strictEqual(await cache.has('does-not-exist'), false);
    });

    it('should delete a key', async () => {
      const key = 'delete-test';
      await cache.set(key, 'value');
      assert.strictEqual(await cache.has(key), true);

      await cache.delete(key);
      assert.strictEqual(await cache.has(key), false);
    });

    it('should handle complex objects', async () => {
      const key = 'complex-object';
      const value = {
        string: 'test',
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        nested: { a: { b: { c: 'deep' } } },
        date: new Date().toISOString(),
      };

      await cache.set(key, value);
      const retrieved = await cache.get<typeof value>(key);

      assert.deepStrictEqual(retrieved, value);
    });
  });

  describe('TTL and Expiration', () => {
    it('should respect custom TTL', async () => {
      const key = 'ttl-test';
      const value = 'expires-quickly';

      // Set with 1 second TTL
      await cache.set(key, value, 1);
      assert.strictEqual(await cache.get(key), value);

      // Wait for expiration
      await new Promise(r => setTimeout(r, 1500));
      assert.strictEqual(await cache.get(key), undefined);
    });

    it('should use default TTL when not specified', async () => {
      const key = 'default-ttl-test';
      await cache.set(key, 'value');

      // Should exist immediately
      assert.strictEqual(await cache.has(key), true);
    });
  });

  describe('Tag-based Invalidation', () => {
    it('should invalidate by tag', async () => {
      const tag = 'user-123';
      const key1 = 'user-profile-123';
      const key2 = 'user-settings-123';
      const otherKey = 'other-data';

      await cache.set(key1, { name: 'John' }, 60, [tag]);
      await cache.set(key2, { theme: 'dark' }, 60, [tag]);
      await cache.set(otherKey, 'untagged', 60);

      // All should exist
      assert.strictEqual(await cache.has(key1), true);
      assert.strictEqual(await cache.has(key2), true);
      assert.strictEqual(await cache.has(otherKey), true);

      // Invalidate by tag
      await cache.invalidateTag(tag);

      // Tagged keys should be gone
      assert.strictEqual(await cache.has(key1), false);
      assert.strictEqual(await cache.has(key2), false);
      // Untagged key should remain
      assert.strictEqual(await cache.has(otherKey), true);
    });

    it('should support multiple tags per key', async () => {
      const key = 'multi-tag-key';
      await cache.set(key, 'value', 60, ['tag-a', 'tag-b', 'tag-c']);

      // Invalidate by one tag
      await cache.invalidateTag('tag-a');
      assert.strictEqual(await cache.has(key), false);
    });
  });

  describe('getOrSet Pattern', () => {
    it('should return cached value if exists', async () => {
      const key = 'cached-pattern';
      const cachedValue = 'already-here';
      await cache.set(key, cachedValue);

      let factoryCalled = false;
      const result = await cache.getOrSet(key, async () => {
        factoryCalled = true;
        return 'new-value';
      });

      assert.strictEqual(result, cachedValue);
      assert.strictEqual(factoryCalled, false);
    });

    it('should call factory and cache result if not exists', async () => {
      const key = 'new-pattern';
      const newValue = 'factory-created';

      const result = await cache.getOrSet(key, async () => newValue);

      assert.strictEqual(result, newValue);
      assert.strictEqual(await cache.get(key), newValue);
    });

    it('should handle factory errors', async () => {
      const key = 'error-pattern';

      await assert.rejects(
        async () => {
          await cache.getOrSet(key, async () => {
            throw new Error('Factory failed');
          });
        },
        /Factory failed/
      );
    });
  });

  describe('Statistics', () => {
    it('should track hits and misses', async () => {
      // Clear stats by creating fresh cache
      const statsCache = await createRedisCache({
        url: testURL,
        keyPrefix: 'stats:',
      });

      // Generate hits
      await statsCache.set('key1', 'value1');
      await statsCache.get('key1'); // hit
      await statsCache.get('key1'); // hit

      // Generate misses
      await statsCache.get('nonexistent1'); // miss
      await statsCache.get('nonexistent2'); // miss

      const stats = statsCache.getStats();
      assert.strictEqual(stats.hits, 2);
      assert.strictEqual(stats.misses, 2);

      await statsCache.disconnect();
    });
  });

  describe('Clear Operations', () => {
    it('should clear all cached data', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      assert.strictEqual(await cache.has('key1'), true);

      await cache.clear();

      assert.strictEqual(await cache.has('key1'), false);
      assert.strictEqual(await cache.has('key2'), false);
      assert.strictEqual(await cache.has('key3'), false);
    });
  });

  describe('Events', () => {
    it('should emit set events', async () => {
      const events: string[] = [];
      cache.on('cache:set', () => events.push('set'));

      await cache.set('event-test', 'value');
      
      assert.strictEqual(events.includes('set'), true);
    });

    it('should emit hit events', async () => {
      const events: string[] = [];
      cache.on('cache:hit', () => events.push('hit'));

      await cache.set('hit-test', 'value');
      await cache.get('hit-test');
      
      assert.strictEqual(events.includes('hit'), true);
    });

    it('should emit delete events', async () => {
      const events: string[] = [];
      cache.on('cache:delete', () => events.push('delete'));

      await cache.set('delete-test', 'value');
      await cache.delete('delete-test');
      
      assert.strictEqual(events.includes('delete'), true);
    });
  });

  describe('Error Handling', () => {
    it('should throw when not connected', async () => {
      const disconnectedCache = new RedisCacheAdapter({
        url: testURL,
      });

      await assert.rejects(
        async () => {
          await disconnectedCache.set('key', 'value');
        },
        /not connected/
      );
    });
  });
});

describe('RedisCacheAdapter - Mock Mode (no Redis)', { skip: !skipIfNoRedis }, () => {
  it('should be skipped when Redis is available', () => {
    assert.ok(true, 'Tests skipped - Redis is available');
  });
});
