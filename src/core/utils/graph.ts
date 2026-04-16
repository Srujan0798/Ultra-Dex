import fs from 'fs/promises';
import { glob } from 'glob';

interface GraphEdge {
  source: string;
  target: string;
  type: 'depends_on' | 'contained_in';
}

interface FunctionNode {
  id: string;
  type: 'function';
  name: string;
  parent: string;
}

interface FileNode {
  id: string;
  type: 'file';
  path: string;
  exports: string[];
  imports: string[];
}

type GraphNode = FunctionNode | FileNode;

interface ProjectGraphSnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
  lastUpdated: string;
}

let cachedGraph: ProjectGraphSnapshot | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 3e4;

async function buildGraph(useCache: boolean = true): Promise<ProjectGraphSnapshot> {
  const now = Date.now();
  if (useCache && cachedGraph && now - lastCacheTime < CACHE_DURATION) {
    return cachedGraph;
  }
  const files = await glob('**/*.{js,ts,jsx,tsx}', {
    ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
    nodir: true,
  });
  const graph: ProjectGraphSnapshot = {
    nodes: [],
    edges: [],
    lastUpdated: /* @__PURE__ */ new Date().toISOString(),
  };
  const promises = files.map(async (file) => {
    try {
      const content = await fs.readFile(file, 'utf8');
      const fileNode: FileNode = {
        id: file,
        type: 'file',
        path: file,
        exports: [],
        imports: [],
      };
      const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        fileNode.imports.push(match[1]);
        graph.edges.push({
          source: file,
          target: match[1],
          type: 'depends_on',
        });
      }
      const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)/g;
      while ((match = funcRegex.exec(content)) !== null) {
        const funcName = match[1];
        const funcId = `${file}:${funcName}`;
        graph.nodes.push({
          id: funcId,
          type: 'function',
          name: funcName,
          parent: file,
        });
        graph.edges.push({
          source: funcId,
          target: file,
          type: 'contained_in',
        });
        fileNode.exports.push(funcName);
      }
      graph.nodes.push(fileNode);
    } catch (_e) {}
  });
  await Promise.allSettled(promises);
  cachedGraph = graph;
  lastCacheTime = now;
  return graph;
}
function getImpactAnalysis(graph: ProjectGraphSnapshot, filePath: string): string[] {
  const impactedBy = graph.edges
    .filter((edge: GraphEdge) => edge.target === filePath || filePath.endsWith(edge.target))
    .map((edge: GraphEdge) => edge.source);
  return [...new Set(impactedBy)];
}
function queryGraph(graph: ProjectGraphSnapshot, query: string): GraphNode[] {
  return graph.nodes.filter(
    (node: GraphNode) => node.id.includes(query) || ('name' in node && node.name === query)
  );
}
var graph_default = {
  buildGraph,
  getImpactAnalysis,
  queryGraph,
};
export { buildGraph, graph_default as default, getImpactAnalysis, queryGraph };
