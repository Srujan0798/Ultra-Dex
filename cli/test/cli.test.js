import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const EXPECTED_VERSION = pkg.version;

const cliPath = path.resolve(process.cwd(), 'bin', 'ultra-dex.js');

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, FORCE_COLOR: '0', LOG_LEVEL: 'silent', ...options.env },
    encoding: 'utf8',
    input: options.input ?? ''
  });
  return {
    ...result,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`
  };
}

test('--version returns valid semver', () => {
  const result = runCli(['--version']);
  assert.equal(result.status, 0);
  const version = result.output.trim();
  assert.match(version, /^\d+\.\d+\.\d+$/);
  assert.equal(version, EXPECTED_VERSION, `Version should match package.json (${EXPECTED_VERSION})`);
});

test('--help shows all 16 commands', () => {
  const result = runCli(['--help']);
  assert.equal(result.status, 0);
  const commands = [
    'init',
    'audit',
    'examples',
    'agents',
    'agent',
    'generate',
    'build',
    'review',
    'align',
    'serve',
    'workflow',
    'suggest',
    'validate',
    'hooks',
    'fetch',
    'sync'
  ];
  commands.forEach(cmd => {
    assert.match(result.output, new RegExp(`\\b${cmd}\\b`));
  });
});

test('agents lists all agents', () => {
  const result = runCli(['agents']);
  assert.equal(result.status, 0);
  const output = result.output.toLowerCase();
  const agents = [
    'cto',
    'planner',
    'research',
    'backend',
    'database',
    'frontend',
    'auth',
    'security',
    'devops',
    'debugger',
    'documentation',
    'reviewer',
    'testing',
    'performance',
    'refactoring'
  ];
  agents.forEach(agent => {
    assert.match(output, new RegExp(`\\b${agent}\\b`));
  });
});

test('validate fails gracefully on empty dir', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-validate-'));
  const result = runCli(['validate', '--dir', tmpDir]);
  assert.equal(result.status, 1);
  assert.match(result.output, /VALIDATION INCOMPLETE|missing|required|❌/i);
});

test('init --preview shows planned files', async () => {
  const result = runCli(['init', '--preview']);
  assert.equal(result.status, 0);
  assert.match(result.output, /PREVIEW MODE: ARCHITECTURAL BLUEPRINT/);
  assert.match(result.output, /QUICK-START\.md/);
});

test('init --live creates scaffold', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-live-'));
  const result = runCli(['init', '--live', '--stack', 'next15-prisma-clerk', '--dir', tmpDir]);
  
  if (result.status !== 0) {
    console.log('Live init failed:', result.output);
  }
  assert.equal(result.status, 0);

  // Verify key files exist
  const files = await fs.readdir(tmpDir);
  assert.ok(files.length > 0, 'Directory should not be empty');
  
  // Clean up
  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('sync updates context', async () => {
  // First create a project
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-sync-'));
  
  // We need a basic CONTEXT.md and some files to sync
  await fs.writeFile(path.join(tmpDir, 'CONTEXT.md'), '# Context\n');
  await fs.writeFile(path.join(tmpDir, 'package.json'), '{}');
  await fs.mkdir(path.join(tmpDir, 'src'), { recursive: true });
  await fs.writeFile(path.join(tmpDir, 'src', 'app.ts'), 'console.log("hello");');

  const result = runCli(['sync', '--dir', tmpDir]);
  
  if (result.status !== 0) {
    console.log('Sync failed:', result.output);
  }
  assert.equal(result.status, 0);
  assert.match(result.output, /Files scanned/);
  
  // Clean up
  await fs.rm(tmpDir, { recursive: true, force: true });
});
