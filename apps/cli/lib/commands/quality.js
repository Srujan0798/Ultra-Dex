// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import { spawn } from 'child_process';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function runTask(label, command, args) {
  try {
    printInfo(chalk.cyan(`\n▶ ${label}`));
    await runProcess(command, args);
    printSuccess(chalk.green(`✓ ${label} passed`));
    return true;
  } catch (error) {
    printError(chalk.red(`✗ ${label} failed`));
    if (error?.shortMessage) printWarning(chalk.gray(error.shortMessage));
    return false;
  }
}

export async function qualityCommand(options = {}) {
  const selected =
    options.all || (!options.lint && !options.test && !options.coverage && !options.security);
  const tasks = [];

  if (selected || options.lint) tasks.push(['Lint', 'npm', ['run', 'lint']]);
  if (selected || options.test) tasks.push(['Tests', 'npm', ['test']]);
  if (selected || options.coverage) tasks.push(['Coverage', 'npm', ['run', 'test:coverage']]);
  if (selected || options.security)
    tasks.push(['Security Audit', 'npm', ['run', 'security:audit']]);

  if (!tasks.length) {
    printWarning(chalk.yellow('No quality checks selected.'));
    return 1;
  }

  let failures = 0;
  for (const [label, command, args] of tasks) {
    const ok = await runTask(label, command, args);
    if (!ok) failures += 1;
  }

  if (failures === 0) {
    printSuccess(chalk.green('\n✅ All selected quality checks passed.'));
    return 0;
  }

  printError(chalk.red(`\n❌ ${failures} quality check(s) failed.`));
  return 1;
}

export function registerQualityCommand(program) {
  program
    .command('quality')
    .description('Run quality gates (lint, tests, coverage, security)')
    .option('--lint', 'Run lint checks')
    .option('--test', 'Run test suite')
    .option('--coverage', 'Run tests with coverage')
    .option('--security', 'Run security audit')
    .option('--all', 'Run all quality checks')
    .action(async (options) => {
      const code = await qualityCommand(options);
      if (code !== 0) process.exit(code);
    });
}

export default { registerQualityCommand, qualityCommand };
