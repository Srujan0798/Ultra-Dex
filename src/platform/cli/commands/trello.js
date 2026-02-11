// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex trello command
 * Kanban Board Sync (real API)
 */

import chalk from 'chalk';
import { TrelloClient } from '../integrations/trello.js';
import { parsePlanFromMarkdown } from './plan.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

function getTrelloConfig(options = {}) {
  return {
    apiKey: options.key || process.env.TRELLO_API_KEY,
    token: options.token || process.env.TRELLO_TOKEN,
    boardId: options.board || process.env.TRELLO_BOARD_ID,
  };
}

async function getBoard(client, boardId) {
  const board = await client.getBoard(boardId);
  const lists = await client.getBoardLists(boardId);
  const cards = await client.getBoardCards(boardId);
  return {
    ...board,
    lists: lists.map((list) => ({
      ...list,
      cards: cards.filter((card) => card.idList === list.id),
    })),
  };
}

function findListByName(lists, name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  return lists.find((list) => list.name.toLowerCase().includes(lower));
}

async function ensureLists(client, boardId, desired) {
  const lists = await client.getBoardLists(boardId);
  const existing = new Map(lists.map((l) => [l.name.toLowerCase(), l]));
  const created = [];

  for (const name of desired) {
    if (!existing.has(name.toLowerCase())) {
      const list = await client.createList(boardId, name);
      created.push(list);
      existing.set(name.toLowerCase(), list);
    }
  }

  const merged = [...lists, ...created];
  return merged;
}

export async function showTrelloStatus(options = {}) {
  const config = getTrelloConfig(options);
  if (!config.apiKey || !config.token || !config.boardId) {
    throw new Error('Missing Trello config. Set TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID.');
  }

  const client = new TrelloClient(config.apiKey, config.token);
  const boardData = await getBoard(client, config.boardId);

  const targetList = findListByName(boardData.lists, options.list || 'doing');
  if (!targetList) {
    printWarning(chalk.yellow('No matching list found.'));
    return;
  }

  printInfo(chalk.cyan(`\n📋 Trello Board: ${boardData.name}`));
  printSuccess(chalk.green(`Cards in "${targetList.name}":\n`));

  if (!targetList.cards.length) {
    printInfo(chalk.gray('No cards in this list.'));
    return;
  }

  targetList.cards.forEach((card, index) => {
    printInfo(chalk.yellow(`${index + 1}. ${card.name}`));
    if (card.desc) printInfo(chalk.gray(`   ${card.desc}`));
  });
}

export async function moveTrelloCard(cardIdOrName, targetListName, options = {}) {
  const config = getTrelloConfig(options);
  if (!config.apiKey || !config.token || !config.boardId) {
    throw new Error('Missing Trello config. Set TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID.');
  }

  const client = new TrelloClient(config.apiKey, config.token);
  const boardData = await getBoard(client, config.boardId);

  let card = null;
  for (const list of boardData.lists) {
    const match = list.cards.find(
      (c) => c.id === cardIdOrName || c.name.toLowerCase().includes(cardIdOrName.toLowerCase())
    );
    if (match) {
      card = match;
      break;
    }
  }

  if (!card) {
    throw new Error(`Card not found: ${cardIdOrName}`);
  }

  const targetList = findListByName(boardData.lists, targetListName);
  if (!targetList) {
    throw new Error(`Target list not found: ${targetListName}`);
  }

  await client.moveCardToList(card.id, targetList.id);
  printSuccess(chalk.green(`✅ Moved "${card.name}" to "${targetList.name}"`));
}

export async function syncPlanToTrello(options = {}) {
  const config = getTrelloConfig(options);
  if (!config.apiKey || !config.token || !config.boardId) {
    throw new Error('Missing Trello config. Set TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BOARD_ID.');
  }

  const client = new TrelloClient(config.apiKey, config.token);
  const lists = await ensureLists(client, config.boardId, ['To Do', 'In Progress', 'Done']);
  const todoList = findListByName(lists, 'To Do') || lists[0];

  const phases = await parsePlanFromMarkdown();
  if (!phases.length) {
    printWarning(chalk.yellow('No phases found in IMPLEMENTATION-PLAN.md'));
    return;
  }

  for (const phase of phases) {
    await client.createCard(
      todoList.id,
      phase.name,
      (phase.steps || []).map((s) => `- ${s.task}`).join('\n')
    );
  }

  printSuccess(chalk.green(`✅ Synced ${phases.length} plan sections to Trello.`));
}

export function registerTrelloCommand(program) {
  const trello = program.command('trello').description('Trello Kanban board synchronization');

  trello
    .command('status')
    .description('Show cards in a specific list (defaults to "Doing")')
    .option('--board <id>', 'Board ID (or set TRELLO_BOARD_ID)')
    .option('--list <name>', 'List name to show')
    .option('--key <key>', 'Trello API key')
    .option('--token <token>', 'Trello API token')
    .action(async (options) => {
      try {
        await showTrelloStatus(options);
      } catch (error) {
        printError(chalk.red(`Trello status failed: ${error.message}`));
        process.exit(1);
      }
    });

  trello
    .command('move')
    .description('Move a card to another list')
    .argument('<card>', 'Card ID or name')
    .argument('<list>', 'Target list name')
    .option('--board <id>', 'Board ID (or set TRELLO_BOARD_ID)')
    .option('--key <key>', 'Trello API key')
    .option('--token <token>', 'Trello API token')
    .action(async (card, list, options) => {
      try {
        await moveTrelloCard(card, list, options);
      } catch (error) {
        printError(chalk.red(`Trello move failed: ${error.message}`));
        process.exit(1);
      }
    });

  trello
    .command('sync')
    .description('Sync IMPLEMENTATION-PLAN.md to Trello')
    .option('--board <id>', 'Board ID (or set TRELLO_BOARD_ID)')
    .option('--key <key>', 'Trello API key')
    .option('--token <token>', 'Trello API token')
    .action(async (options) => {
      try {
        await syncPlanToTrello(options);
      } catch (error) {
        printError(chalk.red(`Trello sync failed: ${error.message}`));
        process.exit(1);
      }
    });
}

export default {
  registerTrelloCommand,
};
