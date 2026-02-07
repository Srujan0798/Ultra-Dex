// Copyright (c) 2026 Ultra-Dex

/**
 * Self-Healing CI/CD Pipeline
 * Automatically detects and fixes common CI/CD failures
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';

// Common failure patterns and their auto-fix strategies
const FAILURE_PATTERNS = [
  {
    pattern: /Cannot find module ['"]([^'"]+)['"]/,
    type: 'missing-dependency',
    fix: async (match) => {
      const moduleName = match[1].split('/')[0];
      printInfo(`🔧 Auto-fixing: Installing missing module ${moduleName}`);
      try {
        execSync(`npm install ${moduleName}`, { stdio: 'inherit' });
        return { fixed: true, action: `Installed ${moduleName}` };
      } catch {
        return { fixed: false, action: `Failed to install ${moduleName}` };
      }
    }
  },
  {
    pattern: /ENOENT.*no such file or directory.*['"]([^'"]+)['"]/,
    type: 'missing-file',
    fix: async (match) => {
      const filePath = match[1];
      printInfo(`🔧 Auto-fixing: Creating missing directory structure for ${filePath}`);
      try {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        return { fixed: true, action: `Created directory ${dir}` };
      } catch {
        return { fixed: false, action: `Failed to create directory` };
      }
    }
  },
  {
    pattern: /error TS\d+:/,
    type: 'typescript-error',
    fix: async () => {
      printInfo(`🔧 Auto-fixing: Running TypeScript with skipLibCheck`);
      try {
        execSync('npx tsc --skipLibCheck', { stdio: 'inherit' });
        return { fixed: true, action: 'Ran tsc with skipLibCheck' };
      } catch {
        return { fixed: false, action: 'TypeScript errors require manual fix' };
      }
    }
  },
  {
    pattern: /npm ERR! peer dep missing/,
    type: 'peer-dependency',
    fix: async () => {
      printInfo(`🔧 Auto-fixing: Installing with legacy-peer-deps`);
      try {
        execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
        return { fixed: true, action: 'Installed with legacy-peer-deps' };
      } catch {
        return { fixed: false, action: 'Failed to resolve peer dependencies' };
      }
    }
  },
  {
    pattern: /EACCES.*permission denied/,
    type: 'permission-error',
    fix: async (match) => {
      printWarning(`⚠️ Permission error detected - requires manual intervention`);
      return { fixed: false, action: 'Permission errors require manual fix', manual: true };
    }
  },
  {
    pattern: /Error: listen EADDRINUSE/,
    type: 'port-in-use',
    fix: async () => {
      printInfo(`🔧 Auto-fixing: Finding and killing process on port`);
      try {
        // Try to find and kill the process using the port
        execSync('lsof -ti:3000 | xargs kill -9 2>/dev/null || true');
        return { fixed: true, action: 'Killed process on port 3000' };
      } catch {
        return { fixed: false, action: 'Could not free up port' };
      }
    }
  },
  {
    pattern: /npm WARN deprecated/,
    type: 'deprecated-package',
    fix: async () => {
      printInfo(`🔧 Auto-fixing: Running npm audit fix`);
      try {
        execSync('npm audit fix', { stdio: 'inherit' });
        return { fixed: true, action: 'Ran npm audit fix' };
      } catch {
        return { fixed: false, action: 'Some deprecations require manual update' };
      }
    }
  },
  {
    pattern: /fatal: not a git repository/,
    type: 'not-git-repo',
    fix: async () => {
      printInfo(`🔧 Auto-fixing: Initializing git repository`);
      try {
        execSync('git init', { stdio: 'inherit' });
        return { fixed: true, action: 'Initialized git repository' };
      } catch {
        return { fixed: false, action: 'Failed to initialize git' };
      }
    }
  },
  {
    pattern: /error: Your local changes.*would be overwritten/,
    type: 'uncommitted-changes',
    fix: async () => {
      printInfo(`🔧 Auto-fixing: Stashing local changes`);
      try {
        execSync('git stash', { stdio: 'inherit' });
        return { fixed: true, action: 'Stashed local changes' };
      } catch {
        return { fixed: false, action: 'Failed to stash changes' };
      }
    }
  },
  {
    pattern: /npm ERR! code ERESOLVE/,
    type: 'dependency-conflict',
    fix: async () => {
      printInfo(`🔧 Auto-fixing: Clearing npm cache and reinstalling`);
      try {
        execSync('rm -rf node_modules package-lock.json && npm cache clean --force && npm install', { stdio: 'inherit' });
        return { fixed: true, action: 'Cleared cache and reinstalled' };
      } catch {
        return { fixed: false, action: 'Failed to resolve dependency conflict' };
      }
    }
  }
];

/**
 * Analyze error output and attempt auto-fix
 */
export async function analyzeAndFix(errorOutput) {
  const fixes = [];

  for (const { pattern, type, fix } of FAILURE_PATTERNS) {
    const match = errorOutput.match(pattern);
    if (match) {
      printInfo(chalk.yellow(`\n🔍 Detected: ${type}`));
      const result = await fix(match);
      fixes.push({ type, ...result });

      if (result.fixed) {
        printSuccess(chalk.green(`✅ ${result.action}`));
      } else if (result.manual) {
        printWarning(chalk.yellow(`⚠️ ${result.action}`));
      } else {
        printError(chalk.red(`❌ ${result.action}`));
      }
    }
  }

  return fixes;
}

