// Copyright (c) 2026 Ultra-Dex

/**
 * Version utility - Single source of truth
 * All files should import VERSION from here
 */

import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(new URL('../../../../package.json', import.meta.url), 'utf8'));

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
function handleModuleError(error, context = 'version') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
