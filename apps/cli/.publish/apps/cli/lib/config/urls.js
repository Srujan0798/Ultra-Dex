// Copyright (c) 2026 Ultra-Dex

export const GITHUB_REPO = 'Srujan0798/Ultra-Dex';
export const GITHUB_WEB_BASE = `https://github.com/${GITHUB_REPO}`;
export const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/main`;

export function githubBlobUrl(pathname) {
  return `${GITHUB_WEB_BASE}/blob/main/${pathname}`;
}

export function githubTreeUrl(pathname) {
  return `${GITHUB_WEB_BASE}/tree/main/${pathname}`;
}

export function githubWebUrl(pathname = '') {
  if (!pathname) return GITHUB_WEB_BASE;
  return `${GITHUB_WEB_BASE}/${pathname}`;
}

/**
 * Handle errors in urls module
 * @param {Error} error - The error to handle
 * @param {string} [context='urls'] - Error context
 */
function _handleModuleError(error, context = 'urls') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
