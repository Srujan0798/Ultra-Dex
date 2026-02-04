import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerCheckCommand } from '../../lib/commands/advanced.js';
import { Command } from 'commander';

describe('check command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the check command with correct description', () => {
    registerCheckCommand(program);

    const command = program.commands.find(cmd => cmd.name() === 'check');
    expect(command).toBeDefined();
    expect(command.description()).toContain('Repository health and alignment check');

    // Check command has no options
    expect(command.options).toHaveLength(0);
  });
});