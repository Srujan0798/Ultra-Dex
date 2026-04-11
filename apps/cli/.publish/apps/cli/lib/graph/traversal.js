// Copyright (c) 2026 Ultra-Dex

/**
 * Graph Traversal Engine
 * Query memory nodes: "Why did we choose X?" → Find Decision node → Follow edges
 */

import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
// import { MemoryEntry } from './schema.js'; // TODO: schema.js does not exist
class MemoryEntry {}

// Graph node types
const NODE_TYPES = {
  DECISION: 'decision',
  REQUIREMENT: 'requirement',
  SOLUTION: 'solution',
  CODE: 'code',
  BUG: 'bug_report',
  FIX: 'fix',
  CONTEXT: 'context',
  MEETING: 'meeting_notes',
  RESEARCH: 'research',
  CONVERSATION: 'conversation',
  TASK: 'task',
  KNOWLEDGE: 'knowledge',
  EXPERIENCE: 'experience',
};

class GraphTraversalEngine {
  constructor() {
    this.nodes = new Map(); // nodeId -> MemoryEntry
    this.edges = new Map(); // edgeId -> { from, to, type, weight }
    this.indexes = {
      content: new Map(), // content hash -> [nodeIds]
      type: new Map(), // type -> [nodeIds]
      author: new Map(), // author -> [nodeIds]
      tag: new Map(), // tag -> [nodeIds]
      relation: new Map(), // nodeId -> [relatedNodeIds]
    };
  }

  /**
   * Add a node to the graph
   */
  addNode(memoryEntry) {
    if (!(memoryEntry instanceof MemoryEntry)) {
      throw new Error('Node must be a MemoryEntry instance');
    }

    this.nodes.set(memoryEntry.id, memoryEntry);

    // Update indexes
    this.updateIndexesForNode(memoryEntry);

    return memoryEntry.id;
  }

  /**
   * Add an edge between two nodes
   */
  addEdge(fromId, toId, edgeType, weight = 1) {
    const edgeId = `${fromId}-${edgeType}-${toId}`;

    const edge = {
      id: edgeId,
      from: fromId,
      to: toId,
      type: edgeType,
      weight,
      createdAt: new Date().toISOString(),
    };

    this.edges.set(edgeId, edge);

    // Update relation index
    if (!this.indexes.relation.has(fromId)) {
      this.indexes.relation.set(fromId, []);
    }
    if (!this.indexes.relation.get(fromId).includes(toId)) {
      this.indexes.relation.get(fromId).push(toId);
    }

    return edgeId;
  }

  /**
   * Update indexes for a node
   */
  updateIndexesForNode(node) {
    // Content index
    const contentHash = node.getContentHash();
    if (!this.indexes.content.has(contentHash)) {
      this.indexes.content.set(contentHash, []);
    }
    if (!this.indexes.content.get(contentHash).includes(node.id)) {
      this.indexes.content.get(contentHash).push(node.id);
    }

    // Type index
    if (!this.indexes.type.has(node.type)) {
      this.indexes.type.set(node.type, []);
    }
    if (!this.indexes.type.get(node.type).includes(node.id)) {
      this.indexes.type.get(node.type).push(node.id);
    }

    // Author index
    if (!this.indexes.author.has(node.author)) {
      this.indexes.author.set(node.author, []);
    }
    if (!this.indexes.author.get(node.author).includes(node.id)) {
      this.indexes.author.get(node.author).push(node.id);
    }

    // Tag indexes
    for (const tag of node.tags) {
      if (!this.indexes.tag.has(tag)) {
        this.indexes.tag.set(tag, []);
      }
      if (!this.indexes.tag.get(tag).includes(node.id)) {
        this.indexes.tag.get(tag).push(node.id);
      }
    }
  }

  /**
   * Find nodes by content query
   */
  findNodesByContent(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [_nodeId, node] of this.nodes.entries()) {
      if (node.content.toLowerCase().includes(lowerQuery)) {
        results.push(node);
      }
    }

