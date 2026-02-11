// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Budget module
 * @module commands/budget
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import { loadBudget, saveBudget, recordSpend } from '../commerce/budget.js';
import { exportBilling } from '../commerce/billing.js';
import { checkAlerts } from '../commerce/alerts.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { checkBudgets, setBudget as setPerfBudget } from '../perf/budget-checker.js';

export function registerBudgetCommand(program) {
  const budget = program.command('budget').description('Manage budget limits and usage');

  budget
    .command('set [operation] [ms]')
    .description('Set budget limits')
    .option('--daily <amount>', 'Daily budget')
    .option('--monthly <amount>', 'Monthly budget')
    .option('--per-agent <amount>', 'Per-agent budget')
    .action(async (operation, ms, options) => {
      if (operation && ms) {
        await setPerfBudget(operation, ms);
        printSuccess(chalk.green(`\n✅ Performance budget set: ${operation} = ${ms}ms\n`));
        return;
      }

      const config = await loadBudget();
      if (options.daily) config.daily = Number(options.daily);
      if (options.monthly) config.monthly = Number(options.monthly);
      if (options.perAgent) config.perAgent = Number(options.perAgent);
      await saveBudget(config);
      printSuccess(chalk.green('\n✅ Budget updated.\n'));
    });

  budget
    .command('status')
    .description('Show current budget usage')
    .action(async () => {
      const config = await loadBudget();
      printInfo(chalk.cyan('\nBudget Status\n'));
      printInfo(`Daily: ${config.spending.daily}/${config.daily}`);
      printInfo(`Monthly: ${config.spending.monthly}/${config.monthly}`);
    });

  budget
    .command('check')
    .description('Check performance budgets against profiler metrics')
    .action(async () => {
      const { violations } = await checkBudgets();
      if (!violations.length) {
        printSuccess(chalk.green('\n✅ No performance budget violations.\n'));
        return;
      }
      printWarning(chalk.yellow('\n⚠️ Performance Budget Violations:\n'));
      violations.forEach((v) => {
        printWarning(`- ${v.operation}: ${Math.round(v.max)}ms > ${v.limit}ms`);
      });
    });

  budget
    .command('report')
    .description('Export billing report')
    .option('--format <format>', 'json or csv', 'json')
    .option('--output <path>', 'Output file path')
    .action(async (options) => {
      const output = await exportBilling(options.format);
      if (options.output) {
        await fs.writeFile(options.output, output);
        printSuccess(chalk.green(`\n✅ Report written to ${options.output}\n`));
      } else {
        process.stdout.write(output + '\n');
      }
    });

  budget
    .command('alert')
    .description('Show budget alerts')
    .action(async () => {
      const { alerts, dailyPct, monthlyPct } = await checkAlerts();
      if (!alerts.length) {
        printSuccess(chalk.green('\n✅ No budget alerts.\n'));
        return;
      }
      printWarning(chalk.yellow('\n⚠️ Budget Alerts\n'));
      alerts.forEach((alert) => {
        printWarning(`- ${alert.period} ${alert.percentage}% (threshold ${alert.threshold}%)`);
      });
      printInfo(chalk.gray(`Daily: ${dailyPct}% | Monthly: ${monthlyPct}%`));
    });

  budget
    .command('spend <amount>')
    .description('Record a spend event')
    .option('--agent <name>', 'Agent name', 'unknown')
    .action(async (amount, options) => {
      await recordSpend(Number(amount), options.agent);
      printSuccess(chalk.green('\n✅ Spend recorded.\n'));
    });
}

/**
 * Safe execution wrapper with error handling for budget
 * @param {Function} fn - Async function to execute
 * @param {string} [context='budget'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'budget') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
