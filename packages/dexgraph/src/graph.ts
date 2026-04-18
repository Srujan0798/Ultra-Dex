import { GraphNode, NodeState, GraphEdge, DexGraphResult } from './types.js';
import { GraphError } from './parser.js';

export class DexGraph {
  private nodes: Map<string, GraphNode>;
  private edges: GraphEdge[];
  private adjacency: Map<string, string[]>; // node → dependents
  private reverseAdjacency: Map<string, string[]>; // node → dependencies

  constructor(parseResult?: { nodes: GraphNode[]; edges: GraphEdge[] }) {
    this.nodes = new Map();
    this.edges = [];
    this.adjacency = new Map();
    this.reverseAdjacency = new Map();
    if (parseResult) {
      for (const node of parseResult.nodes) this.addNode(node);
      for (const edge of parseResult.edges) this.addEdge(edge);
    }
  }

  /**
   * Add a node to the registry
   * @throws {GraphError} if node ID already exists
   */
  addNode(node: GraphNode): void {
    if (this.nodes.has(node.id)) {
      throw new GraphError(`Duplicate node ID: "${node.id}"`);
    }
    this.nodes.set(node.id, node);
    if (!this.adjacency.has(node.id)) {
      this.adjacency.set(node.id, []);
    }
    if (!this.reverseAdjacency.has(node.id)) {
      this.reverseAdjacency.set(node.id, []);
    }
  }

  /**
   * Add an edge between nodes
   * @throws {GraphError} if either from or to node does not exist
   */
  addEdge(edge: GraphEdge): void {
    if (!this.nodes.has(edge.from)) {
      throw new GraphError(`Cannot create edge: source node "${edge.from}" does not exist`);
    }
    if (!this.nodes.has(edge.to)) {
      throw new GraphError(`Cannot create edge: target node "${edge.to}" does not exist`);
    }

    this.edges.push(edge);

    // Update adjacency (dependents)
    const dependents = this.adjacency.get(edge.from) || [];
    if (!dependents.includes(edge.to)) {
      dependents.push(edge.to);
      this.adjacency.set(edge.from, dependents);
    }

    // Update reverse adjacency (dependencies)
    const dependencies = this.reverseAdjacency.get(edge.to) || [];
    if (!dependencies.includes(edge.from)) {
      dependencies.push(edge.from);
      this.reverseAdjacency.set(edge.to, dependencies);
    }
  }

  /**
   * Get a node by ID
   * @throws {GraphError} if node not found
   */
  getNode(id: string): GraphNode {
    const node = this.nodes.get(id);
    if (!node) {
      throw new GraphError(`Node not found: "${id}"`);
    }
    return node;
  }

  /**
   * Get all registered nodes
   */
  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Filter nodes by their current state
   */
  getNodesByState(state: NodeState): GraphNode[] {
    return this.getAllNodes().filter((node) => node.state === state);
  }

  /**
   * Check if a node exists in the registry
   */
  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  /**
   * Get all edges in the graph
   */
  getEdges(): GraphEdge[] {
    return [...this.edges];
  }

  /**
   * Get IDs of nodes that the specified node depends on
   */
  getDependencies(nodeId: string): string[] {
    return this.reverseAdjacency.get(nodeId) || [];
  }

  /**
   * Get IDs of nodes that depend on the specified node
   */
  getDependents(nodeId: string): string[] {
    return this.adjacency.get(nodeId) || [];
  }

  /**
   * Get nodes with zero dependencies (entry points)
   */
  getRootNodes(): GraphNode[] {
    return this.getAllNodes().filter((node) => this.getDependencies(node.id).length === 0);
  }

  /**
   * Get nodes with zero dependents (exit points)
   */
  getLeafNodes(): GraphNode[] {
    return this.getAllNodes().filter((node) => this.getDependents(node.id).length === 0);
  }

  /**
   * DFS-based cycle detection using 3-color marking
   * Returns array of cycles found, or null if no cycles
   */
  detectCycles(): string[][] | null {
    const colors = new Map<string, 'white' | 'gray' | 'black'>();
    const cycles: string[][] = [];
    const allNodeIds = Array.from(this.nodes.keys());

    for (const id of allNodeIds) {
      colors.set(id, 'white');
    }

    const dfs = (u: string, path: string[]) => {
      colors.set(u, 'gray');
      path.push(u);

      const dependents = this.getDependents(u);
      for (const v of dependents) {
        if (colors.get(v) === 'gray') {
          const cyclePath = path.slice(path.indexOf(v));
          cyclePath.push(v);
          cycles.push(cyclePath);
        } else if (colors.get(v) === 'white') {
          dfs(v, [...path]);
        }
      }

      colors.set(u, 'black');
    };

    for (const id of allNodeIds) {
      if (colors.get(id) === 'white') {
        dfs(id, []);
      }
    }

    return cycles.length > 0 ? cycles : null;
  }

  hasCycles(): boolean {
    return this.detectCycles() !== null;
  }

  /**
   * Validate that the graph is a Directed Acyclic Graph (DAG)
   * @throws {GraphError} if cycles are detected
   */
  validateDAG(): void {
    const cycles = this.detectCycles();
    if (cycles) {
      const cycleStr = cycles[0].join(' → ');
      throw new GraphError(`Circular dependency detected: ${cycleStr}`);
    }
  }

  /**
   * Topological Sort using Kahn's algorithm (BFS-based)
   * Returns node IDs in a valid execution order
   * @throws {GraphError} if graph has cycles
   */
  topologicalSort(): string[] {
    const inDegree = new Map<string, number>();
    for (const id of this.nodes.keys()) {
      inDegree.set(id, this.getDependencies(id).length);
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    const result: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      result.push(u);

      for (const v of this.getDependents(u)) {
        const degree = inDegree.get(v)! - 1;
        inDegree.set(v, degree);
        if (degree === 0) {
          queue.push(v);
        }
      }
    }

    if (result.length !== this.nodes.size) {
      throw new GraphError('Circular dependency detected during topological sort');
    }

    return result;
  }

  getExecutionOrder(): string[] {
    return this.topologicalSort();
  }

  /**
   * Return nodes in READY state whose ALL dependencies are in SUCCESS state
   */
  getExecutableNodes(): GraphNode[] {
    return this.getNodesByState('READY').filter((node) => {
      const dependencies = this.getDependencies(node.id);
      return dependencies.every((depId) => this.getNode(depId).state === 'SUCCESS');
    });
  }

  /**
   * Factory: build graph from parser output
   */
  static fromParseResult(result: DexGraphResult): DexGraph {
    const graph = new DexGraph();
    for (const node of result.nodes) {
      graph.addNode(node);
    }
    for (const edge of result.edges) {
      graph.addEdge(edge);
    }
    graph.validateDAG();
    return graph;
  }

  /**
   * Total number of nodes in the graph
   */
  get size(): number {
    return this.nodes.size;
  }
}