/**
 * Run a command with self-healing
 */
export async function runWithHealing(command, options = {}) {
  const { maxRetries = 3, retryDelay = 2000 } = options;
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    attempt++;
    printInfo(chalk.cyan(`\n🚀 Attempt ${attempt}/${maxRetries}: ${command}\n`));

    try {
      const result = execSync(command, {
        stdio: 'pipe',
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      printSuccess(chalk.green(`\n✅ Command succeeded on attempt ${attempt}`));
      return { success: true, output: result, attempts: attempt };

    } catch (error) {
      lastError = error;
      const errorOutput = error.stderr || error.stdout || error.message;

      printError(chalk.red(`\n❌ Command failed on attempt ${attempt}`));

      // Try to auto-fix
      const fixes = await analyzeAndFix(errorOutput);

      if (fixes.length === 0) {
        printWarning(chalk.yellow('No auto-fix available for this error'));
      }

      const anyFixed = fixes.some(f => f.fixed);

      if (!anyFixed && attempt < maxRetries) {
        printInfo(chalk.gray(`Waiting ${retryDelay}ms before retry...`));
        await new Promise(r => setTimeout(r, retryDelay));
      } else if (!anyFixed) {
        break;
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown error',
    attempts: attempt
  };
}

/**
 * Self-healing build pipeline
 */
export async function selfHealingBuild(options = {}) {
  const steps = [
    { name: 'Install Dependencies', command: 'npm install' },
    { name: 'Run Linter', command: 'npm run lint --if-present' },
    { name: 'Run Tests', command: 'npm test --if-present' },
    { name: 'Build', command: 'npm run build --if-present' }
  ];

  const results = [];

  printInfo(chalk.cyan('\n🏗️  Self-Healing Build Pipeline\n'));
  printInfo(chalk.gray('─'.repeat(50)));

  for (const step of steps) {
    printInfo(chalk.bold(`\n📋 ${step.name}`));

    const result = await runWithHealing(step.command, options);
    results.push({ step: step.name, ...result });

    if (!result.success && !options.continueOnError) {
      printError(chalk.red(`\n💥 Pipeline failed at: ${step.name}`));
      break;
    }
  }

  // Summary
  printInfo(chalk.cyan('\n📊 Pipeline Summary\n'));
  printInfo(chalk.gray('─'.repeat(50)));

  for (const r of results) {
    const icon = r.success ? '✅' : '❌';
    const status = r.success ? chalk.green('PASSED') : chalk.red('FAILED');
    printInfo(`${icon} ${r.step}: ${status} (${r.attempts} attempt(s))`);
  }

  const allPassed = results.every(r => r.success);

  if (allPassed) {
    printSuccess(chalk.green.bold('\n🎉 All steps passed!\n'));
  } else {
    printError(chalk.red.bold('\n💥 Some steps failed. Check logs above.\n'));
  }

  return { success: allPassed, results };
}

/**
 * Monitor and heal CI/CD failures in real-time
 */
export async function monitorAndHeal(logFile, options = {}) {
  const { pollInterval = 5000 } = options;

  printInfo(chalk.cyan(`\n👀 Monitoring ${logFile} for failures...\n`));

  let lastSize = 0;

  const check = async () => {
    try {
      const stats = await fs.stat(logFile);

      if (stats.size > lastSize) {
        const content = await fs.readFile(logFile, 'utf8');
        const newContent = content.slice(lastSize);
        lastSize = stats.size;

        // Check for errors in new content
        if (newContent.match(/error|fail|exception/i)) {
          printWarning(chalk.yellow('\n🚨 Error detected in logs!'));
          await analyzeAndFix(newContent);
        }
      }
    } catch (error) {
      // File doesn't exist yet or can't be read
    }
  };

  // Initial check
  await check();

  // Set up polling
  const interval = setInterval(check, pollInterval);

  return () => clearInterval(interval);
}

/**
 * Generate GitHub Actions workflow with self-healing
 */
export function generateSelfHealingWorkflow() {
  return `name: Self-Healing CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies (with retry)
        uses: nick-invision/retry@v2
        with:
          timeout_minutes: 10
          max_attempts: 3
          command: npm ci
          on_retry_command: rm -rf node_modules package-lock.json && npm cache clean --force

      - name: Lint (with auto-fix)
        run: |
          npm run lint || (npm run lint:fix && npm run lint)
        continue-on-error: false

      - name: Test (with retry)
        uses: nick-invision/retry@v2
        with:
          timeout_minutes: 15
          max_attempts: 2
          command: npm test

      - name: Build
        run: npm run build

      - name: Health Check
        run: |
          if [ -f "dist/index.js" ]; then
            echo "✅ Build artifacts exist"
          else
            echo "❌ Build artifacts missing"
            exit 1
          fi

      - name: Notify on Failure
        if: failure()
        run: |
          echo "::error::Build failed - check logs for self-healing attempts"
`;
}

export default {
  analyzeAndFix,
  runWithHealing,
  selfHealingBuild,
  monitorAndHeal,
  generateSelfHealingWorkflow,
  FAILURE_PATTERNS
};
