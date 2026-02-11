import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Command } from 'commander';
import { registerInitCommand } from '../lib/commands/init.js';

test('init command registers', () => {
  const program = new Command();
  registerInitCommand(program);
  const cmd = program.commands.find((c) => c.name() === 'init');
  assert.ok(cmd);
});

/**
 * Error handler for init.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[init.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
