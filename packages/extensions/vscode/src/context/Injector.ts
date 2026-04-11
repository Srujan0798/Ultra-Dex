/**
 * @fileoverview Injector module
 * @module context/Injector
 */

export { injectContext, extractContext, watchContext } from '../commands/contextInjection';

/**
 * Error handler for Injector
 * @param {Error} error - Error to handle
 */
function handleInjectorError(error) {
  try {
    console.error('[Injector]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
