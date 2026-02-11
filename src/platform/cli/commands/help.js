// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Help module
 * @module commands/help
 */

import chalk from 'chalk';
import boxen from 'boxen';
import inquirer from 'inquirer';
import { printInfo } from '../utils/output.js';

const HELP_MAP = {
  deploy: 'ultra-dex cloud deploy',
  monitor: 'ultra-dex monitor',
  init: 'ultra-dex init',
  plan: 'ultra-dex generate',
  test: 'ultra-dex verify',
  audit: 'ultra-dex audit',
  risk: 'ultra-dex risk add',
  mcp: 'ultra-dex serve',
};

export function registerHelpCommand(program) {
  program
    .command('help [topic]')
    .description('Show themed help overview or interactive assistant')
    .action(async (topic) => {
      if (topic) {
        // Static help for topic
        printInfo(chalk.bold(`📖 Help for "${topic}"`));
        // Simple mapping check
        if (HELP_MAP[topic]) {
          printInfo(`Suggested command: ${chalk.cyan(HELP_MAP[topic])}`);
        } else {
          printInfo('No specific help found. Try running without arguments for interactive mode.');
        }
        return;
      }

      // Interactive Mode
      console.log(
        boxen(chalk.bold('🤖 Ultra-Dex AI Assistant'), {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
        })
      );

      const { query } = await inquirer.prompt([
        {
          type: 'input',
          name: 'query',
          message: 'How can I help you? (e.g. "I want to deploy to Vercel")',
        },
      ]);

      const lowerQuery = query.toLowerCase();
      let suggestion = null;

      if (lowerQuery.includes('deploy') || lowerQuery.includes('cloud')) {
        suggestion = 'ultra-dex cloud deploy';
      } else if (lowerQuery.includes('monitor') || lowerQuery.includes('health')) {
        suggestion = 'ultra-dex monitor';
      } else if (
        lowerQuery.includes('init') ||
        lowerQuery.includes('start') ||
        lowerQuery.includes('create')
      ) {
        suggestion = 'ultra-dex init';
      } else if (lowerQuery.includes('plan') || lowerQuery.includes('generate')) {
        suggestion = 'ultra-dex generate "your idea"';
      } else if (lowerQuery.includes('risk')) {
        suggestion = 'ultra-dex risk add';
      } else if (lowerQuery.includes('rule')) {
        suggestion = 'ultra-dex rules list';
      } else if (lowerQuery.includes('mcp') || lowerQuery.includes('server')) {
        suggestion = 'ultra-dex serve';
      }

      if (suggestion) {
        printInfo(`\nBased on your request, you should run:\n`);
        printInfo(chalk.green.bold(`  ${suggestion}\n`));
      } else {
        printInfo(
          `\nI'm not sure about that yet. Try checking the full command list with ${chalk.cyan('ultra-dex --help')}.\n`
        );
      }
    });
}

export default {
  registerHelpCommand,
};

/**
 * Safe execution wrapper with error handling for help
 * @param {Function} fn - Async function to execute
 * @param {string} [context='help'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'help') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
