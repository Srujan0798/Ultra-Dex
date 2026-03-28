// Copyright (c) 2026 Ultra-Dex

import { EnterpriseSSO as SSOClient } from '../sso.js';

export const ssoClient = new SSOClient();

export async function configureSso(options = {}) {
  return ssoClient.configureWizard(options);
}

export async function loginSso() {
  return ssoClient.login();
}

export { SSOClient };

export default {
  ssoClient,
  configureSso,
  loginSso,
  SSOClient,
};

/**
 * Safe execution wrapper with error handling for index
 * @param {Function} fn - Async function to execute
 * @param {string} [context='index'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'index') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
