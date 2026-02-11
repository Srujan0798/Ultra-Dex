#!/usr/bin/env node

// Copyright (c) 2026 Ultra-Dex

/**
 * Pre-commit Governance Hook
 * Runs @Governor audit against staged changes
 */

import { auditGovernance } from '../apps/cli/lib/governance/governor.js';
import chalk from 'chalk';

async function run() {
  console.log(chalk.bold('🛡️  Ultra-Dex Pre-commit Governance Check...'));
  
  try {
    const result = await auditGovernance('.');
    if (!result.ok) {
      console.error(chalk.red('\n✕ Governance Check Failed. Commit blocked.'));
      console.error(chalk.yellow('  Resolve the ADR violations listed above to proceed.'));
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error(chalk.red(`\n✕ Governor Error: ${error.message}`));
    process.exit(1);
  }
}

run();
