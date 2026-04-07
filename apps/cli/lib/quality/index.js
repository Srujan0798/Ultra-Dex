// Copyright (c) 2026 Ultra-Dex

export * from './automation.js';
export * from './gates.js';
export * from './scanner.js';
export * from './gate.js';
export * from './rules.js';
export * from './report.js';

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
