// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Rust module
 * @module runtimes/rust
 */

export const rustRuntime = {
  id: 'rust',
  image: 'rust:1.76-alpine',
  run: (file) => `rustc ${file} -o /tmp/out && /tmp/out`,
};

export default rustRuntime;

/**
 * Error handler for rust
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    logger.error('[rust]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
