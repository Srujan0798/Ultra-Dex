var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { GraphUtils } from './graph-utils.js';
let ArchitectGraph = class {
  constructor() {
    this.graph = GraphUtils.createGraph();
    this.patterns = /* @__PURE__ */ new Map();
    this.templates = /* @__PURE__ */ new Map();
  }
  /**
   * Create agent node
   */
  addAgent(agentId, agentType, metadata = {}) {
    GraphUtils.addNode(this.graph, agentId, {
      type: 'agent',
      agentType,
      ...metadata,
    });
    return this;
  }
  /**
   * Create service node
   */
  addService(serviceId, metadata = {}) {
    GraphUtils.addNode(this.graph, serviceId, {
      type: 'service',
      ...metadata,
    });
    return this;
  }
  /**
   * Create dependency edge
   */
  addDependency(fromId, toId, metadata = {}) {
    GraphUtils.addEdge(this.graph, fromId, toId, {
      type: 'dependency',
      ...metadata,
    });
    return this;
  }
  /**
   * Create communication edge
   */
  addCommunication(fromId, toId, metadata = {}) {
    GraphUtils.addEdge(this.graph, fromId, toId, {
      type: 'communication',
      ...metadata,
    });
    return this;
  }
  /**
   * Register an architecture pattern
   */
  registerPattern(patternName, pattern) {
    this.patterns.set(patternName, pattern);
    return this;
  }
  /**
   * Apply a pattern
   */
  applyPattern(patternName, nodeId, config = {}) {
    const pattern = this.patterns.get(patternName);
    if (!pattern) {
      throw new Error(`Pattern ${patternName} not found`);
    }
    return pattern(this, nodeId, config);
  }
  /**
   * Create master-worker pattern
   */
  createMasterWorkerPattern(masterId, workerIds) {
    this.addAgent(masterId, 'master', { pattern: 'master-worker' });
    for (const workerId of workerIds) {
      this.addAgent(workerId, 'worker', { pattern: 'master-worker' });
      this.addDependency(masterId, workerId, { type: 'delegates-to' });
    }
    return this;
  }
  /**
   * Create hierarchical pattern
   */
  createHierarchicalPattern(hierarchy) {
    this.addAgent(hierarchy.parent, 'hierarchical-parent');
    for (const childId of hierarchy.children) {
      this.addAgent(childId, 'hierarchical-child');
      this.addDependency(hierarchy.parent, childId, { type: 'supervises' });
    }
    return this;
  }
  /**
   * Create mesh pattern
   */
  createMeshPattern(agentIds) {
    for (const agentId of agentIds) {
      this.addAgent(agentId, 'mesh-node', { pattern: 'mesh' });
    }
    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        this.addCommunication(agentIds[i], agentIds[j], { bidirectional: true });
      }
    }
    return this;
  }
  /**
   * Create pipeline pattern
   */
  createPipelinePattern(stageIds) {
    for (const stageId of stageIds) {
      this.addService(stageId, { pattern: 'pipeline-stage' });
    }
    for (let i = 0; i < stageIds.length - 1; i++) {
      this.addDependency(stageIds[i], stageIds[i + 1], { type: 'pipeline' });
    }
    return this;
  }
  /**
   * Validate architecture
   */
  validate() {
    const issues = [];
    const cycles = GraphUtils.findCycles(this.graph);
    if (cycles.length > 0) {
      issues.push({
        severity: 'warning',
        message: `Found ${cycles.length} cycles in architecture`,
        cycles,
      });
    }
    const components = GraphUtils.getConnectedComponents(this.graph);
    if (components.length > 1) {
      issues.push({
        severity: 'warning',
        message: `Architecture has ${components.length} disconnected components`,
        components,
      });
    }
    for (const [nodeId, node] of this.graph.nodes) {
      if (node.incoming.size === 0 && node.outgoing.size === 0) {
        issues.push({
          severity: 'info',
          message: `Node ${nodeId} has no connections`,
        });
      }
    }
    return {
      valid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
    };
  }
  /**
   * Analyze architecture
   */
  analyze() {
    const analysis = {
      nodeCount: this.graph.nodes.size,
      edgeCount: this.graph.edges.size,
      components: GraphUtils.getConnectedComponents(this.graph).length,
      cycles: GraphUtils.findCycles(this.graph),
      densityScore: this.calculateDensityScore(),
      centralityAnalysis: this.calculateCentrality(),
    };
    return analysis;
  }
  /**
   * Calculate graph density
   */
  calculateDensityScore() {
    const n = this.graph.nodes.size;
    const m = this.graph.edges.size;
    if (n <= 1) return 0;
    const maxEdges = n * (n - 1);
    return m / maxEdges;
  }
  /**
   * Calculate node centrality
   */
  calculateCentrality() {
    const centrality = {};
    for (const nodeId of this.graph.nodes.keys()) {
      const node = this.graph.nodes.get(nodeId);
      const degreeCentrality =
        (node.incoming.size + node.outgoing.size) / (this.graph.nodes.size - 1);
      let betweenness = 0;
      for (const sourceId of this.graph.nodes.keys()) {
        if (sourceId === nodeId) continue;
        for (const targetId of this.graph.nodes.keys()) {
          if (targetId === nodeId || sourceId === targetId) continue;
          const path = GraphUtils.shortestPath(this.graph, sourceId, targetId);
          if (path && path.includes(nodeId)) {
            betweenness++;
          }
        }
      }
      centrality[nodeId] = {
        degree: degreeCentrality,
        betweenness,
      };
    }
    return centrality;
  }
  /**
   * Export architecture
   */
  export() {
    return {
      nodes: Array.from(this.graph.nodes.values()),
      edges: Array.from(this.graph.edges.values()),
      patterns: Array.from(this.patterns.keys()),
    };
  }
  /**
   * Visualize architecture
   */
  visualize() {
    return GraphUtils.visualize(this.graph);
  }
};
ArchitectGraph = __decorateClass([singleton()], ArchitectGraph);
var architect_graph_default = ArchitectGraph;
export { ArchitectGraph, architect_graph_default as default };
