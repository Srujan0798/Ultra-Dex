// Copyright (c) 2026 Ultra-Dex

export const DEFAULT_RAG_CONFIG = {
  vectorStore: 'memory',
  topK: 10,
  includeGraph: true,
  maxContextTokens: 4096,
  recencyBoostDays: 30,
};

export function normalizeRagConfig(config = {}) {
  return { ...DEFAULT_RAG_CONFIG, ...config };
}

export default { DEFAULT_RAG_CONFIG, normalizeRagConfig };

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
