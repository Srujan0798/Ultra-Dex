import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Command } from 'commander';
import { registerMcpCommand } from '../../apps/cli/lib/commands/mcp.js';

describe('MCP CLI command', () => {
  it('wires search and install flows through injected factories', async () => {
    const calls = [];
    const registry = {
      async install(pluginId, version) {
        calls.push(['install', pluginId, version]);
      },
      async load(pluginId) {
        calls.push(['load', pluginId]);
      },
      list() {
        return [{ id: 'jira', status: 'active', version: '1.0.0' }];
      },
      async initialize() {},
      async discover() {
        return [{ id: 'jira' }];
      },
    };
    const marketplace = {
      async search(query) {
        calls.push(['search', query]);
        return [{ id: 'jira', version: '1.0.0', description: 'Jira' }];
      },
      async getPlugin(pluginId) {
        calls.push(['info', pluginId]);
        return { id: pluginId };
      },
    };

    const program = new Command();
    registerMcpCommand(program, {
      createRegistry: async () => registry,
      createMarketplace: () => marketplace,
    });

    await program.parseAsync(['mcp', 'search', 'jira'], { from: 'user' });
    await program.parseAsync(['mcp', 'install', 'jira', '--version', '1.0.0'], { from: 'user' });

    assert.deepStrictEqual(calls, [
      ['search', 'jira'],
      ['install', 'jira', '1.0.0'],
      ['load', 'jira'],
    ]);
  });
});
