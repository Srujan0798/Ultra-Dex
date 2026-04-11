// Copyright (c) 2026 Ultra-Dex

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '../..');
const MONOREPO_ROOT = path.resolve(PACKAGE_ROOT, '../..');
const looksLikeMonorepo =
  fs.existsSync(path.join(MONOREPO_ROOT, 'package.json')) &&
  fs.existsSync(path.join(MONOREPO_ROOT, 'apps', 'cli', 'bin', 'ultra-dex.js'));

export const ASSETS_ROOT = path.join(PACKAGE_ROOT, 'assets');
export const ROOT_FALLBACK = looksLikeMonorepo ? MONOREPO_ROOT : PACKAGE_ROOT;
export const LIVE_TEMPLATES_ROOT = path.join(ASSETS_ROOT, 'live-templates');

/**
 * Error handler for paths
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[paths]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
