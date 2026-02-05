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
    const dir = path.dirname(fullPath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {}
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
  } catch (err) {
    console.error('Command failed:', err);
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
      'package.json': JSON.stringify({ dependencies: { 'next': '^14.0.0' } }),
      'IMPLEMENTATION-PLAN.md': [
        '## SECTION 1: Overview',
        '- Feature summary',
        '## SECTION 2: Tech Stack',
        '- Next.js',
        '## SECTION 4: Architecture',
        '- Decisions',
      ].join('\n')
    });

    const output = await runCheckCommand(['--json'], tmpDir);
    const parsed = JSON.parse(output);
    assert.ok(Array.isArray(parsed.sections));
    assert.ok(typeof parsed.percentage === 'number');
    assert.ok(parsed.contextValid !== undefined);
  });

  test('check validates P0 sections (11 sections)', async () => {
    const tmpDir = await createTempProject({
      'CONTEXT.md': 'Project context\nMore details here to ensure non-empty.\n',
      'IMPLEMENTATION-PLAN.md': [
        '## SECTION 1: Summary',
        '## SECTION 2: Features',
        '## SECTION 4: Personas',
        '## SECTION 6: Screens',
        '## SECTION 9: UX',
        '## SECTION 10: Data',
        '## SECTION 11: API',
        '## SECTION 12: Arch',
        '## SECTION 15: Tech',
        '## SECTION 16: Plan',
        '## SECTION 20: Testing',
      ].join('\n')
    });

    const output = await runCheckCommand(['--p0-only', '--json'], tmpDir);
    const parsed = JSON.parse(output);
    const sectionNumbers = parsed.sections.map((s) => s.number);
    
    // Should have 11 sections
    assert.strictEqual(parsed.total, 11);
    assert.ok(sectionNumbers.includes(1));
    assert.ok(sectionNumbers.includes(20));
  });

  test('check validates tech stack against package.json', async () => {
    const tmpDir = await createTempProject({
      'CONTEXT.md': 'Project context\n',
      'package.json': JSON.stringify({ dependencies: { 'prisma': '^5.0.0' } }),
      'IMPLEMENTATION-PLAN.md': [
        '## SECTION 15: Tech Stack',
        'We are using SQLite for now.', // Missing Prisma mention
      ].join('\n')
    });

    const output = await runCheckCommand(['--sections', '15'], tmpDir);
    assert.ok(output.includes('Issues with tech stack choices') || output.includes('Prisma found in package.json but not mentioned'));
  });

  test('check identifies missing acceptance criteria', async () => {
    const tmpDir = await createTempProject({
      'CONTEXT.md': 'Project context\n',
      'IMPLEMENTATION-PLAN.md': [
        '## SECTION 16: Implementation Plan',
        '- Step 1: Just do it.',
      ].join('\n')
    });

    const output = await runCheckCommand(['--sections', '16'], tmpDir);
    // Check for summary wording
    assert.ok(output.includes('Missing acceptance criteria in 1 sections'));
  });

  test('check identifies non-atomic tasks', async () => {
    const tmpDir = await createTempProject({
      'CONTEXT.md': 'Project context\n',
      'IMPLEMENTATION-PLAN.md': [
        '## SECTION 16: Implementation Plan',
        '### Task Breakdown',
        '- [ ] Task 1: Big task (20 hours)',
        'Acceptance Criteria: Done.',
      ].join('\n')
    });

    const output = await runCheckCommand(['--sections', '16'], tmpDir);
    // Check for summary wording
    assert.ok(output.includes('Missing atomic task breakdown in 1 sections'));
  });
});
