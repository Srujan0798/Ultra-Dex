// Copyright (c) 2026 Ultra-Dex

/**
 * Version utility - Single source of truth
 * All files should import VERSION from here
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { version: string; name: string };

export const VERSION: string = pkg.version;
export const PACKAGE_NAME: string = pkg.name;

export default VERSION;

/**
 * Error handler for version
 * @param {Error} error - Error to handle
 */
function handleError(error: Error | unknown) {
  try {
    console.error('[version]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
