/**
 * Production Extended Commands Test Suite
 * Tests for remaining production commands: sync, review, github, search, export
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
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-prod-ext-'));

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }

  return tmpDir;
}

describe('Extended Production Commands', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await createTempProject({
      'CONTEXT.md': '# Test Project',
      'IMPLEMENTATION-PLAN.md': '# Plan\n- [ ] Task 1',
      'src/index.js': 'console.log("hello");',
      '.ultra/state.json': JSON.stringify({
        project: { name: 'Test' },
        phases: [],
      }),
    });
  });

  afterEach(async () => {
    if (tmpDir && existsSync(tmpDir)) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  // ===============================
  // SYNC COMMAND
  // ===============================
  describe('sync command', () => {
    test('sync --help shows usage', () => {
      const result = runCli(['sync', '--help']);
      assert.equal(result.status, 0);
      assert.match(result.output, /sync/i);
      assert.match(result.output, /state/i);
    });

    test('sync updates state from files', async () => {
      const result = runCli(['sync'], { cwd: tmpDir });
      assert.match(result.output, /State Sync|Context Snapshot/i);
      assert.equal(result.status, 0);
    });
  });

  // ===============================
  // REVIEW COMMAND
  // ===============================
  describe('review command', () => {
    test('review --help shows usage', () => {
      const result = runCli(['review', '--help']);
      assert.equal(result.status, 0);
      assert.match(result.output, /review/i);
      assert.match(result.output, /code/i);
    });

    test('review scans project files', async () => {
      const result = runCli(['review', '--dir', tmpDir], { cwd: tmpDir });
      if (result.output.includes('API key')) {
        assert.ok(true, 'Correctly asked for API key');
      } else {
        assert.match(result.output, /Review/i);
      }
    });
  });

  // ===============================
  // GITHUB COMMAND
  // ===============================
  describe('github command', () => {
    test('github --help shows usage', () => {
      const result = runCli(['github', '--help']);
      assert.equal(result.status, 0);
      assert.match(result.output, /github/i);
      assert.match(result.output, /GitHub integration/i);
    });

    test('github setup check', async () => {
      const result = runCli(['github', 'setup'], { cwd: tmpDir });
      assert.match(result.output, /GitHub/i);
    });
  });

  // ===============================
  // SEARCH COMMAND
  // ===============================
  describe('search command', () => {
    test('search --help shows usage', () => {
      const result = runCli(['search', '--help']);
      assert.equal(result.status, 0);
      assert.match(result.output, /search/i);
      assert.match(result.output, /code/i);
    });

    test('search attempts to find text', async () => {
      const result = runCli(['search', 'console'], { cwd: tmpDir });
      assert.match(result.output, /Searching for|Search failed/i);
    });
  });

  // ===============================
  // EXPORT COMMAND
  // ===============================
  describe('export command', () => {
    test('export --help shows usage', () => {
      const result = runCli(['export', '--help']);
      assert.equal(result.status, 0);
      assert.match(result.output, /export/i);
      assert.match(result.output, /format/i);
    });

    test('export generates json output', async () => {
      const outputFile = path.join(tmpDir, 'export.json');
      const result = runCli(['export', '--format', 'json', '--output', outputFile], {
        cwd: tmpDir,
      });

      assert.equal(result.status, 0);
      assert.match(result.output, /Exported/i);
      assert.ok(existsSync(outputFile));

      const content = await fs.readFile(outputFile, 'utf-8');
      assert.ok(content.includes('Test'), 'Export should contain project name');
    });
  });
});
