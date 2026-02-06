// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { snapProgress } from '../utils/snap-progress.js';
import { validateSafePath } from '../utils/validation.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

const DEFAULT_TARGETS = ['node_modules', 'dist', 'build', '.next', 'coverage', '.turbo', '.cache'];

export function registerCleanCommand(program) {
  program
    .command('clean')
    .description('Remove build artifacts and caches')
    .option('-t, --targets <list>', 'Comma-separated list of folders to remove')
    .option('--dry-run', 'Show what would be deleted')
    .option('--snap', 'Use Thanos snap animation')
    .action(async (options) => {
      try {
        const targets = options.targets
          ? options.targets
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : DEFAULT_TARGETS;

        for (const target of targets) {
          const validation = validateSafePath(target, 'Target path');
          if (validation !== true) {
            printError(chalk.red(validation));
            process.exitCode = 1;
            return;
          }
        }

        const resolved = targets.map((t) => path.resolve(process.cwd(), t));

        if (options.dryRun) {
          printInfo(chalk.cyan('Clean dry run:'));
          resolved.forEach((t) => printInfo(`  • ${t}`));
          return;
        }

        if (options.snap) {
          printWarning(chalk.yellow('🫰 Executing snap...'));
          await snapProgress();
        }

        for (const target of resolved) {
          await fs.rm(target, { recursive: true, force: true });
          printSuccess(`✅ Removed ${target}`);
        }

        printSuccess('Cleanup complete.');
      } catch (error) {
        await handleError(error, { command: 'clean', options });
        process.exitCode = 1;
      }
    });
}

export default { registerCleanCommand };
