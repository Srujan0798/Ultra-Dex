// Copyright (c) 2026 Ultra-Dex

/**
 * MCP Module Index
 */

export * from './wizard.js';
export * from './server.js';
export { registerResources } from './resources.js';
export { registerTools } from './tools.js';
export { projectGraph } from './graph.js';
export { ultraMemory } from './memory.js';

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
