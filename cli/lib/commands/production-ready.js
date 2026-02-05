import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { runAutomatedGates } from './verify.js';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

async function loadCoverage(projectDir) {
  try {
    const raw = await fs.readFile(path.join(projectDir, 'coverage', 'coverage-summary.json'), 'utf8');
    const summary = JSON.parse(raw);
    return summary.total?.lines?.pct ?? 0;
  } catch {
    return 0;
  }
}

export function registerProductionReadyCommand(program) {
  program
    .command('production-ready')
    .description('Check production readiness')
    .action(async () => {
      const projectDir = process.cwd();
      const blockers = [];

      const automated = await runAutomatedGates(projectDir);
      const failed = Object.entries(automated).filter(([_, status]) => status === 'FAIL');
      if (failed.length) blockers.push(`Failed verification gates: ${failed.map(([n]) => n).join(', ')}`);

      const coverage = await loadCoverage(projectDir);
      if (coverage < 80) blockers.push(`Coverage below 80% (${coverage}%)`);

      try {
        await fs.access(path.join(projectDir, 'CONTEXT.md'));
      } catch {
        blockers.push('Missing CONTEXT.md');
      }

      printInfo(chalk.cyan('\nProduction Readiness Report\n'));
      printInfo(`Coverage: ${coverage}%`);

      if (blockers.length) {
        printWarning(chalk.yellow('\nBlockers:'));
        blockers.forEach((blocker) => printWarning(`- ${blocker}`));
        process.exitCode = 1;
        return;
      }

      printSuccess(chalk.green('\n✅ Project is production-ready.'));
    });
}
