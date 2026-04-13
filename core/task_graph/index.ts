/**
 * Core Task Graph Module
 * DAG Engine Interface
 *
 * Provides high-level API for building and managing task graphs.
 */

import { DexGraph } from '../../dexgraph/graph.js';
import { DexGraphResult, GraphNode, GraphEdge, NodeState } from '../../dexgraph/types.js';

export interface TaskGraphConfig {
  validateOnBuild: boolean;
  autoResolveDependencies: boolean;
  maxDepth: number;
}

export interface TaskGraphStats {
  nodeCount: number;
  edgeCount: number;
  depth: number;
  width: number;
  cycleFree: boolean;
}

export interface TaskGraphBuilder {
  addNode(node: Omit<GraphNode, 'state'>): TaskGraphBuilder;
  addEdge(from: string, to: string): TaskGraphBuilder;
  build(): DexGraphResult;
  getStats(): TaskGraphStats;
}

export class DAGTaskGraphBuilder implements TaskGraphBuilder {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  private config: TaskGraphConfig;

  constructor(config: Partial<TaskGraphConfig> = {}) {
    this.config = {
      validateOnBuild: config.validateOnBuild ?? true,
      autoResolveDependencies: config.autoResolveDependencies ?? true,
      maxDepth: config.maxDepth ?? 100,
    };
  }

  /**
   * Add a node to the graph
   */
  addNode(node: Omit<GraphNode, 'state'>): TaskGraphBuilder {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node with ID "${node.id}" already exists`);
    }

    const fullNode: GraphNode = {
      ...node,
      state: 'CREATED',
    };

    this.nodes.set(node.id, fullNode);

    // Auto-resolve dependencies from the node definition
    if (this.config.autoResolveDependencies) {
      for (const dep of node.dependencies) {
        this.addEdge(dep, node.id);
      }
    }

    return this;
  }

  /**
   * Add an edge between nodes
   */
  addEdge(from: string, to: string): TaskGraphBuilder {
    // Validate nodes exist
    if (!this.nodes.has(from)) {
      throw new Error(`Source node "${from}" does not exist`);
    }
    if (!this.nodes.has(to)) {
      throw new Error(`Target node "${to}" does not exist`);
    }

    // Check for self-loop
    if (from === to) {
      throw new Error(`Cannot create self-loop on node "${from}"`);
    }

    // Check for duplicate edge
    const exists = this.edges.some((e) => e.from === from && e.to === to);
    if (exists) {
      return this; // Idempotent
    }

    this.edges.push({ from, to });
    return this;
  }

  /**
   * Build the final DexGraphResult
   */
  build(): DexGraphResult {
    const result: DexGraphResult = {
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges],
      metadata: {
        name: 'task-graph',
        description: 'Generated task graph',
        context: {},
      },
    };

    if (this.config.validateOnBuild) {
      this.validate(result);
    }

    return result;
  }

  /**
   * Validate the graph for cycles and other issues
   */
  private validate(result: DexGraphResult): void {
    // Build temporary graph for validation
    const graph = DexGraph.fromParseResult(result);

    // Check for cycles
    try {
      graph.validateDAG();
    } catch (error) {
      throw new Error(`Graph validation failed: ${error}`);
    }

    // Check depth
    const depth = this.calculateDepth(result);
    if (depth > this.config.maxDepth) {
      throw new Error(`Graph depth (${depth}) exceeds maximum (${this.config.maxDepth})`);
    }
  }

  /**
   * Calculate graph statistics
   */
  getStats(): TaskGraphStats {
    const result = this.build();
    const graph = new DexGraph();

    for (const node of result.nodes) {
      graph.addNode(node);
    }
    for (const edge of result.edges) {
      graph.addEdge(edge);
    }

    const depth = this.calculateDepth(result);

    // Calculate width (max nodes at any depth level)
    const nodesAtDepth = new Map<number, number>();
    for (const node of result.nodes) {
      const nodeDepth = this.getNodeDepth(node.id, result);
      nodesAtDepth.set(nodeDepth, (nodesAtDepth.get(nodeDepth) ?? 0) + 1);
    }
    const width = Math.max(...nodesAtDepth.values(), 0);

    // Check for cycles
    let cycleFree = true;
    try {
      graph.validateDAG();
    } catch {
      cycleFree = false;
    }

    return {
      nodeCount: result.nodes.length,
      edgeCount: result.edges.length,
      depth,
      width,
      cycleFree,
    };
  }

  /**
   * Calculate the depth of the graph
   */
  private calculateDepth(result: DexGraphResult): number {
    let maxDepth = 0;
    for (const node of result.nodes) {
      const depth = this.getNodeDepth(node.id, result);
      maxDepth = Math.max(maxDepth, depth);
    }
    return maxDepth;
  }

  /**
   * Calculate depth of a specific node (distance from root)
   */
  private getNodeDepth(nodeId: string, result: DexGraphResult): number {
    const node = result.nodes.find((n) => n.id === nodeId);
    if (!node) return 0;

    if (node.dependencies.length === 0) {
      return 0;
    }

    let maxDepDepth = 0;
    for (const depId of node.dependencies) {
      const depDepth = this.getNodeDepth(depId, result);
      maxDepDepth = Math.max(maxDepDepth, depDepth);
    }

    return maxDepDepth + 1;
  }

  /**
   * Create a DexGraph instance from this builder
   */
  toDexGraph(): DexGraph {
    const result = this.build();
    return DexGraph.fromParseResult(result);
  }

  /**
   * Load from an existing DexGraphResult
   */
  static fromResult(result: DexGraphResult): DAGTaskGraphBuilder {
    const builder = new DAGTaskGraphBuilder();
    for (const node of result.nodes) {
      builder.addNode(node);
    }
    for (const edge of result.edges) {
      builder.addEdge(edge.from, edge.to);
    }
    return builder;
  }

  /**
   * Clear all nodes and edges
   */
  clear(): void {
    this.nodes.clear();
    this.edges = [];
  }

  /**
   * Get node count
   */
  get size(): number {
    return this.nodes.size;
  }
}

// Export factory function
export function createTaskGraph(config?: Partial<TaskGraphConfig>): TaskGraphBuilder {
  return new DAGTaskGraphBuilder(config);
}

// Re-export core types
export { DexGraph, DexGraphResult, GraphNode, GraphEdge, NodeState };
