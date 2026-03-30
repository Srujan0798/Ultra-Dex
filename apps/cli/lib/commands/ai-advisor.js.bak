// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Ai Advisor module
 * @module commands/ai-advisor
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { MODEL_COSTS } from '../advisor/model-costs.js';
import { printInfo, printSuccess } from '../utils/output.js';

export function registerAiAdvisorCommand(program) {
  program
    .command('ai-advisor')
    .description('Interactive AI model advisor')
    .action(async () => {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'budget',
          message: 'What is your budget preference?',
          choices: ['highest quality', 'balanced', 'budget'],
        },
      ]);

      let recommendation = MODEL_COSTS[0];
      if (answers.budget === 'balanced') recommendation = MODEL_COSTS[1];
      if (answers.budget === 'budget') recommendation = MODEL_COSTS[3];

      printSuccess(chalk.green(`\n✅ Recommendation: ${recommendation.name}`));
      printInfo(chalk.gray(`Best for: ${recommendation.bestFor}`));
      printInfo(chalk.cyan('\nCost comparison:'));
      MODEL_COSTS.forEach((model) => {
        printInfo(
          `- ${model.name}: $${model.input}/MTok in, $${model.output}/MTok out (${model.bestFor})`
        );
      });
    });
}

/**
 * Safe execution wrapper with error handling for ai-advisor
 * @param {Function} fn - Async function to execute
 * @param {string} [context='ai-advisor'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'ai-advisor') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
