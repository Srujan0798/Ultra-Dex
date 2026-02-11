// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Neuro Plan module
 * @module commands/neuro-plan
 */

import chalk from 'chalk';
import { buildPlan } from '../planning/neuro-symbolic.js';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

export function registerNeuroPlanCommand(program) {
  program
    .command('neuro-plan <goal>')
    .description('Generate a neuro-symbolic plan with rules validation')
    .action(async (goal) => {
      const result = await buildPlan(goal);
      printInfo(chalk.cyan('\nNeuro-Symbolic Plan\n'));
      printInfo(result.planText);
      if (!result.approved) {
        printWarning(chalk.yellow('\nRule violations detected:'));
        result.violations.forEach((v) => printWarning(`- ${v.id || v.if}`));
      } else {
        printSuccess(chalk.green('\n✅ Plan approved by rules engine.'));
      }
    });
}

/**
 * Safe execution wrapper with error handling for neuro-plan
 * @param {Function} fn - Async function to execute
 * @param {string} [context='neuro-plan'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'neuro-plan') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
