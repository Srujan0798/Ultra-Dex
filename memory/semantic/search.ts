import { randomUUID } from 'node:crypto';

export interface VectorMetadata {
  text: string;
  metadata: Record<string, any>;
  indexedAt: number;
}

export interface SearchResult extends VectorMetadata {
  id: string;
  similarity: number;
}

export class SemanticSearch {
  private vectors: Map<string, number[]>;
  private metadata: Map<string, VectorMetadata>;
  private dimension: number;

  constructor(dimension: number = 1536) {
    this.vectors = new Map();
    this.metadata = new Map();
    this.dimension = dimension;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // Fallback embedding generator (simplified from legacy)
  private generateEmbedding(text: string): number[] {
    const embedding = new Array(this.dimension).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const bucket = (charCode + i) % this.dimension;
      embedding[bucket] += charCode / 1000;
    }
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < this.dimension; i++) {
        embedding[i] /= norm;
      }
    }
    return embedding;
  }

  async index(text: string, metadata: Record<string, any> = {}): Promise<string> {
    const id = `vec_${randomUUID()}`;
    const embedding = this.generateEmbedding(text);
    this.vectors.set(id, embedding);
    this.metadata.set(id, {
      text,
      metadata,
      indexedAt: Date.now(),
    });
    return id;
  }

  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    const queryEmbedding = this.generateEmbedding(query);
    const results: SearchResult[] = [];

    for (const [id, vector] of this.vectors.entries()) {
      const similarity = this.cosineSimilarity(queryEmbedding, vector);
      const meta = this.metadata.get(id);
      if (meta) {
        results.push({
          id,
          similarity,
          ...meta,
        });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  async delete(id: string): Promise<boolean> {
    this.vectors.delete(id);
    return this.metadata.delete(id);
  }

  async clear(): Promise<void> {
    this.vectors.clear();
    this.metadata.clear();
  }
}

export const globalSemanticSearch = new SemanticSearch();
