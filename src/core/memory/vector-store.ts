var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
let VectorStore = class {
  constructor(options = {}) {
    this.vectors = /* @__PURE__ */ new Map();
    this.metadata = /* @__PURE__ */ new Map();
    this.dimension = options.dimension || 384;
    this.indexBuilt = false;
  }
  // Simple cosine similarity
  cosineSimilarity(vecA, vecB) {
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
  generateEmbedding(text) {
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
  async index(text, metadata = {}) {
    const id = `vec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const embedding = this.generateEmbedding(text);
    this.vectors.set(id, embedding);
    this.metadata.set(id, {
      text,
      metadata,
      indexedAt: Date.now(),
    });
    this.indexBuilt = true;
    return { id, embedding, metadata };
  }
  async search(query, limit = 10, minSimilarity = 0) {
    const queryEmbedding = this.generateEmbedding(query);
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
  async get(id) {
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
  async delete(id) {
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
};
VectorStore = __decorateClass([singleton()], VectorStore);
const vectorStore = new VectorStore();
var vector_store_default = vectorStore;
export { VectorStore, vector_store_default as default, vectorStore };
