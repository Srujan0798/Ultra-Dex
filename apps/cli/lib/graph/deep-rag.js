// Copyright (c) 2026 Ultra-Dex

/**
 * Deep Graph RAG
 * FalkorDB / Neo4j-backed impact and semantic search (best-effort fallback to in-memory)
 */

import chalk from 'chalk';
import { GraphRAG } from '../rag/graph.js';
import { FalkorDBClient } from './falkordb-client.js';

async function loadChroma() {
  try {
    const mod = await import('chromadb');
    return mod.ChromaClient || mod.default;
  } catch (_error) {
    throw new Error(
      'chromadb is required for DeepRAG. Install with `npm install chromadb`.'
    );
  }
}

async function loadOpenAIEmbeddings() {
  try {
    const mod = await import('langchain/embeddings/openai');
    return mod.OpenAIEmbeddings || mod.default;
  } catch (_error) {
    throw new Error(
      'langchain OpenAI embeddings are required for DeepRAG. Install with `npm install langchain`.'
    );
  }
}

export class DeepRAG {
  constructor(config = {}) {
    this.config = config;
    this.collectionName = config.collection || 'ultra-dex-knowledge';
    this.collection = null;
    this.chroma = null;
    this.embeddings = null;
  }

  async initialize() {
    const ChromaClient = await loadChroma();
    const OpenAIEmbeddings = await loadOpenAIEmbeddings();

    this.chroma = new ChromaClient();
    this.embeddings = new OpenAIEmbeddings({ apiKey: this.config.openaiKey });
    this.collection = await this.chroma.getOrCreateCollection({
      name: this.collectionName,
      metadata: { 'hnsw:space': 'cosine' },
    });
  }

  async addDocument(content, metadata = {}) {
    if (!this.collection || !this.embeddings) {
      throw new Error('DeepRAG not initialized. Call initialize() first.');
    }

    const embedding = await this.embeddings.embedQuery(content);
    const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    await this.collection.add({
      ids: [id],
      embeddings: [embedding],
      documents: [content],
      metadatas: [{ ...metadata, addedAt: new Date().toISOString() }],
    });

    return id;
  }

  async query(question, options = {}) {
    if (!this.collection || !this.embeddings) {
      throw new Error('DeepRAG not initialized. Call initialize() first.');
    }

    const { topK = 10, filter = {} } = options;
    const embedding = await this.embeddings.embedQuery(question);

    const results = await this.collection.query({
      queryEmbeddings: [embedding],
      nResults: topK,
      where: Object.keys(filter).length ? filter : undefined,
    });

    return results.documents[0].map((doc, i) => ({
      content: doc,
      metadata: results.metadatas[0][i],
      distance: results.distances[0][i],
      relevance: 1 - results.distances[0][i],
    }));
  }

  async expandWithGraph(documents, graph) {
    const expanded = [];

    for (const doc of documents) {
      const related = await graph.getRelated(doc.metadata.fileId);
      expanded.push({
        ...doc,
        related: related.map((r) => ({
          fileId: r.id,
          relationship: r.type,
          summary: r.summary,
        })),
      });
    }

    return expanded;
  }

  async semanticSearch(query, context = {}) {
    const docs = await this.query(query, { topK: 20 });

    const scored = docs.map((doc) => ({
      ...doc,
      score: this.calculateScore(doc, context),
    }));

    return scored.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  calculateScore(doc, context) {
    let score = doc.relevance;

    const age = Date.now() - new Date(doc.metadata.addedAt).getTime();
    const recencyBoost = Math.exp(-age / (30 * 24 * 60 * 60 * 1000));
    score += recencyBoost * 0.2;

    if (context.projectId && doc.metadata.projectId === context.projectId) {
      score += 0.3;
    }

    return score;
  }
}

export class DeepGraphRAG {
  constructor(options = {}) {
    this.dbType = options.dbType || process.env.ULTRA_DEX_GRAPH_DB || 'neo4j';
    this.useInMemory = options.useInMemory || false;
    this.graph = new GraphRAG({
      dbType: this.dbType,
      useInMemory: this.useInMemory,
    });
    this.falkor = null;
  }

  async initialize() {
    if (this.dbType === 'falkordb' && !this.useInMemory) {
      try {
        this.falkor = new FalkorDBClient();
        await this.falkor.connect();
        console.log(chalk.green('[DeepGraphRAG] FalkorDB connected'));
      } catch (error) {
        console.log(chalk.yellow(`[DeepGraphRAG] FalkorDB unavailable: ${error.message}`));
        console.log(chalk.yellow('[DeepGraphRAG] Falling back to in-memory graph'));
        this.useInMemory = true;
      }
    }

    await this.graph.initialize();
  }

  async indexCodebase(rootDir = process.cwd()) {
    return this.graph.indexCodebase(rootDir);
  }

  async search(query, options = {}) {
    return this.graph.query(query, options);
  }

  async impact(target, depth = 2) {
    return this.graph.getImpactAnalysis(target, depth);
  }

  async visualize() {
    return this.graph.exportGraph ? this.graph.exportGraph() : { nodes: [], edges: [] };
  }

  async close() {
    if (this.falkor) {
      await this.falkor.close();
    }
    await this.graph.close();
  }
}

export default DeepGraphRAG;
