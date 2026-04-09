/**
 * V3 Commands Feature Test Suite
 * Tests for deploy, memory, status, health, and scaffold
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

async function createTempDir() {
  return await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-v3-test-'));
}

describe('V3 Feature Commands', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await createTempDir();
  });

  afterEach(async () => {
    if (tmpDir && existsSync(tmpDir)) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  // ===============================
  // DEPLOY COMMAND
  // ===============================
  describe('deploy command', () => {
    test('deploy --help shows usage', () => {
      const result = runCli(['deploy', '--help']);
      assert.equal(result.status, 0);
      assert.match(result.output, /deploy/i);
      assert.match(result.output, /Terraform|Docker|K8s/i);
    });

    test('deploy generates configurations', async () => {
      // Create a dummy package.json
      await fs.writeFile(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'test-app' }));

      const result = runCli(['deploy', '--project', tmpDir, '--all'], { cwd: tmpDir });

      assert.match(result.output, /Generation Summary/i);
      assert.match(result.output, /✅ All deployment configurations generated/i);

      // Verify files
      assert.ok(existsSync(path.join(tmpDir, 'Dockerfile')), 'Dockerfile should exist');
      assert.ok(
        existsSync(path.join(tmpDir, 'docker-compose.yml')),
        'docker-compose.yml should exist'
      );
      assert.ok(
        existsSync(path.join(tmpDir, 'infrastructure/terraform/main.tf')),
        'Terraform main.tf should exist'
      );
      assert.ok(
        existsSync(path.join(tmpDir, 'k8s/deployment.yaml')),
        'K8s deployment.yaml should exist'
      );
    });
  });

  // ===============================
  // MEMORY COMMAND
  // ===============================
  describe('memory command', () => {
    test('memory --help shows usage', () => {
      const result = runCli(['memory', '--help']);
      assert.equal(result.status, 0);
      assert.match(result.output, /memory/i);
      assert.match(result.output, /list|add|search/i);
    });

    test('memory add and list works', async () => {
      // Add a fact
      const addResult = runCli(['memory', 'add', 'The project uses Node.js 20'], { cwd: tmpDir });
      assert.match(addResult.output, /Fact remembered/i);

      // List facts
      const listResult = runCli(['memory', 'list'], { cwd: tmpDir });
      assert.match(listResult.output, /Persistent Memory/i);
      assert.match(listResult.output, /Node\.js 20/i);
    });
  });

  // ===============================
  // MONITORING COMMANDS (status, health)
  // ===============================
  describe('monitoring commands', () => {
    test('status shows system status', () => {
      const result = runCli(['status']);
      assert.match(result.output, /Ultra-Dex Status/i);
    });

    test('health shows health status', () => {
      const result = runCli(['health']);
      assert.match(result.output, /Health Status/i);
    });

    test('health --check runs detailed checks', () => {
      const result = runCli(['health', '--check']);
      assert.match(result.output, /Detailed Health Check Results/i);
      assert.match(result.output, /MCP Server/i);
    });
  });

  // ===============================
  // SCAFFOLD COMMAND
  // ===============================
  describe('scaffold command', () => {
    test('scaffold --help shows usage', () => {
      const result = runCli(['scaffold', '--help']);
      assert.equal(result.status, 0);
      assert.match(result.output, /scaffold/i);
    });

    test('scaffold from plan works', async () => {
      // Setup a plan
      await fs.mkdir(path.join(tmpDir, 'src'), { recursive: true });
      await fs.writeFile(
        path.join(tmpDir, 'IMPLEMENTATION-PLAN.md'),
        `
# Test Project
## Section 6: Tech Stack
Frontend: Next.js
Database: Prisma
Auth: Clerk
`
      );

      const result = runCli(['scaffold', '--from-plan'], { cwd: tmpDir });

      assert.match(result.output, /Scaffolding from Implementation Plan/i);
      assert.match(result.output, /Detected Tech Stack/i);
      assert.match(result.output, /✅ Scaffolding Complete/i);

      // Verify some files
      assert.ok(existsSync(path.join(tmpDir, 'package.json')), 'package.json should be created');
      assert.ok(
        existsSync(path.join(tmpDir, 'prisma/schema.prisma')),
        'Prisma schema should be created'
      );
      assert.ok(existsSync(path.join(tmpDir, 'src/lib/db.ts')), 'DB lib should be created');
    });
  });
});

/**
 * Error handler for v3-commands-feature.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error(
      '[v3-commands-feature.test]',
      error instanceof Error ? error.message : String(error)
    );
  } catch (_) {
    // Fail silently
  }
}
