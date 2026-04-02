// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Cursor module
 * @module adapters/cursor
 */

import { Logger } from '../../utils/logger.js';

const logger = new Logger({ prefix: 'Cursor' });

export function createCursorAdapter() {
  return {
    name: 'cursor',
    description: 'Cursor IDE MCP adapter',
    resources: ['ultra://project/state', 'ultra://project/context'],
    tools: ['remember', 'query_graph', 'validate_output'],
  };
}

/**
 * Handle errors in cursor module
 * @param {Error} error - The error to handle
 * @param {string} [context='cursor'] - Error context
 */
function handleModuleError(error, context = 'cursor') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
