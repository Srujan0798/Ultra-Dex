// Copyright (c) 2026 Ultra-Dex

/**
 * Memory Graph Engine (v6.0.0)
 * Handles semantic relationships between architectural decisions and code.
 */

import { sqliteProvider } from './sqlite.js';
import chalk from 'chalk';
import { printSuccess } from '../utils/output.js';

class MemoryGraph {
  constructor() {
    this.provider = sqliteProvider;
  }

  /**
   * Relate two memory entries
   */
  async relate(fromId, toId, relationshipType = 'RELATES_TO') {
    await this.provider.init();
    const fromNode = await this.provider.get('cold', fromId);
    const toNode = await this.provider.get('cold', toId);

    if (fromNode && toNode) {
      const metadata = fromNode.metadata || {};
      metadata.relations = metadata.relations || [];
      
      // Prevent duplicates
      if (!metadata.relations.find(r => r.target === toId && r.type === relationshipType)) {
        metadata.relations.push({ target: toId, type: relationshipType });
        await this.provider.add('cold', { ...fromNode, metadata });
        printSuccess(chalk.gray(`Link established: ${fromId} --[${relationshipType}]--> ${toId}`));
      }
    }
  }

  /**
   * Trace the chain of thought for a decision
   */
  async getDecisionTrail(decisionId) {
    await this.provider.init();
    const trail = [];
    let currentId = decisionId;

    while (currentId) {
      const node = await this.provider.get('cold', currentId);
      if (!node) break;
      trail.push(node);
      // Look for 'supersedes' or 'relates_to' in metadata
      currentId = node.metadata?.supersedes || node.metadata?.relations?.find(r => r.type === 'SUPERSEDES')?.target;
    }

    return trail;
  }

  /**
   * Find a path between two nodes (BFS)
   */
  async findPath(startId, endId, maxDepth = 5) {
    await this.provider.init();
    const queue = [[{ id: startId }]];
    const visited = new Set();

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];

      if (node.id === endId) return path;

      if (!visited.has(node.id) && path.length <= maxDepth) {
        visited.add(node.id);
        const record = await this.provider.get('cold', node.id);
        
        if (record?.metadata?.relations) {
          for (const rel of record.metadata.relations) {
            const newPath = [...path, { id: rel.target, type: rel.type }];
            queue.push(newPath);
          }
        }
      }
    }

    return null;
  }

  /**
   * Analyze impact of changing a node
   */
  async getImpact(nodeId) {
    await this.provider.init();
    const impact = new Set();
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (impact.has(currentId)) continue;
      impact.add(currentId);

      // In a real graph, we'd look for incoming edges too.
      // For now, we follow outgoing relations.
      const node = await this.provider.get('cold', currentId);
      if (node?.metadata?.relations) {
        for (const rel of node.metadata.relations) {
          queue.push(rel.target);
        }
      }
    }
    
    return Array.from(impact);
  }
}

export class GraphEngine extends MemoryGraph {}

export const memoryGraph = new GraphEngine();
export default memoryGraph;
