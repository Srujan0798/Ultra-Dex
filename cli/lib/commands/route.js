// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import { routeTaskWithEvaluation } from '../router/router.js';
import { printInfo, printError } from '../utils/output.js';

export function registerRouteCommand(program) {
  program
    .command('route <task>')
    .description('Show model routing decision for a task')
    .option('--strategy <name>', 'Routing strategy (cost_optimized, performance, privacy)')
    .option('--provider <provider>', 'Preferred provider')
    .option('--json', 'Output JSON')
    .action(async (task, options) => {
      try {
        const result = await routeTaskWithEvaluation(task, {
          strategy: options.strategy,
          provider: options.provider,
        });

        if (options.json) {
          process.stdout.write(JSON.stringify(result, null, 2) + '\n');
          return;
        }

        printInfo(chalk.cyan('\n🧭 Model Routing\n'));
        printInfo(
          `Task type: ${chalk.white(result.classification.type)} (confidence ${(result.classification.confidence * 100).toFixed(0)}%)`
        );
        printInfo(`Selected model: ${chalk.green(result.preferredModel)}`);
        printInfo(
          chalk.gray(
            `Provider: ${result.routeInfo.provider} | Fallbacks: ${result.routeInfo.fallbackChain.join(' → ')}`
          )
        );
      } catch (error) {
        printError(chalk.red(`Routing failed: ${error.message}`));
      }
    });
}
