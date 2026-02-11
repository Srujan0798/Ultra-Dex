// Copyright (c) 2026 Ultra-Dex

/**
 * Project configuration utilities
 */

/**
 * Get the project root directory
 * @returns {string} The project root path
 */
export function getProjectRoot() {
  return process.cwd();
}

/**
 * Handle errors in config module
 * @param {Error} error - The error to handle
 * @param {string} [context='config'] - Error context
 */
function handleModuleError(error, context = 'config') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
