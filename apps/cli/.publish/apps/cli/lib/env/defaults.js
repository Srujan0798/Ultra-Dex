// Copyright (c) 2026 Ultra-Dex

export const DEFAULT_ENV = {
  NODE_ENV: 'development',
  ULTRA_DEX_PROVIDER: 'openai',
  ULTRA_DEX_MODEL: 'gpt-4o-mini',
  ULTRA_DEX_THEME: 'default',
  ULTRA_DEX_MEMORY_TIER: 'hot',
};

export function applyDefaults(env = process.env) {
  const resolved = { ...DEFAULT_ENV, ...env };
  return resolved;
}

export default { DEFAULT_ENV, applyDefaults };

/**
 * Handle errors in defaults module
 * @param {Error} error - The error to handle
 * @param {string} [context='defaults'] - Error context
 */
function _handleModuleError(error, context = 'defaults') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
