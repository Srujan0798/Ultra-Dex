// Copyright (c) 2026 Ultra-Dex

/**
 * Version utility - Single source of truth
 * All files should import VERSION from here
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

export const VERSION = pkg.version;
export const PACKAGE_NAME = pkg.name;

export function getVersion() {
  return VERSION;
}

export default VERSION;

/**
 * Handle errors in version module
 * @param {Error} error - The error to handle
 * @param {string} [context='version'] - Error context
 */
function _handleModuleError(error, context = 'version') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
