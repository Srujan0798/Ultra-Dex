// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Mcp Remote module
 * @module commands/mcp-remote
 */

import chalk from 'chalk';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { configManager } from '../utils/config-manager.js';

export function registerMcpRemoteCommand(program) {
  const remote = program.command('mcp-remote').description('Remote MCP server and sync');

  remote
    .command('start')
    .description('Start remote MCP server')
    .option('--port <port>', 'Port', '4000')
    .action(async (options) => {
      const port = parseInt(options.port, 10) || 4000;
      const { startRemoteServer } = await import('../mcp/remote/server.js');
      startRemoteServer({ port });
      printSuccess(chalk.green(`✅ Remote MCP server started on port ${port}`));
    });

  remote
    .command('key')
    .description('Generate API key for remote MCP')
    .option('--label <label>', 'Key label', 'remote')
    .action(async (options) => {
      const { generateApiKey } = await import('../mcp/remote/auth.js');
      const key = await generateApiKey(options.label);
      printSuccess(chalk.green(`\n✅ API Key: ${key}\n`));
    });

  remote
    .command('connect <url>')
    .description('Connect to remote MCP server')
    .option('--key <key>', 'API key')
    .action(async (url, options) => {
      try {
        const { RemoteMCPClient } = await import('../mcp/remote/client.js');
        const apiKey = options.key || process.env.ULTRA_DEX_REMOTE_KEY;
        if (!apiKey) {
          printError(chalk.red('API key required (--key or ULTRA_DEX_REMOTE_KEY).'));
          return;
        }
        const client = new RemoteMCPClient({ url, apiKey });
        await client.connect();
        await client.pushContext();
        const config = (await configManager.loadGlobal()) || {};
        config.remote = { url, apiKey };
        await configManager.saveGlobal(config);
        printSuccess(chalk.green('✅ Connected and synced context.'));
      } catch (error) {
        printError(chalk.red(`Connect failed: ${error.message}`));
      }
    });

  remote
    .command('disconnect')
    .description('Disconnect from remote MCP server')
    .action(async () => {
      const config = await configManager.loadGlobal();
      if (config?.remote) {
        config.remote = null;
        await configManager.saveGlobal(config);
      }
      printSuccess(chalk.green('✅ Disconnected.'));
    });

  remote
    .command('status')
    .description('Show remote MCP status')
    .action(async () => {
      const config = await configManager.loadGlobal();
      if (!config?.remote?.url) {
        printWarning(chalk.yellow('No remote connection configured.'));
        return;
      }
      printInfo(chalk.cyan(`Remote MCP: ${config.remote.url}`));
    });

  remote
    .command('sync')
    .description('Push local context to remote')
    .action(async () => {
      const config = await configManager.loadGlobal();
      if (!config?.remote?.url || !config?.remote?.apiKey) {
        printWarning(chalk.yellow('No remote connection configured.'));
        return;
      }
      const { RemoteMCPClient } = await import('../mcp/remote/client.js');
      const client = new RemoteMCPClient({ url: config.remote.url, apiKey: config.remote.apiKey });
      await client.connect();
      await client.pushContext();
      client.disconnect();
      printSuccess(chalk.green('✅ Context synced.'));
    });
}
