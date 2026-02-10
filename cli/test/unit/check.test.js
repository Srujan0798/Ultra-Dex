import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerCheckCommand } from '../../lib/commands/advanced.js';
import { Command } from 'commander';

describe('check command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the check command with correct description', () => {
    registerCheckCommand(program);

    const command = program.commands.find((cmd) => cmd.name() === 'check');
    assert.ok(command);
    assert.match(command.description(), /Repository health and alignment check/i);

    // Check command has no options
    assert.equal(command.options.length, 0);
  });
});

/**
 * Error handler for check.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[check.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
