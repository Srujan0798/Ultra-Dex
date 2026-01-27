/**
 * ultra-dex auto-implement command
 * Fully autonomous feature implementation (GOD MODE)
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { loadState, updateState } from './state.js';
import { buildGraph, getImpactAnalysis } from '../utils/graph.js';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { runAgentLoop } from './run.js';

export function registerAutoImplementCommand(program) {
  program
    .command('auto-implement <feature>')
    .description('Autonomous implementation: Plan -> Code -> Verify (God Mode)')
    .option('-p, --provider <provider>', 'AI provider (defaults to router if configured)')
    .option('--dry-run', 'Show plan without making changes')
    .action(async (feature, options) => {
      console.log(chalk.cyan('\n🚀 Ultra-Dex Autonomous Implementation Engine\n'));
      console.log(chalk.bold(`Target Feature: ${feature}\n`));

      const providerId = options.provider || getDefaultProvider() || 'router';
      const provider = createProvider(providerId);
      
      const spinner = ora('Initializing God Mode Swarm...').start();

      try {
        // 1. Structural Awareness (CPG)
        const graph = await buildGraph();
        spinner.text = 'Analyzing architectural impact...';
        
        // 2. Planning Phase (@Planner)
        spinner.text = '@Planner is breaking down the feature...';
        const projectContext = {
            context: `Feature Request: ${feature}\nCodebase Nodes: ${graph.nodes.length}\nEdges: ${graph.edges.length}`,
            graph
        };

        const plan = await runAgentLoop('planner', `Break down this feature: ${feature}`, provider, projectContext);
        
        if (options.dryRun) {
            spinner.succeed('Planning complete (Dry Run)');
            console.log(chalk.white('\nProposed Plan:'));
            console.log(chalk.gray(plan));
            return;
        }

        // 3. Execution Phase (@Backend/@Frontend)
        spinner.text = 'Agents are implementing code...';
        const executionResult = await runAgentLoop('orchestrator', `Coordinate the implementation of this plan:\n${plan}`, provider, projectContext);

        // 4. Verification Phase (@Testing)
        spinner.text = '@Testing is verifying changes...';
        const verification = await runAgentLoop('testing', `Verify the implementation of: ${feature}`, provider, projectContext);

        // 5. Finalize
        await updateState();
        spinner.succeed(chalk.green('Feature implemented autonomously!'));
        
        console.log(chalk.bold('\nFinal Report:'));
        console.log(chalk.gray(verification));

      } catch (e) {
        spinner.fail(chalk.red(`Auto-Implementation failed: ${e.message}`));
      }
    });
}
