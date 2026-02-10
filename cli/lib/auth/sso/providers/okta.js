// Copyright (c) 2026 Ultra-Dex

export default {
  id: 'okta',
  name: 'Okta',
  discoveryPath: '.well-known/openid-configuration',
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};

/**
 * Error handler for okta
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[okta]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
