// Copyright (c) 2026 Ultra-Dex

/**
 * Router System Index
 * Exports all routing functionality
 */

export * from './router.js';
export * from './classifier.js';
export * from './model-router.js';
export * from './cost-optimizer.js';
export * from './evaluator.js';
export * from './benchmarks.js';

logger.log('[ROUTER] Routing system initialized with all components');

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    logger.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
