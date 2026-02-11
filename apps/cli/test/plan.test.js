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
const cliPath = path.resolve(__dirname, '..', 'bin', 'ultra-dex.js');

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
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
    assert.equal(result.status, 0);
    assert.match(result.output, /plan/i);
    assert.match(result.output, /view/i);
    assert.match(result.output, /update/i);
    assert.match(result.output, /add-step/i);
  });

  test('plan generate creates markdown file', async () => {
    const result = runCli(['plan', 'generate'], { cwd: tmpDir });

    assert.match(result.output, /generated successfully/i);
    assert.ok(existsSync(path.join(tmpDir, 'IMPLEMENTATION-PLAN.md')));

    const content = await fs.readFile(path.join(tmpDir, 'IMPLEMENTATION-PLAN.md'), 'utf-8');
    assert.match(content, /Phase 1/i);
    assert.match(content, /Task 1/i);
  });

  test('plan view shows current status', async () => {
    const result = runCli(['plan', 'view'], { cwd: tmpDir });

    assert.match(result.output, /Plan: Test Project/i);
    assert.match(result.output, /Phase 1/i);
    assert.match(result.output, /Task 1/i);
    assert.match(result.output, /Progress:/i);
  });

  test('plan add-step adds task to phase', async () => {
    const result = runCli(['plan', 'add-step', 'Phase 1', 'New Task 3'], { cwd: tmpDir });

    assert.match(result.output, /Added step/i);
    assert.match(result.output, /New Task 3/i);

    // Verify state update
    const state = JSON.parse(await fs.readFile(path.join(tmpDir, '.ultra/state.json'), 'utf-8'));
    const phase1 = state.phases.find((p) => p.name === 'Phase 1');
    assert.ok(phase1.steps.find((s) => s.task === 'New Task 3'));
  });

  test('plan handles missing state gracefully', async () => {
    const emptyDir = await createTempProject({});
    const result = runCli(['plan', 'view'], { cwd: emptyDir });

    assert.match(result.output, /State not found/i);
  });
});

/**
 * Error handler for plan.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[plan.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
