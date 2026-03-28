// Copyright (c) 2026 Ultra-Dex

import { runStructuralGates } from './structural.js';
import { runFunctionalGates } from './functional.js';
import { runArchitecturalGates } from './architectural.js';

export async function runAllGates(projectDir, config = {}) {
  const structural = await runStructuralGates(projectDir, config.gates || {});
  const functional = await runFunctionalGates(projectDir, config.gates || {});
  const architectural = await runArchitecturalGates(projectDir, config.gates?.architecture || {});
  return [...structural, ...functional, ...architectural];
}

export default { runAllGates };

/**
 * Safe execution wrapper with error handling for index
 * @param {Function} fn - Async function to execute
 * @param {string} [context='index'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'index') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
