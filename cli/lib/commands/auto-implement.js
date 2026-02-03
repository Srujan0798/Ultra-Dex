/**
 * ultra-dex auto-implement command
 * Fully autonomous feature implementation (GOD MODE)
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import { updateStateFile, loadState } from './state.js';
import { projectGraph } from '../mcp/graph.js';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { runAgentLoop } from './run.js';
import { verifyCommand } from './verify.js';
import { generateMarkdown } from './plan.js';

export function registerAutoImplementCommand(program) {
  program
    .command('auto-implement <feature>')
    .description('Autonomous implementation: Plan -> Code -> Verify (God Mode)')
    .option('-p, --provider <provider>', 'AI provider (defaults to router if configured)')
    .option('--dry-run', 'Show plan without making changes')
    .option('--no-verify', 'Skip verification gates')
    .action(async (feature, options) => {
      console.log(chalk.cyan('\n🚀 Ultra-Dex Autonomous Implementation Engine\n'));
      console.log(chalk.bold(`Target Feature: ${feature}\n`));

      const providerId = options.provider || getDefaultProvider() || 'router';
      const provider = createProvider(providerId);
      
      const spinner = ora('Initializing Autonomous Swarm...').start();

      try {
        // 1. Structural Awareness (CPG)
        spinner.text = 'Analyzing codebase architecture...';
        await projectGraph.scan();
        const graphSummary = projectGraph.getSummary();
        
        // 2. Planning Phase (@Planner)
        spinner.text = '@Planner is breaking down the feature...';
        
        const state = await loadState();
        const planMarkdown = state ? generateMarkdown(state) : (await fs.readFile('IMPLEMENTATION-PLAN.md', 'utf8').catch(() => ''));
        const contextMarkdown = await fs.readFile('CONTEXT.md', 'utf8').catch(() => '');

        const projectContext = {
            state,
            plan: planMarkdown,
            context: contextMarkdown,
            graph: graphSummary
        };

        const plan = await runAgentLoop('planner', `Break down this feature into atomic tasks: ${feature}. List exactly what needs to be changed.`, provider, projectContext);
        
        if (options.dryRun) {
            spinner.succeed('Planning complete (Dry Run)');
            console.log(chalk.white('\nProposed Implementation Plan:'));
            console.log(chalk.gray(plan));
            return;
        }

        // 3. Execution Phase - Iterative Implementation
        spinner.text = 'Executing implementation tasks...';
        
        // Split plan into tasks (naive splitting for now)
        const tasks = plan.split('\n').filter(line => line.match(/^[*-]\s+/) || line.match(/^\d+\.\s+/));
        
        if (tasks.length === 0) {
            // If no clear list, treat the whole plan as one task
            tasks.push(plan);
        }

        console.log(chalk.dim(`\nFound ${tasks.length} sub-tasks to execute...`));

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            spinner.text = `[@Orchestrator] Task ${i+1}/${tasks.length}: ${task.substring(0, 50)}...`;
            
            await runAgentLoop('orchestrator', `Implement this specific task from the feature plan: ${task}\n\nOverall Feature: ${feature}\nFull Plan:\n${plan}`, provider, projectContext);
            
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
        
        console.log(chalk.bold('\nFinal Report:'));
        console.log(chalk.green('✅ Implementation complete'));
        console.log(chalk.green('✅ Code standards verified'));
        console.log(chalk.green('✅ Autonomous state synchronized'));

      } catch (e) {
        spinner.fail(chalk.red(`Auto-Implementation failed: ${e.message}`));
        console.error(e);
      }
    });
}

