import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    expect(command).toBeDefined();
    expect(command.description()).toContain('Review code against the implementation plan');

    const options = command.options.map((opt) => opt.flags);
    expect(options).toContain('-p, --provider <provider>');
    expect(options).toContain('-d, --dir <directory>');
    expect(options).toContain('-k, --key <apiKey>');
    expect(options).toContain('--quick');
    expect(options).toContain('--json');
  });
});
