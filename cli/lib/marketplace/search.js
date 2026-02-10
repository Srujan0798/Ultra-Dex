// Copyright (c) 2026 Ultra-Dex

import { AgentMarketplace } from './index.js';

export async function searchAgents(query, options = {}) {
  const marketplace = new AgentMarketplace(options);
  await marketplace.initialize();
  return marketplace.search(query, options);
}

export default {
  searchAgents,
};

/**
 * Safe execution wrapper with error handling for search
 * @param {Function} fn - Async function to execute
 * @param {string} [context='search'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'search') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
