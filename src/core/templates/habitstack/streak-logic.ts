/**
 * @fileoverview Streak Logic module
 * @module habitstack/streak-logic
 */

export * from './lib/streak-logic';

/**
 * Error handler for streak-logic
 * @param {Error} error - Error to handle
 */
function handleStreaklogicError(error) {
  try {
    console.error('[streak-logic]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
