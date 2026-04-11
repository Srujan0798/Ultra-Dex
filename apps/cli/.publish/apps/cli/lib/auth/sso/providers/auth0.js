// Copyright (c) 2026 Ultra-Dex

export default {
  id: 'auth0',
  name: 'Auth0',
  discoveryPath: '.well-known/openid-configuration',
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};

/**
 * Error handler for auth0
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[auth0]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
