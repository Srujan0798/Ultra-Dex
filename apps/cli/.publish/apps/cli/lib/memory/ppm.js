// Copyright (c) 2026 Ultra-Dex

import { ppmManager } from './manager.js';

export { ppmManager };
export default ppmManager;

/**
 * Error handler for ppm
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[ppm]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
