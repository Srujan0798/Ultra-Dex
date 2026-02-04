import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerRunCommand } from '../../../lib/commands/run.js';
import { Command } from 'commander';

describe('run command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the run command with correct options', () => {
    registerRunCommand(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'run');
    expect(command).toBeDefined();
    expect(command.description()).toContain('Execute an agent task automatically');
    
    const options = command.options.map(opt => opt.flags);
    expect(options).toContain('-p, --provider <provider>');
    expect(options).toContain('-a, --agent <agent>');
    expect(options).toContain('--dry-run');
    expect(options).toContain('--verbose');
  });
});