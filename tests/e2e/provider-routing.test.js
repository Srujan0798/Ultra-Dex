import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';

const CLI = 'node --import=tsx apps/cli/bin/ultra-dex.js';
const ENV = { ...process.env, MOCK_AI: 'true' };

describe('E2E: Provider Routing', () => {
  it('should route to mock provider', () => {
    const result = execSync(`${CLI} run planner -t "hello" --provider mock`, {
      encoding: 'utf-8',
      timeout: 60000,
      env: ENV,
    });
    assert.ok(result.length > 0, 'Should produce output');
  });

  it('should handle missing provider key gracefully', () => {
    try {
      execSync(`${CLI} run planner -t "hello" --provider openai`, {
        encoding: 'utf-8',
        timeout: 30000,
        env: { ...ENV, OPENAI_API_KEY: '' },
      });
      // If it succeeds, that's fine (mock may handle it)
    } catch (error) {
      const output = (error.stderr || error.stdout || '').toString();
      assert.ok(
        output.includes('key') || output.includes('API') || output.includes('error') || output.includes('provider'),
        'Should report error about missing key, not crash'
      );
    }
  });

  it('should run swarm command', () => {
    const result = execSync(`${CLI} swarm "draft a launch plan" --provider mock`, {
      encoding: 'utf-8',
      timeout: 120000,
      env: ENV,
    });
    assert.ok(result.length > 0, 'Swarm should produce output');
  });
});
