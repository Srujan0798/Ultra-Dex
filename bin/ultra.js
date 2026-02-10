/**
 * @fileoverview Ultra module
 * @module bin/ultra
 */

#!/usr/bin/env node

// Legacy shim for tests/tools expecting bin/ultra.js
import '../cli/bin/ultra-dex.js';

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
