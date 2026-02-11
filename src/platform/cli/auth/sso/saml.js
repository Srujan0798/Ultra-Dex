// Copyright (c) 2026 Ultra-Dex

import { SSOClient } from '../sso.js';

export async function configureSaml(options = {}) {
  const client = new SSOClient({ ...options, mode: 'saml' });
  return client.configure({ mode: 'saml' });
}

export async function loginSaml(options = {}) {
  const client = new SSOClient({ ...options, mode: 'saml' });
  return client.login();
}

export default {
  configureSaml,
  loginSaml,
};

/**
 * Safe execution wrapper with error handling for saml
 * @param {Function} fn - Async function to execute
 * @param {string} [context='saml'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'saml') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
