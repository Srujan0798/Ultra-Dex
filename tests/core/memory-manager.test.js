// Copyright (c) 2026 Ultra-Dex
import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AgentMemoryManager } from '../../src/core/agents/memory-manager.js';

// Mock UnifiedMemory
class MockUnifiedMemory {
  constructor() {
    this.data = new Map();
    this.stats = { totalItems: 0 };
    this.initialized = false;
  }
  async initialize() {
    this.initialized = true;
  }
  async store(context, options) {
    const id = `mem_${Math.random().toString(36).substr(2, 9)}`;
    const item = {
      id,
      content: context,
      priority: options.priority,
      tags: options.tags,
      created_at: Date.now(),
    };
    this.data.set(id, item);
    this.stats.totalItems++;
    return item;
  }
  async retrieve(query, options) {
    let items = Array.from(this.data.values());
    if (options.tags) {
      items = items.filter((item) => options.tags.every((tag) => item.tags.includes(tag)));
    }
    if (options.priority) {
      items = items.filter((item) => item.priority === options.priority);
    }
    if (options.sort === 'created_at_asc') {
      items.sort((a, b) => a.created_at - b.created_at);
    }
    const limit = options.limit || 100;
    const result = items.slice(0, limit);
    return { items: result };
  }
  async update(id, updates) {
    const item = this.data.get(id);
    if (item) {
      Object.assign(item, updates);
      return item;
    }
    return null;
  }
  getStats() {
    return this.stats;
  }
}

describe('AgentMemoryManager', () => {
  let memoryManager;
  let mockMemory;

  beforeEach(() => {
    memoryManager = new AgentMemoryManager({ maxContextTokens: 100, pruneThreshold: 0.5 });
    mockMemory = new MockUnifiedMemory();
    memoryManager.memory = mockMemory;
  });

  it('should store items in correct tiers', async () => {
    await memoryManager.store('hot', 'key1', 'value1');
    const items = await mockMemory.retrieve('', { tags: ['hot'] });
    assert.strictEqual(items.items.length, 1);
    assert.strictEqual(items.items[0].priority, 'high');
  });

  it('should auto-prune when hot tier exceeds threshold', async () => {
    // 100 tokens max, 0.5 threshold = 50 tokens threshold.
    // Each char is 0.25 tokens (Math.ceil(length / 4)).
    // A 201 char string is 51 tokens.

    await memoryManager.store('hot', 'item1', 'A'.repeat(201)); // > 50 tokens

    // Pruning should have triggered moving some items to 'warm'
    // checkAndPrune is called AFTER store in hot tier.

    const hotItems = await memoryManager.retrieve('', { tags: ['hot'] });
    const warmItems = await memoryManager.retrieve('', { tags: ['warm'] });

    // Default prune amount is 0.2. 1 item * 0.2 = 0.2 -> ceil is 1.
    // So 1 item should have been moved.
    assert.strictEqual(hotItems.items.length, 0);
    assert.strictEqual(warmItems.items.length, 1);
    assert.strictEqual(warmItems.items[0].priority, 'normal');
  });

  it('should promote items to hot tier', async () => {
    const item = await memoryManager.store('warm', 'key1', 'value1');
    await memoryManager.promote(item.id, 'hot');

    const hotItems = await memoryManager.getHotContext('key1');
    assert.strictEqual(hotItems.items.length, 1);
    assert.strictEqual(hotItems.items[0].tags.includes('hot'), true);
    assert.strictEqual(hotItems.items[0].priority, 'high');
  });

  it('should demote items to cold tier', async () => {
    const item = await memoryManager.store('hot', 'key1', 'value1');
    await memoryManager.demote(item.id, 'cold');

    const coldItems = await memoryManager.getColdContext('key1');
    assert.strictEqual(coldItems.items.length, 1);
    assert.strictEqual(coldItems.items[0].tags.includes('cold'), true);
    assert.strictEqual(coldItems.items[0].priority, 'low');
  });

  it('should calculate tier statistics', async () => {
    await memoryManager.store('hot', 'h1', 'hot item'); // 2 tokens
    await memoryManager.store('warm', 'w1', 'warm item'); // 3 tokens

    const stats = await memoryManager.getTierStats();
    assert.strictEqual(stats.hot.count, 1);
    assert.strictEqual(stats.warm.count, 1);
  });
});
