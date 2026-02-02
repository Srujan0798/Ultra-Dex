import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { performance } from 'perf_hooks';

export class CodeGraph {
  constructor() {
    this.nodes = new Map(); // file path -> node info
    this.edges = []; // { from, to, type }
    this.lastScanTime = 0;
    this.cacheTimeout = 30000; // 30 seconds cache
    this.fileHashes = new Map(); // Track file changes for selective updates
  }

  async scan(useCache = true) {
    const now = Date.now();

    // Check if we can use cached results
    if (useCache && this.nodes.size > 0 && (now - this.lastScanTime) < this.cacheTimeout) {
      return this.getSummary();
    }

    // Start performance tracking
    const scanStart = performance.now();

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
    const CONCURRENCY_LIMIT = 100; // Increased for better performance
    const promises = [];

    for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
      const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
      const chunkPromises = chunk.map(file => this.analyzeFile(file));
      promises.push(...chunkPromises);
    }

    // Process all files with better error handling
    const results = await Promise.allSettled(promises);

    // Log any errors that occurred during analysis
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to analyze file at index ${index}:`, result.reason);
      }
    });

    this.lastScanTime = now;

    const scanDuration = performance.now() - scanStart;
    console.debug(`[Performance] Graph scan completed in ${scanDuration.toFixed(2)}ms for ${files.length} files`);

    return this.getSummary();
  }

  async analyzeFile(filePath) {
    try {
      const absolutePath = path.resolve(process.cwd(), filePath);
      const stats = await fs.stat(absolutePath);

      // Check if file has changed since last analysis using mtime
      const currentHash = `${stats.mtimeMs}-${stats.size}`;
      if (this.fileHashes.get(filePath) === currentHash) {
        // File hasn't changed, we could potentially skip analysis
        // For now, we'll still analyze to keep the logic simple
      }
      this.fileHashes.set(filePath, currentHash);

      const content = await fs.readFile(absolutePath, 'utf8');

      // Basic Node Info
      this.nodes.set(filePath, {
        id: filePath,
        size: content.length,
        type: path.extname(filePath).substring(1),
        mtime: stats.mtimeMs,
        // Simple heuristic for "component" vs "utility"
        isComponent: /^[A-Z]/.test(path.basename(filePath)) || content.includes('React') || content.includes('Component'),
      });

      // Extract Imports (Optimized regex with better performance characteristics)
      const importRegex = /import\s+(?:[\w\s{},*$]+)\s+from\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];

        // Resolve relative imports
        if (importPath.startsWith('.')) {
          const absoluteDir = path.dirname(absolutePath);
          const resolvedAbs = path.resolve(absoluteDir, importPath);
          const relativeResolved = path.relative(process.cwd(), resolvedAbs);

          // Add edge with validation to prevent self-references
          if (filePath !== relativeResolved) {
            this.edges.push({
              from: filePath,
              to: relativeResolved,
              type: 'depends_on'
            });
          }
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
      // Only log errors in debug mode to avoid spamming console
      if (process.env.DEBUG) {
        console.error(`Failed to analyze ${filePath}:`, e.message);
      }
    }
  }

  getSummary() {
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.length,
      files: Array.from(this.nodes.keys()),
      dependencies: this.edges,
      lastScanTime: this.lastScanTime,
      cacheHit: this.nodes.size > 0
    };
  }

  findReferences(fileName) {
    return this.edges.filter(e => e.to.includes(fileName));
  }

  // New method to selectively update changed files
  async updateChangedFiles(changedFiles) {
    const updateStart = performance.now();

    for (const file of changedFiles) {
      await this.analyzeFile(file);
    }

    const updateDuration = performance.now() - updateStart;
    console.debug(`[Performance] Updated ${changedFiles.length} changed files in ${updateDuration.toFixed(2)}ms`);
  }

  // Method to clear cache when needed
  clearCache() {
    this.nodes.clear();
    this.edges = [];
    this.fileHashes.clear();
    this.lastScanTime = 0;
  }
}

// Singleton instance
export const projectGraph = new CodeGraph();
