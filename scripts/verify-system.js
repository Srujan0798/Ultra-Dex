#!/usr/bin/env node

// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex v6.0.0 System Verification Script (Meta-Layer Edition)
 * Fast, opinionated health check for the Nexus + CLI.
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

console.log(chalk.magenta('\n🌌 Ultra-Dex v6.0.0 Meta-Layer Verification\n'));

const results = { passed: 0, failed: 0, total: 0 };

function check(condition, description) {
  results.total++;
  if (condition) {
    console.log(chalk.green('  ✅ ') + chalk.gray(description));
    results.passed++;
  } else {
    console.log(chalk.red('  ❌ ') + chalk.gray(description));
    results.failed++;
  }
}

async function verifyMonorepoLayout() {
  console.log(chalk.cyan('\n📁 Monorepo Layout\n'));
  const dirs = ['apps/cli', 'apps/dashboard', 'apps/cloud', 'src/core', 'packages/sdk', '.ultra-dex'];
  for (const dir of dirs) {
    const exists = await fs.access(path.join(process.cwd(), dir)).then(() => true).catch(() => false);
    check(exists, `Directory: ${dir}`);
  }
}

async function verifyCoreBrain() {
  console.log(chalk.cyan('\n🧠 Core Brain\n'));
  try {
    const { agentOrchestrator } = await import('../src/core/orchestration/index.js');
    check(!!agentOrchestrator, 'Nexus Orchestrator importable');

    const { ppmManager } = await import('../src/core/memory/manager.js');
    await ppmManager.init();
    const stats = await ppmManager.stats();
    check(stats.hot >= 0, 'Relational Memory initialized');
  } catch (error) {
    check(false, `Core Brain error: ${error.message}`);
  }
}

async function verifySecurity() {
  console.log(chalk.cyan('\n🛡️  Security & Sandbox\n'));
  try {
    const { checkDocker } = await import('../apps/cli/lib/sandbox/docker.js');
    const dockerOk = await checkDocker();
    if (dockerOk) {
      check(true, 'Docker available for sandbox');
    } else {
      console.log(chalk.yellow('  ⚠️  Docker not found. Sandbox mode will be unavailable.'));
    }

    const { codeValidator } = await import('../src/services/security/validators.js');
    check(!!codeValidator, 'Static code validator importable');
  } catch (error) {
    check(false, `Security subsystem error: ${error.message}`);
  }
}

async function verifyCLI() {
  console.log(chalk.cyan('\n🧪 CLI Sanity\n'));
  try {
    const { spawn } = await import('child_process');
    await new Promise((resolve) => {
      const child = spawn(process.execPath, ['apps/cli/bin/ultra-dex.js', '--version'], {
        cwd: process.cwd(),
      });
      child.on('exit', (code) => {
        check(code === 0, 'ultra-dex --version runs');
        resolve();
      });
      child.on('error', (err) => {
        check(false, `CLI failed to spawn: ${err.message}`);
        resolve();
      });
    });
  } catch (error) {
    check(false, `CLI check error: ${error.message}`);
  }
}

async function runVerification() {
  try {
    await verifyMonorepoLayout();
    await verifyCoreBrain();
    await verifySecurity();
    await verifyCLI();

    console.log(chalk.blue('\n📊 Verification Summary\n'));
    console.log(chalk.gray(`  Total checks: ${results.total}`));
    console.log(chalk.green(`  Passed: ${results.passed}`));
    console.log(chalk.red(`  Failed: ${results.failed}`));

    if (results.failed === 0) {
      console.log(
        chalk.green('\n🎉 All systems verified. Ultra-Dex v6.0.0 Meta-Layer is operational.'),
      );
    } else {
      console.log(
        chalk.red('\n❌ Some systems failed verification. Inspect logs before declaring READY.'),
      );
    }

    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(chalk.red('\n💥 Verification script error:'), error.message);
    process.exit(1);
  }
}

runVerification();