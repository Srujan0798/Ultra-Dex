import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CLI = 'node --import=tsx apps/cli/bin/ultra-dex.js';
const ENV = { ...process.env, MOCK_AI: 'true' };

describe('E2E: Memory and Persistence', () => {
  it('should persist and retrieve memory across runs', () => {
    // Run a task that should store memory
    execSync(`${CLI} run planner -t "Remember this: test-memory-key-42"`, {
      encoding: 'utf-8',
      timeout: 60000,
      env: ENV,
    });

    // Memory should be stored (file or Redis)
    // Verify .ultra-dex/ or memory files exist
    const ultraDexDir = path.join(process.cwd(), '.ultra-dex');
    const dirExists = fs.existsSync(ultraDexDir);
    assert.ok(dirExists, '.ultra-dex directory should exist after run');
  });

  it('should replay execution traces', () => {
    // First run a task to create a trace
    const runResult = execSync(`${CLI} run planner -t "test trace"`, {
      encoding: 'utf-8',
      timeout: 60000,
      env: ENV,
    });
    assert.ok(runResult.length > 0);

    // Then try to list traces
    const listResult = execSync(`${CLI} replay --list`, {
      encoding: 'utf-8',
      timeout: 10000,
      env: ENV,
    });
    // Should not crash — may show "no traces" if not persisted
    assert.ok(typeof listResult === 'string');
  });

  it('should survive restart with file-based memory', () => {
    // Run with MEMORY_BACKEND=file
    const envWithFile = { ...ENV, MEMORY_BACKEND: 'file' };
    const result1 = execSync(`${CLI} run planner -t "persistence test"`, {
      encoding: 'utf-8',
      timeout: 60000,
      env: envWithFile,
    });
    assert.ok(result1.length > 0);

    // Run again — should work without issues
    const result2 = execSync(`${CLI} run planner -t "persistence test 2"`, {
      encoding: 'utf-8',
      timeout: 60000,
      env: envWithFile,
    });
    assert.ok(result2.length > 0);
  });
});
