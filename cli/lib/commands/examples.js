import chalk from 'chalk';
import { githubBlobUrl } from '../config/urls.js';

export function registerExamplesCommand(program) {
  program
    .command('examples')
    .description('List available examples')
    .action(() => {
      console.log(chalk.bold('\nAvailable Ultra-Dex Examples:\n'));

      const examples = [
        {
          name: 'TaskFlow',
          type: 'Task Management',
          url: githubBlobUrl('@%20Ultra%20DeX/Saas%20plan/Examples/TaskFlow-Complete.md'),
        },
        {
          name: 'InvoiceFlow',
          type: 'Invoicing',
          url: githubBlobUrl('@%20Ultra%20DeX/Saas%20plan/Examples/InvoiceFlow-Complete.md'),
        },
        {
          name: 'HabitStack',
          type: 'Habit Tracking',
          url: githubBlobUrl('@%20Ultra%20DeX/Saas%20plan/Examples/HabitStack-Complete.md'),
        },
      ];

      examples.forEach((ex, i) => {
        console.log(chalk.cyan(`${i + 1}. ${ex.name}`) + chalk.gray(` (${ex.type})`));
        console.log(chalk.gray(`   ${ex.url}\n`));
      });
    });
}
