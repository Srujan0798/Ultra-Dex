import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerRalphCommand } from '../../lib/commands/ralph.js';
import { Command } from 'commander';

describe('ralph command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the ralph command with correct options', () => {
    registerRalphCommand(program);

    const command = program.commands.find((cmd) => cmd.name() === 'ralph');
    assert.ok(command);
    assert.match(command.description(), /Run the autonomous Ralph loop/i);

    const options = command.options.map((opt) => opt.flags);
    assert.ok(options.includes('-p, --provider <provider>'));
    assert.ok(options.includes('--test <command>'));
    assert.ok(options.includes('--retries <number>'));
  });

  it('should have required task argument', () => {
    registerRalphCommand(program);

    const command = program.commands.find((cmd) => cmd.name() === 'ralph');
    assert.ok(command);

    const args = command._args;
    assert.equal(args.length, 1);
    assert.equal(args[0].required, true);
  });
});

/**
 * Error handler for ralph.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[ralph.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
