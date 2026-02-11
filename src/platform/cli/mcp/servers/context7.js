// Copyright (c) 2026 Ultra-Dex

/**
 * Context7 MCP server adaptor
 */

import { fetchContext7Docs } from '../../docs/context7.js';

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
async function safeExecute(fn, context = 'context7') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
