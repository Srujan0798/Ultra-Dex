/**
 * ultra-dex run command
 * Execute agent tasks automatically (the "swarm" approach)
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { createProvider, getDefaultProvider, checkConfiguredProviders } from '../providers/index.js';
import { validateSafePath } from '../utils/validation.js';

// Agent definitions with their capabilities
const AGENTS = {
  planner: {
    name: '@Planner',
    role: 'Task Breakdown Specialist',
    systemPrompt: `You are @Planner, an expert at breaking down software features into atomic, implementable tasks.

Your job is to:
1. Analyze the feature request
2. Break it into small tasks (4-9 hours each)
3. Identify dependencies between tasks
4. Prioritize by technical dependency order

Output format:
## Task Breakdown

### Task 1: [Name]
- **Estimated Time:** X hours
- **Dependencies:** None | Task N
- **Agent:** @Backend | @Frontend | @Database | etc.
- **Description:** What needs to be done
- **Acceptance Criteria:**
  - [ ] Criterion 1
  - [ ] Criterion 2

### Task 2: [Name]
...`,
  },
  
  cto: {
    name: '@CTO',
    role: 'Technical Architecture Lead',
    systemPrompt: `You are @CTO, the technical architecture decision maker.

Your job is to:
1. Make technology stack decisions
2. Design system architecture
3. Identify potential technical challenges
4. Set coding standards and patterns

Always consider:
- Scalability requirements
- Security implications
- Developer experience
- Time to market

Output format:
## Architecture Decision

### Decision: [What was decided]
### Rationale: [Why this choice]
### Alternatives Considered: [Other options]
### Implementation Notes: [How to implement]`,
  },

  backend: {
    name: '@Backend',
    role: 'API & Business Logic Developer',
    systemPrompt: `You are @Backend, an expert backend developer.

Your job is to:
1. Design and implement APIs
2. Write business logic
3. Handle data validation
4. Implement error handling

Code requirements:
- TypeScript with strict types
- Zod for validation
- Proper error handling
- Unit test suggestions

Output complete, production-ready code with:
- Full file paths
- All imports
- Type definitions
- Error handling`,
  },

  frontend: {
    name: '@Frontend',
    role: 'UI/UX Developer',
    systemPrompt: `You are @Frontend, an expert frontend developer.

Your job is to:
1. Build React/Next.js components
2. Implement responsive designs
3. Handle state management
4. Ensure accessibility

Code requirements:
- TypeScript with proper types
- Tailwind CSS for styling
- React hooks best practices
- Mobile-first responsive design

Output complete components with:
- Full file paths
- All imports
- Props interfaces
- Styling included`,
  },

  database: {
    name: '@Database',
    role: 'Database Architect',
    systemPrompt: `You are @Database, an expert database architect.

Your job is to:
1. Design database schemas
2. Write migrations
3. Optimize queries
4. Set up indexes

Output format:
- Prisma schema definitions
- Migration files
- Index recommendations
- Query examples`,
  },

  testing: {
    name: '@Testing',
    role: 'QA Engineer',
    systemPrompt: `You are @Testing, an expert QA engineer.

Your job is to:
1. Write unit tests
2. Write integration tests
3. Identify edge cases
4. Suggest test scenarios

Test requirements:
- Jest/Vitest syntax
- High coverage
- Edge case handling
- Mock strategies`,
  },

  reviewer: {
    name: '@Reviewer',
    role: 'Code Review Specialist',
    systemPrompt: `You are @Reviewer, a senior code reviewer.

Your job is to:
1. Review code for quality
2. Identify bugs and issues
3. Suggest improvements
4. Check security concerns

Output format:
## Code Review

### Critical Issues (Must Fix)
- Issue 1: [Description]

### Warnings (Should Fix)
- Warning 1: [Description]

### Suggestions (Nice to Have)
- Suggestion 1: [Description]

### Approved: Yes/No`,
  },
};

async function readProjectContext() {
  const context = {};
  
  try {
    context.plan = await fs.readFile('IMPLEMENTATION-PLAN.md', 'utf8');
  } catch { context.plan = null; }
  
  try {
    context.context = await fs.readFile('CONTEXT.md', 'utf8');
  } catch { context.context = null; }
  
  try {
    const stateContent = await fs.readFile('.ultra/state.json', 'utf8');
    context.state = JSON.parse(stateContent);
  } catch { context.state = null; }
  
  return context;
}

export function registerRunCommand(program) {
  program
    .command('run <agent>')
    .description('Execute an agent task automatically')
    .option('-t, --task <task>', 'Task to execute')
    .option('-p, --provider <provider>', 'AI provider (claude, openai, gemini)')
    .option('-k, --key <apiKey>', 'API key')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .option('--dry-run', 'Show prompt without executing')
    .option('--chain <agents>', 'Chain multiple agents (comma-separated)')
    .action(async (agentName, options) => {
      console.log(chalk.cyan('\n🤖 Ultra-Dex Agent Runner\n'));

      if (options.output) {
        const outputValidation = validateSafePath(options.output, 'Output file');
        if (outputValidation !== true) {
          console.log(chalk.red(outputValidation));
          process.exit(1);
        }
      }

      // Validate agent
      const agent = AGENTS[agentName.toLowerCase()];
      if (!agent) {
        console.log(chalk.red(`Unknown agent: ${agentName}`));
        console.log(chalk.gray(`Available: ${Object.keys(AGENTS).join(', ')}`));
        return;
      }

      // Check for API key
      const configured = checkConfiguredProviders();
      const hasProvider = configured.some(p => p.configured) || options.key;

      if (!hasProvider && !options.dryRun) {
        console.log(chalk.yellow('⚠️  No AI provider configured.\n'));
        console.log(chalk.white('Set an API key:'));
        console.log(chalk.gray('  export ANTHROPIC_API_KEY=your-key'));
        console.log(chalk.gray('  export OPENAI_API_KEY=your-key'));
        console.log(chalk.gray('  Or use --key option\n'));
        console.log(chalk.cyan('💡 Use --dry-run to see the prompt without executing.\n'));
        return;
      }

      // Get task
      let task = options.task;
      if (!task) {
        const { taskInput } = await inquirer.prompt([{
          type: 'input',
          name: 'taskInput',
          message: `What should ${agent.name} do?`,
          validate: t => t.length > 5 || 'Please describe the task'
        }]);
        task = taskInput;
      }

      // Load context
      const spinner = ora('Loading project context...').start();
      const projectContext = await readProjectContext();
      spinner.succeed('Context loaded');

      // Build the prompt
      const contextSection = projectContext.context ? 
        `## Project Context\n${projectContext.context.slice(0, 5000)}\n\n` : '';
      
      const planSection = projectContext.plan ?
        `## Implementation Plan (Summary)\n${projectContext.plan.slice(0, 8000)}\n\n` : '';

      const stateSection = projectContext.state ?
        `## Current State\nScore: ${projectContext.state.score}/100\nSections: ${projectContext.state.sections?.completed || 0}/34\n\n` : '';

      const fullPrompt = `${contextSection}${planSection}${stateSection}## Task\n${task}`;

      if (options.dryRun) {
        console.log(chalk.bold(`\n📋 ${agent.name} Prompt Preview\n`));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.yellow('System Prompt:'));
        console.log(chalk.gray(agent.systemPrompt.slice(0, 500) + '...'));
        console.log(chalk.yellow('\nUser Prompt:'));
        console.log(chalk.gray(fullPrompt.slice(0, 1000) + (fullPrompt.length > 1000 ? '...' : '')));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.cyan(`\nTotal prompt size: ~${(agent.systemPrompt.length + fullPrompt.length)} chars\n`));
        return;
      }

      // Execute with AI
      const providerId = options.provider || getDefaultProvider();
      console.log(chalk.gray(`Using provider: ${providerId}`));

      let provider;
      try {
        provider = createProvider(providerId, {
          apiKey: options.key,
          maxTokens: 8000,
        });
      } catch (err) {
        console.log(chalk.red(`Error: ${err.message}`));
        return;
      }

      const execSpinner = ora(`${agent.name} is working...`).start();
      const startTime = Date.now();

      try {
        const result = await provider.generate(agent.systemPrompt, fullPrompt);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        
        execSpinner.succeed(`${agent.name} completed in ${elapsed}s`);

        // Output result
        if (options.output) {
          await fs.writeFile(options.output, result.content);
          console.log(chalk.green(`\n✅ Output saved to: ${options.output}`));
        } else {
          console.log(chalk.bold(`\n📄 ${agent.name} Output:\n`));
          console.log(chalk.gray('─'.repeat(60)));
          console.log(result.content);
          console.log(chalk.gray('─'.repeat(60)));
        }

        // Show stats
        const cost = provider.estimateCost(result.usage.inputTokens, result.usage.outputTokens);
        console.log(chalk.gray(`\n📊 Tokens: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out`));
        console.log(chalk.gray(`💰 Est. cost: ~$${cost.total.toFixed(4)}`));

        // Handle chaining
        if (options.chain) {
          const nextAgents = options.chain.split(',').map(a => a.trim());
          console.log(chalk.cyan(`\n🔗 Chain: Passing output to ${nextAgents.join(' → ')}\n`));
          
          for (const nextAgentName of nextAgents) {
            const nextAgent = AGENTS[nextAgentName.toLowerCase()];
            if (!nextAgent) {
              console.log(chalk.yellow(`⚠️  Skipping unknown agent: ${nextAgentName}`));
              continue;
            }

            const chainSpinner = ora(`${nextAgent.name} is working...`).start();
            const chainStart = Date.now();

            try {
              const chainResult = await provider.generate(
                nextAgent.systemPrompt,
                `## Previous Agent Output\n${result.content}\n\n## Original Task\n${task}`
              );
              
              const chainElapsed = ((Date.now() - chainStart) / 1000).toFixed(1);
              chainSpinner.succeed(`${nextAgent.name} completed in ${chainElapsed}s`);

              console.log(chalk.bold(`\n📄 ${nextAgent.name} Output:\n`));
              console.log(chalk.gray('─'.repeat(60)));
              console.log(chainResult.content);
              console.log(chalk.gray('─'.repeat(60)));

              // Update result for next in chain
              result.content = chainResult.content;
            } catch (err) {
              chainSpinner.fail(`${nextAgent.name} failed: ${err.message}`);
            }
          }
        }

        console.log(chalk.cyan('\n💡 Next: Run `ultra-dex review` to check alignment.\n'));

      } catch (err) {
        execSpinner.fail('Execution failed');
        console.log(chalk.red(`\nError: ${err.message}`));
      }
    });
}

export function registerSwarmCommand(program) {
  program
    .command('swarm <feature>')
    .description('Run a full agent swarm for a feature')
    .option('-p, --provider <provider>', 'AI provider')
    .option('-k, --key <apiKey>', 'API key')
    .option('--plan-only', 'Only run planner, show task breakdown')
    .action(async (feature, options) => {
      console.log(chalk.cyan('\n🐝 Ultra-Dex Agent Swarm\n'));
      console.log(chalk.gray(`Feature: "${feature}"\n`));

      // Check for API key
      const configured = checkConfiguredProviders();
      const hasProvider = configured.some(p => p.configured) || options.key;

      if (!hasProvider) {
        console.log(chalk.yellow('⚠️  No AI provider configured.\n'));
        console.log(chalk.white('A swarm requires an AI provider. Set an API key:'));
        console.log(chalk.gray('  export ANTHROPIC_API_KEY=your-key\n'));
        return;
      }

      const providerId = options.provider || getDefaultProvider();
      let provider;
      try {
        provider = createProvider(providerId, {
          apiKey: options.key,
          maxTokens: 8000,
        });
      } catch (err) {
        console.log(chalk.red(`Error: ${err.message}`));
        return;
      }

      // Load context
      const projectContext = await readProjectContext();
      const contextSection = projectContext.context ? 
        `## Project Context\n${projectContext.context.slice(0, 3000)}\n\n` : '';

      // Step 1: Planner breaks down the feature
      console.log(chalk.bold('Step 1: 📋 @Planner breaking down feature...\n'));
      const plannerSpinner = ora('@Planner analyzing...').start();

      try {
        const planResult = await provider.generate(
          AGENTS.planner.systemPrompt,
          `${contextSection}## Feature Request\n${feature}`
        );
        plannerSpinner.succeed('@Planner completed task breakdown');

        console.log(chalk.gray('─'.repeat(60)));
        console.log(planResult.content);
        console.log(chalk.gray('─'.repeat(60)));

        if (options.planOnly) {
          console.log(chalk.cyan('\n💡 Use --plan-only=false to execute all tasks.\n'));
          return;
        }

        // Step 2: CTO reviews architecture
        console.log(chalk.bold('\nStep 2: 🏗️  @CTO reviewing architecture...\n'));
        const ctoSpinner = ora('@CTO analyzing...').start();

        const ctoResult = await provider.generate(
          AGENTS.cto.systemPrompt,
          `${contextSection}## Feature\n${feature}\n\n## Planner Output\n${planResult.content}`
        );
        ctoSpinner.succeed('@CTO completed architecture review');

        console.log(chalk.gray('─'.repeat(60)));
        console.log(ctoResult.content);
        console.log(chalk.gray('─'.repeat(60)));

        // Summary
        console.log(chalk.bold.green('\n✅ Swarm Planning Complete!\n'));
        console.log(chalk.white('Agents consulted:'));
        console.log(chalk.gray('  1. @Planner - Task breakdown'));
        console.log(chalk.gray('  2. @CTO - Architecture review'));
        console.log(chalk.cyan('\nNext steps:'));
        console.log(chalk.gray('  • Review the task breakdown above'));
        console.log(chalk.gray('  • Run individual agents: ultra-dex run backend --task "..."'));
        console.log(chalk.gray('  • Or use: ultra-dex build for interactive mode\n'));

      } catch (err) {
        plannerSpinner.fail('Swarm failed');
        console.log(chalk.red(`\nError: ${err.message}`));
      }
    });
}

export default { registerRunCommand, registerSwarmCommand };
