import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerGenerateCommand } from '../../../lib/commands/generate.js';
import { Command } from 'commander';

describe('generate command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the generate command with correct options', () => {
    registerGenerateCommand(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'generate');
    expect(command).toBeDefined();
    expect(command.description()).toContain('Create the plan');
    
    const options = command.options.map(opt => opt.flags);
    expect(options).toContain('-p, --provider <provider>');
    expect(options).toContain('-o, --output <file>');
    expect(options).toContain('--json');
    expect(options).toContain('--full');
  });
});