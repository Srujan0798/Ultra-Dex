import chalk from 'chalk';
import { startVibeSession } from '../vibe/interface.js';
import { printError, printInfo } from '../utils/output.js';

export function registerVibeCommand(program) {
  program
    .command('vibe')
    .description('Natural language vibe coding mode')
    .option('--mode <mode>', 'Initial mode (create|modify|explain|debug)', 'create')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\nStarting Vibe mode...'));
        await startVibeSession({ mode: options.mode });
      } catch (error) {
        printError(chalk.red(`Vibe failed: ${error.message}`));
      }
    });
}
