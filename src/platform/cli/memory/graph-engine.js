// Copyright (c) 2026 Ultra-Dex

/**
 * Memory Graph Engine
 * Traverses memory nodes and outputs Mermaid/Graphviz.
 */

class MemoryGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map(); // key: from -> array of { to, type }
  }

  addEntry(entry) {
    const node = typeof entry?.toJSON === 'function' ? entry.toJSON() : entry;
    this.nodes.set(node.id, node);

    const relations = [];
    if (Array.isArray(node.relatesTo)) {
      node.relatesTo.forEach((id) => relations.push({ to: id, type: 'relates_to' }));
    }
    if (Array.isArray(node.supersedes)) {
      node.supersedes.forEach((id) => relations.push({ to: id, type: 'supersedes' }));
    }

    if (relations.length) {
      this.edges.set(node.id, relations);
    }
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
    logger.error('[graph-engine]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
