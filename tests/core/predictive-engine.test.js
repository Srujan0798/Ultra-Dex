import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ContextCache } from '../../src/core/memory/context-cache.js';
import { PredictiveEngine } from '../../src/core/memory/predictive-engine.js';

describe('PredictiveEngine', () => {
  it('analyzes task intent and entities', () => {
    const engine = new PredictiveEngine();
    const intent = engine.analyzeTaskIntent('Optimize Prisma queries for BillingService');

    assert.ok(intent.keywords.includes('optimize'));
    assert.ok(intent.keywords.includes('prisma'));
    assert.ok(intent.entities.includes('BillingService'));
    assert.strictEqual(intent.intent, 'data');
  });

  it('prefetches, merges, and caches context', async () => {
    const calls = [];
    const engine = new PredictiveEngine({
      cache: new ContextCache({ maxSize: 10, defaultTtl: 60000 }),
      memory: {
        async search(query) {
          calls.push(query);
          if (query === 'Optimize database queries') {
            return [
              { id: 'vector-1', content: 'Use indexes', score: 0.92 },
              { id: 'shared', content: 'Inspect slow queries', score: 0.85 },
            ];
          }

          return [
            { id: `graph-${query}`, content: `Related to ${query}`, score: 0.75 },
            { id: 'shared', content: 'Inspect slow queries', score: 0.8 },
          ];
        },
      },
    });

    const first = await engine.predictContext('Optimize database queries', {
      taskId: 'task-1',
    });
    const second = await engine.predictContext('Optimize database queries', {
      taskId: 'task-1',
    });

    assert.ok(first.items.length >= 2);
    assert.strictEqual(first.items[0].id, 'vector-1');
    assert.strictEqual(second.taskId, 'task-1');
    assert.strictEqual(calls.length >= 2, true);
    assert.strictEqual(engine.cache.getStats().hits, 1);
  });

  it('tracks background prefetch completion and usefulness', async () => {
    const engine = new PredictiveEngine({
      memory: {
        async search(query) {
          return [{ id: query, content: query, score: 0.9 }];
        },
      },
    });

    engine.spawnBackgroundPrefetch('prefetch-1', 'make the button bounce');
    const result = await engine.awaitPrefetch('prefetch-1', 500);
    engine.recordUsage('prefetch-1', true);

    assert.strictEqual(result.taskId, 'prefetch-1');
    assert.strictEqual(engine.getPrefetchStatus('prefetch-1'), 'complete');
    assert.strictEqual(engine.getStats().prefetchHitRate, 1);
  });
});
