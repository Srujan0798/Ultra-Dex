// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Claude module
 * @module adapters/claude
 */

export function createClaudeAdapter() {
  return {
    name: 'claude-desktop',
    description: 'Claude Desktop MCP adapter',
    resources: ['ultra://project/state', 'ultra://project/context'],
    tools: ['remember', 'query_graph', 'validate_output'],
  };
}

/**
 * Handle errors in claude module
 * @param {Error} error - The error to handle
 * @param {string} [context='claude'] - Error context
 */
function handleModuleError(error, context = 'claude') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
