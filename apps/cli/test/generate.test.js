import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Command } from 'commander';
import { registerGenerateCommand } from '../lib/commands/generate.js';

test('generate command registers', () => {
  const program = new Command();
  registerGenerateCommand(program);
  const cmd = program.commands.find((c) => c.name() === 'generate');
  assert.ok(cmd);
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
