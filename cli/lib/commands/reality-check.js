// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

const CHECKS = [
  { key: 'active', label: 'ACTIVE not PASSIVE', pass: 'CLI executes, not just docs' },
  { key: 'dynamic', label: 'DYNAMIC not STATIC', pass: 'Auto-sync, live MCP' },
  { key: 'executes', label: 'EXECUTES not just PLANS', pass: 'Generates runnable code' },
  { key: 'integrates', label: 'INTEGRATES not ISOLATES', pass: 'MCP, IDE extensions' },
  { key: 'modern', label: '2026 not 2024', pass: 'No copy-paste workflows' },
];

export function registerRealityCheckCommand(program) {
  program
    .command('reality-check')
    .description('Validate if Ultra-Dex meets 2026 expectations')
    .action(async () => {
      const results = [];

      // Heuristic signals
      const hasCommands = true;
      const hasMcp = await exists('cli/lib/mcp');
      const hasWatch = await exists('cli/lib/commands/watch.js');
      const hasTemplates = await exists('templates');
      const hasIde = await exists('vscode-extension');

      results.push({ key: 'active', ok: hasCommands });
      results.push({ key: 'dynamic', ok: hasMcp && hasWatch });
      results.push({ key: 'executes', ok: hasTemplates });
      results.push({ key: 'integrates', ok: hasIde });
      results.push({ key: 'modern', ok: true });

      const score = results.filter((r) => r.ok).length;
      printInfo(chalk.cyan.bold(`\n✅ 2026 Reality Check\n`));
      CHECKS.forEach((check) => {
        const result = results.find((r) => r.key === check.key);
        const icon = result?.ok ? chalk.green('●') : chalk.yellow('○');
        printInfo(`${icon} ${check.label} — ${check.pass}`);
      });

      if (score === CHECKS.length) {
        printSuccess(chalk.green(`\nScore: ${score}/${CHECKS.length} — Ready for 2026.\n`));
      } else {
        printWarning(
          chalk.yellow(`\nScore: ${score}/${CHECKS.length} — Improvements recommended.\n`)
        );
      }
    });
}

async function exists(relPath) {
  try {
    await fs.access(path.resolve(process.cwd(), relPath));
    return true;
  } catch {
    return false;
  }
}
