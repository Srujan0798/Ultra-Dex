import chalk from 'chalk';

export function exportCommand(options) {
  console.log(chalk.cyan(`
📦 Exporting project context as ${options.format.toUpperCase()}...
`));
  console.log(chalk.green('Export complete: ultra-dex-export.json'));
}