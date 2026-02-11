// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Mcp Host module
 * @module commands/mcp-host
 */

import chalk from 'chalk';
import { initializeMcpHost, mcpHub } from '../mcp/host.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

export function registerMcpHostCommand(program) {
  const cmd = program.command('mcp-host').description('Manage MCP host connections');

  cmd
    .command('mount <server>')
    .description('Connect to an MCP server')
    .action(async (server) => {
      try {
        await mcpHub.connect(server);
        await mcpHub.saveState();
        printSuccess(chalk.green(`✅ Mounted ${server}`));
      } catch (error) {
        printError(chalk.red(`Mount failed: ${error.message}`));
      }
    });

  cmd
    .command('unmount <server>')
    .description('Disconnect from an MCP server')
    .action(async (server) => {
      try {
        await mcpHub.disconnect(server);
        await mcpHub.saveState();
        printSuccess(chalk.green(`✅ Unmounted ${server}`));
      } catch (error) {
        printError(chalk.red(`Unmount failed: ${error.message}`));
      }
    });

  cmd
    .command('list')
    .description('List connected MCP servers')
    .action(async () => {
      const status = mcpHub.getStatus();
      if (!status.length) {
        printWarning(chalk.yellow('No MCP servers connected.'));
        return;
      }
      status.forEach((s) => printInfo(`- ${s.name} (${s.status})`));
    });

  cmd
    .command('init')
    .description('Initialize MCP host connections from config')
    .action(async () => {
      const result = await initializeMcpHost();
      if (result.connected.length === 0) {
        printWarning(chalk.yellow('No MCP servers connected.'));
      } else {
        printSuccess(chalk.green(`✅ Connected: ${result.connected.join(', ')}`));
      }
      if (result.failures.length) {
        printWarning(chalk.yellow('Failures:'));
        result.failures.forEach((f) => printWarning(`- ${f.server}: ${f.error}`));
      }
    });
}
