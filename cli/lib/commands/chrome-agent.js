// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Chrome Agent module
 * @module commands/chrome-agent
 */

import chalk from 'chalk';
import { ChromeAgentsClient } from '../browser/chrome-agents.js';
import { scaffoldChromeExtension } from '../browser/extension-scaffold.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';

export function registerChromeAgentCommand(program) {
  const cmd = program
    .command('chrome-agent')
    .description('Chrome Agent tools');

  cmd
    .command('run <task>')
    .description('Run Chrome Agents API task')
    .option('--type <type>', 'Task type', 'general')
    .action(async (task, options) => {
      try {
        const client = new ChromeAgentsClient();
        const result = await client.submitTask(task, options);
        printSuccess(chalk.green(`\n✅ Submitted Chrome agent task (${result.id})\n`));
        printInfo(JSON.stringify(result.payload, null, 2));
      } catch (error) {
        printError(chalk.red(`Chrome agent failed: ${error.message}`));
      }
    });

  cmd
    .command('init')
    .description('Scaffold a new Chrome Extension (Manifest V3)')
    .option('-d, --dir <directory>', 'Target directory', 'my-extension')
    .action(async (options) => {
      try {
        await scaffoldChromeExtension(options.dir);
      } catch (error) {
        printError(chalk.red(`Scaffold failed: ${error.message}`));
      }
    });
}