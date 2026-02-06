import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerValidateCommand } from '../../lib/commands/validate.js';
import { Command } from 'commander';

describe('validate command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the validate command with correct options', () => {
    registerValidateCommand(program);

    const command = program.commands.find((cmd) => cmd.name() === 'validate');
    assert.ok(command);
    assert.match(command.description(), /Validate project structure/i);

    const options = command.options.map((opt) => opt.flags);
    assert.ok(options.includes('-d, --dir <directory>'));
    assert.ok(options.includes('--scan'));
  });
});
