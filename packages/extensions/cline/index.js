/**
 * @fileoverview Index module
 * @module cline/index
 */

export function activate(api) {
  api.registerCommand('ultraDex.sync', () => api.notify('Ultra-Dex context synced'));
  api.registerCommand('ultraDex.swarm', () => api.notify('Ultra-Dex swarm executing'));
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
