import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { Command } from 'commander';
import { registerPluginCommand } from '../../apps/cli/lib/commands/plugin.js';
import { createPluginScaffold } from '../../apps/cli/lib/commands/plugin-create.js';

describe('CLI Command: plugin', () => {
  test('registers plugin command tree', () => {
    const program = new Command();
    registerPluginCommand(program);

    const pluginCmd = program.commands.find((cmd) => cmd.name() === 'plugin');
    assert.ok(pluginCmd, 'plugin command should be registered');

    const subcommands = pluginCmd.commands.map((cmd) => cmd.name()).sort();
    assert.deepStrictEqual(subcommands, ['create', 'info', 'install', 'list', 'publish', 'uninstall', 'update']);
  });

  test('createPluginScaffold creates expected files', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-plugin-test-'));
    try {
      const result = await createPluginScaffold('demo-plugin', {
        dir: tempDir,
        yes: true,
        description: 'Demo plugin',
        author: 'test-suite',
      });

      const root = result.targetDir;
      const paths = [
        path.join(root, 'agent.json'),
        path.join(root, 'prompt.md'),
        path.join(root, 'tools', '.gitkeep'),
        path.join(root, 'tests', '.gitkeep'),
      ];

      for (const p of paths) {
        const exists = await fs
          .access(p)
          .then(() => true)
          .catch(() => false);
        assert.ok(exists, `Expected scaffold file to exist: ${p}`);
      }

      const manifest = JSON.parse(await fs.readFile(path.join(root, 'agent.json'), 'utf8'));
      assert.strictEqual(manifest.name, 'demo-plugin');
      assert.strictEqual(manifest.description, 'Demo plugin');
      assert.strictEqual(manifest.author, 'test-suite');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

