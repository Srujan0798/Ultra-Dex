import inquirer from 'inquirer';
import { createSpinner, showSuccess, showInfo, showWarning, showError, withLoading } from './spinner.js';
import { colors, formatMessage, formatTitle, formatSection, formatListItem } from './colors.js';
import { performance } from 'perf_hooks';

/**
 * Interactive CLI utilities for Ultra-Dex
 */
export class InteractiveCLI {
  constructor() {
    this.spinner = null;
  }

  /**
   * Show a welcome message with Ultra-Dex branding
   */
  showWelcome() {
    console.log(colors.brand(`
  ╔══════════════════════════════════════╗
  ║           ULTRA-DEX v6.0.0           ║
  ║    AI Orchestration Meta-Layer       ║
  ╚══════════════════════════════════════╝
    `));
  }

  /**
   * Prompt user with a list of options
   * @param {string} message - Question to ask
   * @param {Array<{name: string, value: any, short?: string}>} choices - Options to choose from
   * @param {any} defaultChoice - Default value
   * @returns {Promise<any>} Selected value
   */
  async promptList(message, choices, defaultChoice = null) {
    const question = {
      type: 'list',
      name: 'selection',
      message: colors.info(message),
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
  async promptCheckbox(message, choices) {
    const question = {
      type: 'checkbox',
      name: 'selections',
      message: colors.info(message),
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
  async promptInput(message, defaultValue = '', validateFn = null) {
    const question = {
      type: 'input',
      name: 'input',
      message: colors.info(message),
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
  async promptPassword(message) {
    const question = {
      type: 'password',
      name: 'password',
      message: colors.info(message),
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
  async promptConfirm(message, defaultAnswer = true) {
    const question = {
      type: 'confirm',
      name: 'confirmed',
      message: colors.warning(message),
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
  async withProgressBar(message, total, taskFn) {
    const spinner = createSpinner(`${message} (0/${total})`);
    spinner.start();

    let current = 0;
    const updateProgress = () => {
      current++;
      spinner.text = `⏳ ${message} (${current}/${total})`;
    };

    try {
      const result = await taskFn(updateProgress);
      spinner.succeed(`✅ ${message} (${total}/${total})`);
      return result;
    } catch (error) {
      spinner.fail(`❌ ${message} (${current}/${total})`);
      throw error;
    }
  }

  /**
   * Show a table of data
   * @param {Array<string>} headers - Table headers
   * @param {Array<Array<string>>} rows - Table rows
   */
  async showTable(headers, rows) {
    const { default: Table } = await import('cli-table3');

    const table = new Table({
      head: headers.map(h => colors.accent.bold(h)),
      colWidths: headers.map(() => 20),
      style: { head: ['cyan', 'bold'] }
    });

    rows.forEach(row => {
      table.push(row);
    });

    console.log(table.toString());
  }

  /**
   * Measure and display execution time
   * @param {string} operation - Operation name
   * @param {Function} fn - Function to execute
   * @returns {Promise<any>} Function result
   */
  async measureTime(operation, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      const duration = Math.round(end - start);
      
      showInfo(`${operation} completed in ${duration}ms`);
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
   * @param {string} type - Message type
   * @param {string} message - Message content
   */
  showMessage(type, message) {
    console.log(formatMessage(type, message));
  }

  /**
   * Display a formatted title
   * @param {string} title - Title to display
   */
  showTitle(title) {
    console.log(formatTitle(title));
  }

  /**
   * Display a formatted section
   * @param {string} header - Section header
   */
  showSection(header) {
    console.log(formatSection(header));
  }

  /**
   * Display a list of items
   * @param {Array<string>} items - Items to display
   */
  showList(items) {
    items.forEach((item, index) => {
      console.log(formatListItem(item, index));
    });
  }

  /**
   * Show a success message with celebration
   * @param {string} message - Success message
   */
  showCelebration(message) {
    console.log(colors.success.bold(`🎉 ${message} 🎉`));
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
  withLoading
};