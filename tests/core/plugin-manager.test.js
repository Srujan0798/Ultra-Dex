// Copyright (c) 2026 Ultra-Dex
import { test, describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  PluginManager,
  Plugin,
  PluginStatus,
} from '../../src/core/infrastructure/plugin-manager.js';

describe('PluginManager', () => {
  let manager;
  let tempDir;

  beforeEach(async () => {
    // Create temp directory for test plugins
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-test-'));

    manager = new PluginManager({
      pluginDirs: [tempDir],
      autoDiscover: false,
    });
  });

  afterEach(async () => {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Lifecycle', () => {
    it('should install → activate → deactivate a plugin', async () => {
      // Create a test plugin
      const pluginDir = path.join(tempDir, 'test-plugin');
      await fs.mkdir(pluginDir, { recursive: true });

      await fs.writeFile(
        path.join(pluginDir, 'package.json'),
        JSON.stringify({
          name: '@ultra-dex/plugin-test',
          version: '1.0.0',
          manifest: {
            id: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
          },
        })
      );

      await fs.writeFile(
        path.join(pluginDir, 'index.js'),
        `
        export const name = 'test-plugin';
        export const version = '1.0.0';
        export async function activate(pm) {
          pm.registerHook('test-hook');
        }
        export async function deactivate(pm) {
          // Cleanup
        }
      `
      );

      // Discover
      const discovered = await manager.discoverPlugins();
      assert.strictEqual(discovered.length, 1);
      assert.strictEqual(discovered[0], 'test-plugin');

      // Install
      const installed = await manager.install('test-plugin');
      assert.strictEqual(installed.status, PluginStatus.INSTALLED);

      // Activate
      const activated = await manager.activate('test-plugin');
      assert.strictEqual(activated.status, PluginStatus.ACTIVE);
      assert.ok(activated.activatedAt);
      assert.strictEqual(activated.stats.activations, 1);

      // Deactivate
      const deactivated = await manager.deactivate('test-plugin');
      assert.strictEqual(deactivated.status, PluginStatus.INACTIVE);
      assert.strictEqual(deactivated.stats.deactivations, 1);
    });

    it('should reject invalid plugin (missing required exports)', async () => {
      // Create invalid plugin (missing activate)
      const pluginDir = path.join(tempDir, 'invalid-plugin');
      await fs.mkdir(pluginDir, { recursive: true });

      await fs.writeFile(
        path.join(pluginDir, 'package.json'),
        JSON.stringify({
          name: 'invalid-plugin',
          version: '1.0.0',
          manifest: { id: 'invalid-plugin' },
        })
      );

      await fs.writeFile(
        path.join(pluginDir, 'index.js'),
        `
        export const name = 'invalid-plugin';
        export const version = '1.0.0';
        // Missing activate function
      `
      );

      await manager.discoverPlugins();

      await assert.rejects(
        async () => await manager.install('invalid-plugin'),
        /missing required exports: activate/
      );
    });

    it('should track plugin stats correctly', async () => {
      const pluginDir = path.join(tempDir, 'stats-plugin');
      await fs.mkdir(pluginDir, { recursive: true });

      await fs.writeFile(
        path.join(pluginDir, 'package.json'),
        JSON.stringify({
          name: 'stats-plugin',
          version: '1.0.0',
          manifest: { id: 'stats-plugin' },
        })
      );

      await fs.writeFile(
        path.join(pluginDir, 'index.js'),
        `
        export const name = 'stats-plugin';
        export const version = '1.0.0';
        export async function activate(pm) {
          pm.registerHook('stats-hook');
        }
      `
      );

      await manager.discoverPlugins();
      await manager.install('stats-plugin');
      await manager.activate('stats-plugin');

      const stats = manager.getStats();
      assert.strictEqual(stats.total, 1);
      assert.strictEqual(stats.active, 1);
      assert.strictEqual(stats.discovered, 0); // Now installed
    });
  });

  describe('Hook System', () => {
    it('should invoke beforeTask hooks on task execution', async () => {
      const pluginDir = path.join(tempDir, 'hook-plugin');
      await fs.mkdir(pluginDir, { recursive: true });

      let hookCalled = false;
      let hookContext = null;

      await fs.writeFile(
        path.join(pluginDir, 'package.json'),
        JSON.stringify({
          name: 'hook-plugin',
          version: '1.0.0',
          manifest: { id: 'hook-plugin' },
        })
      );

      await fs.writeFile(
        path.join(pluginDir, 'index.js'),
        `
        export const name = 'hook-plugin';
        export const version = '1.0.0';
        export async function activate(pm) {
          pm.registerHook('before:task');
          pm.attachToHook('before:task', 'hook-plugin', async (context) => {
            context.modified = true;
            return context;
          });
        }
      `
      );

      await manager.discoverPlugins();
      await manager.install('hook-plugin');
      await manager.activate('hook-plugin');

      // Execute hook
      const context = { task: 'test-task' };
      const result = await manager.executeHook('before:task', context);

      assert.strictEqual(result.modified, true);
      assert.strictEqual(result.task, 'test-task');

      // Check stats
      const hookStats = manager.hookStats.get('before:task');
      assert.ok(hookStats);
      assert.strictEqual(hookStats.calls, 1);
    });

    it('should handle hook errors gracefully', async () => {
      const pluginDir = path.join(tempDir, 'error-plugin');
      await fs.mkdir(pluginDir, { recursive: true });

      await fs.writeFile(
        path.join(pluginDir, 'package.json'),
        JSON.stringify({
          name: 'error-plugin',
          version: '1.0.0',
          manifest: { id: 'error-plugin' },
        })
      );

      await fs.writeFile(
        path.join(pluginDir, 'index.js'),
        `
        export const name = 'error-plugin';
        export const version = '1.0.0';
        export async function activate(pm) {
          pm.registerHook('error-hook');
          pm.attachToHook('error-hook', 'error-plugin', async (context) => {
            throw new Error('Hook failed intentionally');
          });
        }
      `
      );

      await manager.discoverPlugins();
      await manager.install('error-plugin');
      await manager.activate('error-plugin');

      // Execute hook - should not throw
      const context = { test: true };
      const result = await manager.executeHook('error-hook', context);

      // Context should be returned unchanged
      assert.strictEqual(result.test, true);

      // Error should be tracked in stats
      const hookStats = manager.hookStats.get('error-hook');
      assert.strictEqual(hookStats.errors, 1);

      // Plugin should track error
      const plugin = manager.plugins.get('error-plugin');
      assert.strictEqual(plugin.stats.errors, 1);
    });

    it('should unregister hooks on deactivation', async () => {
      const pluginDir = path.join(tempDir, 'unregister-plugin');
      await fs.mkdir(pluginDir, { recursive: true });

      await fs.writeFile(
        path.join(pluginDir, 'package.json'),
        JSON.stringify({
          name: 'unregister-plugin',
          version: '1.0.0',
          manifest: { id: 'unregister-plugin' },
        })
      );

      await fs.writeFile(
        path.join(pluginDir, 'index.js'),
        `
        export const name = 'unregister-plugin';
        export const version = '1.0.0';
        export async function activate(pm) {
          pm.registerHook('cleanup-hook');
          pm.attachToHook('cleanup-hook', 'unregister-plugin', async (ctx) => ctx);
        }
      `
      );

      await manager.discoverPlugins();
      await manager.install('unregister-plugin');
      await manager.activate('unregister-plugin');

      // Verify hook registered
      let handlers = manager.hooks.get('cleanup-hook');
      assert.strictEqual(handlers.length, 1);

      // Deactivate
      await manager.deactivate('unregister-plugin');

      // Hook should be unregistered
      handlers = manager.hooks.get('cleanup-hook');
      assert.strictEqual(handlers.length, 0);
    });
  });

  describe('Discovery', () => {
    it('should discover plugins from multiple directories', async () => {
      const dir1 = path.join(tempDir, 'dir1');
      const dir2 = path.join(tempDir, 'dir2');
      await fs.mkdir(dir1, { recursive: true });
      await fs.mkdir(dir2, { recursive: true });

      // Create plugin in dir1
      const plugin1Dir = path.join(dir1, 'plugin-one');
      await fs.mkdir(plugin1Dir, { recursive: true });
      await fs.writeFile(
        path.join(plugin1Dir, 'package.json'),
        JSON.stringify({
          name: 'plugin-one',
          version: '1.0.0',
          manifest: { id: 'plugin-one' },
        })
      );
      await fs.writeFile(
        path.join(plugin1Dir, 'index.js'),
        'export const name="plugin-one"; export const version="1.0.0"; export async function activate() {}'
      );

      // Create plugin in dir2
      const plugin2Dir = path.join(dir2, 'plugin-two');
      await fs.mkdir(plugin2Dir, { recursive: true });
      await fs.writeFile(
        path.join(plugin2Dir, 'package.json'),
        JSON.stringify({
          name: 'plugin-two',
          version: '1.0.0',
          manifest: { id: 'plugin-two' },
        })
      );
      await fs.writeFile(
        path.join(plugin2Dir, 'index.js'),
        'export const name="plugin-two"; export const version="1.0.0"; export async function activate() {}'
      );

      // Create manager with multiple directories
      const multiManager = new PluginManager({
        pluginDirs: [dir1, dir2],
        autoDiscover: false,
      });

      const discovered = await multiManager.discoverPlugins();
      assert.strictEqual(discovered.length, 2);
      assert.ok(discovered.includes('plugin-one'));
      assert.ok(discovered.includes('plugin-two'));
    });

    it('should skip invalid plugin directories', async () => {
      // Create valid plugin
      const validDir = path.join(tempDir, 'valid-plugin');
      await fs.mkdir(validDir, { recursive: true });
      await fs.writeFile(
        path.join(validDir, 'package.json'),
        JSON.stringify({
          name: 'valid-plugin',
          version: '1.0.0',
          manifest: { id: 'valid-plugin' },
        })
      );
      await fs.writeFile(path.join(validDir, 'index.js'), '');

      // Create invalid plugin (no index.js)
      const invalidDir = path.join(tempDir, 'invalid-plugin');
      await fs.mkdir(invalidDir, { recursive: true });
      await fs.writeFile(
        path.join(invalidDir, 'package.json'),
        JSON.stringify({ name: 'invalid-plugin' })
      );

      const discovered = await manager.discoverPlugins();
      assert.strictEqual(discovered.length, 1);
      assert.strictEqual(discovered[0], 'valid-plugin');
    });
  });

  describe('List and Stats', () => {
    it('should list all plugins with their status', async () => {
      // Create two plugins
      for (const name of ['plugin-a', 'plugin-b']) {
        const dir = path.join(tempDir, name);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(
          path.join(dir, 'package.json'),
          JSON.stringify({
            name,
            version: '1.0.0',
            manifest: { id: name },
          })
        );
        await fs.writeFile(
          path.join(dir, 'index.js'),
          `export const name="${name}"; export const version="1.0.0"; export async function activate() {}`
        );
      }

      await manager.discoverPlugins();

      const list = manager.list();
      assert.strictEqual(list.length, 2);
      assert.ok(list.find((p) => p.id === 'plugin-a'));
      assert.ok(list.find((p) => p.id === 'plugin-b'));
    });

    it('should provide dashboard data', async () => {
      const pluginDir = path.join(tempDir, 'dash-plugin');
      await fs.mkdir(pluginDir, { recursive: true });
      await fs.writeFile(
        path.join(pluginDir, 'package.json'),
        JSON.stringify({
          name: 'dash-plugin',
          version: '2.0.0',
          manifest: { id: 'dash-plugin', name: 'Dashboard Plugin' },
        })
      );
      await fs.writeFile(
        path.join(pluginDir, 'index.js'),
        'export const name="dash-plugin"; export const version="2.0.0"; export async function activate() {}'
      );

      await manager.discoverPlugins();
      await manager.install('dash-plugin');

      const dashboard = manager.getDashboard();
      assert.ok(dashboard.plugins);
      assert.strictEqual(dashboard.plugins.length, 1);
      assert.strictEqual(dashboard.plugins[0].name, 'Dashboard Plugin');
      assert.ok(dashboard.stats);
      assert.ok(dashboard.hooks);
    });
  });

  describe('Uninstall', () => {
    it('should uninstall a plugin completely', async () => {
      const pluginDir = path.join(tempDir, 'remove-plugin');
      await fs.mkdir(pluginDir, { recursive: true });
      await fs.writeFile(
        path.join(pluginDir, 'package.json'),
        JSON.stringify({
          name: 'remove-plugin',
          version: '1.0.0',
          manifest: { id: 'remove-plugin' },
        })
      );
      await fs.writeFile(
        path.join(pluginDir, 'index.js'),
        'export const name="remove-plugin"; export const version="1.0.0"; export async function activate() {}'
      );

      await manager.discoverPlugins();
      await manager.install('remove-plugin');
      await manager.activate('remove-plugin');

      assert.ok(manager.plugins.has('remove-plugin'));

      await manager.uninstall('remove-plugin');

      assert.strictEqual(manager.plugins.has('remove-plugin'), false);
    });
  });
});

describe('Plugin', () => {
  it('should create a Plugin instance with correct properties', () => {
    const metadata = {
      id: 'test',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
      author: 'Test Author',
      entryPoint: 'index.js',
    };

    const plugin = new Plugin(metadata);

    assert.strictEqual(plugin.id, 'test');
    assert.strictEqual(plugin.name, 'Test Plugin');
    assert.strictEqual(plugin.version, '1.0.0');
    assert.strictEqual(plugin.status, PluginStatus.DISCOVERED);
    assert.strictEqual(plugin.stats.activations, 0);
  });

  it('should provide dashboard data', () => {
    const metadata = {
      id: 'dash-test',
      name: 'Dashboard Test',
      version: '1.0.0',
    };

    const plugin = new Plugin(metadata);
    plugin.status = PluginStatus.ACTIVE;
    plugin.activatedAt = '2026-01-01T00:00:00Z';
    plugin.stats.activations = 5;

    const dashboard = plugin.getDashboard();

    assert.strictEqual(dashboard.id, 'dash-test');
    assert.strictEqual(dashboard.status, PluginStatus.ACTIVE);
    assert.strictEqual(dashboard.stats.activations, 5);
  });
});
