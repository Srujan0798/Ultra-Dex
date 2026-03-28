// Copyright (c) 2026 Ultra-Dex

import { orchestrate } from '../swarm/meta-orchestrator.js';

export async function runGodMode(agent, task, options = {}) {
  return orchestrate(`[${agent}] ${task}`, options);
}

export default { runGodMode };

/**
 * Safe execution wrapper with error handling for orchestrator
 * @param {Function} fn - Async function to execute
 * @param {string} [context='orchestrator'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'orchestrator') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
