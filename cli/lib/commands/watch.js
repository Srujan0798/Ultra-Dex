// cli/lib/commands/watch.js
import chalk from 'chalk';
import { watch } from 'fs';
import { join } from 'path';
import { updateState } from './state.js';

export function watchCommand(options) {
  console.log(chalk.cyan.bold('\n👁️  Ultra-Dex Watch Mode\n'));
  console.log(chalk.gray('Watching for file changes...\n'));

  const watchPaths = [
    'CONTEXT.md',
    'IMPLEMENTATION-PLAN.md',
    'src',
    'app',
    'lib'
  ];

  let debounceTimer = null;
  watchPaths.forEach(path => {
    const fullPath = join(process.cwd(), path);
    try {
      watch(fullPath, { recursive: true }, (eventType, filename) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          console.log(chalk.yellow(`\n📝 ${filename} changed`));
          await updateState();
          console.log(chalk.green('✅ State updated'));
        }, 500);
      });
    } catch (e) {
      // Path doesn't exist, skip
    }
  });

  console.log(chalk.gray('Press Ctrl+C to stop'));
  
  // Keep process running
  process.stdin.resume();
}
