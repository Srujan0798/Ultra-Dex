#!/usr/bin/env node

/**
 * ultra-dex estimate - Token and cost estimator for AI operations
 * 
 * Estimates token usage and costs across different AI providers
 * Helps users budget and compare costs before running agents
 */

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';

const program = new Command();

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

program
  .name('ultra-dex estimate')
  .description('Estimate token usage and costs for AI operations')
  .version('1.0.0');

program
  .argument('[task]', 'Task description or type (simple-task, feature-impl, plan-generation, complex-refactor, agent-swarm, context-sync)')
  .option('-t, --tokens <tokens>', 'Total token count (input+output)', parseInt)
  .option('-i, --input-tokens <tokens>', 'Input token count', parseInt)
  .option('-o, --output-tokens <tokens>', 'Output token count', parseInt)
  .option('-p, --provider <provider>', 'Specific provider (openai, anthropic, google, local)', 'all')
  .option('-m, --model <model>', 'Specific model name')
  .option('--compare', 'Compare all providers', false)
  .option('--monthly <tasks>', 'Estimate monthly cost (number of tasks per month)', parseInt)
  .option('--json', 'Output as JSON')
  .action(async (task, options) => {
    try {
      console.log(chalk.cyan.bold('⚡ Ultra-Dex Cost Estimator\n'));

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
        console.log(chalk.blue(`📋 Task Type: ${TASK_ESTIMATES[task].description}\n`));
      } else if (task) {
        // Estimate based on task description length
        const wordCount = task.split(/\s+/).length;
        inputTokens = Math.max(500, wordCount * 2);
        outputTokens = Math.floor(inputTokens * 0.8);
        console.log(chalk.blue(`📝 Task: "${task.substring(0, 60)}${task.length > 60 ? '...' : ''}"\n`));
        console.log(chalk.gray(`   Estimated from ${wordCount} words\n`));
      } else {
        // Default estimate
        inputTokens = 2000;
        outputTokens = 1500;
        console.log(chalk.yellow('⚠️  No task specified, using default estimate\n'));
      }

      const totalTokens = inputTokens + outputTokens;

      if (!options.json) {
        console.log(chalk.white.bold('📊 Token Estimate:'));
        console.log(`   Input:  ${chalk.cyan(inputTokens.toLocaleString())} tokens`);
        console.log(`   Output: ${chalk.cyan(outputTokens.toLocaleString())} tokens`);
        console.log(`   Total:  ${chalk.cyan.bold(totalTokens.toLocaleString())} tokens\n`);
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
        console.log(JSON.stringify({
          task: task || 'default',
          inputTokens,
          outputTokens,
          totalTokens,
          monthlyTasks: options.monthly || null,
          estimates,
        }, null, 2));
        return;
      }

      // Display cost table
      console.log(chalk.white.bold('💰 Cost Estimates:\n'));

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

      console.log(table.toString());

      // Show cheapest option
      const cheapest = estimates.find(e => e.totalCost > 0) || estimates[0];
      console.log(chalk.green(`\n✅ Cheapest paid option: ${cheapest.provider} ${cheapest.model} at $${cheapest.totalCost.toFixed(4)}`));
      
      if (options.monthly) {
        console.log(chalk.green(`📅 Monthly estimate (${options.monthly} tasks): $${cheapest.monthlyCost.toFixed(2)}`));
      }

      // Budget warnings
      if (options.monthly && cheapest.monthlyCost > 100) {
        console.log(chalk.yellow(`\n⚠️  Warning: Monthly cost exceeds $100. Consider using local models (Ollama) for testing.`));
      }

      if (totalTokens > 10000) {
        console.log(chalk.yellow(`\n⚠️  Warning: Large token count (${totalTokens.toLocaleString()}). Consider breaking into smaller tasks.`));
      }

      console.log(chalk.gray(`\n💡 Tip: Use --json for programmatic output or --compare to see all providers`));
      console.log(chalk.gray(`   Prices as of February 2026. Actual costs may vary.`));

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('task-types')
  .description('Show predefined task types and their token estimates')
  .action(() => {
    console.log(chalk.cyan.bold('📋 Predefined Task Types\n'));
    
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

    console.log(table.toString());
    console.log(chalk.gray(`\n💡 Usage: ultra-dex estimate <task-type> (e.g., ultra-dex estimate feature-impl)`));
  });

program
  .command('providers')
  .description('Show all available providers and their pricing')
  .action(() => {
    console.log(chalk.cyan.bold('💰 Available Providers & Models\n'));

    for (const [provider, models] of Object.entries(PRICING)) {
      console.log(chalk.white.bold(`${provider.toUpperCase()}:`));
      
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

      console.log(table.toString());
      console.log();
    }

    console.log(chalk.gray('Prices in USD per 1,000 tokens. Last updated: February 2026'));
  });

program.parse();
