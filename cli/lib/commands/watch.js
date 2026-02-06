// Copyright (c) 2026 Ultra-Dex

// cli/lib/commands/watch.js
import chalk from 'chalk';
import chokidar from 'chokidar';
import { join, relative } from 'path';
import { existsSync } from 'fs';
import { updateStateFile, computeState } from './state.js';
import { syncContextWithDiff } from './sync.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';

async function calculateAlignmentScore() {
  const state = await computeState();
  return state.score || 0;
}

/**
 * Register the watch command with Commander
 */
export function registerWatchCommand(program) {
  const watchCmd = program
    .command('watch')
    .description('Auto-update state on file changes')
    .option(
      '--interval <ms>',
      'Debounce interval in milliseconds (deprecated, use --debounce)',
      '500'
    )
    .option('--debounce <ms>', 'Debounce interval in milliseconds', '500')
    .option('--ignore <globs>', 'Comma-separated glob patterns to ignore')
    .option('--sync', 'Auto-sync CONTEXT.md with brain', false)
    .action(async (options) => {
      try {
        await watchCommand(options);
      } catch (error) {
        await handleError(error, { command: 'watch', options });
        process.exit(error.exitCode || 1);
      }
    });

  watchCmd._examples = [
    { command: 'ultra-dex watch', description: 'Watch project and update state on changes' },
    { command: 'ultra-dex watch --interval 1000', description: 'Use a 1s debounce interval' },
    { command: 'ultra-dex watch --sync', description: 'Auto-sync CONTEXT.md on code changes' },
  ];
}

export async function watchCommand(options) {
  printInfo(chalk.cyan.bold('\n👁️  Ultra-Dex Watch Mode v3.1 (Auto-Sync Edition)\n'));

  const debounce = options.debounce ?? options.interval ?? '500';
  const interval = parseInt(debounce, 10);
  if (Number.isNaN(interval) || interval < 50) {
    throw new ValidationError('Invalid debounce interval. Use a value >= 50ms.');
  }
  printInfo(chalk.gray(`Debounce interval: ${interval}ms`));

  const autoSync = options.sync || false;
  if (autoSync) {
    printSuccess('🔄 Auto-sync enabled: CONTEXT.md will update automatically\n');
  }

  const watchPaths = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'src', 'app', 'lib'];
  const validPaths = watchPaths.filter((p) => existsSync(join(process.cwd(), p)));

  if (validPaths.length === 0) {
    printWarning('No watchable paths found. Ensure CONTEXT.md or src/app/lib exists.');
    return;
  }

  printInfo(chalk.gray(`Watching: ${validPaths.join(', ')}\n`));

  const defaultIgnores = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/.ultra-dex/**',
    '**/.next/**',
    '**/coverage/**',
  ];
  const extraIgnores = options.ignore
    ? options.ignore
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
    : [];
  const ignorePatterns = [...defaultIgnores, ...extraIgnores];

  let debounceTimer = null;
  let lastScore = await calculateAlignmentScore();
  printInfo(chalk.blue(`📊 Initial alignment score: ${lastScore}%\n`));

  try {
    const watcher = chokidar.watch(validPaths, {
      ignored: ignorePatterns,
      ignoreInitial: true,
      persistent: true,
    });

    const handleChange = async (filePath) => {
      const timestamp = new Date().toLocaleTimeString();
      const relativePath = relative(process.cwd(), filePath);
      printInfo(chalk.yellow(`\n[${timestamp}] 📝 ${relativePath} changed`));

      await updateStateFile();

      if (autoSync && !relativePath.includes('CONTEXT.md')) {
        printInfo('🔄 Auto-syncing CONTEXT.md...');
        try {
          const syncResult = await syncContextWithDiff(process.cwd(), relativePath);
          printSuccess('   ✅ CONTEXT.md synced');
          if (syncResult?.summary) {
            printInfo(
              chalk.gray(
                `   📊 Files: ${syncResult.summary.fileCount} | App: ${syncResult.summary.appCount} | API: ${syncResult.summary.apiCount}`
              )
            );
          }
        } catch (e) {
          printWarning('   ⚠️  Auto-sync skipped or failed');
        }
      }

      const newScore = await calculateAlignmentScore();
      const scoreDiff = newScore - lastScore;
      const diffIndicator =
        scoreDiff > 0
          ? chalk.green(`↑ +${scoreDiff}`)
          : scoreDiff < 0
            ? chalk.red(`↓ ${scoreDiff}`)
            : chalk.gray('→ 0');

      lastScore = newScore;
      const scoreColor = newScore >= 80 ? chalk.green : newScore >= 50 ? chalk.yellow : chalk.red;
      printInfo(scoreColor(`✅ State updated | Alignment: ${newScore}% `) + diffIndicator);
    };

    watcher.on('all', (_event, filePath) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        handleChange(filePath).catch((err) => {
          printWarning(`⚠️  Watch handler error: ${err.message}`);
        });
      }, interval);
    });
  } catch (e) {
    printWarning(`  ⚠️  Cannot start watcher: ${e.message}`);
  }

  printInfo(chalk.gray('\nPress Ctrl+C to stop'));
  process.stdin.resume();
}
