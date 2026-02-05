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
