// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Smart Errors module
 * @module utils/smart-errors
 */

export * from './smart-error.js';
import SmartError from './smart-error.js';

export default SmartError;

/**
 * Error handler for smart-errors
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    logger.error('[smart-errors]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
