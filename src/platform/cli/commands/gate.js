// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Gate module
 * @module commands/gate
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { runQualityGates } from '../quality/gate.js';
import { formatGateTable, summarizeGateResults, renderGateReportHtml } from '../quality/report.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';

export function registerGateCommand(program) {
  const gate = program.command('gate').description('Quality gate checks for CI/CD');

  gate
    .command('check')
    .description('Run all quality gates')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      const { results } = await runQualityGates(process.cwd());
      const summary = summarizeGateResults(results);

      if (options.json) {
        console.log(JSON.stringify({ summary, results }, null, 2));
        return;
      }

      printInfo(chalk.cyan('\n🚦 Quality Gates\n'));
      printInfo(formatGateTable(results));
      if (summary.failed > 0) {
        printError(chalk.red(`\n❌ ${summary.failed} gate(s) failed.`));
        process.exitCode = 1;
      } else {
        printSuccess(chalk.green('\n✅ All gates passed.'));
      }
    });

  gate
    .command('status')
    .description('Show gate status summary')
    .action(async () => {
      const { results } = await runQualityGates(process.cwd());
      const summary = summarizeGateResults(results);
      printInfo(chalk.cyan('\n🚦 Quality Gate Status\n'));
      printInfo(
        `Passed: ${summary.passed} | Failed: ${summary.failed} | Warnings: ${summary.warnings}`
      );
    });

  gate
    .command('report')
    .description('Generate quality gate report')
    .option('--output <path>', 'Output file path (json or html)', 'quality-gate-report.html')
    .action(async (options) => {
      const { results } = await runQualityGates(process.cwd());
      const summary = summarizeGateResults(results);

      const outputPath = path.resolve(process.cwd(), options.output);
      if (outputPath.endsWith('.json')) {
        await fs.writeFile(outputPath, JSON.stringify({ summary, results }, null, 2));
      } else {
        await fs.writeFile(outputPath, renderGateReportHtml(results, summary));
      }
      printSuccess(chalk.green(`\n✅ Report written to ${outputPath}\n`));
    });
}

/**
 * Safe execution wrapper with error handling for gate
 * @param {Function} fn - Async function to execute
 * @param {string} [context='gate'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'gate') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
