import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Command } from 'commander';
import { registerAlignCommand } from '../lib/commands/state.js';

test('align command registers', () => {
  const program = new Command();
  registerAlignCommand(program);
  const cmd = program.commands.find((c) => c.name() === 'align');
  assert.ok(cmd);
});

/**
 * Error handler for align.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[align.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
