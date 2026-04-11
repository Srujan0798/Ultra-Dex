// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import ora from '../utils/ora.js';
import { agents as AGENTS_MAP } from '../utils/agents.js';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { context as contextScanner } from '../kernel/context.js';
import { printInfo, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

// Convert agents map to array for easier usage
const ALL_AGENTS = Object.values(AGENTS_MAP);

/**
 * Register the suggest command with Commander
 */
export function registerSuggestCommand(program) {
  const suggestCmd = program
    .command('suggest [query]')
    .description('Get AI agent suggestions for your task')
    .action(async (query) => {
      try {
        printInfo('\n🤖 Ultra-Dex Agent Suggester\n');

        let description = query;
        let taskType = 'custom';

        if (!description) {
          const result = await promptForTaskDetails();
          taskType = result.taskType;
          description = result.description;
        }

        // 1. Environment Analysis
        const context = await runContextAnalysis();

        // 2. Recommendations
        const providerId = getDefaultProvider();
        if (providerId && (description || taskType === 'Custom (AI Analysis)')) {
          const handled = await handleAiSuggestions(description || taskType, context, providerId);
          if (handled) return;
        } else if (!providerId) {
          printWarning(
            chalk.yellow('No AI provider configured. Falling back to static recommendations.')
          );
        }

        // 3. Fallback to static logic
        handleStaticSuggestions(taskType);
      } catch (error) {
        await handleError(error, { command: 'suggest', query });
        process.exit(error.exitCode || 1);
      }
    });

  suggestCmd._examples = [
    {
      command: 'ultra-dex suggest "Add Stripe billing"',
      description: 'Get agent workflow for a specific task',
    },
    { command: 'ultra-dex suggest', description: 'Interactive prompt for task type' },
    {
      command: 'ultra-dex suggest "Refactor auth flow"',
      description: 'AI-assisted agent sequence',
    },
  ];
}

/**
 * Interactive prompt to gather task details
 */
async function promptForTaskDetails() {
  const { taskType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'taskType',
      message: 'What are you trying to build?',
      choices: [
        'Custom (AI Analysis)',
        'New feature from scratch',
        'Authentication system',
        'Payment integration',
        'Database changes',
        'Bug fix',
        'Performance optimization',
        'Deployment/DevOps',
        'API endpoint',
        'UI component',
        'Testing',
      ],
    },
  ]);

  let description = '';
  if (taskType === 'Custom (AI Analysis)') {
    const input = await inquirer.prompt([
      {
        type: 'input',
        name: 'desc',
        message: 'Describe your task in detail:',
        validate: (val) => val.length > 0 || 'Description is required',
      },
    ]);
    description = input.desc;
  } else if (
    ['New feature from scratch', 'Bug fix', 'API endpoint', 'UI component'].includes(taskType)
  ) {
    const input = await inquirer.prompt([
      {
        type: 'input',
        name: 'desc',
        message: 'Briefly describe your task (optional):',
      },
    ]);
    description = input.desc;
  }
  return { taskType, description };
}

/**
 * Scan project environment context
 */
async function runContextAnalysis() {
  const spinner = ora('Analyzing environment context...').start();
  try {
    const ctx = await contextScanner.scan();
    spinner.succeed('Environment analyzed');
    printInfo(chalk.gray(`  Stack: ${ctx.stack} | Branch: ${ctx.git.branch || 'none'}`));
    return ctx;
  } catch (_e) {
    spinner.warn('Environment analysis partial fail');
    return { stack: 'unknown', git: { branch: 'unknown' }, files: [] };
  }
}

/**
 * Get AI-powered agent recommendations
 */
async function handleAiSuggestions(description, ctx, providerId) {
  const aiSpinner = ora('Synthesizing expert recommendations...').start();
  try {
    const provider = createProvider(providerId);
    let contextContent = '';
    try {
      contextContent = await fs.readFile(path.resolve(process.cwd(), 'CONTEXT.md'), 'utf8');
    } catch {}

    const prompt = `
You are an expert software architect using the Ultra-Dex framework.
Suggest the best workflow of agents for this task.

Available Agents:
${ALL_AGENTS.map((a) => `- @${a.name}: ${a.description}`).join('\n')}

Project Environment:
- Stack: ${ctx.stack}
- Git: ${ctx.git?.branch} (${ctx.git?.isDirty ? 'dirty' : 'clean'})

Project Context:
${contextContent.slice(0, 1000)}

User Task: ${description}

Output a JSON object:
{
  "reasoning": "Why this workflow?",
  "agents": ["@Agent1", "@Agent2"],
  "tips": ["Tip 1", "Tip 2"]
}
`;
    const response = await provider.generate(
      'You are a helpful assistant that outputs JSON.',
      prompt
    );
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      aiSpinner.succeed(chalk.green('AI Analysis Complete'));

      printInfo(chalk.bold('\n💡 AI Suggested Workflow:\n'));
      printInfo(chalk.gray(data.reasoning + '\n'));

      data.agents.forEach((agent, i) => {
        const arrow = i < data.agents.length - 1 ? '  →' : '';
        printInfo(chalk.cyan(`  ${i + 1}. ${agent}`) + arrow);
      });

      if (data.tips && data.tips.length > 0) {
        printInfo(chalk.bold('\n🧠 Pro Tips:\n'));
        data.tips.forEach((tip) => printInfo(chalk.gray(`  • ${tip}`)));
      }
      return true;
    }
    return false;
  } catch (_e) {
    aiSpinner.fail('AI analysis failed, falling back to static logic.');
    return false;
  }
}

/**
 * Handle static suggestions for common tasks
 */
function handleStaticSuggestions(taskType) {
  printInfo(chalk.bold('\n💡 Suggested Agent Workflow:\n'));

  const staticMap = {
    'New feature from scratch': {
      agents: ['@Planner', '@CTO', '@Database', '@Backend', '@Frontend', '@Testing', '@Reviewer'],
      reasoning: 'Complete feature requires full pipeline.',
    },
    'Authentication system': {
      agents: ['@Planner', '@Security', '@Database', '@Backend', '@Frontend'],
      reasoning: 'Security-focused implementation.',
    },
    'Bug fix': {
      agents: ['@Debugger', '@Testing', '@Reviewer'],
      reasoning: 'Focused fix and verification.',
    },
    'Deployment/DevOps': {
      agents: ['@DevOps', '@Security'],
      reasoning: 'Infrastructure and security review.',
    },
  };

  const recommendation = staticMap[taskType] || {
    agents: ['@Planner', '@CTO'],
    reasoning: 'Standard architectural approach.',
  };

  printInfo(chalk.gray(recommendation.reasoning + '\n'));
  recommendation.agents.forEach((agent, i) => {
    const arrow = i < recommendation.agents.length - 1 ? '  →' : '';
    printInfo(chalk.cyan(`  ${i + 1}. ${agent}`) + arrow);
  });

  printInfo(chalk.bold('\n📚 Next Steps:\n'));
  printInfo(`  1. Run "ultra-dex swarm '${taskType}'" to execute this workflow.`);
  printInfo(`  2. Check "ultra-dex agents" for more details on each agent.\n`);
}
