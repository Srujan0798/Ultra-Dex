// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Architect module
 * @module commands/architect
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { recommendPattern } from '../architect/decision-tree.js';
import { printInfo, printSuccess } from '../utils/output.js';

export function registerArchitectCommand(program) {
  program
    .command('architect')
    .description('Interactive architecture advisor')
    .action(async () => {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'teamSize',
          message: 'What is your team size?',
          choices: ['1-3', '3-10', '10-50', '50+'],
        },
        {
          type: 'list',
          name: 'traffic',
          message: 'What is your traffic profile?',
          choices: ['steady', 'spiky', 'unknown'],
        },
      ]);

      const recommendation = recommendPattern(answers);
      printSuccess(chalk.green(`\n✅ Recommendation: ${recommendation.name}`));
      printInfo(chalk.gray(`Use case: ${recommendation.useCase}`));
      printInfo(chalk.cyan('\nSuggested Structure:'));
      recommendation.structure.forEach((item) => printInfo(`  - ${item}`));
    });
}

/**
 * Safe execution wrapper with error handling for architect
 * @param {Function} fn - Async function to execute
 * @param {string} [context='architect'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'architect') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
