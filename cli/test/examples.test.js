/**
 * Examples Command Test Suite
 * Tests for the interactive examples system
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
  return await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-examples-test-'));
}

describe('examples command', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await createTempDir();
  });

  afterEach(async () => {
    if (tmpDir && existsSync(tmpDir)) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('examples --help shows usage', () => {
    const result = runCli(['examples', '--help']);
    assert.equal(result.status, 0);
    assert.match(result.output, /examples/i);
    assert.match(result.output, /view/i);
    assert.match(result.output, /init/i);
  });

  test('examples list shows available examples', () => {
    const result = runCli(['examples', 'list']);
    assert.equal(result.status, 0);
    assert.match(result.output, /TaskFlow/i);
    assert.match(result.output, /InvoiceFlow/i);
    assert.match(result.output, /HabitStack/i);
  });

  test('examples view shows details for valid example', () => {
    const result = runCli(['examples', 'view', 'taskflow']);
    assert.equal(result.status, 0);
    assert.match(result.output, /TaskFlow/i);
    assert.match(result.output, /Stack:/i);
    assert.match(result.output, /Next.js/i);
  });

  test('examples view shows error for invalid example', () => {
    const result = runCli(['examples', 'view', 'invalid-id']);
    // Might exit with code 0 but show error message
    assert.match(result.output, /not found/i);
  });

  test('examples init creates project structure', async () => {
    const projectName = 'my-test-project';
    const result = runCli(['examples', 'init', 'taskflow', '--name', projectName], { cwd: tmpDir });

    assert.equal(result.status, 0);
    assert.match(result.output, /Initialized/i);
    assert.match(result.output, /Next steps/i);

    // Verify files were created
    const projectDir = path.join(tmpDir, projectName);
    assert.ok(existsSync(path.join(projectDir, 'package.json')), 'package.json should exist');
    assert.ok(existsSync(path.join(projectDir, 'CONTEXT.md')), 'CONTEXT.md should exist');
    assert.ok(existsSync(path.join(projectDir, 'src')), 'src directory should exist');

    // Verify content
    const contextContent = await fs.readFile(path.join(projectDir, 'CONTEXT.md'), 'utf-8');
    assert.match(contextContent, /TaskFlow/i);
  });
});
