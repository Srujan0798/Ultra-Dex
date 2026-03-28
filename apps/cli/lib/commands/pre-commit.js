// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Pre Commit module
 * @module commands/pre-commit
 */

import { registerPreCommitCommand } from './state.js';

export { registerPreCommitCommand };

export default {
  registerPreCommitCommand,
};

/**
 * Error handler for pre-commit
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    logger.error('[pre-commit]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
