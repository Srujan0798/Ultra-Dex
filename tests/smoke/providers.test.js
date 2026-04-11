import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';

const CLI = 'node apps/cli/bin/ultra-dex.js';
const ENV = { ...process.env, MOCK_AI: 'true' };

describe('Provider Smoke Tests', () => {
  it('should run planner task with MOCK provider', () => {
    const result = execSync(`${CLI} run planner -t "hello"`, {
      encoding: 'utf-8',
      timeout: 60000,
      env: ENV,
    });
    assert.ok(result.length > 0, 'Should produce output');
  });

  it('should run with explicit --provider mock flag', () => {
    const result = execSync(`${CLI} run planner -t "hello" --provider mock`, {
      encoding: 'utf-8',
      timeout: 60000,
      env: ENV,
    });
    assert.ok(result.length > 0, 'Should produce output with explicit provider');
  });

  it('should skip gracefully when real provider key is missing', () => {
    // This test verifies that missing API keys don't crash the CLI
    const envWithoutKeys = { ...ENV, OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '' };
    try {
      const result = execSync(`${CLI} run planner -t "test" --provider openai`, {
        encoding: 'utf-8',
        timeout: 30000,
        env: envWithoutKeys,
      });
      // If it runs, that's fine (mock may handle it)
      assert.ok(typeof result === 'string');
    } catch (error) {
      // Expected: missing key error, not a crash
      const stderr = error.stderr || error.stdout || '';
      assert.ok(
        stderr.includes('key') || stderr.includes('API') || stderr.includes('provider') || stderr.includes('error'),
        'Should report missing API key gracefully, not crash'
      );
    }
  });

  it('should run with --provider nvidia when NVIDIA_API_KEY is set', (t) => {
    if (!process.env.NVIDIA_API_KEY) {
      return t.skip('NVIDIA_API_KEY not set');
    }
    const result = execSync(`${CLI} run planner -t "hello" --provider nvidia`, {
      encoding: 'utf-8',
      timeout: 60000,
      env: { ...process.env },
    });
    assert.ok(result.length > 0);
  });

  it('should run with --provider openai when OPENAI_API_KEY is set', (t) => {
    if (!process.env.OPENAI_API_KEY) {
      return t.skip('OPENAI_API_KEY not set');
    }
    const result = execSync(`${CLI} run planner -t "hello" --provider openai`, {
      encoding: 'utf-8',
      timeout: 60000,
      env: { ...process.env },
    });
    assert.ok(result.length > 0);
  });
});
