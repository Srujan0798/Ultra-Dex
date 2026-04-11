import { fork } from 'child_process';
import { performance } from 'perf_hooks';
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Startup Performance Benchmarks', () => {
  const COLD_START_THRESHOLD = 2000; // 2 seconds
  const WARM_START_THRESHOLD = 500; // 500ms
  const PARSE_THRESHOLD = 100; // 100ms

  it('cold start should complete within 2 seconds', { timeout: 10000 }, async () => {
    const startTime = performance.now();

    // Fork process to simulate cold start
    const child = fork('apps/cli/bin/ultra-dex.js', ['--version'], {
      silent: true,
      execArgv: [], // No preload modules for true cold start
    });

    await new Promise<void>((resolve, reject) => {
      child.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Exit code ${code}`));
      });
    });

    const duration = performance.now() - startTime;

    console.log(`  Cold start: ${duration.toFixed(2)}ms`);
    console.log(`  Threshold: ${COLD_START_THRESHOLD}ms`);

    assert.ok(
      duration < COLD_START_THRESHOLD,
      `Cold start ${duration.toFixed(2)}ms exceeds threshold ${COLD_START_THRESHOLD}ms`
    );
  });

  it('warm start should complete within 500ms', { timeout: 5000 }, async () => {
    const startTime = performance.now();

    // Import cached
    await import('../../apps/cli/bin/ultra-dex.js');

    const duration = performance.now() - startTime;

    console.log(`  Warm start: ${duration.toFixed(2)}ms`);
    console.log(`  Threshold: ${WARM_START_THRESHOLD}ms`);

    assert.ok(
      duration < WARM_START_THRESHOLD,
      `Warm start ${duration.toFixed(2)}ms exceeds threshold ${WARM_START_THRESHOLD}ms`
    );
  });

  it('command parse should complete within 100ms', { timeout: 1000 }, async () => {
    const startTime = performance.now();

    // Parse arguments
    const { Command } = await import('commander');
    const program = new Command();
    program.option('-t, --task <task>', 'Task description');
    program.option('-a, --agent <agent>', 'Agent name');
    program.parse(['-t', 'hello world', '-a', 'planner']);

    const duration = performance.now() - startTime;

    console.log(`  Command parse: ${duration.toFixed(2)}ms`);
    console.log(`  Threshold: ${PARSE_THRESHOLD}ms`);

    assert.ok(
      duration < PARSE_THRESHOLD,
      `Parse ${duration.toFixed(2)}ms exceeds threshold ${PARSE_THRESHOLD}ms`
    );
  });

  it('memory usage at startup should be under 200MB', { timeout: 5000 }, async () => {
    // Force GC if available
    if (global.gc) {
      global.gc();
    }

    const usage = process.memoryUsage();
    const rssMB = usage.rss / 1024 / 1024;

    console.log(`  RSS: ${rssMB.toFixed(2)} MB`);
    console.log(`  Threshold: 200 MB`);

    assert.ok(rssMB < 200, `RSS ${rssMB.toFixed(2)} MB exceeds threshold 200 MB`);
  });
});
