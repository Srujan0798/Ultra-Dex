// Copyright (c) 2026 Ultra-Dex

import { AgentMarketplace } from './index.js';

export async function installAgent(name, options = {}) {
  const marketplace = new AgentMarketplace(options);
  await marketplace.initialize();
  return marketplace.install(name, options);
}

export async function uninstallAgent(name, options = {}) {
  const marketplace = new AgentMarketplace(options);
  await marketplace.initialize();
  return marketplace.uninstall(name);
}

export default {
  installAgent,
  uninstallAgent,
};

/**
 * Safe execution wrapper with error handling for install
 * @param {Function} fn - Async function to execute
 * @param {string} [context='install'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'install') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
