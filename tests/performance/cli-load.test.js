import { describe, it } from 'node:test';
import assert from 'node:assert';
import { performance } from 'node:perf_hooks';
import { execSync } from 'node:child_process';

const CLI = 'node apps/cli/bin/ultra-dex.js';
const ENV = { ...process.env, MOCK_AI: 'true' };

describe('Performance: CLI Load Tests', () => {
  it('should start CLI --help in <1000ms', () => {
    const start = performance.now();
    execSync(`${CLI} --help`, {
      encoding: 'utf-8',
      timeout: 10000,
    });
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 1000, `CLI --help took ${elapsed.toFixed(0)}ms (target <1000ms)`);
  });

  it('should run doctor in <6000ms', () => {
    const start = performance.now();
    execSync(`${CLI} doctor`, {
      encoding: 'utf-8',
      timeout: 10000,
      env: ENV,
    });
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 6000, `CLI doctor took ${elapsed.toFixed(0)}ms (target <6000ms)`);
  });

  it('should handle 10 concurrent CLI invocations', async () => {
    const promises = [];
    const start = performance.now();

    for (let i = 0; i < 10; i++) {
      promises.push(
        new Promise((resolve) => {
          try {
            execSync(`${CLI} --version`, {
              encoding: 'utf-8',
              timeout: 10000,
            });
            resolve(true);
          } catch {
            resolve(false);
          }
        })
      );
    }

    const results = await Promise.all(promises);
    const elapsed = performance.now() - start;
    const successCount = results.filter(Boolean).length;

    assert.strictEqual(successCount, 10, `All 10 concurrent invocations should succeed, got ${successCount}`);
    assert.ok(elapsed < 10000, `10 concurrent CLI calls took ${elapsed.toFixed(0)}ms (target <10000ms)`);
  });
});
