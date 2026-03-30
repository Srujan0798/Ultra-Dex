/**
 * Plan Command Test Suite
 * Tests for interactive plan management
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const cliPath = path.resolve(__dirname, '..', 'bin', 'ultra-dex-cli.js');
const bootstrapPath = path.resolve(__dirname, '..', 'bin', 'ultra-dex.js');

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, ['--import', bootstrapPath, cliPath, ...args], {
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, FORCE_COLOR: '0', LOG_LEVEL: 'silent', ...options.env },
    encoding: 'utf8',
    timeout: options.timeout ?? 30000,
    input: options.input ?? '',
  });
  return {
    ...result,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

async function createTempProject(files = {}) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-plan-test-'));

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }

  return tmpDir;
}

describe('plan command', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await createTempProject({
      '.ultra/state.json': JSON.stringify(
        {
          project: { name: 'Test Project', version: '1.0.0', mode: 'dev' },
          phases: [
            {
              id: '1',
              name: 'Phase 1',
              status: 'in_progress',
              steps: [
                { id: '1.1', task: 'Task 1', status: 'completed' },
                { id: '1.2', task: 'Task 2', status: 'pending' },
              ],
            },
          ],
          agents: { active: [], registry: ['planner'] },
        },
        null,
        2
      ),
    });
  });

  afterEach(async () => {
    if (tmpDir && existsSync(tmpDir)) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('plan --help shows usage', () => {
    const result = runCli(['plan', '--help']);
    assert.match(result.output, /plan/i);
    assert.match(result.output, /--generate/i);
  });

  test('plan --generate writes IMPLEMENTATION-PLAN.md', async () => {
    const result = runCli(['plan', '--generate'], { cwd: tmpDir });
    assert.match(result.output, /generated successfully/i);
    const generatedPath = path.join(tmpDir, 'IMPLEMENTATION-PLAN.md');
    assert.equal(existsSync(generatedPath), true);
  });

  test('plan default renders gantt output', async () => {
    const result = runCli(['plan'], { cwd: tmpDir });
    assert.match(result.output, /Project Timeline|Gantt/i);
  });

  test('plan --milestone marks a step in state', async () => {
    const result = runCli(['plan', '--milestone', '1.2'], { cwd: tmpDir });
    assert.match(result.output, /marked as milestone/i);

    const stateContent = await fs.readFile(path.join(tmpDir, '.ultra/state.json'), 'utf8');
    const state = JSON.parse(stateContent);
    const targetStep = state.phases[0].steps.find((s) => s.id === '1.2');
    assert.equal(targetStep?.isMilestone, true);
  });

  test('plan handles missing state gracefully', async () => {
    const emptyDir = await createTempProject({});
    const result = runCli(['plan'], { cwd: emptyDir });

    assert.match(result.output, /No project plan found|initialize your project|error/i);
  });
});
