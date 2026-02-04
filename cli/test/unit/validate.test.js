import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerValidateCommand } from '../../lib/commands/validate.js';
import { Command } from 'commander';

describe('validate command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the validate command with correct options', () => {
    registerValidateCommand(program);

    const command = program.commands.find(cmd => cmd.name() === 'validate');
    expect(command).toBeDefined();
    expect(command.description()).toContain('Validate project structure');

    const options = command.options.map(opt => opt.flags);
    expect(options).toContain('-d, --dir <directory>');
    expect(options).toContain('--scan');
  });
});