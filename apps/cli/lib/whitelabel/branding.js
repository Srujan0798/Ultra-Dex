// Copyright (c) 2026 Ultra-Dex

import { loadWhitelabelConfig } from './config.js';

export async function getBranding() {
  const config = await loadWhitelabelConfig();
  return {
    name: config.name,
    command: config.command,
    logo: config.logo,
    footer: config.footer,
  };
}

export default {
  getBranding,
};

/**
 * Safe execution wrapper with error handling for branding
 * @param {Function} fn - Async function to execute
 * @param {string} [context='branding'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'branding') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
