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
