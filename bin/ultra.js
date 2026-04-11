#!/usr/bin/env node

/**
 * @fileoverview Ultra module
 * @module bin/ultra
 */

// Legacy shim for tests/tools expecting bin/ultra.js
import '../apps/cli/bin/ultra-dex.js';

/**
 * Error handler for ultra
 * @param {Error} error - Error to handle
 */
function handleUltraError(error) {
  try {
    console.error('[ultra]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
