// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import { startStdioServer } from '../mcp/server.js';
import { listTools, listResources } from '../mcp/registry.js';
import { printInfo, printSuccess } from '../utils/output.js';

export function registerMcpCommand(program) {
  const mcp = program.command('mcp').description('MCP server utilities');

  mcp
    .command('start')
    .description('Start MCP server in stdio mode')
    .action(async () => {
      await startStdioServer();
    });

  mcp
    .command('list')
    .description('List registered MCP tools/resources')
    .action(() => {
      const tools = listTools();
      const resources = listResources();
      printInfo(chalk.cyan('\nMCP Tools\n'));
      tools.forEach((t) => printInfo(`- ${t.name}`));
      printInfo(chalk.cyan('\nMCP Resources\n'));
      resources.forEach((r) => printInfo(`- ${r.name}`));
      printSuccess(chalk.green('\nDone.'));
    });
}

export default { registerMcpCommand };
