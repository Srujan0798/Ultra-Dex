/**
 * ultra-dex build command
 * Auto-Pilot: Finds the next pending task and executes it using Agents.
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import { loadState } from './plan.js';
import { runAgentLoop } from './run.js';
import { createProvider, getDefaultProvider, checkConfiguredProviders } from '../providers/index.js';
import { showProgress } from '../utils/progress.js';
import { getRandomMessage } from '../utils/messages.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';
import { AppError, ValidationError } from '../utils/errors.js';

/**
 * Read project context files (plan, context, state)
 */
async function readProjectContext() {
  try {
    const [plan, ctx, state] = await Promise.all([
      fs.readFile('IMPLEMENTATION-PLAN.md', 'utf8').catch(() => null),
      fs.readFile('CONTEXT.md', 'utf8').catch(() => null),
      loadState()
    ]);

    return { plan, context: ctx, state };
  } catch (error) {
    throw new AppError('Failed to read project context', { cause: error });
  }
}

/**
 * Register the build command with Commander
 * @param {Command} program Commander program instance
 */
export function registerBuildCommand(program) {
  program
    .command('build')
    .description('Auto-Pilot: Execute the next pending task from the plan')
    .option('-p, --provider <provider>', 'AI provider')
    .option('-k, --key <apiKey>', 'API key')
    .option('--dry-run', 'Preview the task without executing')
    .action(async (options) => {
      try {
        printInfo('\n⚡ Ultra-Dex Auto-Pilot\n');
        
        // 1. Validate environment
        await validateEnvironment(options);

        // 2. Load state and find next task
        const state = await loadState();
        if (!state) {
          throw new ValidationError('No project state found.', ['Run "ultra-dex init" first to initialize your project.']);
        }

        const { nextTask, currentPhase } = findNextTask(state);
        if (!nextTask) {
          printSuccess('✅ All phases completed! Your project is fully operational.');
          return;
        }

        // 3. Prepare for execution
        showProgress([`Phase: ${currentPhase.name}`, `Target: ${nextTask.task}`]);
        const agentName = selectAgentForTask(nextTask.task);
        printInfo(`Activating Agent: @${agentName}`);

        if (options.dryRun) {
          printWarning('\nDry run mode. Architectural simulation complete.');
          return;
        }

        // 4. Execute task
        await executeBuildTask(nextTask, agentName, options);
        
      } catch (error) {
        await handleError(error, { command: 'build', options });
        process.exitCode = error.exitCode || 1;
        process.exit(process.exitCode);
      }
    });
}

/**
 * Validate that the environment is ready for building
 */
async function validateEnvironment(options) {
    const availableProviders = checkConfiguredProviders();
    const providerIds = availableProviders.map(p => p.id);

    // 1. Validate specific provider if requested
    if (options.provider) {
        if (!providerIds.includes(options.provider)) {
            throw new ValidationError(`Unknown provider: ${options.provider}`, [
                `Available providers: ${providerIds.join(', ')}`
            ]);
        }

        const selected = availableProviders.find(p => p.id === options.provider);
        if (!selected.configured && !options.key && options.provider !== 'ollama' && options.provider !== 'router') {
            throw new ValidationError(`Provider "${options.provider}" is not configured.`, [
                `Please set the ${selected.envKey} environment variable or use --key.`
            ]);
        }
    }

    // 2. General provider check
    const hasAnyConfigured = availableProviders.some(p => p.configured) || options.key;
    if (!hasAnyConfigured && !options.dryRun && options.provider !== 'ollama') {
        throw new ValidationError('No AI provider keys detected.', [
            'export ANTHROPIC_API_KEY=sk-ant-...',
            'export OPENAI_API_KEY=sk-...',
            'Run "ultra-dex setup" to configure providers.'
        ]);
    }
}

/**
 * Heuristically select the best agent for a given task description
 */
function selectAgentForTask(task) {
    const taskLower = task.toLowerCase();
    if (taskLower.includes('ui') || taskLower.includes('component') || taskLower.includes('page') || taskLower.includes('frontend')) return 'frontend';
    if (taskLower.includes('db') || taskLower.includes('schema') || taskLower.includes('database') || taskLower.includes('prisma')) return 'database';
    if (taskLower.includes('plan') || taskLower.includes('break down') || taskLower.includes('requirements')) return 'planner';
    if (taskLower.includes('test') || taskLower.includes('jest') || taskLower.includes('cypress')) return 'testing';
    if (taskLower.includes('security') || taskLower.includes('auth')) return 'auth';
    if (taskLower.includes('deploy') || taskLower.includes('ci/cd') || taskLower.includes('docker')) return 'devops';
    
    return 'backend'; // Default to backend
}

/**
 * Core execution logic for a build task
 */
async function executeBuildTask(nextTask, agentName, options) {
    const providerId = options.provider || getDefaultProvider();
    const provider = createProvider(providerId, { apiKey: options.key, maxTokens: 8000 });
    const context = await readProjectContext();

    process.stdout.write(chalk.gray('─'.repeat(50)) + '\n');

    const spinner = ora(getRandomMessage('loading')).start();
    try {
      const result = await runAgentLoop(agentName, nextTask.task, provider, context);
      spinner.succeed(chalk.green('Task execution completed'));

      // Ensure output directory exists if we ever use one, currently writing to root
      const filename = `task-${nextTask.id || Date.now()}-${agentName}.md`;

      try {
        await fs.writeFile(filename, result, 'utf8');
        printSuccess(`\n✅ Task output saved to ${filename}`);
      } catch (writeError) {
        throw new AppError(`Failed to save task output to ${filename}`, {
            cause: writeError,
            details: ['Check file permissions in the current directory.']
        });
      }

      printInfo('Review the code and mark the task as completed in .ultra/state.json or using "ultra-dex plan --complete"');
    } catch (error) {
      if (spinner.isSpinning) spinner.fail(chalk.red('Task execution failed'));
      if (error instanceof AppError) throw error;
      throw new AppError('Auto-pilot task execution failed', { cause: error });
    }
}


export default { registerBuildCommand };