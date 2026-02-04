import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerInitCommand } from '../../../lib/commands/init.js';
import { Command } from 'commander';

describe('init command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the init command with correct options', () => {
    registerInitCommand(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'init');
    expect(command).toBeDefined();
    expect(command.description()).toContain('Initialize a new Ultra-Dex Project');
    
    const options = command.options.map(opt => opt.flags);
    expect(options).toContain('-n, --name <name>');
    expect(options).toContain('-d, --dir <directory>');
    expect(options).toContain('--preview');
    expect(options).toContain('--live');
    expect(options).toContain('--stack <preset>');
  });
});