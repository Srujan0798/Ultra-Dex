import { describe, it, expect, vi, beforeEach } from 'vitest';
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

    const command = program.commands.find(cmd => cmd.name() === 'swarm');
    expect(command).toBeDefined();
    expect(command.description()).toContain('Run autonomous agent pipeline');
    
    const options = command.options.map(opt => opt.flags);
    expect(options).toContain('--dry-run');
    expect(options).toContain('--parallel');
  });

  it('should have required task argument', () => {
    program
      .command('swarm <task>')
      .description('Run autonomous agent pipeline')
      .option('--dry-run', 'Show pipeline without executing')
      .option('--parallel', 'Run implementation tier agents in parallel')
      .action(swarmCommand);

    const command = program.commands.find(cmd => cmd.name() === 'swarm');
    expect(command).toBeDefined();

    const args = command._args;
    expect(args).toHaveLength(1);
    expect(args[0].required).toBe(true);
  });
});