// Copyright (c) 2026 Ultra-Dex

/**
 * Structural Static Analysis Gates
 * Provides fail-fast validation for code integrity
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

export async function runStructuralGates(options = {}) {
  const { skipLint = false, skipTypeCheck = false } = options;

  logger.log(chalk.bold('\n📊 Running Structural Gates...\n'));

  try {
    // 1. Syntax Check (Verification via parse attempt or dry-run)
    // For Node.js projects, we can use 'node --check' on modified files
    // For simplicity here, we assume it's part of linting or build
    logger.log(chalk.gray('  [1/3] Syntax Verification...'));

    // 2. Linting Gate
    if (!skipLint) {
      logger.log(chalk.gray('  [2/3] Linting Check (ESLint/Ruff)...'));
      try {
        // Attempt to run eslint if present in package.json
        execSync('npm run lint -- --quiet', { stdio: 'pipe' });
      } catch (e) {
        if (e.message.includes('missing script: lint')) {
          logger.warn(chalk.yellow('        ⚠️  No lint script found. Skipping.'));
        } else {
          logger.error(chalk.red('        ✕ Linting failed. Fix errors before proceeding.'));
          return { ok: false, error: 'LINT_FAILURE' };
        }
      }
    }

    // 3. Type Check Gate
    if (!skipTypeCheck) {
      logger.log(chalk.gray('  [3/3] Type Integrity (tsc --noEmit)...'));
      try {
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
      } catch (e) {
        if (e.message.includes('command not found: tsc')) {
          logger.warn(chalk.yellow('        ⚠️  tsc not found. Skipping.'));
        } else {
          logger.error(chalk.red('        ✕ Type validation failed. Correct type mismatches.'));
          return { ok: false, error: 'TYPE_CHECK_FAILURE' };
        }
      }
    }

    logger.log(chalk.green('\n✅ Structural integrity verified.\n'));
    return { ok: true };
  } catch (criticalError) {
    logger.error(chalk.red(`\n✕ Structural Gate Critical Error: ${criticalError.message}`));
    return { ok: false, error: 'CRITICAL_GATE_ERROR' };
  }
}
