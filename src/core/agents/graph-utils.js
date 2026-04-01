// Copyright (c) 2026 Ultra-Dex
// Graph Utils - Agent architecture graph utilities

/**
 * GraphUtils
 * Utilities for building and manipulating agent architecture graphs
 */
export class GraphUtils {
  /**
   * Create a directed graph
   */
  static createGraph() {
    return {
      nodes: new Map(),
      edges: new Map(),
      metadata: {}
    };
  }

  /**
   * Add node to graph
   */
  static addNode(graph, nodeId, data = {}) {
    if (graph.nodes.has(nodeId)) {
      throw new Error(`Node ${nodeId} already exists`);
    }

    graph.nodes.set(nodeId, {
      id: nodeId,
      data,
      incoming: new Set(),
      outgoing: new Set()
    });

    return graph;
  }

  /**
   * Add edge to graph
   */
  static addEdge(graph, fromId, toId, metadata = {}) {
    if (!graph.nodes.has(fromId)) {
      throw new Error(`Source node ${fromId} not found`);
    }

    if (!graph.nodes.has(toId)) {
      throw new Error(`Target node ${toId} not found`);
    }

    const edgeId = `${fromId}->${toId}`;

    if (graph.edges.has(edgeId)) {
      throw new Error(`Edge ${edgeId} already exists`);
    }

    graph.edges.set(edgeId, {
      id: edgeId,
      from: fromId,
      to: toId,
      metadata
    });

    graph.nodes.get(fromId).outgoing.add(toId);
    graph.nodes.get(toId).incoming.add(fromId);

    return graph;
  }

  /**
   * Find node
   */
  static getNode(graph, nodeId) {
    return graph.nodes.get(nodeId);
  }

  /**
   * Get all outgoing nodes
   */
  static getOutgoing(graph, nodeId) {
    const node = graph.nodes.get(nodeId);
    if (!node) return [];

    return Array.from(node.outgoing).map(id => graph.nodes.get(id));
  }

  /**
   * Get all incoming nodes
   */
  static getIncoming(graph, nodeId) {
    const node = graph.nodes.get(nodeId);
    if (!node) return [];

    return Array.from(node.incoming).map(id => graph.nodes.get(id));
  }

  /**
   * Topological sort
   */
  static topologicalSort(graph) {
    const visited = new Set();
    const stack = [];

    const visit = (nodeId) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = graph.nodes.get(nodeId);
      for (const targetId of node.outgoing) {
        visit(targetId);
      }

      stack.push(nodeId);
    };

    for (const nodeId of graph.nodes.keys()) {
      visit(nodeId);
    }

    return stack;
  }

  /**
   * Find cycles in graph
   */
  static findCycles(graph) {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const dfs = (nodeId, path) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const node = graph.nodes.get(nodeId);

      for (const targetId of node.outgoing) {
        if (!visited.has(targetId)) {
          dfs(targetId, [...path]);
        } else if (recursionStack.has(targetId)) {
          const cycleStart = path.indexOf(targetId);
          cycles.push(path.slice(cycleStart));
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }

  /**
   * Calculate shortest path
   */
  static shortestPath(graph, startId, endId) {
    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current === endId) {
        return path;
      }

      const node = graph.nodes.get(current);

      for (const nextId of node.outgoing) {
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push([...path, nextId]);
        }
      }
    }

    return null;
  }

  /**
   * Find all paths between nodes
   */
  static allPaths(graph, startId, endId, maxDepth = 10) {
    const paths = [];

    const dfs = (current, target, path, visited, depth) => {
      if (depth > maxDepth) return;

      if (current === target) {
        paths.push(path);
        return;
      }

      const node = graph.nodes.get(current);

      for (const nextId of node.outgoing) {
        if (!visited.has(nextId)) {
          visited.add(nextId);
          dfs(nextId, target, [...path, nextId], visited, depth + 1);
          visited.delete(nextId);
        }
      }
    };

    dfs(startId, endId, [startId], new Set([startId]), 0);
    return paths;
  }

  /**
   * Merge graphs
   */
  static mergeGraphs(graph1, graph2) {
    const merged = this.createGraph();

    // Copy all nodes from both graphs
    for (const [nodeId, node] of graph1.nodes) {
      merged.nodes.set(nodeId, JSON.parse(JSON.stringify(node)));
    }

    for (const [nodeId, node] of graph2.nodes) {
      if (!merged.nodes.has(nodeId)) {
        merged.nodes.set(nodeId, JSON.parse(JSON.stringify(node)));
      }
    }

    // Copy all edges
    for (const [edgeId, edge] of graph1.edges) {
      merged.edges.set(edgeId, JSON.parse(JSON.stringify(edge)));
    }

    for (const [edgeId, edge] of graph2.edges) {
      if (!merged.edges.has(edgeId)) {
        merged.edges.set(edgeId, JSON.parse(JSON.stringify(edge)));
      }
    }

    return merged;
  }

  /**
   * Get connected components
   */
  static getConnectedComponents(graph) {
    const visited = new Set();
    const components = [];

    const dfs = (nodeId, component) => {
      visited.add(nodeId);
      component.add(nodeId);

      const node = graph.nodes.get(nodeId);

      for (const nextId of node.outgoing) {
        if (!visited.has(nextId)) {
          dfs(nextId, component);
        }
      }

      for (const prevId of node.incoming) {
        if (!visited.has(prevId)) {
          dfs(prevId, component);
        }
      }
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        const component = new Set();
        dfs(nodeId, component);
        components.push(component);
      }
    }

    return components;
  }

  /**
   * Serialize graph
   */
  static serializeGraph(graph) {
    return JSON.stringify({
      nodes: Array.from(graph.nodes.entries()).map(([id, node]) => ({
        id,
        data: node.data
      })),
      edges: Array.from(graph.edges.entries()).map(([id, edge]) => ({
        from: edge.from,
        to: edge.to,
        metadata: edge.metadata
      })),
      metadata: graph.metadata
    });
  }

  /**
   * Deserialize graph
   */
  static deserializeGraph(serialized) {
    const data = JSON.parse(serialized);
    const graph = this.createGraph();

    // Restore nodes
    for (const node of data.nodes) {
      this.addNode(graph, node.id, node.data);
    }

    // Restore edges
    for (const edge of data.edges) {
      this.addEdge(graph, edge.from, edge.to, edge.metadata);
    }

    graph.metadata = data.metadata;

    return graph;
  }

  /**
   * Visualize graph (text representation)
   */
  static visualize(graph) {
    let output = 'Graph Visualization:\n';
    output += '='.repeat(50) + '\n';

    for (const [nodeId, node] of graph.nodes) {
      output += `Node: ${nodeId}\n`;

      if (node.outgoing.size > 0) {
        output += `  -> [${Array.from(node.outgoing).join(', ')}]\n`;
      }
    }

    output += '='.repeat(50) + '\n';

    return output;
  }
}

export default GraphUtils;
