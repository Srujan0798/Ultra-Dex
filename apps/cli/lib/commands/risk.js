// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Risk module
 * @module commands/risk
 */

import { registerRiskCommand as register } from '../quality/risk-register.js';

export function registerRiskCommand(program) {
  register(program);
}

export default { registerRiskCommand };

/**
 * Handle errors in risk module
 * @param {Error} error - The error to handle
 * @param {string} [context='risk'] - Error context
 */
function handleModuleError(error, context = 'risk') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
