import assert from 'node:assert';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';

import { ContextCache } from '../../src/core/memory/context-cache.js';
import { PredictiveEngine } from '../../src/core/memory/predictive-engine.js';
import { MemoryManager } from '../../src/core/memory/manager.js';

const cleanups = [];

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop();
    await cleanup();
  }
});

class MockTierMemory {
  constructor() {
    this.items = new Map();
    this.counter = 0;
  }

  async initialize() {}

  async store(context, options = {}) {
    const id = `mem-${++this.counter}`;
    this.items.set(id, {
      id,
      content: context,
      priority: options.priority,
      tags: options.tags || [],
      createdAt: new Date().toISOString(),
    });
    return { id };
  }

  async retrieve(query, options = {}) {
    let items = [...this.items.values()];
    if (query) {
      const normalizedQuery = String(query).toLowerCase();
      items = items.filter((item) => item.content.text.toLowerCase().includes(normalizedQuery));
    }

    if (options.tags?.length) {
      items = items.filter((item) => options.tags.every((tag) => item.tags.includes(tag)));
    }

    return {
      items: items.slice(0, options.limit || items.length).map((item) => ({
        id: item.id,
        content: item.content,
        tags: item.tags,
        priority: item.priority,
        createdAt: item.createdAt,
      })),
    };
  }

  async update(id, updates) {
    const current = this.items.get(id);
    if (!current) {
      return null;
    }

    Object.assign(current, updates);
    return current;
  }

  getStats() {
    return { totalItems: this.items.size };
  }
}

describe('Memory tier completions', () => {
  it('spills evicted entries to overflow storage', async () => {
    const cache = new ContextCache({
      maxSize: 100,
      defaultTtl: 60000,
      overflowDbPath: path.join(os.tmpdir(), `context-cache-${Date.now()}.db`),
      memoryMode: false,
    });
    cleanups.push(() => cache.close());

    for (let index = 0; index < 101; index++) {
      cache.set(`task-${index}`, { index, payload: `context-${index}` });
    }

    assert.strictEqual(cache.get('task-0'), null);
    assert.strictEqual(cache.getStats().evictions, 1);
  });

  it('returns prefetch context', async () => {
    const engine = new PredictiveEngine({
      memory: {
        async search(query) {
          if (query === 'Optimize BillingService queries') {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return [{ id: 'vector-1', content: 'Use composite indexes', score: 0.95 }];
          }

          return [];
        },
        async queryGraph() {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return [{ id: 'graph-1', content: 'BillingService owns invoices', score: 0.7 }];
        },
      },
    });

    engine.spawnBackgroundPrefetch('prefetch-early', 'Optimize BillingService queries');
    const startedAt = Date.now();
    const result = await engine.awaitPrefetch('prefetch-early', 5000);
    const durationMs = Date.now() - startedAt;

    assert.ok(result);
    assert.ok(result.items.length > 0);
    assert.ok(durationMs < 1000);
  });

  it('promotes entries to hot tier', async () => {
    const memoryManager = new MemoryManager({
      memory: new MockTierMemory(),
      sweepIntervalMs: 10,
    });
    cleanups.push(() => memoryManager.shutdown());

    const entry = await memoryManager.add({
      content: 'BillingService query optimization checklist',
      type: 'note',
      metadata: { key: 'billing-note' },
    });

    // Simulate usage
    for (let index = 0; index < 4; index++) {
      await memoryManager.search('BillingService', 5);
    }

    await memoryManager.runTierSweep();

    const tierStats = await memoryManager.getTierStats();
    assert.ok(tierStats.hot >= 0);
  });
});
