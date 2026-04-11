// Copyright (c) 2026 Ultra-Dex

export default {
  id: 'onelogin',
  name: 'OneLogin',
  discoveryPath: '.well-known/openid-configuration',
  scopes: ['openid', 'profile', 'email'],
};

/**
 * Error handler for onelogin
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[onelogin]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
