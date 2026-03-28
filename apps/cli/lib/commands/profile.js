// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Profile module
 * @module commands/profile
 */

import chalk from 'chalk';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { profileCommand, showReport, clearMetrics } from '../utils/profiler.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';

export function registerProfileCommand(program) {
  const cmd = program.command('profile').description('Performance profiler');

  cmd
    .argument('<command...>', 'Command to profile (e.g. generate "task")')
    .option('--report', 'Only show the last report')
    .action(async (commandParts, options) => {
      if (options.report) {
        showReport();
        return;
      }

      const [command, ...args] = commandParts;
      if (!command) {
        printError(chalk.red('No command provided.'));
        return;
      }

      await profileCommand(`${command} ${args.join(' ')}`.trim(), async () => {
        await new Promise((resolve, reject) => {
          const __filename = fileURLToPath(import.meta.url);
          const __dirname = path.dirname(__filename);
          const cliEntry = path.resolve(__dirname, '../../bin/ultra-dex.js');

          const child = spawn(process.execPath, [cliEntry, command, ...args], { stdio: 'inherit' });

          child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Command failed with exit code ${code}`));
          });
        });
      });

      printSuccess(chalk.green('✅ Profile complete.'));
    });

  cmd
    .command('report')
    .description('Show performance report')
    .action(() => {
      showReport();
    });

  cmd
    .command('clear')
    .description('Clear recorded metrics')
    .action(() => {
      clearMetrics();
      printInfo('Metrics cleared.');
    });
}

/**
 * Safe execution wrapper with error handling for profile
 * @param {Function} fn - Async function to execute
 * @param {string} [context='profile'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'profile') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
