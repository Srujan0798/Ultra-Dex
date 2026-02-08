# 🧠 Agent Prompt: Memory & Graph Enhancements (v4.2)

---

## 1. cli/lib/graph/deep-rag.js - Complete Knowledge Graph

```javascript
import { ChromaClient } from 'chromadb';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

export class DeepRAG {
  constructor(config) {
    this.chroma = new ChromaClient();
    this.embeddings = new OpenAIEmbeddings({ apiKey: config.openaiKey });
    this.collectionName = config.collection || 'ultra-dex-knowledge';
    this.collection = null;
  }

  async initialize() {
    this.collection = await this.chroma.getOrCreateCollection({
      name: this.collectionName,
      metadata: { 'hnsw:space': 'cosine' }
    });
  }

  async addDocument(content, metadata = {}) {
    const embedding = await this.embeddings.embedQuery(content);
    const id = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await this.collection.add({
      ids: [id],
      embeddings: [embedding],
      documents: [content],
      metadatas: [{ ...metadata, addedAt: new Date().toISOString() }]
    });
    
    return id;
  }

  async query(question, options = {}) {
    const { topK = 10, filter = {} } = options;
    const embedding = await this.embeddings.embedQuery(question);
    
    const results = await this.collection.query({
      queryEmbeddings: [embedding],
      nResults: topK,
      where: Object.keys(filter).length ? filter : undefined
    });
    
    return results.documents[0].map((doc, i) => ({
      content: doc,
      metadata: results.metadatas[0][i],
      distance: results.distances[0][i],
      relevance: 1 - results.distances[0][i]
    }));
  }

  async expandWithGraph(documents, graph) {
    const expanded = [];
    
    for (const doc of documents) {
      const related = await graph.getRelated(doc.metadata.fileId);
      expanded.push({
        ...doc,
        related: related.map(r => ({
          fileId: r.id,
          relationship: r.type,
          summary: r.summary
        }))
      });
    }
    
    return expanded;
  }

  async semanticSearch(query, context = {}) {
    // 1. Get relevant embeddings
    const docs = await this.query(query, { topK: 20 });
    
    // 2. Re-rank by recency and relevance
    const scored = docs.map(doc => ({
      ...doc,
      score: this.calculateScore(doc, context)
    }));
    
    // 3. Sort and return top results
    return scored.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  calculateScore(doc, context) {
    let score = doc.relevance;
    
    // Boost recent documents
    const age = Date.now() - new Date(doc.metadata.addedAt);
    const recencyBoost = Math.exp(-age / (30 * 24 * 60 * 60 * 1000)); // 30 day decay
    score += recencyBoost * 0.2;
    
    // Boost documents from same project
    if (context.projectId && doc.metadata.projectId === context.projectId) {
      score += 0.3;
    }
    
    return score;
  }
}
```

---

## 2. cli/lib/graph/impact-visualizer.js

```javascript
import { writeFileSync } from 'fs';

export class ImpactVisualizer {
  constructor(graph) {
    this.graph = graph;
  }

  async generateImpactGraph(changedFiles) {
    const nodes = new Set();
    const edges = [];
    
    for (const file of changedFiles) {
      nodes.add(file);
      const dependents = await this.graph.getDependents(file);
      
      for (const dep of dependents) {
        nodes.add(dep.path);
        edges.push({
          source: file,
          target: dep.path,
          type: dep.type,
          risk: this.calculateRisk(dep)
        });
      }
    }
    
    return { nodes: Array.from(nodes), edges };
  }

  calculateRisk(dependency) {
    const factors = {
      isCore: dependency.path.includes('/lib/') ? 0.3 : 0,
      isTest: dependency.path.includes('/test/') ? -0.2 : 0,
      depth: Math.min(dependency.depth / 5, 0.3),
      coupling: Math.min(dependency.coupling / 10, 0.4)
    };
    return Object.values(factors).reduce((a, b) => a + b, 0);
  }

  generateD3Visualization(impactData) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    .node { fill: #69b3a2; stroke: #333; stroke-width: 1.5px; }
    .node.high-risk { fill: #e74c3c; }
    .node.medium-risk { fill: #f39c12; }
    .link { stroke: #999; stroke-opacity: 0.6; }
    .link.high-risk { stroke: #e74c3c; stroke-width: 2px; }
  </style>
</head>
<body>
  <svg width="960" height="600"></svg>
  <script>
    const data = ${JSON.stringify(impactData)};
    // D3 force simulation code...
  </script>
</body>
</html>`;
    return html;
  }

  async saveVisualization(changedFiles, outputPath) {
    const impact = await this.generateImpactGraph(changedFiles);
    const html = this.generateD3Visualization(impact);
    writeFileSync(outputPath, html);
    return outputPath;
  }
}
```

---

## 3. Enhance cli/lib/memory/vector-store.js

```javascript
export class VectorStore {
  constructor(options = {}) {
    this.index = new Map();
    this.embeddings = options.embeddings;
    this.dimensions = options.dimensions || 1536;
  }

  async add(id, content, metadata = {}) {
    const vector = await this.embeddings.embed(content);
    this.index.set(id, { vector, content, metadata, addedAt: Date.now() });
  }

  async search(query, limit = 10) {
    const queryVector = await this.embeddings.embed(query);
    
    const results = [];
    for (const [id, entry] of this.index) {
      const similarity = this.cosineSimilarity(queryVector, entry.vector);
      results.push({ id, similarity, ...entry });
    }
    
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
```

---

**SUCCESS:** Deep RAG, Impact Visualizer, Enhanced Vector Store
