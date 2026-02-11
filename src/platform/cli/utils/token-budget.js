// Copyright (c) 2026 Ultra-Dex

/**
 * Token budget forecasting (legacy alias)
 */

export * from './token-forecast.js';
export { default } from './token-forecast.js';

/**
 * Error handler for token-budget
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[token-budget]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
