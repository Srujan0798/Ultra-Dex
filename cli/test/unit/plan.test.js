import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerPlanCommand } from '../../../lib/commands/plan.js';
import { Command } from 'commander';

describe('plan command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the plan command with correct options', () => {
    registerPlanCommand(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'plan');
    expect(command).toBeDefined();
    expect(command.description()).toContain('Manage project plan');
    
    const options = command.options.map(opt => opt.flags);
    expect(options).toContain('-p, --provider <provider>');
    expect(options).toContain('-o, --output <file>');
    expect(options).toContain('--json');
    expect(options).toContain('--estimate');
    expect(options).toContain('--gantt');
  });
});