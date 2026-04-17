// Copyright (c) 2026 Ultra-Dex

/**
 * Version utility - Single source of truth
 * All files should import VERSION from here
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonCandidates = [
  path.resolve(__dirname, '../../package.json'),
  path.resolve(__dirname, '../../../../../package.json'),
  path.resolve(process.cwd(), 'package.json'),
  path.resolve(process.cwd(), '../package.json'),
];
const packageJsonPath = packageJsonCandidates.find((candidate) => fs.existsSync(candidate));

if (!packageJsonPath) {
  throw new Error('Ultra-Dex CLI version metadata could not be resolved');
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

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
