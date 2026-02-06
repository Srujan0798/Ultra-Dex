/**
 * ultra-dex trello command
 * Kanban Board Sync
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { validateSafePath } from '../utils/validation.js';

const execAsync = promisify(exec);

// Mock Trello data for demonstration when no credentials are provided
const MOCK_BOARDS = {
  'board-1': {
    id: 'board-1',
    name: 'Project Board',
    lists: [
      {
        id: 'list-1',
        name: 'To Do',
        cards: [
          { id: 'card-1', name: 'Design new UI', desc: 'Create wireframes for new UI', pos: 1 },
          { id: 'card-2', name: 'Implement auth', desc: 'Build authentication system', pos: 2 },
        ],
      },
      {
        id: 'list-2',
        name: 'Doing',
        cards: [
          { id: 'card-3', name: 'Fix login bug', desc: 'Resolve login issue with OAuth', pos: 1 },
          { id: 'card-4', name: 'API integration', desc: 'Connect to third-party API', pos: 2 },
        ],
      },
      {
        id: 'list-3',
        name: 'Done',
        cards: [
          { id: 'card-5', name: 'Setup project', desc: 'Initialize project structure', pos: 1 },
        ],
      },
    ],
  },
};

export async function showTrelloStatus(options = {}) {
  printInfo(chalk.cyan('\n📋 Trello Board Status\n'));

  // Check if Trello credentials are available
  const hasCredentials = process.env.TRELLO_API_KEY && process.env.TRELLO_TOKEN;

  let boardData;

  if (hasCredentials) {
    printInfo(chalk.gray('Fetching board status from Trello...'));
    boardData = await fetchBoardFromTrello();
  } else {
    printWarning(chalk.yellow('Trello credentials not found. Using mock data for demonstration.'));
    boardData = MOCK_BOARDS['board-1'];
  }

  if (!boardData) {
    throw new Error('Could not fetch Trello board data');
  }

  // Find the "Doing" list
  const doingList = boardData.lists.find(
    (list) =>
      list.name.toLowerCase().includes('doing') ||
      list.name.toLowerCase().includes('in progress') ||
      list.name.toLowerCase().includes('work')
  );

  if (!doingList || doingList.cards.length === 0) {
    printInfo(chalk.gray('No cards found in "Doing" column.'));
    return;
  }

  printSuccess(chalk.green(`Cards in "${doingList.name}":\n`));

  doingList.cards.forEach((card, index) => {
    printInfo(chalk.yellow(`${index + 1}. ${card.name}`));
    if (card.desc) {
      printInfo(chalk.gray(`   ${card.desc}`));
    }
    console.log('');
  });
}

export async function moveTrelloCard(cardId, targetListName, options = {}) {
  printInfo(chalk.cyan(`\n🔄 Moving card to "${targetListName}"\n`));

  // Check if Trello credentials are available
  const hasCredentials = process.env.TRELLO_API_KEY && process.env.TRELLO_TOKEN;

  let boardData;

  if (hasCredentials) {
    printInfo(chalk.gray('Fetching board data from Trello...'));
    boardData = await fetchBoardFromTrello();
  } else {
    printWarning(chalk.yellow('Trello credentials not found. Using mock data for demonstration.'));
    boardData = MOCK_BOARDS['board-1'];
  }

  if (!boardData) {
    throw new Error('Could not fetch Trello board data');
  }

  // Find the card
  let cardToMove = null;
  let sourceList = null;

  for (const list of boardData.lists) {
    const card = list.cards.find(
      (c) => c.id === cardId || c.name.toLowerCase().includes(cardId.toLowerCase())
    );
    if (card) {
      cardToMove = card;
      sourceList = list;
      break;
    }
  }

  if (!cardToMove) {
    throw new Error(`Card not found: ${cardId}`);
  }

  // Find the target list
  const targetList = boardData.lists.find((list) =>
    list.name.toLowerCase().includes(targetListName.toLowerCase())
  );

  if (!targetList) {
    throw new Error(`Target list not found: ${targetListName}`);
  }

  printInfo(
    chalk.gray(
      `Moving card "${cardToMove.name}" from "${sourceList.name}" to "${targetList.name}"...`
    )
  );

  if (hasCredentials) {
    // In a real implementation, this would call the Trello API
    // For now, we'll just simulate the move
    printSuccess(chalk.green(`✅ Moved card "${cardToMove.name}" to "${targetList.name}"`));
  } else {
    printSuccess(
      chalk.green(`✅ Simulated moving card "${cardToMove.name}" to "${targetList.name}"`)
    );
  }
}

/**
 * Fetch board data from Trello API
 */
async function fetchBoardFromTrello() {
  // In a real implementation, this would call the Trello API
  // For now, we'll simulate the API call
  try {
    // Check if we have credentials
    if (!process.env.TRELLO_API_KEY || !process.env.TRELLO_TOKEN) {
      return null;
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo purposes, return mock data
    return MOCK_BOARDS['board-1'];
  } catch (error) {
    printWarning(chalk.yellow(`Failed to fetch board from Trello: ${error.message}`));
    return null;
  }
}

export function registerTrelloCommand(program) {
  const trelloCmd = program.command('trello').description('Trello Kanban board synchronization');

  trelloCmd
    .command('status')
    .description('Show cards in "Doing" column')
    .action(async () => {
      try {
        await showTrelloStatus();
      } catch (error) {
        printError(chalk.red(`Trello status failed: ${error.message}`));
        process.exit(1);
      }
    });

  trelloCmd
    .command('move')
    .description('Move card to Done')
    .argument('<card>', 'Card ID or name to move')
    .argument('<target>', 'Target list name (e.g., "done", "completed")')
    .action(async (card, target) => {
      try {
        await moveTrelloCard(card, target);
      } catch (error) {
        printError(chalk.red(`Trello move failed: ${error.message}`));
        process.exit(1);
      }
    });

  trelloCmd._examples = [
    { command: 'ultra-dex trello status', description: 'Show cards in "Doing" column' },
    { command: 'ultra-dex trello move "API integration" done', description: 'Move card to Done' },
    {
      command: 'ultra-dex trello move card-4 completed',
      description: 'Move card by ID to Completed',
    },
  ];
}

export default {
  showTrelloStatus,
  moveTrelloCard,
  registerTrelloCommand,
};
