/**
 * @fileoverview Auth module
 * @module lib/auth
 */

export const authConfig = {
  providers: [],
};

/**
 * Error handler for auth
 * @param {Error} error - Error to handle
 */
function handleAuthError(error) {
  try {
    console.error('[auth]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
