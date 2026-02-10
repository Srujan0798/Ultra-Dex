/**
 * @fileoverview Auth Routes module
 * @module auth/auth.routes
 */

export const routes = [{ path: '/auth/login', method: 'POST' }];

/**
 * Error handler for auth.routes
 * @param {Error} error - Error to handle
 */
function handleAuthroutesError(error) {
  try {
    console.error('[auth.routes]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
