// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex forge command
 * NL-to-Code: Manifests a project from a natural language request
 */

import chalk from 'chalk';
import ora from 'ora';
import { runPipeline } from '../nl-pipeline/index.js';
import { printError, printInfo, printSuccess } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

export function registerForgeCommand(program) {
  program
    .command('forge <request>')
    .description('NL-to-Code: Build and deploy a project from a simple description')
    .option('-o, --output <directory>', 'Output directory', '.')
    .option('--deploy', 'Automatically deploy after successful build', false)
    .action(async (request, options) => {
      try {
        printInfo(chalk.bold.cyan('\n🔨 Ultra-Dex Forge: Manifesting Reality\n'));
        printInfo(chalk.gray(`Request: "${request}"\n`));

        const spinner = ora('Initializing NL-to-Code pipeline...').start();

        // Execute the full pipeline
        const result = await runPipeline(request);

        spinner.succeed('Pipeline execution complete!');

        printSuccess(chalk.green('\n✅ Project forged successfully!'));
        printInfo(chalk.white(`  Intent: ${result.parsed.intent}`));
        printInfo(chalk.white(`  Plan: IMPLEMENTATION-PLAN.md generated`));

        if (result.tests.ok) {
          printSuccess(chalk.green('  Tests: All tests passed'));
        } else {
          printError(chalk.red('  Tests: Some tests failed (See logs)'));
        }

        if (result.deployment.ok) {
          printSuccess(chalk.green(`  Deployment: ${result.deployment.message}`));
        } else {
          printInfo(chalk.yellow(`  Deployment: ${result.deployment.message}`));
        }

        printInfo(chalk.bold('\nNext steps:'));
        printInfo(chalk.cyan(`  1. cd ${options.output}`));
        printInfo(chalk.cyan('  2. ultra-dex serve (Start the kernel)'));
        printInfo(chalk.cyan('  3. ultra-dex dashboard (Monitor the build)\n'));
      } catch (error) {
        await handleError(error, { command: 'forge', request, options });
        process.exitCode = 1;
        process.exit(process.exitCode);
      }
    });
}

export default { registerForgeCommand };
