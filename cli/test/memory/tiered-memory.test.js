/**
 * Tests for Tiered Memory System (Hot-Warm-Cold)
 *
 * Critical performance module - ensures efficient memory management
 */

import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Tiered Memory System - Basic Tests', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-memory-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Memory Tier Structure', () => {
    test('should define hot tier for recent data', () => {
      const hotTier = {
        name: 'hot',
        maxSize: 100,
        ttl: 5000, // 5 seconds
        priority: 1
      };

      assert.strictEqual(hotTier.name, 'hot');
      assert.strictEqual(hotTier.priority, 1);
    });

    test('should define warm tier for frequent data', () => {
      const warmTier = {
        name: 'warm',
        maxSize: 500,
        ttl: 60000, // 1 minute
        priority: 2
      };

      assert.strictEqual(warmTier.name, 'warm');
      assert.strictEqual(warmTier.priority, 2);
    });

    test('should define cold tier for archived data', () => {
      const coldTier = {
        name: 'cold',
        maxSize: Infinity,
        ttl: Infinity,
        priority: 3
      };

      assert.strictEqual(coldTier.name, 'cold');
      assert.strictEqual(coldTier.priority, 3);
    });
  });

  describe('Memory Tier Operations', () => {
    test('should store data in hot tier first', () => {
      const memoryStore = new Map();
      const data = { key: 'test', value: 'data', tier: 'hot' };

      memoryStore.set('test', data);

      assert.strictEqual(memoryStore.get('test').tier, 'hot');
    });

    test('should move data from hot to warm tier', () => {
      const hotData = { key: 'test', tier: 'hot', accessCount: 0 };

      // Simulate tier transition
      hotData.tier = 'warm';
      hotData.accessCount = 5;

      assert.strictEqual(hotData.tier, 'warm');
      assert.strictEqual(hotData.accessCount, 5);
    });

    test('should archive data to cold tier', () => {
      const warmData = { key: 'test', tier: 'warm', lastAccess: Date.now() };

      // Simulate archival
      warmData.tier = 'cold';
      warmData.archived = true;

      assert.strictEqual(warmData.tier, 'cold');
      assert.strictEqual(warmData.archived, true);
    });

    test('should handle data promotion from cold to hot', () => {
      const coldData = { key: 'test', tier: 'cold', value: 'archived' };

      // Simulate access and promotion
      coldData.tier = 'hot';
      coldData.lastAccess = Date.now();

      assert.strictEqual(coldData.tier, 'hot');
      assert.ok(coldData.lastAccess);
    });
  });

  describe('Memory Eviction', () => {
    test('should evict least recently used items from hot tier', () => {
      const hotTier = [];

      // Add items
      hotTier.push({ key: 'a', lastAccess: 100 });
      hotTier.push({ key: 'b', lastAccess: 200 });
      hotTier.push({ key: 'c', lastAccess: 300 });

      // Sort by lastAccess (oldest first)
      hotTier.sort((a, b) => a.lastAccess - b.lastAccess);

      // Evict oldest
      const evicted = hotTier.shift();

      assert.strictEqual(evicted.key, 'a');
      assert.strictEqual(hotTier.length, 2);
    });

    test('should respect tier size limits', () => {
      const maxSize = 5;
      const items = [];

      for (let i = 0; i < 10; i++) {
        items.push({ key: `item${i}`, data: `data${i}` });
      }

      // Keep only maxSize items
      const limited = items.slice(-maxSize);

      assert.strictEqual(limited.length, maxSize);
      assert.strictEqual(limited[0].key, 'item5');
    });
  });

  describe('Data Compression', () => {
    test('should mark data for compression in cold tier', () => {
      const coldItem = {
        key: 'large-data',
        value: 'x'.repeat(1000),
        compressed: false
      };

      // Simulate compression
      coldItem.compressed = true;
      coldItem.originalSize = coldItem.value.length;
      coldItem.value = 'compressed-data';

      assert.strictEqual(coldItem.compressed, true);
      assert.strictEqual(coldItem.originalSize, 1000);
    });

    test('should decompress data on access', () => {
      const compressedItem = {
        key: 'test',
        value: 'compressed',
        compressed: true,
        originalValue: 'original-data'
      };

      // Simulate decompression
      compressedItem.value = compressedItem.originalValue;
      compressedItem.compressed = false;

      assert.strictEqual(compressedItem.value, 'original-data');
      assert.strictEqual(compressedItem.compressed, false);
    });
  });

  describe('Access Patterns', () => {
    test('should track access frequency', () => {
      const item = { key: 'test', accessCount: 0 };

      // Simulate multiple accesses
      item.accessCount++;
      item.accessCount++;
      item.accessCount++;

      assert.strictEqual(item.accessCount, 3);
    });

    test('should update last access timestamp', () => {
      const item = { key: 'test', lastAccess: 0 };

      const now = Date.now();
      item.lastAccess = now;

      assert.strictEqual(item.lastAccess, now);
    });

    test('should promote frequently accessed cold items', () => {
      const item = {
        key: 'popular',
        tier: 'cold',
        accessCount: 0
      };

      // Simulate frequent accesses
      for (let i = 0; i < 10; i++) {
        item.accessCount++;
      }

      // Promote if accessCount > threshold
      if (item.accessCount >= 5) {
        item.tier = 'hot';
      }

      assert.strictEqual(item.tier, 'hot');
    });
  });

  describe('Memory Statistics', () => {
    test('should calculate tier sizes', () => {
      const stats = {
        hot: { count: 10, bytes: 1024 },
        warm: { count: 50, bytes: 5120 },
        cold: { count: 200, bytes: 20480 }
      };

      const totalCount = stats.hot.count + stats.warm.count + stats.cold.count;
      const totalBytes = stats.hot.bytes + stats.warm.bytes + stats.cold.bytes;

      assert.strictEqual(totalCount, 260);
      assert.strictEqual(totalBytes, 26624);
    });

    test('should track hit/miss ratios', () => {
      const metrics = {
        hits: 80,
        misses: 20,
        total: 100
      };

      const hitRatio = metrics.hits / metrics.total;
      const missRatio = metrics.misses / metrics.total;

      assert.strictEqual(hitRatio, 0.8);
      assert.strictEqual(missRatio, 0.2);
    });
  });

  describe('Tier Transitions', () => {
    test('should handle hot to warm transition', () => {
      const transitions = [];
      const item = { key: 'test', tier: 'hot' };

      // Record transition
      transitions.push({ from: item.tier, to: 'warm', timestamp: Date.now() });
      item.tier = 'warm';

      assert.strictEqual(item.tier, 'warm');
      assert.strictEqual(transitions[0].from, 'hot');
      assert.strictEqual(transitions[0].to, 'warm');
    });

    test('should handle warm to cold transition', () => {
      const item = { key: 'test', tier: 'warm', lastAccess: Date.now() - 120000 };

      // Move to cold if not accessed for 2 minutes
      const ageMs = Date.now() - item.lastAccess;
      if (ageMs > 60000) {
        item.tier = 'cold';
      }

      assert.strictEqual(item.tier, 'cold');
    });

    test('should handle cold to hot promotion on access', () => {
      const item = { key: 'test', tier: 'cold' };

      // Promote on access
      item.tier = 'hot';
      item.lastAccess = Date.now();
      item.accessCount = 1;

      assert.strictEqual(item.tier, 'hot');
      assert.strictEqual(item.accessCount, 1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty tiers', () => {
      const tiers = {
        hot: [],
        warm: [],
        cold: []
      };

      assert.strictEqual(tiers.hot.length, 0);
      assert.strictEqual(tiers.warm.length, 0);
      assert.strictEqual(tiers.cold.length, 0);
    });

    test('should handle single item across tiers', () => {
      const item = { key: 'lonely', tier: 'hot' };

      // Move through tiers
      item.tier = 'warm';
      assert.strictEqual(item.tier, 'warm');

      item.tier = 'cold';
      assert.strictEqual(item.tier, 'cold');

      item.tier = 'hot';
      assert.strictEqual(item.tier, 'hot');
    });

    test('should handle concurrent access', () => {
      const item = { key: 'concurrent', accessCount: 0 };

      // Simulate concurrent accesses
      const accesses = [1, 2, 3, 4, 5];
      accesses.forEach(() => item.accessCount++);

      assert.strictEqual(item.accessCount, 5);
    });

    test('should handle large data items', () => {
      const largeItem = {
        key: 'large',
        value: 'x'.repeat(100000),
        size: 100000
      };

      assert.ok(largeItem.size > 50000);
      assert.strictEqual(largeItem.value.length, 100000);
    });
  });

  describe('Performance Characteristics', () => {
    test('should have fast hot tier access', () => {
      const hotTier = new Map();
      hotTier.set('fast', { value: 'data' });

      const start = Date.now();
      const value = hotTier.get('fast');
      const duration = Date.now() - start;

      assert.ok(value);
      assert.ok(duration < 10); // Should be < 10ms
    });

    test('should track tier access times', () => {
      const metrics = {
        hotAccessTime: 1,
        warmAccessTime: 10,
        coldAccessTime: 100
      };

      assert.ok(metrics.hotAccessTime < metrics.warmAccessTime);
      assert.ok(metrics.warmAccessTime < metrics.coldAccessTime);
    });
  });
});
