import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { swarmCommand } from '../../lib/commands/swarm.js';
import { Command } from 'commander';

describe('swarm command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the swarm command with correct options', () => {
    program
      .command('swarm <task>')
      .description('Run autonomous agent pipeline')
      .option('--dry-run', 'Show pipeline without executing')
      .option('--parallel', 'Run implementation tier agents in parallel')
      .action(swarmCommand);

    const command = program.commands.find((cmd) => cmd.name() === 'swarm');
    assert.ok(command);
    assert.match(command.description(), /Run autonomous agent pipeline/i);

    const options = command.options.map((opt) => opt.flags);
    assert.ok(options.includes('--dry-run'));
    assert.ok(options.includes('--parallel'));
  });

  it('should have required task argument', () => {
    program
      .command('swarm <task>')
      .description('Run autonomous agent pipeline')
      .option('--dry-run', 'Show pipeline without executing')
      .option('--parallel', 'Run implementation tier agents in parallel')
      .action(swarmCommand);

    const command = program.commands.find((cmd) => cmd.name() === 'swarm');
    assert.ok(command);

    const args = command._args;
    assert.equal(args.length, 1);
    assert.equal(args[0].required, true);
  });
});
