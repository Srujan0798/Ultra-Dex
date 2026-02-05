import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Command } from 'commander';
import { registerCheckCommand } from '../../lib/commands/check.js';

async function createTempProject(files = {}) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-check-'));
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, filePath);
    mkdirSync(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }
  return tmpDir;
}

async function runCheckCommand(args, cwd) {
  const program = new Command();
  registerCheckCommand(program);

  const logs = [];
  const originalLog = console.log;
  console.log = (...input) => logs.push(input.join(' '));

  const originalCwd = process.cwd();
  process.chdir(cwd);
  try {
    await program.parseAsync(['node', 'test', 'check', ...args]);
  } finally {
    process.chdir(originalCwd);
    console.log = originalLog;
  }

  return logs.join('\n').trim();
}

describe('check command', () => {
  test('check --json returns structured output', async () => {
    const tmpDir = await createTempProject({
      'CONTEXT.md': 'Project context\nMore details here to ensure non-empty.\n',
      'IMPLEMENTATION-PLAN.md': [
        '## 1 Overview',
        '- Feature summary',
        '## 2 Scope',
        '- Scope details',
        '## 3 Requirements',
        '- Acceptance Criteria: Must pass',
        '## 4 Architecture',
        '- Decisions and dependencies',
      ].join('\n')
    });

    const output = await runCheckCommand(['--json'], tmpDir);
    const parsed = JSON.parse(output);
    assert.ok(Array.isArray(parsed.sections));
    assert.ok(typeof parsed.percentage === 'number');
    assert.ok(parsed.contextValid !== undefined);
  });

  test('check --p0-only filters non-P0 sections', async () => {
    const tmpDir = await createTempProject({
      'CONTEXT.md': 'Project context\nMore details here to ensure non-empty.\n',
      'IMPLEMENTATION-PLAN.md': [
        '## 1 Overview',
        '- Feature summary',
        '## 2 Scope',
        '- Scope details',
        '## 3 Requirements',
        '- Acceptance Criteria: Must pass',
      ].join('\n')
    });

    const output = await runCheckCommand(['--p0-only', '--json'], tmpDir);
    const parsed = JSON.parse(output);
    const sectionNumbers = parsed.sections.map((s) => s.number);
    assert.ok(sectionNumbers.includes(1));
    assert.ok(sectionNumbers.includes(2));
    assert.ok(!sectionNumbers.includes(3));
  });
});
