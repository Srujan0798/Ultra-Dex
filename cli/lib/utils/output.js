import chalk from 'chalk';

export function printError(message, err) {
  console.log(chalk.red(message));
  if (err?.message) {
    console.log(chalk.gray(`  → ${err.message}`));
  }
}

export function printWarning(message) {
  console.log(chalk.yellow(message));
}

export function printInfo(message) {
  console.log(chalk.cyan(message));
}

export function printSuccess(message) {
  console.log(chalk.green(message));
}
