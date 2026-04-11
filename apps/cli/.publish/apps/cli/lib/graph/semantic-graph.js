// Copyright (c) 2026 Ultra-Dex

/**
 * Graph RAG - Semantic Knowledge Graph Implementation
 * Uses in-memory graph with optional Neo4j/FalkorDB backend
 */

import { projectGraph } from '../mcp/graph.js';

export class SemanticKnowledgeGraph {
  constructor(options = {}) {
    this.backend = options.backend || 'memory'; // 'memory', 'neo4j', 'falkordb'
    this.nodes = new Map();
    this.edges = [];
    this.embeddings = new Map();
    this.connectionString = options.connectionString;
  }

  /**
   * Initialize graph from project
   */
  async initialize(workspacePath) {
    // Use existing project graph
    if (projectGraph.nodes.size === 0) {
      await projectGraph.scan(workspacePath);
    }

    // Convert to semantic nodes
    for (const [id, node] of projectGraph.nodes) {
      this.addSemanticNode(id, node);
    }

    // Add semantic edges
    for (const edge of projectGraph.edges) {
      this.addSemanticEdge(edge);
    }

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.length,
    };
  }

  /**
   * Add a semantic node with embedding
   */
  addSemanticNode(id, node) {
    const semanticNode = {
      id,
      type: node.type || 'unknown',
      name: node.name || id,
      path: node.path,
      content: node.content?.slice(0, 1000), // Truncate for embedding
      metadata: {
        language: node.language,
        exports: node.exports || [],
        imports: node.imports || [],
        dependencies: node.dependencies || [],
        loc: node.loc,
      },
      // Semantic properties
      concepts: this.extractConcepts(node),
      domain: this.inferDomain(node),
      complexity: this.calculateComplexity(node),
    };

    this.nodes.set(id, semanticNode);
    return semanticNode;
  }

  /**
   * Extract semantic concepts from node
   */
  extractConcepts(node) {
    const concepts = new Set();
    const content = (node.content || node.name || '').toLowerCase();

    // Domain concepts
    const domainPatterns = {
      auth: /auth|login|session|password|token|jwt/,
      payment: /stripe|payment|billing|subscription|checkout/,
      database: /prisma|db|query|model|schema|migration/,
      api: /api|endpoint|route|handler|controller/,
      ui: /component|button|modal|form|input|page/,
      test: /test|spec|mock|fixture|expect|assert/,
      config: /config|env|settings|options/,
    };

    for (const [concept, pattern] of Object.entries(domainPatterns)) {
      if (pattern.test(content)) {
        concepts.add(concept);
      }
    }

    return Array.from(concepts);
  }

  /**
   * Infer domain from node
   */
  inferDomain(node) {
    const path = node.path || '';

    if (path.includes('/api/') || path.includes('/routes/')) return 'backend';
    if (path.includes('/components/') || path.includes('/pages/')) return 'frontend';
    if (path.includes('/lib/') || path.includes('/utils/')) return 'core';
    if (path.includes('/test/') || path.includes('.test.')) return 'testing';
    if (path.includes('/config/') || path.includes('.config.')) return 'config';

    return 'general';
  }

  /**
   * Calculate complexity score
   */
  calculateComplexity(node) {
    const loc = node.loc || 0;
    const imports = (node.imports || []).length;
    const exports = (node.exports || []).length;

    // Simple complexity heuristic
    let score = 1;
    if (loc > 100) score++;
    if (loc > 300) score++;
    if (imports > 5) score++;
    if (imports > 10) score++;
    if (exports > 3) score++;

    return Math.min(score, 5); // 1-5 scale
  }

  /**
   * Add semantic edge with relationship type
   */
  addSemanticEdge(edge) {
    const semanticEdge = {
      source: edge.source,
      target: edge.target,
      type: edge.type || 'depends_on',
      weight: edge.weight || 1,
      metadata: edge.metadata || {},
    };

    this.edges.push(semanticEdge);
    return semanticEdge;
  }

  /**
   * Query graph by concepts
   */
  queryByConcepts(concepts, options = {}) {
    const limit = options.limit || 10;
    const results = [];

    for (const [_id, node] of this.nodes) {
      const matchScore = concepts.filter((c) => node.concepts.includes(c)).length / concepts.length;

      if (matchScore > 0) {
        results.push({ ...node, score: matchScore });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Query graph by domain
   */
  queryByDomain(domain, options = {}) {
    const limit = options.limit || 20;
    return Array.from(this.nodes.values())
      .filter((n) => n.domain === domain)
      .slice(0, limit);
  }

  /**
   * Find related nodes
   */
  findRelated(nodeId, options = {}) {
    const depth = options.depth || 2;
    const limit = options.limit || 10;

    const visited = new Set();
    const related = [];

    const traverse = (id, currentDepth) => {
      if (currentDepth > depth || visited.has(id)) return;
      visited.add(id);

      // Find edges from this node
      const outgoing = this.edges.filter((e) => e.source === id);
      const incoming = this.edges.filter((e) => e.target === id);

      for (const edge of [...outgoing, ...incoming]) {
        const relatedId = edge.source === id ? edge.target : edge.source;
        const relatedNode = this.nodes.get(relatedId);

        if (relatedNode && !visited.has(relatedId)) {
          related.push({
            ...relatedNode,
            relationship: edge.type,
            distance: currentDepth,
          });
          traverse(relatedId, currentDepth + 1);
        }
      }
    };

    traverse(nodeId, 1);

    return related.sort((a, b) => a.distance - b.distance).slice(0, limit);
  }

  /**
   * Get architecture overview
   */
  getArchitectureOverview() {
    const domains = {};
    const concepts = {};

    for (const node of this.nodes.values()) {
      // Count by domain
      domains[node.domain] = (domains[node.domain] || 0) + 1;

      // Count by concept
      for (const concept of node.concepts) {
        concepts[concept] = (concepts[concept] || 0) + 1;
      }
    }

    // Find high-complexity nodes
    const complexNodes = Array.from(this.nodes.values())
      .filter((n) => n.complexity >= 4)
      .map((n) => ({ id: n.id, name: n.name, complexity: n.complexity }));

    // Find highly connected nodes (potential abstractions)
    const connectionCounts = {};
    for (const edge of this.edges) {
      connectionCounts[edge.source] = (connectionCounts[edge.source] || 0) + 1;
      connectionCounts[edge.target] = (connectionCounts[edge.target] || 0) + 1;
    }

    const coreAbstractions = Object.entries(connectionCounts)
      .filter(([_, count]) => count >= 5)
      .map(([id, count]) => ({ id, connections: count }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 10);

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      domains,
      concepts,
      complexNodes,
      coreAbstractions,
    };
  }

  /**
   * Generate Cypher query for Neo4j export
   */
  toCypher() {
    const statements = [];

    // Create nodes
    for (const node of this.nodes.values()) {
      statements.push(
        `CREATE (n:${node.domain} {id: '${node.id}', name: '${node.name}', ` +
          `type: '${node.type}', complexity: ${node.complexity}, ` +
          `concepts: ${JSON.stringify(node.concepts)}})`
      );
    }

    // Create relationships
    for (const edge of this.edges) {
      statements.push(
        `MATCH (a {id: '${edge.source}'}), (b {id: '${edge.target}'}) ` +
          `CREATE (a)-[:${edge.type.toUpperCase()}]->(b)`
      );
    }

    return statements.join(';\n');
  }
}

export const semanticGraph = new SemanticKnowledgeGraph();

export default SemanticKnowledgeGraph;

/**
 * Safe execution wrapper with error handling for semantic-graph
 * @param {Function} fn - Async function to execute
 * @param {string} [context='semantic-graph'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'semantic-graph') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
