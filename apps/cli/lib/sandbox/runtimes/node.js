// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Node module
 * @module runtimes/node
 */

export const nodeRuntime = {
  id: 'node',
  image: 'node:22-alpine',
  run: (file) => `node ${file}`,
};

export default nodeRuntime;

/**
 * Error handler for node
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[node]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
