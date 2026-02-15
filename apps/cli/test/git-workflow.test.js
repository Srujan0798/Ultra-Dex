import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { Command } from 'commander';
import { registerGitWorkflowCommand } from '../lib/commands/git.js';

function runGit(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

async function withCapturedOutput(fn) {
  const logs = [];
  const errors = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => {
    logs.push(args.map((item) => String(item)).join(' '));
  };
  console.error = (...args) => {
    errors.push(args.map((item) => String(item)).join(' '));
  };

  try {
    await fn();
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }

  return {
    logs,
    errors,
    output: [...logs, ...errors].join('\n'),
  };
}

async function runGitCommand(args) {
  const program = new Command();
  registerGitWorkflowCommand(program);

  return withCapturedOutput(async () => {
    await program.parseAsync(['git', ...args], { from: 'user' });
  });
}

describe('git workflow command', () => {
  let tmpDir;
  let originalCwd;
  let defaultBranch;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-git-cmd-'));

    runGit(['init'], tmpDir);
    runGit(['config', 'user.email', 'test@example.com'], tmpDir);
    runGit(['config', 'user.name', 'Ultra Dex Test'], tmpDir);

    defaultBranch = runGit(['branch', '--show-current'], tmpDir) || 'master';

    await fs.writeFile(path.join(tmpDir, 'README.md'), '# Ultra-Dex Test\n');
    runGit(['add', 'README.md'], tmpDir);
    runGit(['commit', '-m', 'chore: initialize repo'], tmpDir);
    runGit(['tag', 'v0.1.0'], tmpDir);

    runGit(['checkout', '-b', 'feature-clean'], tmpDir);
    await fs.writeFile(path.join(tmpDir, 'feature.txt'), 'feature branch\n');
    runGit(['add', 'feature.txt'], tmpDir);
    runGit(['commit', '-m', 'feat: add feature branch file'], tmpDir);
    runGit(['checkout', defaultBranch], tmpDir);
    runGit(['merge', '--no-ff', 'feature-clean', '-m', 'merge feature-clean'], tmpDir);

    process.chdir(tmpDir);
    process.exitCode = 0;
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    process.exitCode = 0;
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('git analyze prints JSON summary', async () => {
    const result = await runGitCommand(['analyze', '--since', '7', '--json']);

    assert.equal(result.errors.length, 0);
    const parsed = JSON.parse(result.logs.join('\n'));
    assert.equal(typeof parsed.branch, 'string');
    assert.equal(typeof parsed.commitCount, 'number');
    assert.equal(parsed.periodDays, 7);
  });

  test('git suggest-commit suggests conventional message from staged files', async () => {
    await fs.writeFile(path.join(tmpDir, 'docs.md'), 'hello docs\n');
    runGit(['add', 'docs.md'], tmpDir);

    const result = await runGitCommand(['suggest-commit', '--quiet']);

    assert.equal(result.errors.length, 0);
    assert.match(result.output, /docs\(/i);
  });

  test('git cleanup-branches dry run lists merged branches', async () => {
    const result = await runGitCommand(['cleanup-branches']);

    assert.equal(result.errors.length, 0);
    assert.match(result.output, /feature-clean/i);
    assert.match(result.output, /dry run mode/i);
  });

  test('git release dry run reports last tag and commit count', async () => {
    const result = await runGitCommand(['release']);

    assert.equal(result.errors.length, 0);
    assert.match(result.output, /Last tag:\s*v0\.1\.0/i);
    assert.match(result.output, /Commits since v0\.1\.0/i);
    assert.match(result.output, /Dry run mode/i);
  });
});
