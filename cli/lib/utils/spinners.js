import ora from 'ora';
import chalk from 'chalk';

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function createSpinner(text) {
  return ora({
    text: chalk.cyan(text),
    spinner: {
      interval: 80,
      frames: spinnerFrames
    },
    color: 'magenta'
  });
}

export function success(text) {
  return ora().succeed(chalk.green(text));
}

export function fail(text) {
  return ora().fail(chalk.red(text));
}

export function info(text) {
  return ora().info(chalk.blue(text));
}

export function warn(text) {
  return ora().warn(chalk.yellow(text));
}

// Task list with progress
export async function runTasks(tasks) {
  for (const task of tasks) {
    const spinner = createSpinner(task.title);
    spinner.start();
    try {
      await task.fn();
      spinner.succeed(chalk.green(task.title));
    } catch (error) {
      spinner.fail(chalk.red(`${task.title}: ${error.message}`));
      throw error;
    }
  }
}