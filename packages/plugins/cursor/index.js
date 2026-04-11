/**
 * @fileoverview Index module
 * @module cursor/index
 */

export function activate(api) {
  api.registerCommand('ultraDex.run', () => api.notify('Ultra-Dex run invoked'));
  api.registerCommand('ultraDex.context', () => api.notify('Ultra-Dex context injected'));
  api.registerCommand('ultraDex.swarm', () => api.notify('Ultra-Dex swarm started'));
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
