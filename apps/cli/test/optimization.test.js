// Copyright (c) 2026 Ultra-Dex

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  UltraOptimizer,
  PerformanceMetrics,
  UltraCache,
  WorkerPool,
} from '../lib/optimization/ultra.js';

describe('Ultra Optimization v6.0', () => {
  describe('PerformanceMetrics', () => {
    it('should record metrics', () => {
      const metrics = new PerformanceMetrics();
      metrics.record('test-op', 100);

      const stats = metrics.getStats('test-op');
      assert.strictEqual(stats.count, 1);
      assert.strictEqual(stats.avg, 100);
    });

    it('should calculate percentiles', () => {
      const metrics = new PerformanceMetrics();

      for (let i = 1; i <= 100; i++) {
        metrics.record('test', i);
      }

      const stats = metrics.getStats('test');
      assert.ok(stats.p95 > 90);
      assert.ok(stats.p99 > 98);
    });

    it('should track slow operations', () => {
      const metrics = new PerformanceMetrics();
      metrics.record('fast', 10);
      metrics.record('slow', 2000);

      const slow = metrics.getSlowOperations(1000);
      assert.strictEqual(slow.length, 1);
      assert.strictEqual(slow[0].duration, 2000);
    });

    it('should generate recommendations', () => {
      const metrics = new PerformanceMetrics();

      for (let i = 0; i < 10; i++) {
        metrics.record('slow-op', 2000);
      }

      const recs = metrics.getRecommendations();
      assert.ok(recs.length > 0);
      assert.strictEqual(recs[0].priority, 'high');
    });
  });

  describe('UltraCache', () => {
    it('should cache and retrieve values', () => {
      const cache = new UltraCache();
      cache.set('key1', 'value1');

      const value = cache.get('key1');
      assert.strictEqual(value, 'value1');
    });

    it('should return undefined for missing keys', () => {
      const cache = new UltraCache();
      const value = cache.get('missing');
      assert.strictEqual(value, undefined);
    });

    it('should track hit rate', () => {
      const cache = new UltraCache();

      cache.set('key', 'value');
      cache.get('key'); // hit
      cache.get('key'); // hit
      cache.get('missing'); // miss

      const stats = cache.getStats();
      assert.ok(stats.hitRate.includes('66'));
    });

    it('should evict LRU items', () => {
      const cache = new UltraCache({ maxSize: 2 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3'); // Should evict key1

      assert.strictEqual(cache.get('key1'), undefined);
      assert.strictEqual(cache.get('key2'), 'value2');
      assert.strictEqual(cache.get('key3'), 'value3');
    });

    it('should respect TTL', async () => {
      const cache = new UltraCache({ ttl: 50 });
      cache.set('key', 'value');

      assert.strictEqual(cache.get('key'), 'value');

      await new Promise((r) => setTimeout(r, 100));
      assert.strictEqual(cache.get('key'), undefined);
    });
  });

  describe('UltraOptimizer', () => {
    it('should optimize function with caching', async () => {
      const optimizer = new UltraOptimizer();

      let callCount = 0;
      const fn = async (x) => {
        callCount++;
        return x * 2;
      };

      const optimized = optimizer.optimize(fn, { cacheKey: 'double' });

      const result1 = await optimized(5);
      const result2 = await optimized(5);

      assert.strictEqual(result1, 10);
      assert.strictEqual(result2, 10);
      assert.strictEqual(callCount, 1); // Cached
    });

    it('should batch operations', async () => {
      const optimizer = new UltraOptimizer();

      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push({
          fn: async (x) => x * 2,
          args: [i],
          options: {},
        });
      }

      const results = await optimizer.batch(operations);

      assert.strictEqual(results.length, 10);
      assert.strictEqual(results[0], 0);
      assert.strictEqual(results[5], 10);
    });

    it('should track metrics', async () => {
      const optimizer = new UltraOptimizer();

      const fn = async () => 'result';
      const optimized = optimizer.optimize(fn, { cacheKey: 'test' });

      await optimized();

      const report = optimizer.getReport();
      assert.ok(report.metrics);
      assert.ok(report.cache);
    });
  });
});
