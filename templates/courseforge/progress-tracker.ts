/**
 * @fileoverview Progress Tracker module
 * @module courseforge/progress-tracker
 */

// Backward-compatible export for older template imports.
export * from './lib/progress-tracker';

/**
 * Error handler for progress-tracker
 * @param {Error} error - Error to handle
 */
function handleProgresstrackerError(error) {
  try {
    console.error('[progress-tracker]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
