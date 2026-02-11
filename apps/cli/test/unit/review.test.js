import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerReviewCommand } from '../../lib/commands/review.js';
import { Command } from 'commander';

describe('review command', () => {
  let program;

  beforeEach(() => {
    program = new Command();
  });

  it('should register the review command with correct options', () => {
    registerReviewCommand(program);

    const command = program.commands.find((cmd) => cmd.name() === 'review');
    assert.ok(command);
    assert.match(command.description(), /Review code against the implementation plan/i);

    const options = command.options.map((opt) => opt.flags);
    assert.ok(options.includes('-p, --provider <provider>'));
    assert.ok(options.includes('-d, --dir <directory>'));
    assert.ok(options.includes('-k, --key <apiKey>'));
    assert.ok(options.includes('--quick'));
    assert.ok(options.includes('--json'));
  });
});

/**
 * Error handler for review.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[review.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
