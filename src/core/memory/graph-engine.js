/**
 * Graph Engine - REAL Implementation
 * Stores and queries graph relationships
 */

export class GraphEngine {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.adjacencyList = new Map();
  }

  async initialize() {
    // Initialize data structures
    this.nodes.clear();
    this.edges = [];
    this.adjacencyList.clear();
  }

  async addNode(id, data = {}) {
    const node = {
      id,
      data,
      createdAt: Date.now(),
      type: data.type || 'generic'
    };
    this.nodes.set(id, node);
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, []);
    }
    return node;
  }

  async addEdge(from, to, relation = 'connected') {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      throw new Error(`Both nodes must exist. from: ${from}, to: ${to}`);
    }

    const edge = {
      from,
      to,
      relation,
      createdAt: Date.now()
    };
    this.edges.push(edge);

    // Update adjacency list
    if (!this.adjacencyList.has(from)) {
      this.adjacencyList.set(from, []);
    }
    this.adjacencyList.get(from).push({ to, relation });

    return edge;
  }

  async getNode(id) {
    return this.nodes.get(id) || null;
  }

  async getNeighbors(nodeId) {
    const neighbors = this.adjacencyList.get(nodeId) || [];
    return neighbors.map(n => ({
      id: n.to,
      relation: n.relation,
      node: this.nodes.get(n.to)
    }));
  }

  async query(pattern) {
    const { type, relation, depth = 1 } = pattern;
    const results = { nodes: [], edges: [] };

    // Filter nodes by type
    for (const [id, node] of this.nodes.entries()) {
      if (!type || node.type === type) {
        results.nodes.push(node);

        // Get edges for this node
        const nodeEdges = this.edges.filter(e => e.from === id || e.to === id);
        if (!relation) {
          results.edges.push(...nodeEdges);
        } else {
          results.edges.push(...nodeEdges.filter(e => e.relation === relation));
        }
      }
    }

    return results;
  }

  async findPath(from, to) {
    // BFS for shortest path
    const queue = [[from]];
    const visited = new Set([from]);

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];

      if (node === to) {
        return path;
      }

      const neighbors = this.adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.to)) {
          visited.add(neighbor.to);
          queue.push([...path, neighbor.to]);
        }
      }
    }

    return null; // No path found
  }

  async clear() {
    this.nodes.clear();
    this.edges = [];
    this.adjacencyList.clear();
  }

  size() {
    return this.nodes.size;
  }

  edgeCount() {
    return this.edges.length;
  }

  async export() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges],
      stats: {
        nodeCount: this.nodes.size,
        edgeCount: this.edges.length
      }
    };
  }
}

export const graphEngine = new GraphEngine();
export default graphEngine;
