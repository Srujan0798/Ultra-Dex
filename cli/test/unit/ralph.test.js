import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerRalphCommand } from '../../../lib/commands/ralph.js';
import { Command } from 'commander';

describe('ralph command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the ralph command with correct options', () => {
    registerRalphCommand(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'ralph');
    expect(command).toBeDefined();
    expect(command.description()).toContain('Run the autonomous Ralph loop');
    
    const options = command.options.map(opt => opt.flags);
    expect(options).toContain('-p, --provider <provider>');
    expect(options).toContain('--test <command>');
    expect(options).toContain('--retries <number>');
  });

  it('should have required task argument', () => {
    registerRalphCommand(program);

    const command = program.commands.find(cmd => cmd.name() === 'ralph');
    expect(command).toBeDefined();
    
    const args = command._args;
    expect(args).toHaveLength(1);
    expect(args[0].name).toBe('task');
    expect(args[0].required).toBe(true);
  });
});