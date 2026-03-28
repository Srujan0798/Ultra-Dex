// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Go module
 * @module runtimes/go
 */

export const goRuntime = {
  id: 'go',
  image: 'golang:1.22-alpine',
  run: (file) => `go run ${file}`,
};

export default goRuntime;

/**
 * Error handler for go
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    logger.error('[go]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
