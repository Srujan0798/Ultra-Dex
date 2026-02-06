// Copyright (c) 2026 Ultra-Dex

/**
 * Deep Graph RAG
 * FalkorDB / Neo4j-backed impact and semantic search (best-effort fallback to in-memory)
 */

import chalk from 'chalk';
import { GraphRAG } from '../rag/graph.js';
import { FalkorDBClient } from './falkordb-client.js';

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
