/**
 * Ultra-Dex Performance Benchmarks
 * Measures performance of key operations
 */

import { test, mock } from 'node:test';
import assert from 'node:assert';
import { performance } from 'perf_hooks';
import { CodeGraph } from '../lib/mcp/graph.js';
import { runQualityScan } from '../lib/quality/scanner.js';

test('Performance: Graph scan performance', async (t) => {
  const graph = new CodeGraph();

  // Measure scan performance
  const startTime = performance.now();
  const result = await graph.scan(false); // Disable cache for measurement
  const endTime = performance.now();

  const duration = endTime - startTime;

  await t.test(`Graph scan completed in ${duration.toFixed(2)}ms`, () => {
    // Set reasonable performance expectations
    // For a typical project, scanning should complete within 5 seconds
    assert.ok(duration < 5000, `Graph scan took too long: ${duration.toFixed(2)}ms`);
  });

  await t.test('Graph has reasonable node count', () => {
    // Verify the graph has some content
    assert.ok(result.nodeCount > 0, 'Graph should have at least one node');
  });
});

test('Performance: Quality scan performance', async (t) => {
  // Measure quality scan performance
  const startTime = performance.now();
  const result = await runQualityScan('.');
  const endTime = performance.now();

  const duration = endTime - startTime;

  await t.test(`Quality scan completed in ${duration.toFixed(2)}ms`, () => {
    // Set reasonable performance expectations
    // For a typical project, quality scan should complete within 10 seconds
    assert.ok(duration < 10000, `Quality scan took too long: ${duration.toFixed(2)}ms`);
  });

  await t.test('Quality scan returns valid results', () => {
    assert.ok('passed' in result, 'Should have passed count');
    assert.ok('failed' in result, 'Should have failed count');
    assert.ok('warnings' in result, 'Should have warnings count');
  });
});

test('Performance: Graph selective update', async (t) => {
  const graph = new CodeGraph();

  // First, do a full scan to populate the graph
  await graph.scan(false);

  // Measure selective update performance
  const startTime = performance.now();
  await graph.updateChangedFiles(['package.json']); // Use a small file for testing
  const endTime = performance.now();

  const duration = endTime - startTime;

  await t.test(`Selective update completed in ${duration.toFixed(2)}ms`, () => {
    // Selective update should be significantly faster than full scan
    assert.ok(duration < 1000, `Selective update took too long: ${duration.toFixed(2)}ms`);
  });
});

test('Performance: Cache effectiveness', async (t) => {
  const graph = new CodeGraph();

  // First scan (no cache)
  const firstStartTime = performance.now();
  await graph.scan(false);
  const firstEndTime = performance.now();
  const firstDuration = firstEndTime - firstStartTime;

  // Second scan (with cache)
  const secondStartTime = performance.now();
  await graph.scan(true); // Enable cache
  const secondEndTime = performance.now();
  const secondDuration = secondEndTime - secondStartTime;

  await t.test('Cache provides performance benefit', () => {
    // Cached scan should be significantly faster
    if (firstDuration > 0) {
      const speedupRatio = firstDuration / Math.max(secondDuration, 1);
      assert.ok(
        speedupRatio > 1.5,
        `Cache should provide speedup, got ratio: ${speedupRatio.toFixed(2)}x`
      );
    }
  });
});

test('Performance: Memory usage during graph operations', async (t) => {
  const graph = new CodeGraph();

  // Capture memory before
  const memBefore = process.memoryUsage().heapUsed;

  // Perform graph operations
  await graph.scan(false);

  // Capture memory after
  const memAfter = process.memoryUsage().heapUsed;
  const memDiff = memAfter - memBefore;

  await t.test(
    `Memory usage increase is reasonable: ${(memDiff / 1024 / 1024).toFixed(2)} MB`,
    () => {
      // Memory increase should be reasonable (less than 100MB for typical operations)
      assert.ok(
        memDiff < 100 * 1024 * 1024,
        `Memory increase too high: ${(memDiff / 1024 / 1024).toFixed(2)} MB`
      );
    }
  );
});

test('Performance: Concurrency handling', async (t) => {
  const graph = new CodeGraph();

  // Test multiple concurrent scans
  const startTime = performance.now();
  const promises = [];
  for (let i = 0; i < 3; i++) {
    promises.push(graph.scan(false));
  }

  const results = await Promise.all(promises);
  const endTime = performance.now();

  const duration = endTime - startTime;

  await t.test(`Concurrent operations completed in ${duration.toFixed(2)}ms`, () => {
    // Concurrent operations should complete within reasonable time
    assert.ok(duration < 8000, `Concurrent operations took too long: ${duration.toFixed(2)}ms`);
  });

  await t.test('All concurrent operations succeeded', () => {
    assert.strictEqual(results.length, 3, 'All operations should return results');
    results.forEach((result) => {
      assert.ok('nodeCount' in result, 'Each result should have nodeCount');
    });
  });
});

/**
 * Error handler for performance-benchmarks.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[performance-benchmarks.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
