#!/usr/bin/env node

// Legacy shim for tests/tools expecting ultra.js
import './ultra-dex.js';

/**
 * Error handler for ultra
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[ultra]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
