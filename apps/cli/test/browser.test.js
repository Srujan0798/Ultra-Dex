/**
 * Tests for the ultra-dex browser command
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
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
  });
  return {
    ...result,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

describe('browser command', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-browser-test-'));
  });

  afterEach(async () => {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('browser screenshot exists', () => {
    const result = runCli(['browser', 'screenshot', '--help']);
    assert.equal(result.status, 0);
    assert.match(result.output, /screenshot/i);
    assert.match(result.output, /--output/i);
  });

  test('browser scrape exists', () => {
    const result = runCli(['browser', 'scrape', '--help']);
    assert.equal(result.status, 0);
    assert.match(result.output, /scrape/i);
    assert.match(result.output, /--query/i);
  });

  test('browser test exists', () => {
    const result = runCli(['browser', 'test', '--help']);
    assert.equal(result.status, 0);
    assert.match(result.output, /test/i);
    assert.match(result.output, /--assertions/i);
  });

  test('browser record exists', () => {
    const result = runCli(['browser', 'record', '--help']);
    assert.equal(result.status, 0);
    assert.match(result.output, /record/i);
  });

  test('browser mockup exists', () => {
    const result = runCli(['browser', 'mockup', '--help']);
    assert.equal(result.status, 0);
    assert.match(result.output, /mockup/i);
    assert.match(result.output, /--stack/i);
  });

  test('browser audit exists', () => {
    const result = runCli(['browser', 'audit', '--help']);
    assert.equal(result.status, 0);
    assert.match(result.output, /audit/i);
    assert.match(result.output, /--promote/i);
  });
});

/**
 * Error handler for browser.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[browser.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
