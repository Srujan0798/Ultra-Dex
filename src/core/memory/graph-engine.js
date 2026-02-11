// Copyright (c) 2026 Ultra-Dex

/**
 * Memory Graph Engine
 * Traverses memory nodes and outputs Mermaid/Graphviz.
 */

import { sqliteProvider } from './sqlite.js';

class MemoryGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.provider = sqliteProvider;
  }

  async relate(fromId, toId, relationshipType = 'RELATES_TO') {
    await this.provider.init();
    const fromNode = await this.provider.get('cold', fromId);
    const toNode = await this.provider.get('cold', toId);

    if (fromNode && toNode) {
      const metadata = fromNode.metadata || {};
      metadata.relations = metadata.relations || [];
      metadata.relations.push({ target: toId, type: relationshipType });
      await this.provider.add('cold', { ...fromNode, metadata });
      
      printSuccess(chalk.gray(\`Link established: \${fromId} --[\${relationshipType}]--> \${toId}\`));
    }
  }

  async findPath(startId, endId, maxDepth = 5) {
    // Basic BFS pathfinding implementation
    // ... logic to follow metadata.relations ...
  }

  link(from, to, type = 'relates_to') {
    if (!this.edges.has(from)) this.edges.set(from, []);
    this.edges.get(from).push({ to, type });
  }

  getNode(id) {
    return this.nodes.get(id) || null;
  }

  queryDecisionWhy(keyword) {
    const matches = [];
    for (const node of this.nodes.values()) {
      if (node.type === 'decision' && node.content?.toLowerCase().includes(keyword.toLowerCase())) {
        matches.push(node);
      }
    }
    return matches;
  }

  traverseFrom(id, depth = 2, visited = new Set()) {
    if (depth < 0 || visited.has(id)) return [];
    visited.add(id);

    const edges = this.edges.get(id) || [];
    const results = [];
    for (const edge of edges) {
      results.push(edge);
      results.push(...this.traverseFrom(edge.to, depth - 1, visited));
    }

    return results;
  }

  toMermaid() {
    const lines = ['graph TD'];
    for (const [from, edges] of this.edges.entries()) {
      edges.forEach((edge) => {
        lines.push(`  ${sanitize(from)} --|${edge.type}| ${sanitize(edge.to)}`);
      });
    }
    return lines.join('\n');
  }

  toGraphviz() {
    const lines = ['digraph MemoryGraph {'];
    for (const [from, edges] of this.edges.entries()) {
      edges.forEach((edge) => {
        lines.push(`  "${from}" -> "${edge.to}" [label="${edge.type}"];`);
      });
    }
    lines.push('}');
    return lines.join('\n');
  }
}

function sanitize(id) {
  return String(id).replace(/[^a-zA-Z0-9_]/g, '_');
}

export const memoryGraph = new MemoryGraph();

export default {
  MemoryGraph,
  memoryGraph,
};

/**
 * Error handler for graph-engine
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[graph-engine]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
