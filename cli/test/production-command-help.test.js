import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Command } from 'commander';
import { MockAIProvider } from './mocks/providers.js';

import { registerInitCommand } from '../lib/commands/init.js';
import { registerGenerateCommand } from '../lib/commands/generate.js';
import { registerBuildCommand } from '../lib/commands/build.js';
import { registerServeCommand } from '../lib/commands/serve.js';
import { registerValidateCommand } from '../lib/commands/validate.js';
import { registerDashboardCommand } from '../lib/commands/dashboard.js';
import { registerAutoImplementCommand } from '../lib/commands/auto-implement.js';
import { registerCiMonitorCommand } from '../lib/commands/ci-monitor.js';
import { registerCloudCommand } from '../lib/commands/cloud.js';
import { registerBrainCommand } from '../lib/commands/brain.js';
import { swarmCommand } from '../lib/commands/swarm.js';

describe('production command registration', () => {
  test('registers production commands with commander', () => {
    const program = new Command();

    registerInitCommand(program);
    registerGenerateCommand(program);
    registerBuildCommand(program);
    registerServeCommand(program);
    registerValidateCommand(program);
    registerDashboardCommand(program);
    registerAutoImplementCommand(program);
    registerCiMonitorCommand(program);
    registerCloudCommand(program);
    registerBrainCommand(program);

    program.command('swarm <task>').action(swarmCommand);

    const names = program.commands.map((cmd) => cmd.name());
    const expected = [
      'init',
      'generate',
      'build',
      'serve',
      'validate',
      'dashboard',
      'auto-implement',
      'ci-monitor',
      'cloud',
      'brain',
      'swarm',
    ];

    expected.forEach((name) => {
      assert.ok(names.includes(name), `Expected ${name} command to be registered`);
    });
  });
});

describe('mocks for production command tests', () => {
  test('MockAIProvider generates a deterministic plan response', async () => {
    const provider = new MockAIProvider();
    const result = await provider.generate('system', 'generate a plan for analytics dashboard');
    assert.ok(result.content.toLowerCase().includes('implementation plan'));
    assert.ok(result.usage.inputTokens > 0);
  });
});
