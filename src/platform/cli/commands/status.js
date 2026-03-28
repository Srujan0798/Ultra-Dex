// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Status module
 * @module commands/status
 */

import { registerStatusCommand as register } from './state.js';

export function registerStatusCommand(program) {
  return register(program);
}

export default { registerStatusCommand };

/**
 * Handle errors in status module
 * @param {Error} error - The error to handle
 * @param {string} [context='status'] - Error context
 */
function handleModuleError(error, context = 'status') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
