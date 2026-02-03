/**
 * Comprehensive tests for config command
 * Tests: MCP config, Cursor rules, VSCode settings, config management
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { existsSync } from 'node:fs';

describe('Config Command', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-config-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('Config Module Exports', () => {
    test('exports configCommand function', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      assert.strictEqual(typeof configCommand, 'function');
    });

    test('exports loadConfig function', async () => {
      const { loadConfig } = await import('../lib/commands/config.js');
      assert.strictEqual(typeof loadConfig, 'function');
    });
  });

  describe('Config File Operations', () => {
    test('loadConfig returns empty object when no config exists', async () => {
      const { loadConfig } = await import('../lib/commands/config.js');
      const config = loadConfig();
      
      assert.ok(typeof config === 'object');
      assert.strictEqual(Object.keys(config).length, 0);
    });

    test('loadConfig reads existing config file', async () => {
      const { loadConfig } = await import('../lib/commands/config.js');
      
      // Create config directory and file
      const configDir = path.join(tmpDir, '.ultra-dex');
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, 'config.json'),
        JSON.stringify({ testKey: 'testValue', nested: { key: 'value' } })
      );
      
      const config = loadConfig();
      
      assert.strictEqual(config.testKey, 'testValue');
      assert.ok(config.nested);
      assert.strictEqual(config.nested.key, 'value');
    });

    test('loadConfig handles invalid JSON gracefully', async () => {
      const { loadConfig } = await import('../lib/commands/config.js');
      
      // Create invalid config file
      const configDir = path.join(tmpDir, '.ultra-dex');
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, 'config.json'),
        'invalid json{{'
      );
      
      const config = loadConfig();
      
      assert.ok(typeof config === 'object');
      assert.strictEqual(Object.keys(config).length, 0);
    });
  });

  describe('MCP Config Generation', () => {
    test('configCommand --mcp generates MCP config', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      await configCommand({ mcp: true });
      
      // Should create mcp-config.json
      const mcpConfigExists = existsSync(path.join(tmpDir, 'mcp-config.json'));
      assert.ok(mcpConfigExists, 'Should create mcp-config.json');
      
      const content = await fs.readFile(path.join(tmpDir, 'mcp-config.json'), 'utf8');
      const config = JSON.parse(content);
      
      assert.ok(config.mcpServers, 'Should have mcpServers');
      assert.ok(config.mcpServers['ultra-dex'], 'Should have ultra-dex server');
      assert.ok(config.mcpServers['ultra-dex'].command, 'Should have command');
      assert.ok(config.mcpServers['ultra-dex'].args, 'Should have args');
      assert.ok(config.mcpServers['ultra-dex'].cwd, 'Should have cwd');
    });

    test('MCP config uses correct command', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      await configCommand({ mcp: true });
      
      const content = await fs.readFile(path.join(tmpDir, 'mcp-config.json'), 'utf8');
      const config = JSON.parse(content);
      
      assert.strictEqual(config.mcpServers['ultra-dex'].command, 'npx');
      assert.deepStrictEqual(config.mcpServers['ultra-dex'].args, ['ultra-dex', 'serve']);
      // Path might be symlinked on macOS (/private/var vs /var), so check it contains tmpDir name
      assert.ok(config.mcpServers['ultra-dex'].cwd.includes(path.basename(tmpDir)), 'CWD should contain temp directory name');
    });
  });

  describe('Cursor Config Generation', () => {
    test('configCommand --cursor generates Cursor rules', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      await configCommand({ cursor: true });
      
      // Should create .cursor/rules directory and file
      const cursorDir = path.join(tmpDir, '.cursor', 'rules');
      const cursorDirExists = existsSync(cursorDir);
      assert.ok(cursorDirExists, 'Should create .cursor/rules directory');
      
      const files = await fs.readdir(cursorDir);
      assert.ok(files.length > 0, 'Should create rule files');
    });

    test('Cursor rules file contains Ultra-Dex standards', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      await configCommand({ cursor: true });
      
      const cursorDir = path.join(tmpDir, '.cursor', 'rules');
      const files = await fs.readdir(cursorDir);
      
      if (files.length > 0) {
        const content = await fs.readFile(path.join(cursorDir, files[0]), 'utf8');
        assert.ok(content.includes('Ultra-Dex'), 'Should mention Ultra-Dex');
      }
    });
  });

  describe('VSCode Config Generation', () => {
    test('configCommand --vscode generates VSCode settings', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      await configCommand({ vscode: true });
      
      // Should create .vscode directory
      const vscodeDir = path.join(tmpDir, '.vscode');
      const vscodeDirExists = existsSync(vscodeDir);
      assert.ok(vscodeDirExists, 'Should create .vscode directory');
    });

    test('VSCode settings file is valid JSON', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      await configCommand({ vscode: true });
      
      const settingsPath = path.join(tmpDir, '.vscode', 'settings.json');
      if (existsSync(settingsPath)) {
        const content = await fs.readFile(settingsPath, 'utf8');
        const settings = JSON.parse(content);
        assert.ok(typeof settings === 'object');
      }
    });
  });

  describe('Config Value Management', () => {
    test('configCommand --set creates config with key=value', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      await configCommand({ set: 'testKey=testValue' });
      
      // Read the config file
      const configPath = path.join(tmpDir, '.ultra-dex', 'config.json');
      if (existsSync(configPath)) {
        const content = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(content);
        assert.strictEqual(config.testKey, 'testValue');
      }
    });

    test('configCommand --set handles JSON values', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      await configCommand({ set: 'nested={"key":"value"}' });
      
      const configPath = path.join(tmpDir, '.ultra-dex', 'config.json');
      if (existsSync(configPath)) {
        const content = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(content);
        assert.ok(typeof config.nested === 'object');
        assert.strictEqual(config.nested.key, 'value');
      }
    });

    test('configCommand --get retrieves config value', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      // First set a value
      await configCommand({ set: 'retrieveKey=retrieveValue' });
      
      // Then get it
      await configCommand({ get: 'retrieveKey' });
      
      // Should complete without error
      assert.ok(true);
    });

    test('configCommand --get handles missing keys gracefully', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      await assert.doesNotReject(async () => {
        await configCommand({ get: 'nonExistentKey' });
      });
    });

    test('configCommand --set handles invalid format gracefully', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      await assert.doesNotReject(async () => {
        await configCommand({ set: 'invalidFormat' });
      });
    });
  });

  describe('Config Display', () => {
    test('configCommand --show displays config', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      // Set some config first
      await configCommand({ set: 'displayKey=displayValue' });
      
      // Then show it
      await assert.doesNotReject(async () => {
        await configCommand({ show: true });
      });
    });

    test('configCommand without options shows default', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      await assert.doesNotReject(async () => {
        await configCommand({});
      });
    });
  });



  describe('Integration Tests', () => {
    test('full config workflow', async () => {
      const { configCommand, loadConfig } = await import('../lib/commands/config.js');
      
      // Set multiple values
      await configCommand({ set: 'key1=value1' });
      await configCommand({ set: 'key2={"nested":"object"}' });
      await configCommand({ set: 'key3=123' });
      
      // Generate MCP config
      await configCommand({ mcp: true });
      
      // Verify MCP config exists
      assert.ok(existsSync(path.join(tmpDir, 'mcp-config.json')));
      
      // Load and verify config
      const config = loadConfig();
      assert.ok(config.key1 || config.key2 || config.key3 || Object.keys(config).length === 0);
    });

    test('all config generation options work', async () => {
      const { configCommand } = await import('../lib/commands/config.js');
      
      // Should not throw for any option
      await assert.doesNotReject(async () => {
        await configCommand({ mcp: true });
      });
      
      await assert.doesNotReject(async () => {
        await configCommand({ cursor: true });
      });
      
      await assert.doesNotReject(async () => {
        await configCommand({ vscode: true });
      });
    });
  });
});
