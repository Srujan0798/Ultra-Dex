// Copyright (c) 2026 Ultra-Dex

export default {
  id: 'google',
  name: 'Google Workspace',
  discoveryPath: '.well-known/openid-configuration',
  scopes: ['openid', 'profile', 'email'],
};

/**
 * Error handler for google
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    logger.error('[google]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
