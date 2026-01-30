/**
 * ultra-dex build command
 * Auto-Pilot: Finds the next pending task and executes it using Agents.
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
// import path from "path";
import { loadState } from './plan.js';
import { runAgentLoop } from './run.js';
import { createProvider, getDefaultProvider, checkConfiguredProviders } from '../providers/index.js';
import { showProgress } from '../utils/progress.js';
import { getRandomMessage } from '../utils/messages.js';

async function readProjectContext() {
  const context = {};
  try { context.plan = await fs.readFile('IMPLEMENTATION-PLAN.md', 'utf8'); } catch { context.plan = null; }
  try { context.context = await fs.readFile('CONTEXT.md', 'utf8'); } catch { context.context = null; }
  context.state = await loadState();
  return context;
}

export function registerBuildCommand(program) {
  program
    .command('build')
    .description('Auto-Pilot: Execute the next pending task from the plan')
    .option('-p, --provider <provider>', 'AI provider')
    .option('-k, --key <apiKey>', 'API key')
    .option('--dry-run', 'Preview the task without executing')
    .action(async (options) => {
      console.log(chalk.cyan('\n⚡ Ultra-Dex Auto-Pilot\n'));
      
      // Check for API key
      const configured = checkConfiguredProviders();
      const hasProvider = configured.some(p => p.configured) || options.key;

      if (!hasProvider && !options.dryRun) {
        console.log(chalk.yellow('⚠️  No API keys found.'));
        console.log(chalk.white('Set an API key to enable Auto-Pilot.'));
        return;
      }

      const state = await loadState();
      if (!state) {
        console.log(chalk.red('❌ No project state found. Run "ultra-dex init" first.'));
        return;
      }

      // Find next pending task
      let nextTask = null;
      let currentPhase = null;

      for (const phase of state.phases) {
        const pending = phase.steps.find(s => s.status !== 'completed');
        if (pending) {
          nextTask = pending;
          currentPhase = phase;
          break;
        }
      }

      if (!nextTask) {
        console.log(chalk.green('✅ All phases completed! The project is ready.'));
        return;
      }

      // Show Progress
      showProgress([`Phase: ${currentPhase.name}`, `Target: ${nextTask.task}`]);

      // Heuristic to pick agent (naive)
      let agentName = 'backend'; // default
      const taskLower = nextTask.task.toLowerCase();
      if (taskLower.includes('ui') || taskLower.includes('component') || taskLower.includes('page')) agentName = 'frontend';
      if (taskLower.includes('db') || taskLower.includes('schema') || taskLower.includes('database')) agentName = 'database';
      if (taskLower.includes('plan') || taskLower.includes('break down')) agentName = 'planner';
      if (taskLower.includes('test')) agentName = 'testing';
      
      console.log(chalk.gray(`Activating Agent: @${agentName}`));

      if (options.dryRun) {
        console.log(chalk.yellow('\nDry run mode. Exiting.'));
        return;
      }

      const providerId = options.provider || getDefaultProvider();
      const provider = createProvider(providerId, { apiKey: options.key, maxTokens: 8000 });
      const context = await readProjectContext();

      console.log(chalk.gray('─'.repeat(50)));
      
      const spinner = ora(getRandomMessage('loading')).start();
      try {
        const result = await runAgentLoop(agentName, nextTask.task, provider, context);
        spinner.succeed(chalk.green('Task execution completed'));

        // Save output
        const filename = `task-${nextTask.id}-${agentName}.md`;
        await fs.writeFile(filename, result);
        console.log(chalk.green(`\n✅ Task output saved to ${filename}`));
        console.log(chalk.gray('Review the code and mark the task as completed in .ultra/state.json'));
      } catch (error) {
        spinner.fail(chalk.red('Task execution failed'));
        console.error(error);
      }
    });
}

export default { registerBuildCommand };
