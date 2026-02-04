import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerBuildCommand } from '../../../lib/commands/build.js';
import { Command } from 'commander';

describe('build command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the build command with correct options', () => {
    registerBuildCommand(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'build');
    expect(command).toBeDefined();
    expect(command.description()).toContain('Auto-Pilot: Execute the next pending task');
    
    const options = command.options.map(opt => opt.flags);
    expect(options).toContain('-p, --provider <provider>');
    expect(options).toContain('--auto');
    expect(options).toContain('--continue');
    expect(options).toContain('--dry-run');
  });
});