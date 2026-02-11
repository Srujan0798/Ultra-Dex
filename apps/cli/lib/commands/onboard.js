// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Onboard module
 * @module commands/onboard
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

export function registerOnboardCommand(program) {
  program
    .command('onboard')
    .description('Interactive onboarding wizard')
    .action(async () => {
      printInfo(chalk.cyan('\nWelcome to Ultra-Dex onboarding\n'));

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'provider',
          message: 'Select AI provider',
          choices: ['anthropic', 'openai', 'google', 'skip'],
        },
        {
          type: 'confirm',
          name: 'createProject',
          message: 'Create first project now?',
          default: true,
        },
        {
          type: 'confirm',
          name: 'generatePlan',
          message: 'Generate implementation plan after init?',
          default: true,
        },
      ]);

      if (answers.provider !== 'skip') {
        printInfo(chalk.gray(`Set ${answers.provider} API key in your shell.`));
      }

      if (answers.createProject) {
        printInfo(chalk.gray('Run: ultra-dex init'));
      }

      if (answers.generatePlan) {
        printInfo(chalk.gray('Run: ultra-dex generate "Describe your product"'));
      }

      printSuccess(chalk.green('\nOnboarding checklist complete.'));
      printWarning(chalk.yellow('Tip: run `ultra-dex doctor` to verify setup.'));
    });
}

/**
 * Safe execution wrapper with error handling for onboard
 * @param {Function} fn - Async function to execute
 * @param {string} [context='onboard'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'onboard') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
