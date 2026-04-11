// Copyright (c) 2026 Ultra-Dex

/**
 * cli/lib/integrations/trello.js
 * Trello Integration with Real API Implementation
 */

import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { requireConfig, retryWithBackoff } from './utils.js';

const TRELLO_API = 'https://api.trello.com/1';

export class TrelloClient {
  constructor(apiKey, token) {
    requireConfig({ apiKey, token }, ['apiKey', 'token'], 'Trello');
    this.apiKey = apiKey;
    this.token = token;
  }

  get auth() {
    return `key=${this.apiKey}&token=${this.token}`;
  }

  async createBoard(name, prefs = {}) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${TRELLO_API}/boards?name=${encodeURIComponent(name)}&${this.auth}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(prefs),
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to create board: ${response.status} ${response.statusText}`);
      }

      const board = await response.json();
      printSuccess(`✅ Created Trello board: ${board.name}`);
      return board;
    } catch (error) {
      printError(`Failed to create Trello board: ${error.message}`);
      throw error;
    }
  }

  async createList(boardId, name) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(
          `${TRELLO_API}/lists?idBoard=${boardId}&name=${encodeURIComponent(name)}&${this.auth}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      );

      if (!response.ok) {
        throw new Error(`Failed to create list: ${response.status} ${response.statusText}`);
      }

      const list = await response.json();
      printSuccess(`✅ Created Trello list: ${list.name}`);
      return list;
    } catch (error) {
      printError(`Failed to create Trello list: ${error.message}`);
      throw error;
    }
  }

  async createCard(listId, name, desc = '', options = {}) {
    try {
      let url = `${TRELLO_API}/cards?idList=${listId}&name=${encodeURIComponent(name)}&desc=${encodeURIComponent(desc)}&${this.auth}`;

      // Add optional parameters
      if (options.due) url += `&due=${options.due}`;
      if (options.pos) url += `&pos=${options.pos}`;
      if (options.labels) url += `&idLabels=${options.labels}`;
      if (options.members) url += `&idMembers=${options.members}`;

      const response = await retryWithBackoff(() =>
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to create card: ${response.status} ${response.statusText}`);
      }

      const card = await response.json();
      printSuccess(`✅ Created Trello card: ${card.name}`);
      return card;
    } catch (error) {
      printError(`Failed to create Trello card: ${error.message}`);
      throw error;
    }
  }

  async addChecklist(cardId, name, items = []) {
    try {
      // Create the checklist first
      const checklistResponse = await retryWithBackoff(() =>
        fetch(
          `${TRELLO_API}/checklists?idCard=${cardId}&name=${encodeURIComponent(name)}&${this.auth}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      );

      if (!checklistResponse.ok) {
        throw new Error(
          `Failed to create checklist: ${checklistResponse.status} ${checklistResponse.statusText}`
        );
      }

      const checklist = await checklistResponse.json();

      // Add items to the checklist
      for (const item of items) {
        const itemResponse = await retryWithBackoff(() =>
          fetch(
            `${TRELLO_API}/checklists/${checklist.id}/checkItems?name=${encodeURIComponent(item)}&${this.auth}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
        );

        if (!itemResponse.ok) {
          printWarning(`Failed to add checklist item: ${item} - ${itemResponse.statusText}`);
        }
      }

      printSuccess(`✅ Added checklist "${name}" with ${items.length} items to card ${cardId}`);
      return checklist;
    } catch (error) {
      printError(`Failed to add checklist to Trello card ${cardId}: ${error.message}`);
      throw error;
    }
  }

  async getBoard(boardId) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${TRELLO_API}/boards/${boardId}?${this.auth}`)
      );

      if (!response.ok) {
        throw new Error(`Failed to get board: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Trello board ${boardId}: ${error.message}`);
      throw error;
    }
  }

  async getBoardLists(boardId) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${TRELLO_API}/boards/${boardId}/lists?${this.auth}`)
      );

      if (!response.ok) {
        throw new Error(`Failed to get board lists: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Trello board lists: ${error.message}`);
      throw error;
    }
  }

  async getBoardCards(boardId) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${TRELLO_API}/boards/${boardId}/cards?${this.auth}`)
      );

      if (!response.ok) {
        throw new Error(`Failed to get board cards: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Trello board cards: ${error.message}`);
      throw error;
    }
  }

  async updateCard(cardId, updates) {
    try {
      const queryString = Object.entries(updates)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      const response = await retryWithBackoff(() =>
        fetch(`${TRELLO_API}/cards/${cardId}?${this.auth}&${queryString}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to update card: ${response.status} ${response.statusText}`);
      }

      const card = await response.json();
      printSuccess(`✅ Updated Trello card: ${card.name}`);
      return card;
    } catch (error) {
      printError(`Failed to update Trello card ${cardId}: ${error.message}`);
      throw error;
    }
  }

  async moveCardToList(cardId, listId) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${TRELLO_API}/cards/${cardId}?idList=${listId}&${this.auth}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to move card: ${response.status} ${response.statusText}`);
      }

      const card = await response.json();
      printSuccess(`✅ Moved Trello card to list: ${card.idList}`);
      return card;
    } catch (error) {
      printError(`Failed to move Trello card ${cardId}: ${error.message}`);
      throw error;
    }
  }

  async archiveCard(cardId) {
    try {
      const response = await retryWithBackoff(() =>
        fetch(`${TRELLO_API}/cards/${cardId}?closed=true&${this.auth}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      if (!response.ok) {
        throw new Error(`Failed to archive card: ${response.status} ${response.statusText}`);
      }

      printSuccess(`✅ Archived Trello card: ${cardId}`);
      return true;
    } catch (error) {
      printError(`Failed to archive Trello card ${cardId}: ${error.message}`);
      throw error;
    }
  }

  async addLabelToCard(cardId, labelColor) {
    try {
      const response = await fetch(
        `${TRELLO_API}/cards/${cardId}/labels?color=${labelColor}&${this.auth}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add label: ${response.status} ${response.statusText}`);
      }

      printSuccess(`✅ Added label to Trello card: ${cardId}`);
      return await response.json();
    } catch (error) {
      printError(`Failed to add label to Trello card ${cardId}: ${error.message}`);
      throw error;
    }
  }

  async getCardsInList(listId) {
    try {
      const response = await fetch(`${TRELLO_API}/lists/${listId}/cards?${this.auth}`);

      if (!response.ok) {
        throw new Error(`Failed to get cards in list: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get cards in Trello list ${listId}: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Sync plan to Trello board
 */
export async function syncPlanToTrello(client, boardId, planData) {
  printInfo('🔄 Syncing plan to Trello board...');

  // Get the "To Do" list (usually the first list)
  const lists = await client.getBoardLists(boardId);
  const todoList =
    lists.find(
      (list) =>
        list.name.toLowerCase().includes('todo') ||
        list.name.toLowerCase().includes('backlog') ||
        list.name.toLowerCase().includes('to do')
    ) || lists[0]; // fallback to first list

  if (!todoList) {
    throw new Error('No lists found in Trello board');
  }

  const results = [];

  for (const section of planData.sections) {
    try {
      // Create a card for each section
      const card = await client.createCard(todoList.id, section.name, section.description || '', {
        labels: [section.priority?.toLowerCase() || 'green'],
      });

      // Add checklist with subsections if they exist
      if (section.tasks && Array.isArray(section.tasks) && section.tasks.length > 0) {
        await client.addChecklist(card.id, 'Implementation Steps', section.tasks);
      }

      results.push(card);
      printSuccess(`✅ Created Trello card: ${section.name}`);
    } catch (error) {
      printError(`Failed to create Trello card for ${section.name}: ${error.message}`);
    }
  }

  printSuccess(`🎉 Synced ${results.length} plan sections to Trello board`);
  return results;
}

/**
 * Validate Trello configuration
 */
export async function validateTrelloConfig(config) {
  if (!config.apiKey || !config.token) {
    throw new Error('Trello configuration requires apiKey and token');
  }

  const client = new TrelloClient(config.apiKey, config.token);

  try {
    // Test by fetching the member associated with the token
    const response = await fetch(`${TRELLO_API}/members/me?${client.auth}`);

    if (!response.ok) {
      throw new Error(`Trello connection test failed: ${response.status} ${response.statusText}`);
    }

    const userInfo = await response.json();
    printSuccess(
      `✅ Trello connection validated for user: ${userInfo.fullName || userInfo.username}`
    );
    return true;
  } catch (error) {
    printError(`❌ Trello connection failed: ${error.message}`);
    return false;
  }
}

export default {
  TrelloClient,
  syncPlanToTrello,
  validateTrelloConfig,
};
