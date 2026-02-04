import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerVerifyCommand } from '../../../lib/commands/verify.js';
import { Command } from 'commander';

describe('verify command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the verify command with correct options', () => {
    registerVerifyCommand(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'verify');
    expect(command).toBeDefined();
    expect(command.description()).toContain('Run executable 21-step verification');
    
    const options = command.options.map(opt => opt.flags);
    expect(options).toContain('-p, --provider <provider>');
    expect(options).toContain('--live');
  });
});