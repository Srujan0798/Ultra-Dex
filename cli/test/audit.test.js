/**
 * Audit Command Test Suite
 * Tests for the comprehensive project audit system
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
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-audit-test-'));

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }

  return tmpDir;
}

describe('audit command', () => {
  let tmpDir;

  afterEach(async () => {
    if (tmpDir && existsSync(tmpDir)) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('audit --help shows usage', () => {
    const result = runCli(['audit', '--help']);
    assert.equal(result.status, 0);
    assert.match(result.output, /audit/i);
    assert.match(result.output, /Comprehensive/i);
  });

  test('audit detects missing files', async () => {
    tmpDir = await createTempProject({}); // Empty project

    const result = runCli(['audit', '--dir', tmpDir]);

    assert.match(result.output, /STRUCTURE/i);
    assert.match(result.output, /package\.json.*Missing/i);
    assert.match(result.output, /README\.md.*Missing/i);
    assert.match(result.output, /Score:/i);
  });

  test('audit detects valid project structure', async () => {
    tmpDir = await createTempProject({
      'package.json': '{}',
      'README.md': '# Test',
      'IMPLEMENTATION-PLAN.md': '# Plan',
      'CONTEXT.md': '# Context',
      'src/index.js': 'console.log("hi")',
    });

    const result = runCli(['audit', '--dir', tmpDir]);

    assert.match(result.output, /✅.*package\.json/i);
    assert.match(result.output, /✅.*src\//i);
  });

  test('audit checks for security issues', async () => {
    tmpDir = await createTempProject({
      'package.json': '{}',
      '.env.example': 'KEY=value',
    });

    const result = runCli(['audit', '--dir', tmpDir]);

    assert.match(result.output, /SECURITY/i);
    assert.match(result.output, /✅.*\.env\.example/i);
  });

  test('audit --fix attempts to create missing files', async () => {
    tmpDir = await createTempProject({
      'package.json': '{}',
    });

    const result = runCli(['audit', '--dir', tmpDir, '--fix']);

    assert.match(result.output, /Running auto-fixes/i);

    // Check if IMPLEMENTATION-PLAN.md was created
    const planExists = existsSync(path.join(tmpDir, 'IMPLEMENTATION-PLAN.md'));
    assert.ok(planExists, 'Should create IMPLEMENTATION-PLAN.md');
  });
});

/**
 * Error handler for audit.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[audit.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
