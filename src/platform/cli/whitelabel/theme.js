// Copyright (c) 2026 Ultra-Dex

import { loadWhitelabelConfig } from './config.js';

export async function getThemeOverrides() {
  const config = await loadWhitelabelConfig();
  return {
    primary: config.colors?.primary || '#6366f1',
    secondary: config.colors?.secondary || '#111827',
  };
}

export default {
  getThemeOverrides,
};

/**
 * Safe execution wrapper with error handling for theme
 * @param {Function} fn - Async function to execute
 * @param {string} [context='theme'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'theme') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
