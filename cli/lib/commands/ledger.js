// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import fs from 'fs/promises';
import { ledger } from '../ledger/index.js';
import { addDecision } from '../ledger/decisions.js';
import { printInfo, printSuccess, printError, printWarning } from '../utils/output.js';

export function registerLedgerCommand(program) {
  const command = program.command('ledger').description('Immutable audit trail for AI decisions');

  command
    .command('add <decision>')
    .description('Record a decision in the ledger')
    .option('--agent <name>', 'Agent name', 'manual')
    .option('--rationale <text>', 'Decision rationale')
    .option('--files <list>', 'Comma-separated affected files')
    .action(async (decision, options) => {
      const files = options.files ? options.files.split(',').map((f) => f.trim()) : [];
      const entry = await addDecision({
        agent: options.agent,
        decision,
        rationale: options.rationale,
        affected_files: files,
      });
      printSuccess(chalk.green(`\n✅ Decision recorded at ${entry.timestamp}\n`));
    });

  command
    .command('search <query>')
    .description('Search ledger entries')
    .action(async (query) => {
      const results = await ledger.searchLedger(query);
      if (!results.length) {
        printWarning(chalk.yellow('\nNo ledger entries found.\n'));
        return;
      }
      printInfo(chalk.cyan('\nLedger results:\n'));
      results.forEach((entry) => {
        printInfo(chalk.white(`- ${entry.timestamp} ${entry.agent} ${entry.action}`));
        if (entry.rationale) printInfo(chalk.gray(`  ${entry.rationale}`));
      });
    });

  command
    .command('range')
    .description('Query ledger by date range')
    .option('--from <date>', 'Start date (YYYY-MM-DD)')
    .option('--to <date>', 'End date (YYYY-MM-DD)')
    .action(async (options) => {
      const results = await ledger.rangeLedger(options.from, options.to);
      printInfo(chalk.cyan(`\nLedger entries: ${results.length}\n`));
      results.forEach((entry) => {
        printInfo(chalk.white(`- ${entry.timestamp} ${entry.agent} ${entry.action}`));
      });
    });

  command
    .command('agent <name>')
    .description('Query ledger by agent')
    .action(async (name) => {
      const results = await ledger.agentLedger(name);
      printInfo(chalk.cyan(`\nLedger entries for ${name}: ${results.length}\n`));
      results.forEach((entry) => {
        printInfo(chalk.white(`- ${entry.timestamp} ${entry.action}`));
      });
    });

  command
    .command('export')
    .description('Export ledger')
    .option('--format <format>', 'json or csv', 'json')
    .option('--output <path>', 'Output file path')
    .action(async (options) => {
      const output = await ledger.exportLedger(options.format);
      if (options.output) {
        await fs.writeFile(options.output, output);
        printSuccess(chalk.green(`\n✅ Ledger exported to ${options.output}\n`));
      } else {
        process.stdout.write(output + '\n');
      }
    });

  command
    .command('verify')
    .description('Verify ledger checksums')
    .action(async () => {
      const result = await ledger.verifyLedger();
      if (result.valid) {
        printSuccess(chalk.green('\n✅ Ledger checksums valid.\n'));
      } else {
        printError(chalk.red(`\n❌ Ledger checksum failures: ${result.invalid.length}\n`));
      }
    });
}
