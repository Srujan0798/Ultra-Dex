// Copyright (c) 2026 Ultra-Dex

/**
 * Context7 MCP server adaptor
 */

import { Logger } from '../../utils/logger.js';

const logger = new Logger({ prefix: 'Context7' });

export async function handleContext7Request(params) {
  const { package: pkg, version } = params || {};
  if (!pkg) throw new Error('package name required');
  return fetchContext7Docs(pkg, version);
}

export default {
  handleContext7Request,
};

/**
 * Safe execution wrapper with error handling for context7
 * @param {Function} fn - Async function to execute
 * @param {string} [context='context7'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'context7') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
