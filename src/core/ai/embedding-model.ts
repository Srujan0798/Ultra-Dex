var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
import { pipeline } from "@xenova/transformers";
import { singleton, inject } from "tsyringe";
import { DI_TOKENS } from '../di/tokens.js';
let EmbeddingModel = class {
  constructor(logger, config) {
    this.logger = logger;
    this.config = config;
    this.modelName = this.config.get("embedding.model", "Xenova/all-MiniLM-L6-v2");
    this.quantized = this.config.get("embedding.quantized", true);
  }
  model = null;
  modelName;
  quantized;
  initialized = false;
  dimensions = 384;
  async initialize() {
    if (this.initialized)
      return;
    this.logger.info(`Loading embedding model: ${this.modelName}`, {
      quantized: this.quantized,
      dimensions: this.dimensions
    });
    try {
      this.model = await pipeline("feature-extraction", this.modelName, {
        quantized: this.quantized
      });
      this.initialized = true;
      this.logger.info("Embedding model loaded successfully");
    } catch (error) {
      this.logger.error("Failed to load embedding model", error);
      throw new Error(`Failed to initialize embedding model: ${error.message}`);
    }
  }
  async embed(text) {
    if (!this.initialized) {
      await this.initialize();
    }
    if (!this.model) {
      throw new Error("Embedding model not initialized");
    }
    try {
      const result = await this.model(text, {
        pooling: "mean",
        normalize: true
      });
      return Array.from(result.data);
    } catch (error) {
      this.logger.error("Embedding generation failed", error, { text: text.slice(0, 100) });
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }
  async embedBatch(texts) {
    if (!this.initialized) {
      await this.initialize();
    }
    const batchSize = this.config.get("embedding.batchSize", 10);
    const results = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((text) => this.embed(text))
      );
      results.push(...batchResults);
    }
    return results;
  }
  cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }
    return dotProduct / denominator;
  }
  /**
   * Compute average of multiple vectors
   */
  static averageVectors(vectors) {
    if (vectors.length === 0) {
      throw new Error("Cannot average empty vector array");
    }
    const dim = vectors[0].length;
    const result = new Array(dim).fill(0);
    for (const v of vectors) {
      if (v.length !== dim) {
        throw new Error("All vectors must have same dimension");
      }
      for (let i = 0; i < dim; i++) {
        result[i] += v[i];
      }
    }
    return result.map((x) => x / vectors.length);
  }
};
EmbeddingModel = __decorateClass([
  singleton(),
  __decorateParam(0, inject(DI_TOKENS.Logger)),
  __decorateParam(1, inject(DI_TOKENS.ConfigService))
], EmbeddingModel);
class MockEmbeddingModel {
  dimensions = 384;
  async initialize() {
  }
  async embed(text) {
    const vector = [];
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = (seed << 5) - seed + text.charCodeAt(i);
      seed |= 0;
    }
    for (let i = 0; i < this.dimensions; i++) {
      seed = seed * 1103515245 + 12345 & 2147483647;
      vector.push(seed / 2147483647 * 2 - 1);
    }
    const norm = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));
    return vector.map((x) => x / norm);
  }
  async embedBatch(texts) {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
  cosineSimilarity(a, b) {
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
}
export {
  EmbeddingModel,
  MockEmbeddingModel
};
