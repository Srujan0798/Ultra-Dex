import chalk from 'chalk';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import { ledger } from '../ledger/index.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';

const exec = promisify(execCb);

export function registerCommitCommand(program) {
  program
    .command('commit')
    .description('Commit with latest ledger decision appended')
    .option('-m, --message <message>', 'Commit message')
    .option('--no-verify', 'Skip git hooks', false)
    .action(async (options) => {
      try {
        if (!options.message) {
          printError(chalk.red('Commit message required. Use -m "message".'));
          return;
        }

        const entries = await ledger.readLedger();
        const latest = entries[entries.length - 1];
        const decisionText = latest?.decision?.selected_option || latest?.output || latest?.rationale || '';

        const extra = decisionText ? ` Decision: ${decisionText}` : '';
        const message = `${options.message}${extra}`;
        const args = options.noVerify ? ' --no-verify' : '';

        await exec(`git commit -m "${message.replace(/"/g, '\\"')}"${args}`);
        printSuccess(chalk.green('✅ Commit created with ledger decision appended.'));
      } catch (error) {
        printError(chalk.red(`Commit failed: ${error.message}`));
      }
    });
}
