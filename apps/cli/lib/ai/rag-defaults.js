// Copyright (c) 2026 Ultra-Dex

/**
 * RAG (Retrieval-Augmented Generation) Defaults
 * Configured based on v3.4.5 architectural research
 */

export const RAG_CONFIG = {
  // MVP Stack (Local-first & Rapid Prototyping)
  mvp: {
    vector_db: 'chroma',
    embeddings: 'openai-text-embedding-3-small',
    proximity_metric: 'cosine',
  },

  // Production Stack (Enterprise-grade)
  production: {
    vector_db: 'pinecone',
    embeddings: 'cohere-embed-english-v3.0',
    proximity_metric: 'dotproduct',
  },

  // Knowledge Slicing Strategy
  chunking: {
    min_tokens: 300,
    max_tokens: 600,
    overlap_percentage: 0.15, // 15% overlap to preserve context boundaries
    strategy: 'recursive-character',
  },
};

/**
 * Helper to get active RAG profile
 */
export function getRagProfile(env = 'mvp') {
  return RAG_CONFIG[env] || RAG_CONFIG.mvp;
}

/**
 * Handle errors in rag-defaults module
 * @param {Error} error - The error to handle
 * @param {string} [context='rag-defaults'] - Error context
 */
function _handleModuleError(error, context = 'rag-defaults') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
