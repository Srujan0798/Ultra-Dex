// Copyright (c) 2026 Ultra-Dex
// tests/core/context-meta-manager.test.js

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'assert';
import { contextMetaManager } from '../../packages/core/index.js';

describe('ContextMetaManager', () => {
  let testManager;

  beforeEach(() => {
    // Create a fresh instance for each test
    testManager = new (class extends contextMetaManager.constructor {
      constructor() {
        super();
        // Disable semantic search for these tests to avoid API calls
        this.config.enableSemanticSearch = false;
        this.config.enableCompression = false;
        this.config.enableEncryption = false;
        
        // Clear all stores
        this.memoryStore.clear();
        this.longTermMemory.clear();
        this.vectorStore.clear();
        this.contextWindows.clear();
        this.compressionCache.clear();
      }
    })();
  });

  it('should initialize with default configuration', () => {
    assert.ok(testManager.config);
    assert.strictEqual(testManager.config.enableSemanticSearch, false);
    assert.strictEqual(testManager.config.enableCompression, false);
    assert.strictEqual(testManager.config.enableEncryption, false);
  });

  it('should store and retrieve memory entries', async () => {
    const testData = { message: 'Hello, World!', timestamp: Date.now() };
    const context = { session: 'test-session', user: 'test-user' };
    const metadata = { tags: ['test', 'hello'], permanent: false };

    const result = await testManager.store('test-key', testData, context, metadata);

    assert.ok(result);
    assert.strictEqual(result.id, 'test-key');
    assert.deepStrictEqual(result.data, testData);
    assert.deepStrictEqual(result.context, context);
    assert.ok(result.metadata);
    assert.ok(result.metadata.createdAt);
    assert.ok(result.metadata.updatedAt);
    assert.strictEqual(result.metadata.accessCount, 0);
    assert.strictEqual(result.compressed, false);
  });

  it('should retrieve stored memory entries', async () => {
    const testData = { value: 42, text: 'test data' };
    await testManager.store('retrieve-test', testData);

    const retrieved = await testManager.retrieve('retrieve-test');

    assert.ok(retrieved);
    assert.deepStrictEqual(retrieved.data, testData);
    assert.ok(retrieved.metadata.accessCount > 0);
  });

  it('should handle missing keys gracefully', async () => {
    const result = await testManager.retrieve('non-existent-key');
    assert.strictEqual(result, null);
  });

  it('should update context windows', async () => {
    const testData = { info: 'context test' };
    await testManager.store('ctx-test-key', testData);

    await testManager.updateContextWindow('test-window', 'ctx-test-key', {
      id: 'ctx-test-key',
      data: testData,
      context: {},
      metadata: { createdAt: new Date().toISOString(), accessCount: 0 }
    });

    const window = testManager.contextWindows.get('test-window');
    assert.ok(window);
    assert.ok(window.memories.has('ctx-test-key'));
    assert.strictEqual(window.id, 'test-window');
    assert.ok(window.createdAt);
    assert.ok(window.lastUpdated);
  });

  it('should calculate context window size', async () => {
    const testData1 = { data: 'small' };
    const testData2 = { data: 'larger data object with more content' };
    
    await testManager.store('size-test-1', testData1);
    await testManager.store('size-test-2', testData2);

    // Create a context window
    await testManager.updateContextWindow('size-test-window', 'size-test-1', {
      id: 'size-test-1',
      data: testData1,
      context: {},
      metadata: { createdAt: new Date().toISOString(), accessCount: 0 }
    });
    await testManager.updateContextWindow('size-test-window', 'size-test-2', {
      id: 'size-test-2',
      data: testData2,
      context: {},
      metadata: { createdAt: new Date().toISOString(), accessCount: 0 }
    });

    const window = testManager.contextWindows.get('size-test-window');
    const size = testManager.calculateContextWindowSize(window);

    assert.ok(size > 0);
    assert.ok(Number.isInteger(size));
  });

  it('should manage long-term vs short-term memory', async () => {
    const shortTermData = { type: 'short-term' };
    const longTermData = { type: 'long-term' };

    // Store with default (short-term) metadata
    await testManager.store('short-term-key', shortTermData);
    
    // Store with permanent metadata (long-term)
    await testManager.store('long-term-key', longTermData, {}, { permanent: true });

    // Check that both are stored
    const shortTerm = testManager.memoryStore.get('short-term-key');
    const longTerm = testManager.longTermMemory.get('long-term-key');

    assert.ok(shortTerm);
    assert.ok(longTerm);
    assert.strictEqual(shortTerm.metadata.permanent, undefined);
    assert.strictEqual(longTerm.metadata.permanent, true);
  });

  it('should update access counts on retrieval', async () => {
    const testData = { accessed: 'data' };
    await testManager.store('access-test', testData);

    // Retrieve multiple times
    await testManager.retrieve('access-test');
    await testManager.retrieve('access-test');
    const finalResult = await testManager.retrieve('access-test');

    assert.strictEqual(finalResult.metadata.accessCount, 3);
    assert.ok(finalResult.metadata.lastAccessed);
  });

  it('should handle context window trimming', async () => {
    // Temporarily increase the size limit for testing
    const originalLimit = testManager.config.maxContextLength;
    testManager.config.maxContextLength = 100; // Very small for testing

    // Add several entries to exceed the limit
    for (let i = 0; i < 5; i++) {
      const data = { id: i, content: `This is a moderately sized content entry ${i}`.repeat(5) };
      await testManager.store(`trim-test-${i}`, data);
      
      await testManager.updateContextWindow('trim-test-window', `trim-test-${i}`, {
        id: `trim-test-${i}`,
        data,
        context: {},
        metadata: { 
          createdAt: new Date().toISOString(), 
          accessCount: i + 1, // Different access counts for prioritization
          lastAccessed: new Date().toISOString()
        }
      });
    }

    const window = testManager.contextWindows.get('trim-test-window');
    assert.ok(window);

    // Restore original limit
    testManager.config.maxContextLength = originalLimit;
  });

  it('should clean up expired memories', async () => {
    const testData = { expired: 'test' };
    
    // Store with a past creation date to simulate expiration
    const expiredKey = 'expired-test';
    const expiredEntry = {
      id: expiredKey,
      data: testData,
      context: {},
      metadata: {
        createdAt: new Date(Date.now() - 10000000).toISOString(), // 10M ms ago (about 115 days)
        updatedAt: new Date(Date.now() - 10000000).toISOString(),
        accessCount: 0,
        lastAccessed: null
      },
      embedding: null,
      compressed: false
    };

    testManager.memoryStore.set(expiredKey, expiredEntry);

    // Run cleanup
    const cleanedCount = await testManager.cleanupExpiredMemories();

    // The expired entry should be removed
    const retrieved = testManager.memoryStore.get(expiredKey);
    assert.strictEqual(retrieved, undefined);
    assert.ok(cleanedCount >= 0);
  });

  it('should get statistics', () => {
    const stats = testManager.getStats();

    assert.ok(stats);
    assert.strictEqual(typeof stats.totalMemories, 'number');
    assert.strictEqual(typeof stats.memoryStoreSize, 'number');
    assert.strictEqual(typeof stats.longTermMemorySize, 'number');
    assert.strictEqual(typeof stats.vectorStoreSize, 'number');
    assert.strictEqual(typeof stats.contextWindowsCount, 'number');
    assert.strictEqual(typeof stats.compressionCacheSize, 'number');
  });

  it('should clear all memories', async () => {
    await testManager.store('clear-test-1', { data: 'test1' });
    await testManager.store('clear-test-2', { data: 'test2' });

    // Verify they're there
    assert.ok(testManager.memoryStore.get('clear-test-1'));
    assert.ok(testManager.memoryStore.get('clear-test-2'));

    // Clear all
    await testManager.clearAll();

    // Verify they're gone
    assert.strictEqual(testManager.memoryStore.size, 0);
    assert.strictEqual(testManager.longTermMemory.size, 0);
    assert.strictEqual(testManager.vectorStore.size, 0);
    assert.strictEqual(testManager.contextWindows.size, 0);
    assert.strictEqual(testManager.compressionCache.size, 0);

    // Stats should be reset
    const stats = testManager.getStats();
    assert.strictEqual(stats.totalMemories, 0);
  });

  it('should handle compression when enabled', async () => {
    // Enable compression temporarily
    testManager.config.enableCompression = true;

    // Create a large data object
    const largeData = { 
      content: 'A'.repeat(2048), // Larger than our 1KB threshold
      metadata: { large: true, repeated: 'A'.repeat(1000) }
    };

    const result = await testManager.store('large-test', largeData);

    // With compression enabled, the data should be marked as compressed
    assert.strictEqual(result.compressed, true);

    // Disable compression for the rest of the tests
    testManager.config.enableCompression = false;
  });
});