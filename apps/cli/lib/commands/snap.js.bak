// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Snap module
 * @module commands/snap
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { snapProgress } from '../utils/snap-progress.js';
import { handleError } from '../utils/error-handler.js';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

const DEFAULT_TARGETS = ['node_modules', 'dist', '.next'];

export function registerSnapCommand(program) {
  program
    .command('snap')
    .description('Clean build artifacts with a Thanos snap')
    .option('-t, --targets <list>', 'Comma-separated list of folders to remove')
    .option('--dry-run', 'Show what would be deleted')
    .action(async (options) => {
      try {
        const targets = options.targets
          ? options.targets
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : DEFAULT_TARGETS;

        const resolved = targets.map((t) => path.resolve(process.cwd(), t));

        if (options.dryRun) {
          printInfo(chalk.cyan('Snap dry run:'));
          resolved.forEach((t) => printInfo(`  • ${t}`));
          return;
        }

        printWarning(chalk.yellow('🫰 Executing snap...'));
        await snapProgress();

        for (const target of resolved) {
          await fs.rm(target, { recursive: true, force: true });
          printSuccess(`✅ Removed ${target}`);
        }

        printSuccess('All artifacts cleared. Half the files remain... just kidding.');
      } catch (error) {
        await handleError(error, { command: 'snap', options });
        process.exitCode = 1;
      }
    });
}

export default { registerSnapCommand };
