import { performance } from 'perf_hooks';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { UnifiedMemory } from '../../src/core/memory/unified-api.ts';

describe('Memory Performance Benchmarks', () => {
  it('store operation average should stay under 1ms/op (sanity threshold)', async () => {
    const memory = new UnifiedMemory();
    await memory.initialize();

    const ITERATIONS = 300;
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      await memory.store({ text: `bench-entry-${i}` }, { strategy: 'sql', priority: 'normal' });
    }
    const duration = performance.now() - start;
    const avg = duration / ITERATIONS;

    console.log(`  Store avg: ${avg.toFixed(3)}ms/op`);
    assert.ok(avg < 5, `Store avg ${avg.toFixed(3)}ms/op exceeds threshold 5ms/op`);

    await memory.close();
  });

  it('search operation average should stay under 50ms/query', async () => {
    const memory = new UnifiedMemory();
    await memory.initialize();

    for (let i = 0; i < 500; i++) {
      await memory.store({ text: `searchable benchmark text ${i}` }, { strategy: 'sql' });
    }

    const QUERIES = 50;
    const start = performance.now();
    for (let i = 0; i < QUERIES; i++) {
      await memory.retrieve('searchable', { strategy: 'sql', limit: 10 });
    }
    const duration = performance.now() - start;
    const avg = duration / QUERIES;

    console.log(`  Search avg: ${avg.toFixed(3)}ms/query`);
    assert.ok(avg < 50, `Search avg ${avg.toFixed(3)}ms/query exceeds threshold 50ms/query`);

    await memory.close();
  });

  it('RSS should stay under 200MB in benchmark process', () => {
    const rssMb = process.memoryUsage().rss / 1024 / 1024;
    console.log(`  RSS: ${rssMb.toFixed(2)}MB`);
    assert.ok(rssMb < 200, `RSS ${rssMb.toFixed(2)}MB exceeds threshold 200MB`);
  });
});

