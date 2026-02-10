// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Health module
 * @module commands/health
 */

import { registerHealthCommand } from './monitoring.js';

export { registerHealthCommand };

export default {
  registerHealthCommand,
};

/**
 * Error handler for health
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[health]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
