// Copyright (c) 2026 Ultra-Dex

import { ChromeAgentsClient } from './chrome-agents.js';

export class BrowserOrchestrator {
  constructor(options = {}) {
    this.client = new ChromeAgentsClient(options);
  }

  async runTasks(tasks = []) {
    const results = [];
    for (const task of tasks) {
      results.push(await this.client.submitTask(task.text, task));
    }
    return results;
  }
}

export default BrowserOrchestrator;

/**
 * Safe execution wrapper with error handling for orchestrator
 * @param {Function} fn - Async function to execute
 * @param {string} [context='orchestrator'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'orchestrator') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
