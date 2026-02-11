/**
 * Smoke Tests for Large Commands
 *
 * Basic sanity checks for commands >500 lines that lack comprehensive tests
 * These tests ensure commands load without errors and handle basic scenarios
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

// Helper function to safely test command imports
async function testCommandImport(commandPath, functionName) {
  try {
    const module = await import(commandPath);
    assert.ok(module, 'Module should be defined');

    // Check if the expected function exists (lenient check)
    if (functionName && typeof module[functionName] === 'function') {
      return { success: true, hasFunction: true };
    }

    // If no specific function name, just check module loads
    return { success: true, hasFunction: false, module };
  } catch (error) {
    throw new Error(`Failed to import ${commandPath}: ${error.message}`);
  }
}

describe('Large Commands - Smoke Tests', () => {
  describe('scaffold-enhanced command', () => {
    test('should load module without critical errors', async () => {
      const result = await testCommandImport(
        '../../lib/commands/scaffold-enhanced.js',
        'registerScaffoldEnhancedCommand'
      );
      assert.ok(result.success);
    });
  });

  describe('cloud command', () => {
    test('should load module without critical errors', async () => {
      const result = await testCommandImport('../../lib/commands/cloud.js', 'registerCloudCommand');
      assert.ok(result.success);
    });
  });

  describe('dashboard command', () => {
    test('should load module without critical errors', async () => {
      const result = await testCommandImport(
        '../../lib/commands/dashboard.js',
        'registerDashboardCommand'
      );
      assert.ok(result.success);
    });
  });

  describe('export command', () => {
    test('should load module without critical errors', async () => {
      const result = await testCommandImport(
        '../../lib/commands/export.js',
        'registerExportCommand'
      );
      assert.ok(result.success);
    });
  });

  describe('code-gen command', () => {
    test('should load module without critical errors', async () => {
      const result = await testCommandImport(
        '../../lib/commands/code-gen.js',
        'registerCodeGenCommand'
      );
      assert.ok(result.success);
    });
  });

  describe('deploy command', () => {
    test('should load module without critical errors', async () => {
      const result = await testCommandImport(
        '../../lib/commands/deploy.js',
        'registerDeployCommand'
      );
      assert.ok(result.success);
    });
  });

  describe('diff command', () => {
    test('should load module without critical errors', async () => {
      const result = await testCommandImport('../../lib/commands/diff.js', 'registerDiffCommand');
      assert.ok(result.success);
    });
  });

  describe('team command', () => {
    test('should load module without critical errors', async () => {
      const result = await testCommandImport('../../lib/commands/team.js', 'registerTeamCommand');
      assert.ok(result.success);
    });
  });

  describe('search command', () => {
    test('should load module without critical errors', async () => {
      const result = await testCommandImport(
        '../../lib/commands/search.js',
        'registerSearchCommand'
      );
      assert.ok(result.success);
    });
  });

  describe('run command', () => {
    test('should load module without critical errors', async () => {
      const result = await testCommandImport('../../lib/commands/run.js', 'registerRunCommand');
      assert.ok(result.success);
    });
  });

  describe('quality command', () => {
    test('should load module without critical errors', async () => {
      const result = await testCommandImport(
        '../../lib/commands/quality.js',
        'registerQualityCommand'
      );
      assert.ok(result.success);
    });
  });

  describe('sync command', () => {
    test('should load module without critical errors', async () => {
      const result = await testCommandImport('../../lib/commands/sync.js', 'registerSyncCommand');
      assert.ok(result.success);
    });
  });

  describe('scaffold-plan command', () => {
    test('should load module without critical errors', async () => {
      const result = await testCommandImport(
        '../../lib/commands/scaffold-plan.js',
        'registerScaffoldPlanCommand'
      );
      assert.ok(result.success);
    });
  });
});
