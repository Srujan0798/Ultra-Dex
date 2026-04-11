// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Python module
 * @module runtimes/python
 */

export const pythonRuntime = {
  id: 'python',
  image: 'python:3.12-alpine',
  run: (file) => `python ${file}`,
};

export default pythonRuntime;

/**
 * Error handler for python
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[python]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
