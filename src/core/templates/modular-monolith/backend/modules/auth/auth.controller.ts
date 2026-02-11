/**
 * @fileoverview Auth Controller module
 * @module auth/auth.controller
 */

export function login() {
  return { status: 'ok' };
}

/**
 * Error handler for auth.controller
 * @param {Error} error - Error to handle
 */
function handleAuthcontrollerError(error) {
  try {
    console.error('[auth.controller]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
