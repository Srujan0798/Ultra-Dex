import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { MockAIProvider } from './mocks/providers.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const cliPath = path.resolve(__dirname, '..', 'bin', 'ultra-dex.js');

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, FORCE_COLOR: '0', LOG_LEVEL: 'silent', ...options.env },
    encoding: 'utf8',
    timeout: options.timeout ?? 20000,
    input: options.input ?? ''
  });
  return {
    ...result,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`
  };
}

describe('production command help output', () => {
  const commands = [
    { name: 'init', args: ['init', '--help'] },
    { name: 'generate', args: ['generate', '--help'] },
    { name: 'build', args: ['build', '--help'] },
    { name: 'swarm', args: ['swarm', '--help'] },
    { name: 'serve', args: ['serve', '--help'] },
    { name: 'validate', args: ['validate', '--help'] },
    { name: 'dashboard', args: ['dashboard', '--help'] },
    { name: 'auto-implement', args: ['auto-implement', '--help'] },
    { name: 'ci-monitor', args: ['ci-monitor', '--help'] },
    { name: 'cloud', args: ['cloud', '--help'] },
    { name: 'brain', args: ['brain', '--help'] }
  ];

  for (const cmd of commands) {
    test(`${cmd.name} --help exits cleanly`, () => {
      const result = runCli(cmd.args);
      assert.equal(result.status, 0, `Expected ${cmd.name} --help to exit with 0`);
      assert.match(result.output, new RegExp(`\\b${cmd.name}\\b`, 'i'));
    });
  }
});

describe('mocks for production command tests', () => {
  test('MockAIProvider generates a deterministic plan response', async () => {
    const provider = new MockAIProvider();
    const result = await provider.generate('system', 'generate a plan for analytics dashboard');
    assert.ok(result.content.toLowerCase().includes('implementation plan'));
    assert.ok(result.usage.inputTokens > 0);
  });
});
