// Copyright (c) 2026 Ultra-Dex

import { SSOClient } from '../sso.js';

export async function configureOidc(options = {}) {
  const client = new SSOClient({ ...options, mode: 'oidc' });
  return client.configure({ mode: 'oidc' });
}

export async function loginOidc(options = {}) {
  const client = new SSOClient({ ...options, mode: 'oidc' });
  return client.login();
}

export default {
  configureOidc,
  loginOidc,
};

/**
 * Safe execution wrapper with error handling for oidc
 * @param {Function} fn - Async function to execute
 * @param {string} [context='oidc'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'oidc') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
