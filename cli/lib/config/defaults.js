// Copyright (c) 2026 Ultra-Dex

/**
 * Environment Defaults & Constants
 * Updated for v3.4.5 spec
 */

export const DEFAULTS = {
  // Performance & Scaling
  CACHE_TIMEOUT: process.env.ULTRA_CACHE_TIMEOUT
    ? parseInt(process.env.ULTRA_CACHE_TIMEOUT)
    : 30000,
  CONCURRENCY_LIMIT: process.env.ULTRA_CONCURRENCY_LIMIT
    ? parseInt(process.env.ULTRA_CONCURRENCY_LIMIT)
    : 100,

  // Connectivity
  MCP_PORT: process.env.ULTRA_MCP_PORT ? parseInt(process.env.ULTRA_MCP_PORT) : 3001,

  // Observability
  LOG_LEVEL: process.env.ULTRA_LOG_LEVEL || 'info',

  // Legacy Compatibility (v3.3.x)
  AGENT_TIMEOUT: process.env.ULTRA_AGENT_TIMEOUT
    ? parseInt(process.env.ULTRA_AGENT_TIMEOUT)
    : 60000,
  STORAGE_ADAPTER: process.env.ULTRA_STORAGE_ADAPTER || 'local',
};

/**
 * Merges user config with defaults, ensuring v3.4.5 standards are met
 */
export function getConfig(userConfig = {}) {
  return {
    ...DEFAULTS,
    ...userConfig,
    // Enforce v3.4.5 specific overrides if needed
    version: '3.4.5',
  };
}
