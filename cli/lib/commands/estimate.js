/**
 * ultra-dex estimate - Token and cost estimator for AI operations
 *
 * Estimates token usage and costs across different AI providers
 * Helps users budget and compare costs before running agents
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

// Token pricing per 1K tokens (as of Feb 2026)
const PRICING = {
  openai: {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  },
  anthropic: {
    'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-opus': { input: 15.00, output: 75.00 },
    'claude-3-haiku': { input: 0.25, output: 1.25 },
  },
  google: {
    'gemini-pro': { input: 0.50, output: 1.50 },
    'gemini-ultra': { input: 7.00, output: 21.00 },
  },
  local: {
    'ollama': { input: 0.00, output: 0.00, note: 'Local - pay for electricity only' },
    'lm-studio': { input: 0.00, output: 0.00, note: 'Local - pay for electricity only' },
  },
};

// Average tokens per task type (rough estimates)
const TASK_ESTIMATES = {
  'simple-task': { input: 500, output: 300, description: 'Simple code review or fix' },
  'feature-impl': { input: 2000, output: 1500, description: 'Implement single feature' },
  'plan-generation': { input: 3000, output: 2500, description: 'Generate implementation plan' },
  'complex-refactor': { input: 5000, output: 4000, description: 'Complex refactoring' },
  'agent-swarm': { input: 10000, output: 8000, description: 'Full agent swarm execution' },
  'context-sync': { input: 1000, output: 500, description: 'Context synchronization' },
};

export function registerEstimateCommand(program) {
  program
    .command('estimate')
    .description('Estimate token usage and costs for AI operations')
    .argument('[task]', 'Task description or type (simple-task, feature-impl, plan-generation, complex-refactor, agent-swarm, context-sync)')
    .option('-t, --tokens <tokens>', 'Total token count (input+output)', parseInt)
    .option('-i, --input-tokens <tokens>', 'Input token count', parseInt)
    .option('-o, --output-tokens <tokens>', 'Output token count', parseInt)
    .option('-p, --provider <provider>', 'Specific provider (openai, anthropic, google, local)', 'all')
    .option('-m, --model <model>', 'Specific model name')
    .option('--compare', 'Compare all providers', false)
    .option('--monthly <tasks>', 'Estimate monthly cost (number of tasks per month)', parseInt)
    .option('--hours <hours>', 'Base hours for overhead calculation', parseFloat)
    .option('--tasks <count>', 'Number of tasks (for context switching)', parseInt)
    .option('--new-tech', 'Apply new technology overhead')
    .option('--integration', 'Apply integration overhead')
    .option('--uncertainty', 'Apply uncertainty overhead')
    .option('--json', 'Output as JSON')
    .action(async (task, options) => {
      try {
        printInfo(chalk.cyan.bold('⚡ Ultra-Dex Cost Estimator\n'));

        if (options.hours) {
          const base = Number(options.hours);
          const factors = [];
          factors.push({ name: 'Testing', value: 0.25 });
          factors.push({ name: 'Code Review', value: 0.10 });
          if ((options.tasks || 1) > 2) factors.push({ name: 'Context Switching', value: 0.15 });
          if (options.newTech) factors.push({ name: 'New Technology', value: 0.30 });
          if (options.integration) factors.push({ name: 'Integration', value: 0.20 });
          if (options.uncertainty) factors.push({ name: 'Uncertainty', value: 0.20 });

          const totalFactor = factors.reduce((sum, f) => sum + f.value, 0);
          const actualHours = base * (1 + totalFactor);
          const needsSplit = actualHours > 9;

          printInfo(chalk.white.bold('🧮 Overhead Estimate:'));
          printInfo(`   Base: ${base}h`);
          factors.forEach(f => printInfo(`   + ${Math.round(f.value * 100)}% ${f.name}`));
          printInfo(`   Total: ${actualHours.toFixed(2)}h`);
          if (needsSplit) {
            printWarning(chalk.yellow('⚠️  Consider splitting into smaller tasks (<9h each).'));
          }
          printInfo('');
        }

        // Validate token inputs
        if (options.tokens !== undefined && (isNaN(options.tokens) || options.tokens < 0)) {
          printError(chalk.red('❌ Error: --tokens must be a non-negative number'));
          process.exitCode = 1;
          process.exit(process.exitCode);
        }
        if (options.inputTokens !== undefined && (isNaN(options.inputTokens) || options.inputTokens < 0)) {
          printError(chalk.red('❌ Error: --input-tokens must be a non-negative number'));
          process.exitCode = 1;
          process.exit(process.exitCode);
        }
        if (options.outputTokens !== undefined && (isNaN(options.outputTokens) || options.outputTokens < 0)) {
          printError(chalk.red('❌ Error: --output-tokens must be a non-negative number'));
          process.exitCode = 1;
          process.exit(process.exitCode);
        }
        if (options.monthly !== undefined && (isNaN(options.monthly) || options.monthly < 1)) {
          printError(chalk.red('❌ Error: --monthly must be a positive number'));
          process.exitCode = 1;
          process.exit(process.exitCode);
        }
        if (options.provider !== 'all' && !PRICING[options.provider]) {
          printError(chalk.red(`❌ Error: Unknown provider: ${options.provider}`));
          printInfo(chalk.gray('   Available: openai, anthropic, google, local'));
          process.exitCode = 1;
          process.exit(process.exitCode);
        }

        // Determine token counts
        let inputTokens, outputTokens;

        if (options.tokens) {
          // Assume 60/40 split for input/output if only total provided
          inputTokens = Math.floor(options.tokens * 0.6);
          outputTokens = Math.floor(options.tokens * 0.4);
        } else if (options.inputTokens && options.outputTokens) {
          inputTokens = options.inputTokens;
          outputTokens = options.outputTokens;
        } else if (task && TASK_ESTIMATES[task]) {
          inputTokens = TASK_ESTIMATES[task].input;
          outputTokens = TASK_ESTIMATES[task].output;
          printInfo(chalk.blue(`📋 Task Type: ${TASK_ESTIMATES[task].description}\n`));
        } else if (task) {
          // Estimate based on task description length
          const wordCount = task.split(/\s+/).length;
          inputTokens = Math.max(500, wordCount * 2);
          outputTokens = Math.floor(inputTokens * 0.8);
          printInfo(chalk.blue(`📝 Task: "${task.substring(0, 60)}${task.length > 60 ? '...' : ''}"\n`));
          printInfo(chalk.gray(`   Estimated from ${wordCount} words\n`));
        } else {
          // Default estimate
          inputTokens = 2000;
          outputTokens = 1500;
          printWarning(chalk.yellow('⚠️  No task specified, using default estimate\n'));
        }

        const totalTokens = inputTokens + outputTokens;

        if (!options.json) {
          printInfo(chalk.white.bold('📊 Token Estimate:'));
          printInfo(`   Input:  ${chalk.cyan(inputTokens.toLocaleString())} tokens`);
          printInfo(`   Output: ${chalk.cyan(outputTokens.toLocaleString())} tokens`);
          printInfo(`   Total:  ${chalk.cyan.bold(totalTokens.toLocaleString())} tokens\n`);
        }

        // Calculate costs
        const estimates = [];

        for (const [provider, models] of Object.entries(PRICING)) {
          if (options.provider !== 'all' && provider !== options.provider) continue;
          if (options.model && !models[options.model]) continue;

          for (const [model, pricing] of Object.entries(models)) {
            if (options.model && model !== options.model) continue;

            const inputCost = (inputTokens / 1000) * pricing.input;
            const outputCost = (outputTokens / 1000) * pricing.output;
            const totalCost = inputCost + outputCost;
            const monthlyCost = options.monthly ? totalCost * options.monthly : null;

            estimates.push({
              provider,
              model,
              inputCost,
              outputCost,
              totalCost,
              monthlyCost,
              note: pricing.note || null,
            });
          }
        }

        // Sort by cost (cheapest first, except put free at bottom)
        estimates.sort((a, b) => {
          if (a.totalCost === 0 && b.totalCost === 0) return 0;
          if (a.totalCost === 0) return 1;
          if (b.totalCost === 0) return -1;
          return a.totalCost - b.totalCost;
        });

        if (options.json) {
          process.stdout.write(JSON.stringify({
            task: task || 'default',
            inputTokens,
            outputTokens,
            totalTokens,
            monthlyTasks: options.monthly || null,
            estimates,
          }, null, 2) + '\n');
          return;
        }

        // Display cost table
        printInfo(chalk.white.bold('💰 Cost Estimates:\n'));

        const table = new Table({
          head: ['Provider', 'Model', 'Input', 'Output', 'Total', options.monthly ? 'Monthly' : ''],
          colWidths: [12, 20, 12, 12, 12, options.monthly ? 12 : 0],
          style: { head: ['cyan'] },
        });

        for (const est of estimates) {
          const row = [
            chalk.white(est.provider),
            est.model,
            `$${est.inputCost.toFixed(4)}`,
            `$${est.outputCost.toFixed(4)}`,
            est.totalCost === 0
              ? chalk.green.bold('FREE')
              : chalk.yellow.bold(`$${est.totalCost.toFixed(4)}`),
          ];

          if (options.monthly) {
            row.push(est.monthlyCost === 0
              ? chalk.green('FREE')
              : chalk.yellow(`$${est.monthlyCost.toFixed(2)}`)
            );
          }

          table.push(row);

          if (est.note) {
            table.push([{ colSpan: options.monthly ? 6 : 5, content: chalk.gray(`   ${est.note}`) }]);
          }
        }

        process.stdout.write(table.toString() + '\n');

        // Show cheapest option
        const cheapest = estimates.find(e => e.totalCost > 0) || estimates[0];
        printSuccess(chalk.green(`\n✅ Cheapest paid option: ${cheapest.provider} ${cheapest.model} at $${cheapest.totalCost.toFixed(4)}`));

        if (options.monthly) {
          printSuccess(chalk.green(`📅 Monthly estimate (${options.monthly} tasks): $${cheapest.monthlyCost.toFixed(2)}`));
        }

        // Budget warnings
        if (options.monthly && cheapest.monthlyCost > 100) {
          printWarning(chalk.yellow(`\n⚠️  Warning: Monthly cost exceeds $100. Consider using local models (Ollama) for testing.`));
        }

        if (totalTokens > 10000) {
          printWarning(chalk.yellow(`\n⚠️  Warning: Large token count (${totalTokens.toLocaleString()}). Consider breaking into smaller tasks.`));
        }

        printInfo(chalk.gray(`\n💡 Tip: Use --json for programmatic output or --compare to see all providers`));
        printInfo(chalk.gray(`   Prices as of February 2026. Actual costs may vary.`));

      } catch (error) {
        await handleError(error, { command: 'estimate', task, options });
        process.exitCode = error.exitCode || 1;
        process.exit(process.exitCode);
      }
    });

  program
    .command('estimate-task-types')
    .description('Show predefined task types and their token estimates')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan.bold('📋 Predefined Task Types\n'));

        const table = new Table({
          head: ['Task Type', 'Description', 'Input Tokens', 'Output Tokens', 'Total'],
          style: { head: ['cyan'] },
        });

        for (const [type, data] of Object.entries(TASK_ESTIMATES)) {
          table.push([
            chalk.white(type),
            data.description,
            data.input.toLocaleString(),
            data.output.toLocaleString(),
            chalk.yellow.bold((data.input + data.output).toLocaleString()),
          ]);
        }

        process.stdout.write(table.toString() + '\n');
        printInfo(chalk.gray(`\n💡 Usage: ultra-dex estimate <task-type> (e.g., ultra-dex estimate feature-impl)`));
      } catch (error) {
        await handleError(error, { command: 'estimate-task-types', options });
        process.exitCode = error.exitCode || 1;
        process.exit(process.exitCode);
      }
    });

  program
    .command('estimate-providers')
    .description('Show all available providers and their pricing')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan.bold('💰 Available Providers & Models\n'));

        for (const [provider, models] of Object.entries(PRICING)) {
          printInfo(chalk.white.bold(`${provider.toUpperCase()}:`));

          const table = new Table({
            head: ['Model', 'Input/1K', 'Output/1K'],
            style: { head: ['gray'] },
          });

          for (const [model, pricing] of Object.entries(models)) {
            table.push([
              model,
              pricing.input === 0 ? chalk.green('FREE') : `$${pricing.input.toFixed(2)}`,
              pricing.output === 0 ? chalk.green('FREE') : `$${pricing.output.toFixed(2)}`,
            ]);
          }

          process.stdout.write(table.toString() + '\n');
          process.stdout.write('\n');
        }

        printInfo(chalk.gray('Prices in USD per 1,000 tokens. Last updated: February 2026'));
      } catch (error) {
        await handleError(error, { command: 'estimate-providers', options });
        process.exitCode = error.exitCode || 1;
        process.exit(process.exitCode);
      }
    });
}
