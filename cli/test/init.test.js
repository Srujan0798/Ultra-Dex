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
