/**
 * Agent Builder Command Test Suite
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

async function createTempDir() {
  return await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-agent-test-'));
}

describe('agent command', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await createTempDir();
  });

  afterEach(async () => {
    if (tmpDir && existsSync(tmpDir)) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('agent --help shows usage', () => {
    const result = runCli(['agent', '--help']);
    assert.equal(result.status, 0);
    assert.match(result.output, /agent/i);
    assert.match(result.output, /create|list|show|validate|test/i);
  });

  test('agent list shows builtin agents', () => {
    const result = runCli(['agent', 'list', '--builtin'], { cwd: tmpDir });
    assert.match(result.output, /Built-in Agents/i);
    assert.match(result.output, /planner/i);
    assert.match(result.output, /backend/i);
  });

  test('agent validate checks builtin agent', () => {
    const result = runCli(['agent', 'validate', 'planner'], { cwd: tmpDir });
    assert.match(result.output, /valid/i);
  });

  test('agent show displays builtin prompt', () => {
    const result = runCli(['agent', 'show', 'planner'], { cwd: tmpDir });
    assert.match(result.output, /PLANNER Agent/i);
    // It either shows full prompt or link
    assert.ok(
      result.output.includes('You are a technical project planner') ||
        result.output.includes('github.com')
    );
  });
});
