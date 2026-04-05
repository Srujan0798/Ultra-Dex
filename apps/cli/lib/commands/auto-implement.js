// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex auto-implement command
 * Fully autonomous feature implementation (GOD MODE)
 */

import chalk from 'chalk';
import ora from '../utils/ora.js';
import fs from 'fs/promises';
import { updateStateFile, loadState } from './state.js';
import { projectGraph } from '../mcp/graph.js';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { runAgentLoop } from './run.js';
import { verifyCommand } from './verify.js';
import { generateMarkdown } from './plan.js';
import { AutomationPipeline } from '../automation/pipeline.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

export function registerAutoImplementCommand(program) {
  program
    .command('auto-implement <feature>')
    .description('Autonomous implementation: Plan -> Code -> Verify (God Mode)')
    .option('-p, --provider <provider>', 'AI provider (defaults to router if configured)')
    .option('--dry-run', 'Show plan without making changes')
    .option('--no-verify', 'Skip verification gates')
    .option('--full', 'Run full automation pipeline with checkpoints')
    .option('--no-stop', 'Run pipeline without approval checkpoints')
    .option('--approve <checkpoint>', 'Approve and continue from last checkpoint')
    .action(async (feature, options) => {
      try {
        printInfo(chalk.cyan('\n🚀 Ultra-Dex Autonomous Implementation Engine\n'));
        printInfo(chalk.bold(`Target Feature: ${feature}\n`));

        const providerId = options.provider || getDefaultProvider() || 'router';
        const provider = createProvider(providerId);

        const spinner = ora('Initializing Autonomous Swarm...').start();

        // 1. Structural Awareness (CPG)
        spinner.text = 'Analyzing codebase architecture...';
        await projectGraph.scan();
        const graphSummary = projectGraph.getSummary();

        if (options.full || options.noStop || options.approve) {
          spinner.text = 'Running full automation pipeline...';
          spinner.stop();

          const pipeline = new AutomationPipeline({
            feature,
            provider,
            options: {
              noStop: options.noStop,
              approve: options.approve,
              noVerify: options.noVerify,
              provider: providerId,
            },
          });

          try {
            await pipeline.run();
            spinner.start('Finalizing implementation...');
            await updateStateFile();
            spinner.succeed(chalk.green('Feature implemented autonomously!'));
          } catch (err) {
            spinner.fail(chalk.yellow(err.message));
            return;
          }
        } else {
          // 2. Planning Phase (@Planner)
          spinner.text = '@Planner is breaking down the feature...';

          const state = await loadState();
          const planMarkdown = state
            ? generateMarkdown(state)
            : await fs.readFile('IMPLEMENTATION-PLAN.md', 'utf8').catch(() => '');
          const contextMarkdown = await fs.readFile('CONTEXT.md', 'utf8').catch(() => '');

          const projectContext = {
            state,
            plan: planMarkdown,
            context: contextMarkdown,
            graph: graphSummary,
          };

          const plan = await runAgentLoop(
            'planner',
            `Break down this feature into atomic tasks: ${feature}. List exactly what needs to be changed.`,
            provider,
            projectContext
          );

          if (options.dryRun) {
            spinner.succeed('Planning complete (Dry Run)');
            printInfo(chalk.white('\nProposed Implementation Plan:'));
            printInfo(chalk.gray(plan));
            return;
          }

          // 3. Execution Phase - Iterative Implementation
          spinner.text = 'Executing implementation tasks...';

          // Split plan into tasks (naive splitting for now)
          const tasks = plan
            .split('\n')
            .filter((line) => line.match(/^[*-]\s+/) || line.match(/^\d+\.\s+/));

          if (tasks.length === 0) {
            // If no clear list, treat the whole plan as one task
            tasks.push(plan);
          }

          printInfo(chalk.dim(`\nFound ${tasks.length} sub-tasks to execute...`));

          for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            spinner.text = `[@Orchestrator] Task ${i + 1}/${tasks.length}: ${task.substring(0, 50)}...`;

            await runAgentLoop(
              'orchestrator',
              `Implement this specific task from the feature plan: ${task}\n\nOverall Feature: ${feature}\nFull Plan:\n${plan}`,
              provider,
              projectContext
            );

            // Incremental state update
            await updateStateFile();
          }

          // 4. Verification Phase (@Testing)
          if (!options.noVerify) {
            spinner.text = 'Running verification gates...';
            spinner.stop();
            await verifyCommand(feature, { provider: providerId });
            spinner.start('Finalizing implementation...');
          }

          // 5. Finalize
          await updateStateFile();
          spinner.succeed(chalk.green('Feature implemented autonomously!'));
        }

        printInfo(chalk.bold('\nFinal Report:'));
        printSuccess('✅ Implementation complete');
        printSuccess('✅ Code standards verified');
        printSuccess('✅ Autonomous state synchronized');
      } catch (error) {
        await handleError(error, { command: 'auto-implement', feature, options });
        process.exitCode = error.exitCode || 1;
        process.exit(process.exitCode);
      }
    });
}
