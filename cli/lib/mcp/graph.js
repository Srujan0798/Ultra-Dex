import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export class CodeGraph {
  constructor() {
    this.nodes = new Map(); // file path -> node info
    this.edges = []; // { from, to, type }
    this.lastScanTime = 0;
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  async scan(useCache = true) {
    // Check if we can use cached results
    const now = Date.now();
    if (useCache && this.nodes.size > 0 && (now - this.lastScanTime) < this.cacheTimeout) {
      return this.getSummary();
    }

    this.nodes.clear();
    this.edges = [];

    // Find all js/ts/jsx/tsx files
    // Ignoring node_modules, .git, dist, build
    const files = await glob('**/*.{js,ts,jsx,tsx}', {
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/.next/**'],
      absolute: false,
      cwd: process.cwd()
    });

    // Process files in chunks to prevent EMFILE errors
    const CONCURRENCY_LIMIT = 50;
    for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
      const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.allSettled(chunk.map(file => this.analyzeFile(file)));
    }

    this.lastScanTime = now;
    return this.getSummary();
  }

  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(path.resolve(process.cwd(), filePath), 'utf8');
      
      // Basic Node Info
      this.nodes.set(filePath, {
        id: filePath,
        size: content.length,
        type: path.extname(filePath).substring(1),
        // Simple heuristic for "component" vs "utility"
        isComponent: /^[A-Z]/.test(path.basename(filePath)) || content.includes('React') || content.includes('Component'),
      });

      // Extract Imports (Regex based for speed/simplicity without AST parsing overhead)
      const importRegex = /import\s+(?:[\w\s{},*]+)\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        
        // Resolve relative imports
        if (importPath.startsWith('.')) {
          const absoluteDir = path.dirname(path.resolve(process.cwd(), filePath));
          const resolvedAbs = path.resolve(absoluteDir, importPath);
          const relativeResolved = path.relative(process.cwd(), resolvedAbs);
          
          // Add edge
          this.edges.push({
            from: filePath,
            to: relativeResolved, // Note: This might not match exactly if extensions are missing, but good enough for rough graph
            type: 'depends_on'
          });
        } else {
          // Package import
          this.edges.push({
            from: filePath,
            to: importPath,
            type: 'package_dependency'
          });
        }
      }

    } catch (e) {
      console.error(`Failed to analyze ${filePath}:`, e);
    }
  }

  getSummary() {
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.length,
      files: Array.from(this.nodes.keys()),
      dependencies: this.edges
    };
  }

  findRefereces(fileName) {
    return this.edges.filter(e => e.to.includes(fileName));
  }
}

// Singleton instance
export const projectGraph = new CodeGraph();
