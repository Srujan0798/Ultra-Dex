/**
 * Comprehensive tests for monitoring, status, config, metrics, and health commands
 * Tests: statusCommand, configCommand, metricsCommand, healthCommand
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('Monitoring & System Commands', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-monitoring-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('Status Command', () => {
    test('exports statusCommand function', async () => {
      const { statusCommand } = await import('../lib/commands/monitoring.js');
      assert.strictEqual(typeof statusCommand, 'function');
    });

    test('exports registerStatusCommand function', async () => {
      const { registerStatusCommand } = await import('../lib/commands/monitoring.js');
      assert.strictEqual(typeof registerStatusCommand, 'function');
    });

    test('registers status command with program', async () => {
      const { registerStatusCommand } = await import('../lib/commands/monitoring.js');

      const mockProgram = {
        command: function (name) {
          this.commandName = name;
          return this;
        },
        description: function (desc) {
          this.commandDescription = desc;
          return this;
        },
        option: function (flags, description) {
          if (!this.options) this.options = [];
          this.options.push({ flags, description });
          return this;
        },
        action: function (fn) {
          this.actionFn = fn;
          return this;
        },
      };

      registerStatusCommand(mockProgram);

      assert.strictEqual(mockProgram.commandName, 'status');
      assert.ok(
        mockProgram.commandDescription.includes('status') ||
          mockProgram.commandDescription.includes('health')
      );
      assert.ok(mockProgram.options.length >= 4);
      assert.strictEqual(typeof mockProgram.actionFn, 'function');
    });

    test('registers all status options', async () => {
      const { registerStatusCommand } = await import('../lib/commands/monitoring.js');

      const mockProgram = {
        command: () => mockProgram,
        description: () => mockProgram,
        options: [],
        option: function (flags, description) {
          this.options.push({ flags, description });
          return this;
        },
        action: () => mockProgram,
      };

      registerStatusCommand(mockProgram);

      const metricsOption = mockProgram.options.find(
        (o) => o.flags.includes('--metrics') || o.flags.includes('-m')
      );
      const healthOption = mockProgram.options.find(
        (o) => o.flags.includes('--health') || o.flags.includes('-h')
      );
      const configOption = mockProgram.options.find(
        (o) => o.flags.includes('--config') || o.flags.includes('-c')
      );
      const allOption = mockProgram.options.find(
        (o) => o.flags.includes('--all') || o.flags.includes('-a')
      );

      assert.ok(metricsOption, 'Should have --metrics option');
      assert.ok(healthOption, 'Should have --health option');
      assert.ok(configOption, 'Should have --config option');
      assert.ok(allOption, 'Should have --all option');
    });

    test('statusCommand accepts options parameter', async () => {
      const { statusCommand } = await import('../lib/commands/monitoring.js');
      // Should not throw when called with options
      await assert.doesNotReject(async () => {
        await statusCommand({});
      });
    });

    test('statusCommand handles metrics option', async () => {
      const { statusCommand } = await import('../lib/commands/monitoring.js');
      // Should not throw
      await assert.doesNotReject(async () => {
        await statusCommand({ metrics: true });
      });
    });

    test('statusCommand handles health option', async () => {
      const { statusCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await statusCommand({ health: true });
      });
    });

    test('statusCommand handles config option', async () => {
      const { statusCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await statusCommand({ config: true });
      });
    });

    test('statusCommand handles all option', async () => {
      const { statusCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await statusCommand({ all: true });
      });
    });

    test('statusCommand shows default view without options', async () => {
      const { statusCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await statusCommand({});
      });
    });
  });

  describe('Config Command', () => {
    test('exports configCommand function', async () => {
      const { configCommand } = await import('../lib/commands/monitoring.js');
      assert.strictEqual(typeof configCommand, 'function');
    });

    test('exports registerSystemConfigCommand function', async () => {
      const { registerSystemConfigCommand } = await import('../lib/commands/monitoring.js');
      assert.strictEqual(typeof registerSystemConfigCommand, 'function');
    });

    test('registers sys-config command with alias', async () => {
      const { registerSystemConfigCommand } = await import('../lib/commands/monitoring.js');

      const mockProgram = {
        command: function (name) {
          this.commandName = name;
          return this;
        },
        alias: function (alias) {
          this.commandAlias = alias;
          return this;
        },
        description: function (desc) {
          this.commandDescription = desc;
          return this;
        },
        option: function (flags, description) {
          if (!this.options) this.options = [];
          this.options.push({ flags, description });
          return this;
        },
        action: function (fn) {
          this.actionFn = fn;
          return this;
        },
      };

      registerSystemConfigCommand(mockProgram);

      assert.strictEqual(mockProgram.commandName, 'sys-config');
      assert.strictEqual(mockProgram.commandAlias, 'sconfig');
      assert.ok(
        mockProgram.commandDescription.includes('configuration') ||
          mockProgram.commandDescription.includes('config')
      );
      assert.ok(mockProgram.options.length >= 4);
    });

    test('registers all config options', async () => {
      const { registerSystemConfigCommand } = await import('../lib/commands/monitoring.js');

      const mockProgram = {
        command: () => mockProgram,
        alias: () => mockProgram,
        description: () => mockProgram,
        options: [],
        option: function (flags, description) {
          this.options.push({ flags, description });
          return this;
        },
        action: () => mockProgram,
      };

      registerSystemConfigCommand(mockProgram);

      const wizardOption = mockProgram.options.find(
        (o) => o.flags.includes('--wizard') || o.flags.includes('-w')
      );
      const listOption = mockProgram.options.find(
        (o) => o.flags.includes('--list') || o.flags.includes('-l')
      );
      const getOption = mockProgram.options.find(
        (o) => o.flags.includes('--get') || o.flags.includes('-g')
      );
      const setOption = mockProgram.options.find(
        (o) => o.flags.includes('--set') || o.flags.includes('-s')
      );

      assert.ok(wizardOption, 'Should have --wizard option');
      assert.ok(listOption, 'Should have --list option');
      assert.ok(getOption, 'Should have --get option');
      assert.ok(setOption, 'Should have --set option');
    });

    test('configCommand handles wizard option', async () => {
      const { configCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await configCommand({ wizard: true });
      });
    });

    test('configCommand handles list option', async () => {
      const { configCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await configCommand({ list: true });
      });
    });

    test('configCommand handles get option', async () => {
      const { configCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await configCommand({ get: 'someKey' });
      });
    });

    test('configCommand handles set option with valid format', async () => {
      const { configCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await configCommand({ set: 'key=value' });
      });
    });

    test('configCommand handles set option with invalid format', async () => {
      const { configCommand } = await import('../lib/commands/monitoring.js');
      // Should handle gracefully even with invalid format
      await assert.doesNotReject(async () => {
        await configCommand({ set: 'invalid-format' });
      });
    });

    test('configCommand shows default view without options', async () => {
      const { configCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await configCommand({});
      });
    });

    test('configCommand parses JSON values in set', async () => {
      const { configCommand } = await import('../lib/commands/monitoring.js');
      // Should handle JSON values
      await assert.doesNotReject(async () => {
        await configCommand({ set: 'key={"nested": "value"}' });
      });
    });
  });

  describe('Metrics Command', () => {
    test('exports metricsCommand function', async () => {
      const { metricsCommand } = await import('../lib/commands/monitoring.js');
      assert.strictEqual(typeof metricsCommand, 'function');
    });

    test('exports registerMetricsCommand function', async () => {
      const { registerMetricsCommand } = await import('../lib/commands/monitoring.js');
      assert.strictEqual(typeof registerMetricsCommand, 'function');
    });

    test('registers metrics command', async () => {
      const { registerMetricsCommand } = await import('../lib/commands/monitoring.js');

      const mockProgram = {
        command: function (name) {
          this.commandName = name;
          return this;
        },
        description: function (desc) {
          this.commandDescription = desc;
          return this;
        },
        option: function (flags, description) {
          if (!this.options) this.options = [];
          this.options.push({ flags, description });
          return this;
        },
        action: function (fn) {
          this.actionFn = fn;
          return this;
        },
      };

      registerMetricsCommand(mockProgram);

      assert.strictEqual(mockProgram.commandName, 'metrics');
      assert.ok(mockProgram.commandDescription.includes('metrics'));
      assert.strictEqual(typeof mockProgram.actionFn, 'function');
    });

    test('metricsCommand accepts options', async () => {
      const { metricsCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await metricsCommand({});
      });
    });

    test('metricsCommand handles watch option', async () => {
      const { metricsCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await metricsCommand({ watch: true });
      });
    });

    test('metricsCommand handles json option', async () => {
      const { metricsCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await metricsCommand({ json: true });
      });
    });
  });

  describe('Health Command', () => {
    test('exports healthCommand function', async () => {
      const { healthCommand } = await import('../lib/commands/monitoring.js');
      assert.strictEqual(typeof healthCommand, 'function');
    });

    test('exports registerHealthCommand function', async () => {
      const { registerHealthCommand } = await import('../lib/commands/monitoring.js');
      assert.strictEqual(typeof registerHealthCommand, 'function');
    });

    test('registers health command', async () => {
      const { registerHealthCommand } = await import('../lib/commands/monitoring.js');

      const mockProgram = {
        command: function (name) {
          this.commandName = name;
          return this;
        },
        description: function (desc) {
          this.commandDescription = desc;
          return this;
        },
        option: function (flags, description) {
          if (!this.options) this.options = [];
          this.options.push({ flags, description });
          return this;
        },
        action: function (fn) {
          this.actionFn = fn;
          return this;
        },
      };

      registerHealthCommand(mockProgram);

      assert.strictEqual(mockProgram.commandName, 'health');
      assert.ok(mockProgram.commandDescription.includes('health'));
      assert.strictEqual(typeof mockProgram.actionFn, 'function');
    });

    test('healthCommand accepts options', async () => {
      const { healthCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await healthCommand({});
      });
    });

    test('healthCommand handles check option', async () => {
      const { healthCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await healthCommand({ check: true });
      });
    });

    test('healthCommand handles fix option', async () => {
      const { healthCommand } = await import('../lib/commands/monitoring.js');
      await assert.doesNotReject(async () => {
        await healthCommand({ fix: true });
      });
    });
  });

  describe('Integration Tests', () => {
    test('commands work in combination', async () => {
      const { statusCommand, configCommand, metricsCommand, healthCommand } =
        await import('../lib/commands/monitoring.js');

      // All commands should be importable and callable
      await assert.doesNotReject(async () => {
        await statusCommand({});
        await configCommand({ list: true });
        await metricsCommand({});
        await healthCommand({});
      });
    });

    test('all register functions work', async () => {
      const {
        registerStatusCommand,
        registerSystemConfigCommand,
        registerMetricsCommand,
        registerHealthCommand,
      } = await import('../lib/commands/monitoring.js');

      const mockProgram = {
        command: function () {
          return this;
        },
        alias: function () {
          return this;
        },
        description: function () {
          return this;
        },
        option: function () {
          return this;
        },
        action: function () {
          return this;
        },
      };

      // All should register without error
      assert.doesNotThrow(() => registerStatusCommand(mockProgram));
      assert.doesNotThrow(() => registerSystemConfigCommand(mockProgram));
      assert.doesNotThrow(() => registerMetricsCommand(mockProgram));
      assert.doesNotThrow(() => registerHealthCommand(mockProgram));
    });
  });
});

/**
 * Error handler for monitoring.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[monitoring.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
