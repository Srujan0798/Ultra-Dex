// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Db Advisor module
 * @module commands/db-advisor
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { recommendDatabase } from '../advisor/database-tree.js';
import { printInfo, printSuccess } from '../utils/output.js';

export function registerDbAdvisorCommand(program) {
  program
    .command('db-advisor')
    .description('Interactive database advisor')
    .action(async () => {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'useCase',
          message: 'What is your primary use case?',
          choices: ['ecommerce', 'cms', 'saas', 'analytics'],
        },
      ]);

      const rec = recommendDatabase(answers.useCase);
      printSuccess(chalk.green(`\n✅ Recommendation: ${rec.recommendation}`));
      printInfo(chalk.gray(`Hosting: ${rec.hosting}`));
      printInfo(chalk.cyan('\nPrisma setup:'));
      printInfo('  npm install prisma @prisma/client');
      printInfo('  npx prisma init --datasource-provider postgresql');
    });
}

/**
 * Safe execution wrapper with error handling for db-advisor
 * @param {Function} fn - Async function to execute
 * @param {string} [context='db-advisor'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'db-advisor') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
