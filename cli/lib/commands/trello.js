import chalk from 'chalk';
import { Command } from 'commander';
import integrations from '../integrations/index.js';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

export function registerTrelloCommand(program) {
  const trello = new Command('trello');
  trello.description('Trello integration helpers');

  trello
    .command('status')
    .description('Show Trello integration status')
    .action(async () => {
      try {
        await integrations.trello.connect({
          apiKey: process.env.TRELLO_API_KEY,
          token: process.env.TRELLO_TOKEN,
          boardId: process.env.TRELLO_BOARD_ID
        });
        printSuccess(chalk.green('\n✅ Trello integration configured.\n'));
      } catch (error) {
        printWarning(chalk.yellow(`Trello not configured: ${error.message}`));
      }
    });

  trello
    .command('create-board <name>')
    .description('Create a Trello board (placeholder)')
    .action(async (name) => {
      printInfo(chalk.cyan(`Created Trello board: ${name} (placeholder)`));
    });

  program.addCommand(trello);
}
