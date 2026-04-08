import { singleton } from 'tsyringe';

import inquirer from 'inquirer';
import { createSpinner, showSuccess, showInfo, showWarning, showError, withLoading, runTaskSuite } from './spinner.js';
import { colors, gradients, formatMessage, formatTitle, formatSection, formatListItem } from './colors.js';
import { performance } from 'perf_hooks';
import chalk from 'chalk';

type AnyFunction = (...args: unknown[]) => unknown;

/**
 * Interactive CLI utilities for Ultra-Dex
 */
@singleton()
export class InteractiveCLI {
  constructor() {
    this.spinner = null;
  }

  /**
   * Show a welcome message with Ultra-Dex branding
   */
  showWelcome(): void {
    console.log('\n' + gradients.brand(`
   __  ____  __               ____            
  / / / / / / /__________ _  / __ \\___  _  __ 
 / / / / / / / ___/ __ \`/ / / / / / _ \\| |/_/ 
/ /_/ / /_/ / /  / /_/ / / / /_/ /  __/>  <   
\\____/\\____/_/   \\__,_/_/ /_____/\\___/_/|_|   
                                              
    `) + '\n');
    console.log(`  ${colors.brand('AI Orchestration Meta-Layer for SaaS Development')}`);
    console.log(`  ${chalk.dim('Version 6.0.0 | Enterprise Ready')}\n`);
  }

  /**
   * Prompt user with a list of options
   * @param {string} message - Question to ask
   * @param {Array<{name: string, value: any, short?: string}>} choices - Options to choose from
   * @param {any} defaultChoice - Default value
   * @returns {Promise<any>} Selected value
   */
  async promptList(message: string, choices: Array<{ name: string, value: unknown, short?: string }>, defaultChoice: unknown = null): Promise<unknown> {
    const question = {
      type: 'list',
      name: 'selection',
      message: chalk.cyan(message),
      choices: choices.map(choice => ({
        name: choice.name,
        value: choice.value,
        short: choice.short || choice.name
      })),
      default: defaultChoice
    };

    const result = await inquirer.prompt([question]);
    return result.selection;
  }

  /**
   * Prompt user with checkbox options
   * @param {string} message - Question to ask
   * @param {Array<{name: string, value: any, checked?: boolean}>} choices - Options to choose from
   * @returns {Promise<Array<any>>} Selected values
   */
  async promptCheckbox(message: string, choices: Array<{ name: string, value: unknown, checked?: boolean }>): Promise<unknown[]> {
    const question = {
      type: 'checkbox',
      name: 'selections',
      message: chalk.cyan(message),
      choices: choices.map(choice => ({
        name: choice.name,
        value: choice.value,
        checked: choice.checked || false
      }))
    };

    const result = await inquirer.prompt([question]);
    return result.selections;
  }

  /**
   * Prompt user for text input
   * @param {string} message - Question to ask
   * @param {string} defaultValue - Default value
   * @param {Function} validateFn - Validation function
   * @returns {Promise<string>} User input
   */
  async promptInput(message: string, defaultValue: string = '', validateFn: AnyFunction | null = null): Promise<string> {
    const question = {
      type: 'input',
      name: 'input',
      message: chalk.cyan(message),
      default: defaultValue
    };

    if (validateFn) {
      question.validate = validateFn;
    }

    const result = await inquirer.prompt([question]);
    return result.input;
  }

  /**
   * Prompt user for password
   * @param {string} message - Question to ask
   * @returns {Promise<string>} Password input
   */
  async promptPassword(message: string): Promise<string> {
    const question = {
      type: 'password',
      name: 'password',
      message: chalk.cyan(message),
      mask: '*'
    };

    const result = await inquirer.prompt([question]);
    return result.password;
  }

