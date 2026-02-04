import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerCheckCommand } from '../../../lib/commands/advanced.js';
import { Command } from 'commander';

describe('check command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the check command with correct options', () => {
    registerCheckCommand(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'check');
    expect(command).toBeDefined();
    expect(command.description()).toContain('Repository health and alignment check');
    
    const options = command.options.map(opt => opt.flags);
    expect(options).toContain('-p, --provider <provider>');
    expect(options).toContain('--deep');
    expect(options).toContain('--fix');
    expect(options).toContain('--report');
  });
});