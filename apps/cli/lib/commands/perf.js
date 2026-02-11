// Copyright (c) 2026 Ultra-Dex

/**
 * Lightweight performance summary command.
 * Kept for backward compatibility with `ultra-dex perf`.
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

const PERF_HISTORY_PATH = path.join('.ultra-dex', 'perf-history.json');

async function readHistory() {
  try {
    const raw = await fs.readFile(path.resolve(process.cwd(), PERF_HISTORY_PATH), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function perfCommand(options = {}) {
  if (options.clear) {
    try {
      await fs.rm(path.resolve(process.cwd(), PERF_HISTORY_PATH), { force: true });
      printSuccess(chalk.green('Cleared performance history.'));
    } catch {
      printWarning(chalk.yellow('No performance data to clear.'));
    }
    return;
  }

  const history = await readHistory();
  const days = Number(options.days || 7);

  printInfo(chalk.cyan('\n📈 Performance Summary\n'));
  if (history.length === 0) {
    printWarning(chalk.yellow('No performance data recorded yet.'));
    return;
  }

  const recent = history.slice(-Math.max(1, days * 20));
  const avgMs = Math.round(recent.reduce((acc, row) => acc + (row.durationMs || 0), 0) / recent.length);
  const maxMs = Math.max(...recent.map((row) => row.durationMs || 0));
  const minMs = Math.min(...recent.map((row) => row.durationMs || 0));

  printInfo(`Samples: ${recent.length}`);
  printInfo(`Average: ${avgMs}ms`);
  printInfo(`Min: ${minMs}ms`);
  printInfo(`Max: ${maxMs}ms`);

  if (options.summary) {
    printInfo(chalk.gray(`Window: last ${days} day(s)`));
  }
}

export function registerPerfCommand(program) {
  program
    .command('perf')
    .description('Show lightweight performance metrics summary')
    .option('--summary', 'Show detailed summary')
    .option('--days <n>', 'Number of days to include', '7')
    .option('--clear', 'Clear performance history')
    .action(perfCommand);
}

export default { registerPerfCommand, perfCommand };

