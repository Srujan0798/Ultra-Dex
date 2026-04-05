import ora from './utils/ora.js';
import chalk from 'chalk';
import { gradients, colors } from './colors.js';

/**
 * Creates a consistent spinner with Ultra-Dex branding
 * @param {string} text - Initial text to display
 * @param {object} options - Spinner options
 * @returns {ora.Ora} Spinner instance
 */
export function createSpinner(text = 'Processing...', options = {}) {
  return ora({
    text: ` ${text}`,
    spinner: 'dots',
    color: 'magenta',
    ...options
  });
}

/**
 * Shows a success message with consistent checkmark
 * @param {string} text - Success message
 */
export function showSuccess(text) {
  console.log(`${chalk.green('✔')} ${text}`);
}

/**
 * Shows an info message with consistent icon
 * @param {string} text - Info message
 */
export function showInfo(text) {
  console.log(`${chalk.blue('ℹ')} ${text}`);
}

/**
 * Shows a warning message with consistent icon
 * @param {string} text - Warning message
 */
export function showWarning(text) {
  console.log(`${chalk.yellow('⚠')} ${text}`);
}

/**
 * Shows an error message with consistent icon
 * @param {string} text - Error message
 */
export function showError(text) {
  console.log(`${chalk.red('✖')} ${text}`);
}

/**
 * Shows a loading message with spinner temporarily
 * @param {string} text - Loading message
 * @param {Function} promiseFn - Async function to execute
 * @returns {Promise<any>} Result of the promise
 */
export async function withLoading(text, promiseFn) {
  const spinner = createSpinner(text).start();
  
  try {
    const result = await promiseFn(spinner);
    spinner.succeed(chalk.green(` ${text}`));
    return result;
  } catch (error) {
    spinner.fail(chalk.red(` ${text} - ${error.message}`));
    throw error;
  }
}

/**
 * Executes a series of tasks with a combined progress indicator
 * @param {string} title - Overall task title
 * @param {Array<{name: string, fn: Function}>} tasks - List of tasks to run
 */
export async function runTaskSuite(title, tasks) {
  console.log(`\n${colors.brand(title)}`);
  
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const prefix = chalk.dim(`[${i + 1}/${tasks.length}]`);
    const spinner = createSpinner(`${prefix} ${task.name}`).start();
    
    try {
      await task.fn();
      spinner.succeed(`${prefix} ${chalk.green(task.name)}`);
    } catch (error) {
      spinner.fail(`${prefix} ${chalk.red(task.name)}: ${error.message}`);
      throw error;
    }
  }
  
  console.log(gradients.success(`\n✨ ${title} completed successfully!\n`));
}