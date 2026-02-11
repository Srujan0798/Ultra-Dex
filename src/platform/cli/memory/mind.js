// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { projectGraph } from '../mcp/graph.js';

/**
 * Persistent Project Mind
 * Hybrid RAG (Vector + Graph) for total project recall
 */
export class ProjectMind {
  constructor() {
    this.memoryPath = path.resolve(process.cwd(), '.ultra/memory.json');
  }

  async query(text) {
    console.log(`[Mind] Recalling context for: "${text}"`);
    // Placeholder for actual vector search
    // In production, this would call ChromaDB/Pinecone
    return {
      knowledgeNodes: await this.getRelatedGraphNodes(text),
      contextSnippet: "Project foundation established using v6.0 architecture.",
      relevanceScore: 0.95
    };
  }

  async getRelatedGraphNodes(text) {
    try {
      await projectGraph.scan();
      const summary = projectGraph.getSummary();
      return summary.files.filter(f => f.toLowerCase().includes(text.toLowerCase()));
    } catch {
      return [];
    }
  }

  async ingest(data) {
    const memory = await this.loadMemory();
    memory.push({
      timestamp: new Date().toISOString(),
      ...data
    });
    await this.saveMemory(memory);
  }

  async loadMemory() {
    try {
      const content = await fs.readFile(this.memoryPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async saveMemory(memory) {
    await fs.mkdir(path.dirname(this.memoryPath), { recursive: true });
    await fs.writeFile(this.memoryPath, JSON.stringify(memory, null, 2));
  }
}