    return results;
  }

  /**
   * Find nodes by type
   */
  findNodesByType(type) {
    const nodeIds = this.indexes.type.get(type) || [];
    return nodeIds.map((id) => this.nodes.get(id)).filter(Boolean);
  }

  /**
   * Find nodes by tag
   */
  findNodesByTag(tag) {
    const nodeIds = this.indexes.tag.get(tag) || [];
    return nodeIds.map((id) => this.nodes.get(id)).filter(Boolean);
  }

  /**
   * Find decision nodes that might answer "Why did we choose X?"
   */
  findDecisionNodes(query) {
    const lowerQuery = query.toLowerCase();
    const decisionNodes = this.findNodesByType(NODE_TYPES.DECISION);

    return decisionNodes.filter((node) => {
      return (
        node.content.toLowerCase().includes(lowerQuery) ||
        node.content.toLowerCase().includes('choose') ||
        node.content.toLowerCase().includes('select') ||
        node.content.toLowerCase().includes('decide')
      );
    });
  }

  /**
   * Traverse the graph starting from a node, following specific edge types
   */
  traverseFromNode(startNodeId, options = {}) {
    const {
      maxDepth = 3,
      edgeTypes = null, // null means any edge type
      _nodeTypes = null, // null means any node type
      direction = 'both', // 'outgoing', 'incoming', 'both'
      maxResults = 50,
    } = options;

    const visited = new Set();
    const results = [];
    const queue = [{ nodeId: startNodeId, depth: 0, path: [startNodeId] }];

    while (queue.length > 0 && results.length < maxResults) {
      const { nodeId, depth, path } = queue.shift();

      if (visited.has(nodeId) || depth > maxDepth) {
        continue;
      }

      visited.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (node) {
        results.push({
          node,
          path,
          depth,
        });
      }

      if (depth >= maxDepth) {
        continue;
      }

      // Get connected nodes based on direction and filters
      const connectedNodes = this.getConnectedNodes(nodeId, { edgeTypes, direction });

      for (const connected of connectedNodes) {
        if (!visited.has(connected.nodeId)) {
          queue.push({
            nodeId: connected.nodeId,
            depth: depth + 1,
            path: [...path, connected.nodeId],
          });
        }
      }
    }

    return results;
  }

  /**
   * Get connected nodes for traversal
   */
  getConnectedNodes(nodeId, options = {}) {
    const { edgeTypes = null, direction = 'both' } = options;
    const connections = [];

    // Outgoing edges
    if (direction === 'outgoing' || direction === 'both') {
      for (const [_edgeId, edge] of this.edges.entries()) {
        if (edge.from === nodeId) {
          if (!edgeTypes || edgeTypes.includes(edge.type)) {
            connections.push({
              nodeId: edge.to,
              edge,
              direction: 'outgoing',
            });
          }
        }
      }
    }

    // Incoming edges
    if (direction === 'incoming' || direction === 'both') {
      for (const [_edgeId, edge] of this.edges.entries()) {
        if (edge.to === nodeId) {
          if (!edgeTypes || edgeTypes.includes(edge.type)) {
            connections.push({
              nodeId: edge.from,
              edge,
              direction: 'incoming',
            });
          }
        }
      }
    }

    return connections;
  }

  /**
   * Answer "Why did we choose X?" queries
   */
  async answerWhyQuestion(query) {
    printInfo(`🤔 Processing "Why" question: ${query}`);

    // Find decision nodes that might contain the answer
    const decisionNodes = this.findDecisionNodes(query);

    if (decisionNodes.length === 0) {
      printWarning(`No decision nodes found for query: ${query}`);
      return [];
    }

    printSuccess(`Found ${decisionNodes.length} potential decision nodes`);

    // For each decision node, traverse to find supporting context
    const answers = [];

    for (const decisionNode of decisionNodes) {
      printInfo(`Analyzing decision: ${decisionNode.id}`);

      // Traverse to find related context, requirements, etc.
      const traversalResults = this.traverseFromNode(decisionNode.id, {
        maxDepth: 2,
        edgeTypes: ['supports', 'motivates', 'requires', 'addresses'],
        nodeTypes: [
          NODE_TYPES.REQUIREMENT,
          NODE_TYPES.CONTEXT,
          NODE_TYPES.RESEARCH,
          NODE_TYPES.MEETING,
        ],
      });

      answers.push({
        decision: decisionNode,
        supportingInfo: traversalResults.map((r) => ({
          node: r.node,
          relationship: r.path.length > 1 ? 'indirect' : 'direct',
          depth: r.depth,
        })),
        confidence: this.calculateAnswerConfidence(decisionNode, traversalResults),
      });
    }

    // Sort by confidence
    answers.sort((a, b) => b.confidence - a.confidence);

    return answers;
  }

  /**
   * Calculate confidence in an answer
   */
  calculateAnswerConfidence(decisionNode, supportingInfo) {
    let confidence = 0.5; // Base confidence

    // Boost for relevant content
    if (
      decisionNode.content.toLowerCase().includes('because') ||
      decisionNode.content.toLowerCase().includes('therefore') ||
      decisionNode.content.toLowerCase().includes('due to')
    ) {
      confidence += 0.2;
    }

    // Boost for supporting information
    confidence += Math.min(0.3, supportingInfo.length * 0.1);

    // Boost for recent information
    const daysOld =
      (Date.now() - new Date(decisionNode.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 30) {
      // Less than 30 days old
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Find all nodes related to a specific topic
   */
  findTopicNodes(topic) {
    const results = [];

    for (const [_nodeId, node] of this.nodes.entries()) {
      if (
        node.content.toLowerCase().includes(topic.toLowerCase()) ||
        node.tags.some((tag) => tag.toLowerCase().includes(topic.toLowerCase()))
      ) {
        results.push(node);
      }
    }

    return results;
  }

  /**
   * Get the full graph structure
   */
  getGraphStructure() {
    return {
      nodes: Array.from(this.nodes.values()).map((node) => ({
        id: node.id,
        type: node.type,
        contentPreview: node.content.substring(0, 100) + '...',
        tags: node.tags,
        author: node.author,
        createdAt: node.createdAt,
      })),
      edges: Array.from(this.edges.values()).map((edge) => ({
        id: edge.id,
        from: edge.from,
        to: edge.to,
        type: edge.type,
        weight: edge.weight,
      })),
    };
  }

  /**
   * Get statistics about the graph
   */
  getStatistics() {
    const stats = {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      nodeTypes: {},
      avgConnections: 0,
    };

    // Count node types
    for (const node of this.nodes.values()) {
      stats.nodeTypes[node.type] = (stats.nodeTypes[node.type] || 0) + 1;
    }

    // Calculate average connections
    if (this.nodes.size > 0) {
      let totalConnections = 0;
      for (const [nodeId] of this.nodes.entries()) {
        totalConnections += this.getConnectedNodes(nodeId).length;
      }
      stats.avgConnections = totalConnections / this.nodes.size;
    }

    return stats;
  }

  /**
   * Clear the graph
   */
  clear() {
    this.nodes.clear();
    this.edges.clear();
    this.indexes = {
      content: new Map(),
      type: new Map(),
      author: new Map(),
      tag: new Map(),
      relation: new Map(),
    };
  }
}

// Global instance
const graphTraversalEngine = new GraphTraversalEngine();

/**
 * Register graph traversal command
 */
export function registerGraphTraversalCommand(program) {
  const graphCmd = program
    .command('graph-traverse')
    .alias('traverse')
    .description('Graph traversal engine for memory queries');

  graphCmd
    .command('why')
    .description('Answer "Why did we choose X?" questions')
    .argument('<query>', 'The "why" question')
    .action(async (query) => {
      try {
        printInfo(`🔍 Traversing graph to answer: "${query}"`);

        const answers = await graphTraversalEngine.answerWhyQuestion(query);

        if (answers.length === 0) {
          printWarning('No relevant information found in the graph.');
          return;
        }

        printSuccess(`Found ${answers.length} potential answers:\n`);

        for (let i = 0; i < Math.min(3, answers.length); i++) {
          // Show top 3
          const answer = answers[i];
          printInfo(`Answer ${i + 1} (Confidence: ${(answer.confidence * 100).toFixed(1)}%)`);
          printInfo(`Decision: ${answer.decision.content.substring(0, 200)}...`);

          if (answer.supportingInfo.length > 0) {
            printInfo('Supporting information:');
            for (const support of answer.supportingInfo.slice(0, 3)) {
              // Show top 3
              printInfo(`  - ${support.node.type}: ${support.node.content.substring(0, 100)}...`);
            }
          }
          console.log('');
        }
      } catch (error) {
        printError(`Graph traversal failed: ${error.message}`);
      }
    });

  graphCmd
    .command('find')
    .description('Find nodes by content')
    .argument('<query>', 'Search query')
    .option('-t, --type <type>', 'Filter by node type')
    .option('-a, --author <author>', 'Filter by author')
    .action((query, options) => {
      try {
        let results;

        if (options.type) {
          results = graphTraversalEngine.findNodesByType(options.type);
        } else {
          results = graphTraversalEngine.findNodesByContent(query);
        }

        if (results.length === 0) {
          printWarning(`No nodes found for query: ${query}`);
          return;
        }

        printSuccess(`Found ${results.length} nodes:\n`);

        for (const node of results.slice(0, 10)) {
          // Show top 10
          printInfo(`${node.type} (${node.id}): ${node.content.substring(0, 150)}...`);
        }
      } catch (error) {
        printError(`Node search failed: ${error.message}`);
      }
    });

  graphCmd
    .command('stats')
    .description('Show graph statistics')
    .action(() => {
      try {
        const stats = graphTraversalEngine.getStatistics();

        printSuccess('📊 Graph Statistics:');
        printInfo(`  Total Nodes: ${stats.totalNodes}`);
        printInfo(`  Total Edges: ${stats.totalEdges}`);
        printInfo(`  Average Connections: ${stats.avgConnections.toFixed(2)}`);
        printInfo('  Node Types:');

        for (const [type, count] of Object.entries(stats.nodeTypes)) {
          printInfo(`    ${type}: ${count}`);
        }
      } catch (error) {
        printError(`Stats retrieval failed: ${error.message}`);
      }
    });

  graphCmd
    .command('traverse')
    .description('Traverse from a specific node')
    .argument('<node-id>', 'Starting node ID')
    .option('-d, --depth <depth>', 'Maximum traversal depth', '2')
    .option('-t, --types <types>', 'Comma-separated node types to include')
    .action((nodeId, options) => {
      try {
        const node = graphTraversalEngine.nodes.get(nodeId);
        if (!node) {
          printError(`Node not found: ${nodeId}`);
          return;
        }

        const nodeTypes = options.types ? options.types.split(',') : null;

        const results = graphTraversalEngine.traverseFromNode(nodeId, {
          maxDepth: parseInt(options.depth),
          nodeTypes,
        });

        printSuccess(`Traversed from node ${nodeId}, found ${results.length} connected nodes:\n`);

        for (const result of results) {
          printInfo(
            `Depth ${result.depth}: ${result.node.type} - ${result.node.content.substring(0, 100)}...`
          );
        }
      } catch (error) {
        printError(`Traversal failed: ${error.message}`);
      }
    });

  graphCmd._examples = [
    {
      command: 'ultra-dex graph-traverse why "did we choose PostgreSQL"',
      description: 'Find why PostgreSQL was chosen',
    },
    {
      command: 'ultra-dex graph-traverse find "authentication"',
      description: 'Find nodes about authentication',
    },
    { command: 'ultra-dex graph-traverse stats', description: 'Show graph statistics' },
    {
      command: 'ultra-dex graph-traverse traverse mem_12345',
      description: 'Traverse from specific node',
    },
  ];
}

export default {
  GraphTraversalEngine,
  graphTraversalEngine,
  NODE_TYPES,
  registerGraphTraversalCommand,
};