  /**
   * Confirm with user
   * @param {string} message - Confirmation message
   * @param {boolean} defaultAnswer - Default answer
   * @returns {Promise<boolean>} True if confirmed
   */
  async promptConfirm(message: string, defaultAnswer: boolean = true): Promise<boolean> {
    const question = {
      type: 'confirm',
      name: 'confirmed',
      message: chalk.yellow(message),
      default: defaultAnswer
    };

    const result = await inquirer.prompt([question]);
    return result.confirmed;
  }

  /**
   * Show a progress bar (simulated)
   * @param {string} message - Progress message
   * @param {number} total - Total steps
   * @param {Function} taskFn - Function that performs the task
   * @returns {Promise<any>} Task result
   */
  async withProgressBar(message: string, total: number, taskFn: AnyFunction): Promise<unknown> {
    const spinner = createSpinner(`${message} (0/${total})`);
    spinner.start();

    let current = 0;
    const updateProgress = (): void => {
      current++;
      spinner.text = ` ${message} (${current}/${total})`;
    };

    try {
      const result = await taskFn(updateProgress);
      spinner.succeed(chalk.green(` ${message} (${total}/${total})`));
      return result;
    } catch (error) {
      spinner.fail(chalk.red(` ${message} (${current}/${total})`));
      throw error;
    }
  }

  /**
   * Show a table of data
   * @param {Array<string>} headers - Table headers
   * @param {Array<Array<string>>} rows - Table rows
   */
  async showTable(headers: string[], rows: string[][]): Promise<void> {
    const { default: Table } = await import('cli-table3');

    const table = new Table({
      head: headers.map(h => chalk.bold(h)),
      chars: {
        'top': '━', 'top-mid': '┳', 'top-left': '┏', 'top-right': '┓',
        'bottom': '━', 'bottom-mid': '┻', 'bottom-left': '┗', 'bottom-right': '┛',
        'left': '┃', 'left-mid': '┣', 'mid': '━', 'mid-mid': '╋',
        'right': '┃', 'right-mid': '┫', 'middle': '┃'
      },
      style: {
        head: [], // Disable default colors to use our own
        border: ['dim']
      }
    });

    // Colorize headers
    table.options.head = headers.map(h => gradients.info(h));

    rows.forEach(row => {
      table.push(row);
    });

    console.log('\n' + table.toString() + '\n');
  }

  /**
   * Run a suite of tasks
   */
  async runTasks(title: string, tasks: Array<{ name: string, fn: AnyFunction }>): Promise<unknown> {
    return await runTaskSuite(title, tasks);
  }

  /**
   * Measure and display execution time
   * @param {string} operation - Operation name
   * @param {Function} fn - Function to execute
   * @returns {Promise<any>} Function result
   */
  async measureTime(operation: string, fn: AnyFunction): Promise<unknown> {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      const duration = Math.round(end - start);

      showInfo(`${operation} completed in ${chalk.bold(duration + 'ms')}`);
      return result;
    } catch (error) {
      const end = performance.now();
      const duration = Math.round(end - start);

      showError(`${operation} failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Display a formatted message
   */
  showMessage(type: string, message: string): void {
    console.log(formatMessage(type, message));
  }

  /**
   * Display a formatted title
   */
  showTitle(title: string): void {
    console.log(formatTitle(title));
  }

  /**
   * Display a formatted section
   */
  showSection(header: string): void {
    console.log(formatSection(header));
  }

  /**
   * Display a list of items
   */
  showList(items: string[]): void {
    items.forEach((item, index) => {
      console.log(formatListItem(item, index));
    });
  }

  /**
   * Show a success message with celebration
   * @param {string} message - Success message
   */
  showCelebration(message: string): void {
    console.log('\n' + colors.celebrate(`✨ ${message} ✨`) + '\n');
  }
}

// Export singleton instance
export const interactiveCLI = new InteractiveCLI();

// Export individual utilities
export {
  createSpinner,
  showSuccess,
  showInfo,
  showWarning,
  showError,
  withLoading,
  runTaskSuite
};