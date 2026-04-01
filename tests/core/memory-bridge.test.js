// Copyright (c) 2026 Ultra-Dex
// MemoryBridge LRU Cache Eviction Tests

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { tmpdir } from 'os';
import { join } from 'path';
import fs from 'fs/promises';
import { MemoryBridge } from '../../apps/cli/lib/autonomous/memory-bridge.js';

describe('MemoryBridge LRU Cache Eviction', () => {
  let testDir;
  let bridge;

  beforeEach(async () => {
    testDir = join(tmpdir(), `ultra-dex-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    if (bridge) {
      await bridge.clearAll();
    }
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should respect maxCacheSize limit with LRU eviction', async () => {
    const maxCacheSize = 3;
    bridge = new MemoryBridge({ dataDir: testDir, maxCacheSize });
    await bridge.initialize();

    // Add 5 items to cache
    for (let i = 1; i <= 5; i++) {
      await bridge.saveContext({
        sessionId: `session_${i}`,
        goal: `Test goal ${i}`,
        plan: { tasks: [] },
        taskResults: []
      });
    }

    // Cache should only have maxCacheSize items
    const stats = bridge.getStats();
    assert.strictEqual(stats.cachedSessions, maxCacheSize, `Cache should have ${maxCacheSize} items`);

    // Verify oldest items (1, 2) were evicted, newest (3, 4, 5) remain
    assert.strictEqual(bridge._cache.has('session_1'), false, 'session_1 should be evicted');
    assert.strictEqual(bridge._cache.has('session_2'), false, 'session_2 should be evicted');
    assert.strictEqual(bridge._cache.has('session_3'), true, 'session_3 should remain');
    assert.strictEqual(bridge._cache.has('session_4'), true, 'session_4 should remain');
    assert.strictEqual(bridge._cache.has('session_5'), true, 'session_5 should remain');
  });

  it('should update LRU order on cache hit', async () => {
    const maxCacheSize = 3;
    bridge = new MemoryBridge({ dataDir: testDir, maxCacheSize });
    await bridge.initialize();

    // Add 3 items
    for (let i = 1; i <= 3; i++) {
      await bridge.saveContext({
        sessionId: `session_${i}`,
        goal: `Test goal ${i}`,
        plan: { tasks: [] },
        taskResults: []
      });
    }

    // Access session_1 to make it most recently used
    await bridge.loadContext('session_1');

    // Add one more item, should evict session_2 (now oldest)
    await bridge.saveContext({
      sessionId: 'session_4',
      goal: 'Test goal 4',
      plan: { tasks: [] },
      taskResults: []
    });

    // session_2 should be evicted, session_1 should remain
    assert.strictEqual(bridge._cache.has('session_1'), true, 'session_1 should remain (was accessed)');
    assert.strictEqual(bridge._cache.has('session_2'), false, 'session_2 should be evicted (oldest)');
    assert.strictEqual(bridge._cache.has('session_3'), true, 'session_3 should remain');
    assert.strictEqual(bridge._cache.has('session_4'), true, 'session_4 should remain');
  });

  it('should track cache hit/miss statistics', async () => {
    bridge = new MemoryBridge({ dataDir: testDir, maxCacheSize: 10 });
    await bridge.initialize();

    // Save a context
    await bridge.saveContext({
      sessionId: 'session_hit',
      goal: 'Test goal',
      plan: { tasks: [] },
      taskResults: []
    });

    // Load existing context (cache hit)
    await bridge.loadContext('session_hit');
    await bridge.loadContext('session_hit');

    // Load non-existing context (cache miss)
    await bridge.loadContext('session_nonexistent');

    const stats = bridge.getStats();
    assert.strictEqual(stats.cacheStats.hits, 2, 'Should have 2 cache hits');
    assert.strictEqual(stats.cacheStats.misses, 1, 'Should have 1 cache miss');
    assert.strictEqual(stats.cacheStats.hitRate, 0.67, 'Hit rate should be ~0.67');
    assert.strictEqual(stats.cacheStats.missRate, 0.33, 'Miss rate should be ~0.33');
  });

  it('should include maxCacheSize in stats', async () => {
    const maxCacheSize = 25;
    bridge = new MemoryBridge({ dataDir: testDir, maxCacheSize });
    await bridge.initialize();

    const stats = bridge.getStats();
    assert.strictEqual(stats.maxCacheSize, maxCacheSize, 'maxCacheSize should be in stats');
  });

  it('should use default maxCacheSize of 50', async () => {
    bridge = new MemoryBridge({ dataDir: testDir });
    await bridge.initialize();

    const stats = bridge.getStats();
    assert.strictEqual(stats.maxCacheSize, 50, 'Default maxCacheSize should be 50');
  });

  it('should clear cache order on clearAll', async () => {
    bridge = new MemoryBridge({ dataDir: testDir, maxCacheSize: 10 });
    await bridge.initialize();

    // Add some items
    for (let i = 1; i <= 3; i++) {
      await bridge.saveContext({
        sessionId: `session_${i}`,
        goal: `Test goal ${i}`,
        plan: { tasks: [] },
        taskResults: []
      });
    }

    // Clear all
    await bridge.clearAll();

    const stats = bridge.getStats();
    assert.strictEqual(stats.cachedSessions, 0, 'Cache should be empty');
    assert.strictEqual(stats.cacheStats.hits, 0, 'Cache hits should be reset');
    assert.strictEqual(stats.cacheStats.misses, 0, 'Cache misses should be reset');
    assert.strictEqual(bridge._cacheOrder.length, 0, 'Cache order should be empty');
  });

  it('should remove from cache order on clearSession', async () => {
    bridge = new MemoryBridge({ dataDir: testDir, maxCacheSize: 10 });
    await bridge.initialize();

    await bridge.saveContext({
      sessionId: 'session_to_clear',
      goal: 'Test goal',
      plan: { tasks: [] },
      taskResults: []
    });

    const initialOrderLength = bridge._cacheOrder.length;
    assert.strictEqual(initialOrderLength, 1, 'Should have 1 item in order');

    await bridge.clearSession('session_to_clear');

    assert.strictEqual(bridge._cacheOrder.length, 0, 'Cache order should be empty after clear');
    assert.strictEqual(bridge._cache.has('session_to_clear'), false, 'Cache should not have session');
  });
});

