/**
 * @fileoverview Index module
 * @module windsurf/index
 */

export function activate(api) {
  api.registerCommand('ultraDex.plan', () => api.notify('Ultra-Dex plan generated'));
  api.registerCommand('ultraDex.review', () => api.notify('Ultra-Dex review complete'));
}

export function deactivate() {}

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleIndexError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
