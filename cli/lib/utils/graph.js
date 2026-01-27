/**
 * Graph Utility (CPG Implementation)
 * Manages the Code Property Graph (CPG) for architectural memory
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

/**
 * Build a simple Code Property Graph (CPG)
 * Maps files, functions, and dependencies
 */
export async function buildGraph() {
  const files = await glob('**/*.{js,ts,jsx,tsx}', { 
    ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
    nodir: true 
  });

  const graph = {
    nodes: [],
    edges: [],
    lastUpdated: new Date().toISOString()
  };

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const fileNode = {
        id: file,
        type: 'file',
        path: file,
        exports: [],
        imports: []
      };

      // Naive parsing using Regex (Phase 2.1)
      // In Phase 2.2+ this would use tree-sitter
      
      // Extract imports
      const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        fileNode.imports.push(match[1]);
        graph.edges.push({
          source: file,
          target: match[1],
          type: 'depends_on'
        });
      }

      // Extract function declarations
      const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)/g;
      while ((match = funcRegex.exec(content)) !== null) {
        const funcName = match[1];
        const funcId = `${file}:${funcName}`;
        graph.nodes.push({
          id: funcId,
          type: 'function',
          name: funcName,
          parent: file
        });
        graph.edges.push({
          source: funcId,
          target: file,
          type: 'contained_in'
        });
        fileNode.exports.push(funcName);
      }

      graph.nodes.push(fileNode);
    } catch (e) {
      // Skip files that can't be read
    }
  }

  return graph;
}

/**
 * Find the impact of changing a file
 * @param {Object} graph - The CPG
 * @param {string} filePath - The file being changed
 */
export function getImpactAnalysis(graph, filePath) {
  const impactedBy = graph.edges
    .filter(edge => edge.target === filePath || filePath.endsWith(edge.target))
    .map(edge => edge.source);
  
  return [...new Set(impactedBy)];
}

/**
 * Find structural truth (exact subgraph)
 * @param {Object} graph - The CPG
 * @param {string} query - Symbol name
 */
export function queryGraph(graph, query) {
  return graph.nodes.filter(node => 
    node.id.includes(query) || (node.name && node.name === query)
  );
}

export default {
  buildGraph,
  getImpactAnalysis,
  queryGraph
};
