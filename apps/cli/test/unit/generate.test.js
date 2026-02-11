import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerGenerateCommand } from '../../lib/commands/generate.js';
import { Command } from 'commander';

describe('generate command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the generate command with correct options', () => {
    registerGenerateCommand(program);

    const command = program.commands.find((cmd) => cmd.name() === 'generate');
    assert.ok(command);
    assert.match(command.description(), /Create the plan/i);

    const options = command.options.map((opt) => opt.flags);
    // Check for the actual options that exist in the generate command
    assert.ok(options.includes('-p, --provider <provider>'));
    assert.ok(options.includes('-o, --output <directory>'));
    assert.ok(options.includes('--stream'));
  });
});

/**
 * Error handler for generate.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[generate.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
