// Copyright (c) 2026 Ultra-Dex

export default {
  id: 'azure-ad',
  name: 'Azure AD',
  discoveryPath: 'v2.0/.well-known/openid-configuration',
  scopes: ['openid', 'profile', 'email', 'offline_access', 'User.Read'],
};

/**
 * Error handler for azure-ad
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    console.error('[azure-ad]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
