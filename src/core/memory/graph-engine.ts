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
import { singleton } from "tsyringe";
let GraphEngine = class {
  constructor() {
    this.nodes = /* @__PURE__ */ new Map();
    this.edges = [];
    this.adjacencyList = /* @__PURE__ */ new Map();
  }
  async initialize() {
    this.nodes.clear();
    this.edges = [];
    this.adjacencyList.clear();
  }
  async addNode(id, data = {}) {
    const node = {
      id,
      data,
      createdAt: Date.now(),
      type: data.type || "generic"
    };
    this.nodes.set(id, node);
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, []);
    }
    return node;
  }
  async addEdge(from, to, relation = "connected") {
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
    return neighbors.map((n) => ({
      id: n.to,
      relation: n.relation,
      node: this.nodes.get(n.to)
    }));
  }
  async query(pattern) {
    const { type, relation, depth = 1 } = pattern;
    const results = { nodes: [], edges: [] };
    for (const [id, node] of this.nodes.entries()) {
      if (!type || node.type === type) {
        results.nodes.push(node);
        const nodeEdges = this.edges.filter((e) => e.from === id || e.to === id);
        if (!relation) {
          results.edges.push(...nodeEdges);
        } else {
          results.edges.push(...nodeEdges.filter((e) => e.relation === relation));
        }
      }
    }
    return results;
  }
  async findPath(from, to) {
    const queue = [[from]];
    const visited = /* @__PURE__ */ new Set([from]);
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
    return null;
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
};
GraphEngine = __decorateClass([
  singleton()
], GraphEngine);
const graphEngine = new GraphEngine();
var graph_engine_default = graphEngine;
export {
  GraphEngine,
  graph_engine_default as default,
  graphEngine
};
