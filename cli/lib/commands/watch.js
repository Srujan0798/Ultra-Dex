// cli/lib/commands/watch.js
import chalk from 'chalk';
import { watch } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';
import { updateStateFile, computeState } from './state.js';
import { execSync } from 'child_process';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError } from '../utils/errors.js';

async function calculateAlignmentScore() {
  const state = await computeState();
  return state.score || 0;
}

/**
 * Register the watch command with Commander
 */
export function registerWatchCommand(program) {
    program
      .command('watch')
      .description('Auto-update state on file changes')
      .option('--interval <ms>', 'Debounce interval in milliseconds', '500')
      .option('--sync', 'Auto-sync CONTEXT.md with brain', false)
      .action(async (options) => {
          try {
              await watchCommand(options);
          } catch (error) {
              await handleError(error, { command: 'watch', options });
              process.exit(error.exitCode || 1);
          }
      });
}

export async function watchCommand(options) {
  printInfo(chalk.cyan.bold('\n👁️  Ultra-Dex Watch Mode v3.1 (Auto-Sync Edition)\n'));
  
  const interval = options.interval ? parseInt(options.interval, 10) : 500;
  printInfo(chalk.gray(`Debounce interval: ${interval}ms`));

  const autoSync = options.sync || false;
  if (autoSync) {
    printSuccess('🔄 Auto-sync enabled: CONTEXT.md will update automatically\n');
  }

  const watchPaths = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'src', 'app', 'lib'];
  const validPaths = watchPaths.filter(p => existsSync(join(process.cwd(), p)));

  printInfo(chalk.gray(`Watching: ${validPaths.join(', ')}\n`));

  let debounceTimer = null;
  let lastScore = await calculateAlignmentScore();
  printInfo(chalk.blue(`📊 Initial alignment score: ${lastScore}%\n`));

  validPaths.forEach(path => {
    const fullPath = join(process.cwd(), path);
    try {
      watch(fullPath, { recursive: true }, (eventType, filename) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          const timestamp = new Date().toLocaleTimeString();
          printInfo(chalk.yellow(`\n[${timestamp}] 📝 ${filename || path} changed`));

          await updateStateFile();

          if (autoSync && !filename?.includes('CONTEXT.md') && !filename?.includes('.md')) {
            printInfo('🔄 Auto-syncing CONTEXT.md...');
            try {
              execSync('npx ultra-dex sync --brain', { stdio: 'pipe', timeout: 30000 });
              printSuccess('   ✅ CONTEXT.md synced with brain');
            } catch (e) {
              printWarning('   ⚠️  Auto-sync skipped or failed');
            }
          }

          const newScore = await calculateAlignmentScore();
          const scoreDiff = newScore - lastScore;
          const diffIndicator = scoreDiff > 0 ? chalk.green(`↑ +${scoreDiff}`) : scoreDiff < 0 ? chalk.red(`↓ ${scoreDiff}`) : chalk.gray('→ 0');

          lastScore = newScore;
          const scoreColor = newScore >= 80 ? chalk.green : newScore >= 50 ? chalk.yellow : chalk.red;
          printInfo(scoreColor(`✅ State updated | Alignment: ${newScore}% `) + diffIndicator);

        }, interval);
      });
    } catch (e) {
        printWarning(`  ⚠️  Cannot watch ${path}: ${e.message}`);
    }
  });

  printInfo(chalk.gray('\nPress Ctrl+C to stop'));
  process.stdin.resume();
}