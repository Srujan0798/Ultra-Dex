import chalk from 'chalk';
import inquirer from 'inquirer';
import { AGENTS } from './agents.js';

export function registerSuggestCommand(program) {
  program
    .command('suggest')
    .description('Get AI agent suggestions for your task')
    .action(async () => {
      console.log(chalk.cyan('\n🤖 Ultra-Dex Agent Suggester\n'));

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'taskType',
          message: 'What are you trying to build?',
          choices: [
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
        {
          type: 'input',
          name: 'description',
          message: 'Briefly describe your task:',
          default: '',
        },
      ]);

      console.log(chalk.bold('\n💡 Suggested Agent Workflow:\n'));

      let suggestedAgents = [];
      let reasoning = '';

      switch (answers.taskType) {
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
      if (answers.taskType === 'Authentication system') {
        console.log(chalk.blue('  ultra-dex workflow auth'));
        console.log(chalk.blue('  ultra-dex workflow supabase\n'));
      } else if (answers.taskType === 'Payment integration') {
        console.log(chalk.blue('  ultra-dex workflow payments\n'));
      } else if (answers.taskType === 'Deployment/DevOps') {
        console.log(chalk.blue('  ultra-dex workflow vercel'));
        console.log(chalk.blue('  ultra-dex workflow cicd\n'));
      } else {
        console.log(chalk.gray('  Use "ultra-dex workflow <feature>" to see examples\n'));
      }
    });
}
