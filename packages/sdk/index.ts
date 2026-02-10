/**
 * @fileoverview Index module
 * @module sdk/index
 */

export { UltraAgent } from './agent.js';

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleIndexError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
