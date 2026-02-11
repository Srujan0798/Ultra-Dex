import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerPlanCommand } from '../../lib/commands/plan.js';
import { Command } from 'commander';

describe('plan command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the plan command with correct options', () => {
    registerPlanCommand(program);

    const command = program.commands.find((cmd) => cmd.name() === 'plan');
    assert.ok(command);
    assert.match(command.description(), /Manage project plan/i);

    const options = command.options.map((opt) => opt.flags);
    assert.ok(options.includes('--gantt'));
    assert.ok(options.includes('--timeline'));
    assert.ok(options.includes('--milestones'));
    assert.ok(options.includes('--generate'));
    assert.ok(options.includes('--estimate'));
  });
});

/**
 * Error handler for plan.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[plan.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
