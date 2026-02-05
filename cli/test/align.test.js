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
