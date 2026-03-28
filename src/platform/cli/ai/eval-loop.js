// Copyright (c) 2026 Ultra-Dex

// Thin alias for Evaluation Loop module
export * from './evaluation-loop.js';
import evaluationLoop from './evaluation-loop.js';
export default evaluationLoop;

/**
 * Error handler for eval-loop
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    logger.error('[eval-loop]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
