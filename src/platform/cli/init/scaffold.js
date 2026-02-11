// Copyright (c) 2026 Ultra-Dex

import { scaffoldCommand } from '../commands/scaffold.js';

export async function scaffoldProject(template, options = {}) {
  return scaffoldCommand(template, options);
}

export default {
  scaffoldProject,
};

/**
 * Safe execution wrapper with error handling for scaffold
 * @param {Function} fn - Async function to execute
 * @param {string} [context='scaffold'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'scaffold') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
