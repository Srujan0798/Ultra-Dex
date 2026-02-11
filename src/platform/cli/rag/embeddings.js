// Copyright (c) 2026 Ultra-Dex

/**
 * Graph RAG Embeddings Module
 * Generates and manages embeddings for semantic search
 */

import chalk from 'chalk';

/**
 * Embeddings Manager for Graph RAG
 */
export class EmbeddingsManager {
  constructor(options = {}) {
    this.model = options.model || 'Xenova/all-MiniLM-L6-v2';
    this.embedder = null;
    this.cache = new Map();
    this.cacheSize = options.cacheSize || 1000;
  }

  /**
   * Initialize the embedding model
   */
  async initialize() {
    try {
      // Use Xenova Transformers for embeddings
      const { pipeline } = await import('@xenova/transformers');
      this.embedder = await pipeline('feature-extraction', this.model);
      console.log(chalk.green('[Embeddings] Model loaded:', this.model));
      return true;
    } catch (error) {
      console.log(chalk.yellow('[Embeddings] Failed to load model:', error.message));
      console.log(chalk.yellow('[Embeddings] Run: npm install @xenova/transformers'));
      return false;
    }
  }

  /**
   * Generate embedding for text
   */
  async embed(text) {
    if (!this.embedder) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Embeddings model not available');
      }
    }

    // Check cache
    const cacheKey = this.hashText(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Generate embedding
    const output = await this.embedder(text, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data);

    // Cache result
    if (this.cache.size < this.cacheSize) {
      this.cache.set(cacheKey, embedding);
    }

    return embedding;
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedBatch(texts) {
    const embeddings = [];
    for (const text of texts) {
      try {
        const embedding = await this.embed(text);
        embeddings.push(embedding);
      } catch (error) {
        console.log(chalk.yellow(`[Embeddings] Failed to embed: ${error.message}`));
        embeddings.push(null);
      }
    }
    return embeddings;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Search for similar texts
   */
  async search(query, candidates, topK = 5) {
    const queryEmbedding = await this.embed(query);

    const similarities = candidates.map((candidate) => ({
      text: candidate.text || candidate,
      metadata: candidate.metadata || {},
      similarity: this.cosineSimilarity(queryEmbedding, candidate.embedding || candidate),
    }));

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }

  /**
   * Simple hash for caching
   */
  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log(chalk.gray('[Embeddings] Cache cleared'));
  }
}

/**
 * Generate embeddings for codebase
 */
export async function generateCodebaseEmbeddings(rootDir = process.cwd()) {
  const manager = new EmbeddingsManager();
  const initialized = await manager.initialize();

  if (!initialized) {
    console.log(chalk.red('Failed to initialize embeddings model'));
    return null;
  }

  console.log(chalk.blue('[Embeddings] Generating codebase embeddings...'));

  // This would scan the codebase and generate embeddings
  // For now, return the manager instance
  return manager;
}

// Export singleton
export const embeddingsManager = new EmbeddingsManager();
