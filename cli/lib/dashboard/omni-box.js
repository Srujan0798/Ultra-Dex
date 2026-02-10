// Copyright (c) 2026 Ultra-Dex

import { registerOmniBoxCommand } from '../ui/dashboard.js';

export function registerOmniBox(program) {
  return registerOmniBoxCommand(program);
}

export default { registerOmniBox };

/**
 * Handle errors in omni-box module
 * @param {Error} error - The error to handle
 * @param {string} [context='omni-box'] - Error context
 */
function handleModuleError(error, context = 'omni-box') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
