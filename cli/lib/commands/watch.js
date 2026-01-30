// cli/lib/commands/watch.js
import chalk from 'chalk';
import { watch } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';
import { updateStateFile, computeState } from './state.js';

async function calculateAlignmentScore() {
  const state = await computeState();
  return state.score || 0;
}

export function watchCommand(options) {
  console.log(chalk.cyan.bold('\n👁️  Ultra-Dex Watch Mode v3.0\n'));
  console.log(chalk.gray('Watching for file changes...\n'));

  const interval = options.interval ? parseInt(options.interval, 10) : 500;
  console.log(chalk.gray(`Debounce interval: ${interval}ms`));

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
