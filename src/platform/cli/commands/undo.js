// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Universal Undo Command
 * Roll back recent file operations and prune agent memory.
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { historyManager } from '../history/undo.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

export function registerUndoCommand(program) {
  const undo = program
    .command('undo')
    .description('Revert recent file system operations and memory')
    .option('-s, --steps <n>', 'Number of operations to undo', '1')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      try {
        const steps = parseInt(options.steps, 10);
        if (Number.isNaN(steps) || steps < 1) {
          printError(chalk.red('Steps must be a positive integer.'));
          return;
        }

        const result = await historyManager.undo(steps);
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        if (!result.reverted.length) {
          printWarning(chalk.yellow('No operations to undo.'));
          return;
        }

        printSuccess(chalk.green(`✅ Undid ${result.reverted.length} operation(s).`));
        if (result.cutoff) {
          printInfo(chalk.gray(`Memory pruned after ${result.cutoff}`));
        }
      } catch (error) {
        await handleError(error, { command: 'undo', options });
      }
    });

  undo
    .command('list')
    .description('List recent operations')
    .option('-l, --limit <n>', 'Number of entries to show', '20')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      try {
        const limit = parseInt(options.limit, 10);
        const list = await historyManager.list(limit);

        if (options.json) {
          console.log(JSON.stringify(list, null, 2));
          return;
        }

        if (list.length === 0) {
          printWarning(chalk.yellow('No history entries found.'));
          return;
        }

        const table = new Table({
          head: ['Index', 'Type', 'File', 'Timestamp', 'Actor'],
          style: { head: ['cyan'] },
        });

        list.forEach((entry, index) => {
          table.push([
            index,
            entry.type,
            entry.filePath,
            new Date(entry.timestamp).toLocaleString(),
            entry.actor || '-',
          ]);
        });

        printInfo(table.toString());
      } catch (error) {
        await handleError(error, { command: 'undo list', options });
      }
    });

  undo
    .command('scrub')
    .description('Revert to a specific point in time')
    .option('--id <id>', 'Operation ID to revert back to')
    .option('--timestamp <iso>', 'ISO timestamp to revert back to')
    .option('--index <n>', 'History index to revert back to (0-based)')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      try {
        const index = options.index !== undefined ? parseInt(options.index, 10) : undefined;
        const result = await historyManager.undoTo({
          id: options.id,
          timestamp: options.timestamp,
          index: Number.isNaN(index) ? undefined : index,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        if (!result.reverted.length) {
          printWarning(chalk.yellow('No operations were reverted for the requested target.'));
          return;
        }

        printSuccess(chalk.green(`✅ Reverted ${result.reverted.length} operation(s).`));
        if (result.cutoff) {
          printInfo(chalk.gray(`Memory pruned after ${result.cutoff}`));
        }
      } catch (error) {
        await handleError(error, { command: 'undo scrub', options });
      }
    });
}

export default { registerUndoCommand };
