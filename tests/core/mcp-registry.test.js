import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { MCPRegistry } from '../../src/core/mcp/registry.js';

describe('MCPRegistry', () => {
  let tempDir;
  let pluginsDir;
  let pluginDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-mcp-'));
    pluginsDir = path.join(tempDir, 'plugins');
    pluginDir = path.join(pluginsDir, 'demo-plugin');
    await fs.mkdir(pluginDir, { recursive: true });
    await fs.writeFile(
      path.join(pluginDir, 'package.json'),
      JSON.stringify(
        {
          name: '@ultra-dex/plugin-demo-plugin',
          version: '1.0.0',
          description: 'Demo MCP plugin',
          ultraDex: { id: 'demo-plugin' },
        },
        null,
        2
      )
    );
    await fs.writeFile(
      path.join(pluginDir, 'index.js'),
      `
        export const name = 'demo-plugin';
        export const version = '1.0.0';
        export async function activate(pluginManager) {
          pluginManager.registerHook('beforeTask');
        }
        export async function deactivate() {}
      `
    );
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('publishes, installs, loads, and uninstalls plugins', async () => {
    const registry = new MCPRegistry({
      dataDir: path.join(tempDir, '.ultra-dex', 'mcp'),
      registryFile: path.join(tempDir, '.ultra-dex', 'mcp', 'registry.json'),
      pluginManagerOptions: {
        pluginDirs: [pluginsDir],
        autoDiscover: false,
      },
    });

    const manifest = await registry.publish(pluginDir);
    assert.strictEqual(manifest.id, 'demo-plugin');

    const discovered = await registry.discover({ query: 'demo' });
    assert.strictEqual(discovered.length, 1);

    const installed = await registry.install('demo-plugin');
    assert.strictEqual(installed.id, 'demo-plugin');

    const active = await registry.load('demo-plugin');
    assert.strictEqual(active.status, 'active');

    const listed = registry.list();
    assert.strictEqual(listed.length, 1);
    assert.strictEqual(listed[0].installed, true);

    await registry.unload('demo-plugin');
    await registry.uninstall('demo-plugin');
    assert.strictEqual(registry.list().length, 0);
  });
});
