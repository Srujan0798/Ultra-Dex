// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Test module
 * @module commands/test
 */

import chalk from 'chalk';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveScope(scope) {
  if (scope === 'cli') return path.resolve(process.cwd(), 'cli');
  if (scope === 'root') return process.cwd();

  const cliPath = path.resolve(process.cwd(), 'cli');
  if (await fileExists(path.join(cliPath, 'package.json'))) {
    return cliPath;
  }
  return process.cwd();
}

function spawnCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', cwd });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

export function registerTestCommand(program) {
  program
    .command('test')
    .description('Run test suite for the current project')
    .option('--scope <scope>', 'Test scope (auto|root|cli)', 'auto')
    .option('--coverage', 'Run coverage script if available')
    .option('--watch', 'Run in watch mode')
    .option('--runner <cmd>', 'Override runner command (default: npm)')
    .action(async (options) => {
      try {
        const cwd = await resolveScope(options.scope);
        const pkgPath = path.join(cwd, 'package.json');
        const hasPkg = await fileExists(pkgPath);
        if (!hasPkg) {
          printError(chalk.red(`No package.json found in ${cwd}`));
          return;
        }

        const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
        const scripts = pkg.scripts || {};

        let script = 'test';
        if (options.coverage && scripts['test:coverage']) script = 'test:coverage';
        if (options.watch && scripts['test:watch']) script = 'test:watch';

        const runner = options.runner || 'npm';
        const args = runner === 'npm' ? ['run', script] : [script];

        printInfo(chalk.cyan(`\n🧪 Running ${script} (${cwd})\n`));
        await spawnCommand(runner, args, cwd);
        printSuccess('\n✅ Tests completed');
      } catch (error) {
        printWarning(chalk.yellow(`Test run failed: ${error.message}`));
      }
    });
}

export default { registerTestCommand };
