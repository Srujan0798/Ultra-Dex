// cli/lib/commands/watch.js
import chalk from 'chalk';
import { watch } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';
import { updateStateFile, computeState } from './state.js';
import { execSync } from 'child_process';

async function calculateAlignmentScore() {
  const state = await computeState();
  return state.score || 0;
}

export function watchCommand(options) {
  console.log(chalk.cyan.bold('\n👁️  Ultra-Dex Watch Mode v3.1 (Auto-Sync Edition)\n'));
  console.log(chalk.gray('Watching for file changes...\n'));

  const interval = options.interval ? parseInt(options.interval, 10) : 500;
  console.log(chalk.gray(`Debounce interval: ${interval}ms`));

  // Auto-sync configuration
  const autoSync = options.sync || false;
  const syncInterval = options.syncInterval ? parseInt(options.syncInterval, 10) : 5000;
  
  if (autoSync) {
    console.log(chalk.green('🔄 Auto-sync enabled: CONTEXT.md will update automatically'));
    console.log(chalk.gray(`   Sync interval: ${syncInterval}ms\n`));
  }

  const watchPaths = [
    'CONTEXT.md',
    'IMPLEMENTATION-PLAN.md',
    'src',
    'app',
    'lib'
  ];

  const validPaths = watchPaths.filter(p => {
    const fullPath = join(process.cwd(), p);
    return existsSync(fullPath);
  });

  console.log(chalk.gray(`Watching: ${validPaths.join(', ')}\n`));

  let debounceTimer = null;
  let lastScore = null;

  // Initial score display
  calculateAlignmentScore().then(score => {
    lastScore = score;
    console.log(chalk.blue(`📊 Initial alignment score: ${score}%\n`));
  });

  validPaths.forEach(path => {
    const fullPath = join(process.cwd(), path);
    try {
      watch(fullPath, { recursive: true }, (eventType, filename) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          const timestamp = new Date().toLocaleTimeString();
          console.log(chalk.yellow(`\n[${timestamp}] 📝 ${filename || path} changed`));
          
          await updateStateFile();
          
          // Auto-sync CONTEXT.md if enabled and code files changed
          if (autoSync && !filename?.includes('CONTEXT.md') && !filename?.includes('.md')) {
            console.log(chalk.blue('🔄 Auto-syncing CONTEXT.md...'));
            try {
              execSync('npx ultra-dex sync --brain', { 
                stdio: 'pipe',
                timeout: 30000 
              });
              console.log(chalk.green('   ✅ CONTEXT.md synced with brain'));
            } catch (e) {
              console.log(chalk.gray('   ⚠️  Auto-sync skipped (no changes detected or error)'));
            }
          }
          
          const newScore = await calculateAlignmentScore();
          const scoreDiff = lastScore !== null ? newScore - lastScore : 0;
          const diffIndicator = scoreDiff > 0 
            ? chalk.green(`↑ +${scoreDiff}`) 
            : scoreDiff < 0 
              ? chalk.red(`↓ ${scoreDiff}`) 
              : chalk.gray('→ 0');
          
          lastScore = newScore;
          
          const scoreColor = newScore >= 80 ? 'green' : newScore >= 50 ? 'yellow' : 'red';
          console.log(chalk[scoreColor](`✅ State updated | Alignment: ${newScore}% ${diffIndicator}`));
          
        }, interval);
      });
    } catch (e) {
      console.log(chalk.gray(`  ⚠️  Cannot watch ${path}: ${e.message}`));
    }
  });

  console.log(chalk.gray('\nPress Ctrl+C to stop'));
  
  // Keep process running
  process.stdin.resume();
}
