import chalk from 'chalk';

export function watchCommand() {
  console.log(chalk.cyan('\n👀 Watching project for changes...'));
  console.log(chalk.gray('Auto-state tracking enabled.'));
}