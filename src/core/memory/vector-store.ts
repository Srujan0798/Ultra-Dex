import { singleton } from 'tsyringe';
import { randomUUID } from 'crypto';
import { EmbeddingService } from './embedding-service.js';

interface VectorStoreOptions {
  dimension?: number;
}

interface VectorMetadata {
  text: string;
  metadata: Record<string, unknown>;
  indexedAt: number;
}

@singleton()
class VectorStore {
  private vectors: Map<string, number[]>;
  private metadata: Map<string, VectorMetadata>;
  private dimension: number;
  private indexBuilt: boolean;
  private embeddingService: EmbeddingService;

  constructor(options: VectorStoreOptions = {}) {
    this.vectors = /* @__PURE__ */ new Map();
    this.metadata = /* @__PURE__ */ new Map();
    this.embeddingService = new EmbeddingService();
    this.dimension = options.dimension || this.embeddingService.getDimension();
    this.indexBuilt = false;
  }
  // Simple cosine similarity
  cosineSimilarity(vecA: number[], vecB: number[]) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same dimension');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;
    return dotProduct / denominator;
  }
  // Generate simple hash-based embedding (for demo without ML)
  generateEmbedding(text: string) {
    const embedding = new Array(this.dimension).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const bucket = (charCode + i) % this.dimension;
      embedding[bucket] += charCode / 1e3;
    }
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < this.dimension; i++) {
        embedding[i] /= norm;
      }
    }
    return embedding;
  }
  async index(text: string, metadata: Record<string, unknown> = {}) {
    const id = `vec_${randomUUID()}`;
    const embedding = await this.generateEmbeddingFromService(text);
    this.vectors.set(id, embedding);
    this.metadata.set(id, {
      text,
      metadata,
      indexedAt: Date.now(),
    });
    this.indexBuilt = true;
    return { id, embedding, metadata };
  }
  async search(query: string, limit = 10, minSimilarity = 0) {
    const queryEmbedding = await this.generateEmbeddingFromService(query);
    const results = [];
    for (const [id, vector] of this.vectors.entries()) {
      const similarity = this.cosineSimilarity(queryEmbedding, vector);
      if (similarity >= minSimilarity) {
        results.push({
          id,
          similarity,
          ...this.metadata.get(id),
        });
      }
    }
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }
  async get(id: string) {
    const vector = this.vectors.get(id);
    const meta = this.metadata.get(id);
    if (!vector || !meta) {
      return null;
    }
    return {
      id,
      vector,
      ...meta,
    };
  }
  async delete(id: string) {
    const deleted = this.vectors.delete(id);
    this.metadata.delete(id);
    return deleted;
  }
  async clear() {
    this.vectors.clear();
    this.metadata.clear();
    this.indexBuilt = false;
  }
  size() {
    return this.vectors.size;
  }
  async rebuildIndex() {
    this.indexBuilt = true;
    return { status: 'rebuilt', count: this.vectors.size };
  }
  async stats() {
    return {
      vectorCount: this.vectors.size,
      dimension: this.dimension,
      indexBuilt: this.indexBuilt,
      memoryUsage: (this.vectors.size * this.dimension * 8) / 1024 / 1024,
      // MB
    };
  }

  private async generateEmbeddingFromService(text: string): Promise<number[]> {
    const embedding = await this.embeddingService.embed(text);
    if (embedding.length === this.dimension) return embedding;
    if (embedding.length > this.dimension) return embedding.slice(0, this.dimension);
    return [...embedding, ...new Array(this.dimension - embedding.length).fill(0)];
  }
}

const vectorStore = new VectorStore();
export { VectorStore, vectorStore };
