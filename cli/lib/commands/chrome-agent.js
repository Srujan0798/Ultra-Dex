import chalk from 'chalk';
import { ChromeAgentsClient } from '../browser/chrome-agents.js';
import { printInfo, printSuccess, printError } from '../utils/output.js';

export function registerChromeAgentCommand(program) {
  program
    .command('chrome-agent <task>')
    .description('Run Chrome Agents API task')
    .option('--type <type>', 'Task type', 'general')
    .action(async (task, options) => {
      try {
        const client = new ChromeAgentsClient();
        const result = await client.submitTask(task, options);
        printSuccess(chalk.green(`\n✅ Submitted Chrome agent task (${result.id})\n`));
        printInfo(JSON.stringify(result.payload, null, 2));
      } catch (error) {
        printError(chalk.red(`Chrome agent failed: ${error.message}`));
      }
    });
}

