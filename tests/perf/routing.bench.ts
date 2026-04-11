import { performance } from 'perf_hooks';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ThompsonSamplingRouter } from '../../src/core/routing/bandit-router.js';

describe('Routing Performance Benchmarks', () => {
  const router = new ThompsonSamplingRouter();

  it('provider selection p95 should be under 20ms', { timeout: 30000 }, async () => {
    const ITERATIONS = 1000;
    const times: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      router.selectProvider('benchmark task', { optimize: 'cost' });
      times.push(performance.now() - start);
    }

    times.sort((a, b) => a - b);
    const p50 = times[Math.floor(ITERATIONS * 0.5)];
    const p95 = times[Math.floor(ITERATIONS * 0.95)];
    const p99 = times[Math.floor(ITERATIONS * 0.99)];
    const avg = times.reduce((a, b) => a + b, 0) / times.length;

    console.log(`  Selection p50: ${p50.toFixed(3)}ms`);
    console.log(`  Selection p95: ${p95.toFixed(3)}ms`);
    console.log(`  Selection p99: ${p99.toFixed(3)}ms`);
    console.log(`  Selection avg: ${avg.toFixed(3)}ms`);
    console.log(`  Threshold p95: 20ms`);

    assert.ok(p95 < 20, `p95 ${p95.toFixed(3)}ms exceeds threshold 20ms`);
  });

  it('stat update p95 should be under 5ms', { timeout: 10000 }, async () => {
    const ITERATIONS = 1000;
    const times: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      router.updateStats('nvidia', { success: true, cost: 0.001, latency: 100 });
      times.push(performance.now() - start);
    }

    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(ITERATIONS * 0.95)];

    console.log(`  Update p95: ${p95.toFixed(3)}ms`);
    console.log(`  Threshold: 5ms`);

    assert.ok(p95 < 5, `p95 ${p95.toFixed(3)}ms exceeds threshold 5ms`);
  });

  it(
    'provider selection with constraints should be under 30ms p95',
    { timeout: 30000 },
    async () => {
      const ITERATIONS = 1000;
      const times: number[] = [];

      const constraints = {
        maxCostPerToken: 0.003,
        maxLatencyMs: 5000,
        minQualityScore: 0.8,
      };

      for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();
        router.selectProvider('benchmark task', constraints);
        times.push(performance.now() - start);
      }

      times.sort((a, b) => a - b);
      const p95 = times[Math.floor(ITERATIONS * 0.95)];

      console.log(`  Selection with constraints p95: ${p95.toFixed(3)}ms`);
      console.log(`  Threshold: 30ms`);

      assert.ok(p95 < 30, `p95 ${p95.toFixed(3)}ms exceeds threshold 30ms`);
    }
  );
});
