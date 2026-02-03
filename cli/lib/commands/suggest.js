import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import ora from 'ora';
import { AGENTS } from './agents.js';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { context } from '../kernel/context.js';

export function registerSuggestCommand(program) {
  program
    .command('suggest [query]')
    .description('Get AI agent suggestions for your task')
    .action(async (query) => {
      console.log(chalk.cyan('\n🤖 Ultra-Dex Agent Suggester\n'));

      // Check for AI Provider
      const providerId = getDefaultProvider();
      
      let description = query;
      let taskType = 'custom';

      if (!description) {
        const answers = await inquirer.prompt([
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
        taskType = answers.taskType;

        if (taskType === 'Custom (AI Analysis)') {
             const input = await inquirer.prompt([{
                 type: 'input',
                 name: 'desc',
                 message: 'Describe your task in detail:',
             }]);
             description = input.desc;
        } else if (['New feature from scratch', 'Bug fix', 'API endpoint', 'UI component'].includes(taskType)) {
             const input = await inquirer.prompt([{
                 type: 'input',
                 name: 'desc',
                 message: 'Briefly describe your task (optional):',
             }]);
             description = input.desc;
        }
      }

      // 1. Context Phase
      const spinner = ora('Analyzing environment context...').start();
      const ctx = await context.scan();
      spinner.succeed('Environment analyzed');
      console.log(chalk.gray(`  Stack: ${ctx.stack} | Branch: ${ctx.git.branch || 'none'}`));

      // AI Mode
      if (providerId && (description || taskType === 'Custom (AI Analysis)')) {
          const aiSpinner = ora('Synthesizing expert recommendations...').start();
          try {
              const provider = createProvider(providerId);
              
              let contextContent = '';
              try {
                  contextContent = await fs.readFile(path.resolve(process.cwd(), 'CONTEXT.md'), 'utf8');
              } catch {}

              const prompt = `
You are an expert software architect using the Ultra-Dex framework.
Based on the user's task and the project environment, suggest the best workflow of agents.

Available Agents:
${AGENTS.map(a => `- @${a.name}: ${a.description}`).join('\n')}

Project Environment:
- Stack: ${ctx.stack}
- Git: ${ctx.git.branch} (${ctx.git.isDirty ? 'dirty' : 'clean'})
- Files: ${ctx.files.join(', ')}

Project Context (from CONTEXT.md):
${contextContent.slice(0, 1000)}...

User Task: ${description || taskType}

Output a JSON object with:
{
  "reasoning": "Why this workflow?",
  "agents": ["@Agent1", "@Agent2"],
  "tips": ["Tip 1", "Tip 2"]
}
`;
              const response = await provider.generate('You are a helpful assistant that outputs JSON.', prompt);
              
              // Extract JSON
              const jsonMatch = response.content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                  const data = JSON.parse(jsonMatch[0]);
                  aiSpinner.succeed(chalk.green('AI Analysis Complete'));
                  
                  console.log(chalk.bold('\n💡 AI Suggested Workflow:\n'));
                  console.log(chalk.gray(data.reasoning + '\n'));
                  
                  data.agents.forEach((agent, i) => {
                      const arrow = i < data.agents.length - 1 ? '  →' : '';
                      console.log(chalk.cyan(`  ${i + 1}. ${agent}`) + arrow);
                  });

                  if (data.tips && data.tips.length > 0) {
                      console.log(chalk.bold('\n🧠 Pro Tips:\n'));
                      data.tips.forEach(tip => console.log(chalk.gray(`  • ${tip}`)));
                  }
                  return;
              }
          } catch (e) {
              aiSpinner.fail('AI analysis failed, falling back to static logic.');
              // Fallthrough to static
          }
      }

      // Static Fallback
      console.log(chalk.bold('\n💡 Suggested Agent Workflow (Static):\n'));

      let suggestedAgents = [];
      let reasoning = '';

      switch (taskType) {
        case 'New feature from scratch':
          suggestedAgents = ['@Planner', '@CTO', '@Database', '@Backend', '@Frontend', '@Testing', '@Reviewer', '@DevOps'];
          reasoning = 'Complete feature requires planning, architecture, implementation, testing, and deployment';
          break;

        case 'Authentication system':
          suggestedAgents = ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@Frontend', '@Security', '@DevOps'];
          reasoning = 'Auth requires research (providers), security review, and full-stack implementation';
          break;

        case 'Payment integration':
          suggestedAgents = ['@Planner', '@Research', '@CTO', '@Database', '@Backend', '@Frontend', '@Testing', '@Security', '@DevOps'];
          reasoning = 'Payments need provider research, webhook handling, testing, and security audit';
          break;

        case 'Database changes':
          suggestedAgents = ['@Planner', '@CTO', '@Database', '@Backend', '@Testing'];
          reasoning = 'Schema changes need planning, architecture review, migration, and testing';
          break;

        case 'Bug fix':
          suggestedAgents = ['@Debugger', '@Testing', '@Reviewer'];
          reasoning = 'Debug issue, add test to prevent regression, review fix';
          break;

        case 'Performance optimization':
          suggestedAgents = ['@Performance', '@Backend', '@Frontend', '@Database', '@Testing'];
          reasoning = 'Identify bottlenecks, optimize code/queries, verify improvements';
          break;

        case 'Deployment/DevOps':
          suggestedAgents = ['@DevOps', '@CTO', '@Security'];
          reasoning = 'Infrastructure setup with security review';
          break;

        case 'API endpoint':
          suggestedAgents = ['@Backend', '@Database', '@Testing', '@Reviewer'];
          reasoning = 'Implement endpoint, add tests, review code quality';
          break;

        case 'UI component':
          suggestedAgents = ['@Frontend', '@Reviewer'];
          reasoning = 'Build component, review for quality and accessibility';
          break;

        case 'Testing':
          suggestedAgents = ['@Testing', '@Reviewer'];
          reasoning = 'Write tests, review coverage';
          break;

        default:
          suggestedAgents = ['@Planner', '@CTO'];
          reasoning = 'Start with planning and architecture review';
      }

      console.log(chalk.gray(reasoning + '\n'));

      suggestedAgents.forEach((agent, i) => {
        const agentName = agent.replace('@', '').toLowerCase();
        const agentInfo = AGENTS.find(a => a.name === agentName);
        const arrow = i < suggestedAgents.length - 1 ? '  →' : '';
        console.log(chalk.cyan(`  ${i + 1}. ${agent}`) + chalk.gray(` - ${agentInfo?.description || ''}`) + arrow);
      });

      console.log(chalk.bold('\n📚 Next Steps:\n'));
      console.log(chalk.gray(`  1. Start with ${suggestedAgents[0]} to plan the task`));
      console.log(chalk.gray('  2. Hand off to each agent in sequence'));
      console.log(chalk.gray('  3. Use "ultra-dex agent <name>" to see full prompts\n'));

      console.log(chalk.bold('🔗 Related Workflows:\n'));
      if (taskType === 'Authentication system') {
        console.log(chalk.blue('  ultra-dex workflow auth'));
        console.log(chalk.blue('  ultra-dex workflow supabase\n'));
      } else if (taskType === 'Payment integration') {
        console.log(chalk.blue('  ultra-dex workflow payments\n'));
      } else if (taskType === 'Deployment/DevOps') {
        console.log(chalk.blue('  ultra-dex workflow vercel'));
        console.log(chalk.blue('  ultra-dex workflow cicd\n'));
      } else {
        console.log(chalk.gray('  Use "ultra-dex workflow <feature>" to see examples\n'));
      }
    });
}
