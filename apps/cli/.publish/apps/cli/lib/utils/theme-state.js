// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Theme State module
 * @module utils/theme-state
 */

export let isDoomsday = false;

export function setDoomsdayMode(enabled) {
  isDoomsday = enabled;
}

export function isDoomsdayMode() {
  return isDoomsday;
}

/**
 * Handle errors in theme-state module
 * @param {Error} error - The error to handle
 * @param {string} [context='theme-state'] - Error context
 */
function _handleModuleError(error, context = 'theme-state') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
