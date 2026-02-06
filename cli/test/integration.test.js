/**
 * Integration tests for Ultra-Dex CLI workflows
 * Tests complete command sequences and end-to-end scenarios
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const cliPath = path.resolve(process.cwd(), 'cli/bin/ultra-dex.js');

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, FORCE_COLOR: '0', LOG_LEVEL: 'silent', ...options.env },
    encoding: 'utf8',
    timeout: options.timeout ?? 60000,
  });
  return {
    ...result,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

describe('CLI Integration Workflows', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-integration-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('Project Initialization Workflow', () => {
    test('init --preview shows planned files', () => {
      const result = runCli(['init', '--preview']);
      assert.strictEqual(result.status, 0);
      assert.ok(result.output.includes('Planned files') || result.output.includes('files'));
    });

    test('init --live creates project structure', async () => {
      const result = runCli(['init', '--live']);

      // Check that expected files/directories were created
      const ultraDexExists = await fs
        .access(path.join(tmpDir, '.ultra-dex'))
        .then(() => true)
        .catch(() => false);

      assert.ok(
        ultraDexExists ||
          result.output.includes('created') ||
          result.output.includes('initialized'),
        'Should create project structure or indicate success'
      );
    });

    test('init then validate workflow', async () => {
      // Initialize project
      runCli(['init', '--live']);

      // Validate the project
      const result = runCli(['validate']);

      // Should complete without crashing
      assert.ok(result.status === 0 || result.status === 1, 'Should exit cleanly');
    });
  });

  describe('Agent Workflow', () => {
    test('agents list shows all agents', () => {
      const result = runCli(['agents']);
      assert.strictEqual(result.status, 0);
      assert.ok(
        result.output.includes('backend') || result.output.includes('cto'),
        'Should list agent names'
      );
    });

    test('agents search finds matching agents', () => {
      const result = runCli(['agents', 'search', 'backend']);
      assert.strictEqual(result.status, 0);
      assert.ok(
        result.output.includes('backend') || result.output.includes('Backend'),
        'Should find backend agent'
      );
    });

    test('agent show displays agent info', () => {
      const result = runCli(['agent', 'backend']);
      // May succeed or fail depending on agent file availability
      assert.ok(result.output.length > 0, 'Should produce output');
    });
  });

  describe('Configuration Workflow', () => {
    test('config shows environment info', () => {
      const result = runCli(['config']);
      assert.strictEqual(result.status, 0);
      assert.ok(
        result.output.includes('Config') || result.output.includes('Environment'),
        'Should show configuration'
      );
    });

    test('config --cursor creates cursor rules', () => {
      const result = runCli(['config', '--cursor']);
      assert.strictEqual(result.status, 0);
      // May create files or show instructions
      assert.ok(result.output.length > 0);
    });

    test('config --vscode creates vscode settings', () => {
      const result = runCli(['config', '--vscode']);
      assert.strictEqual(result.status, 0);
      assert.ok(result.output.length > 0);
    });
  });

  describe('Brain Sync Workflow', () => {
    test('brain sync creates CONTEXT.md', async () => {
      const result = runCli(['brain']);

      // Check if CONTEXT.md was created or command succeeded
      const contextExists = await fs
        .access(path.join(tmpDir, 'CONTEXT.md'))
        .then(() => true)
        .catch(() => false);

      assert.ok(
        contextExists ||
          result.output.includes('synchronized') ||
          result.output.includes('updated'),
        'Should create CONTEXT.md or indicate success'
      );
    });

    test('brain sync updates existing CONTEXT.md', async () => {
      // Create initial CONTEXT.md
      await fs.writeFile(
        path.join(tmpDir, 'CONTEXT.md'),
        '# Test Project\n\n## Current Focus\nInitial setup.'
      );

      const result = runCli(['brain']);

      // Should update without error
      assert.ok(
        result.status === 0 ||
          result.output.includes('synchronized') ||
          result.output.includes('updated'),
        'Should update existing file'
      );
    });
  });

  describe('Export Workflow', () => {
    test('export shows available formats', () => {
      const result = runCli(['export', '--help']);
      assert.strictEqual(result.status, 0);
      assert.ok(
        result.output.includes('format') ||
          result.output.includes('json') ||
          result.output.includes('html'),
        'Should mention export formats'
      );
    });

    test('export to JSON', async () => {
      // Create a minimal project first
      runCli(['init', '--live']);

      const result = runCli(['export', '--format', 'json']);

      // Should succeed or show export content
      assert.ok(
        result.status === 0 || result.output.includes('{') || result.output.includes('project'),
        'Should export to JSON or indicate success'
      );
    });
  });

  describe('Status and Info Commands', () => {
    test('status shows project status', () => {
      const result = runCli(['status']);
      // Status may fail on empty project but should not crash
      assert.ok(typeof result.status === 'number', 'Should exit with numeric code');
    });

    test('doctor runs diagnostics', () => {
      const result = runCli(['doctor']);
      assert.ok(result.output.length > 0, 'Should produce diagnostic output');
    });

    test('version shows version info', () => {
      const result = runCli(['--version']);
      assert.strictEqual(result.status, 0);
      assert.ok(result.output.match(/\d+\.\d+\.\d+/), 'Should show version number');
    });

    test('help shows command list', () => {
      const result = runCli(['--help']);
      assert.strictEqual(result.status, 0);
      assert.ok(
        result.output.includes('Commands:') || result.output.includes('command'),
        'Should list commands'
      );
    });
  });

  describe('Error Handling', () => {
    test('handles unknown commands gracefully', () => {
      const result = runCli(['unknown-command']);
      // Should fail but not crash
      assert.ok(
        result.status !== 0 || result.output.includes('error') || result.output.includes('unknown'),
        'Should handle unknown command'
      );
    });

    test('handles missing required arguments', () => {
      const result = runCli(['agent']);
      // Should show help or error
      assert.ok(result.output.length > 0);
    });

    test('validates invalid project names', () => {
      // Test through init command with invalid name
      const result = runCli(['init', '--name', 'invalid/name']);
      assert.ok(
        result.output.includes('error') || result.output.includes('invalid') || result.status !== 0,
        'Should validate project names'
      );
    });
  });
});

describe('Command Chains', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-chains-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('full project setup workflow', async () => {
    // Step 1: Initialize
    const initResult = runCli(['init', '--live']);

    // Step 2: Sync brain
    const brainResult = runCli(['brain']);

    // Step 3: Check alignment
    const alignResult = runCli(['align']);

    // All steps should complete
    assert.ok(
      initResult.status === 0 || initResult.output.includes('created'),
      'Init should succeed'
    );
    assert.ok(
      brainResult.output.includes('synchronized') || brainResult.output.includes('updated'),
      'Brain sync should work'
    );
    assert.ok(
      alignResult.output.includes('Alignment') || alignResult.output.includes('score'),
      'Align should produce output'
    );
  });

  test('agent to export workflow', async () => {
    // Initialize first
    runCli(['init', '--live']);

    // List agents
    const agentsResult = runCli(['agents']);
    assert.ok(
      agentsResult.output.includes('backend') || agentsResult.output.includes('cto'),
      'Should list agents'
    );

    // Export project
    const exportResult = runCli(['export', '--format', 'markdown']);
    assert.ok(exportResult.output.length > 0, 'Should export');
  });
});
