import fs from 'fs/promises';
import { existsSync } from 'fs';
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
    this.cacheDir = path.resolve(process.cwd(), '.ultra-dex');
    this.cacheFile = path.resolve(this.cacheDir, 'graph.json');
  }

  async loadCache() {
    try {
      if (existsSync(this.cacheFile)) {
        const data = await fs.readFile(this.cacheFile, 'utf8');
        const json = JSON.parse(data);
        this.nodes = new Map(json.nodes);
        this.edges = json.edges;
        this.lastScanTime = json.lastScanTime || 0;
        return true;
      }
    } catch (e) {
      console.warn('Failed to load graph cache:', e.message);
    }
    return false;
  }

  async saveCache() {
    try {
      if (!existsSync(this.cacheDir)) {
        await fs.mkdir(this.cacheDir, { recursive: true });
      }
      const json = {
        nodes: Array.from(this.nodes.entries()),
        edges: this.edges,
        lastScanTime: Date.now()
      };
      await fs.writeFile(this.cacheFile, JSON.stringify(json, null, 2));
    } catch (e) {
      console.warn('Failed to save graph cache:', e.message);
    }
  }

  async scan(useCache = true) {
    const now = Date.now();

    // Try loading persistent cache if memory cache is empty
    if (useCache && this.nodes.size === 0) {
      await this.loadCache();
    }

    // Check if we can use cached results
    if (useCache && this.nodes.size > 0 && (now - this.lastScanTime) < this.cacheTimeout) {
      return this.getSummary();
    }

    // Start performance tracking
    const scanStart = performance.now();

    // Find all js/ts/jsx/tsx files
    // Ignoring node_modules, .git, dist, build
    const files = await glob('**/*.{js,ts,jsx,tsx}', {
      ignore: ['**/node_modules/**', '.git/**', 'dist/**', 'build/**', '.next/**'],
      absolute: false,
      cwd: process.cwd(),
      nodir: true
    });

    const currentFiles = new Set(files);
    const filesToAnalyze = [];

    // Identify files to update or add
    for (const file of files) {
      try {
        const stats = await fs.stat(path.resolve(process.cwd(), file));
        const mtime = stats.mtimeMs;

        const existingNode = this.nodes.get(file);
        if (!existingNode || existingNode.mtime !== mtime) {
          filesToAnalyze.push({ file, mtime });
        }
      } catch (e) {
        console.warn(`Failed to stat ${file}:`, e.message);
      }
    }

    // Identify deleted files
    for (const [file] of this.nodes) {
      if (!currentFiles.has(file)) {
        this.nodes.delete(file);
        // Remove edges originating from this file
        this.edges = this.edges.filter(e => e.from !== file);
      }
    }

    // Remove old edges from files being re-analyzed
    if (filesToAnalyze.length > 0) {
      const filesToUpdateSet = new Set(filesToAnalyze.map(f => f.file));
      this.edges = this.edges.filter(e => !filesToUpdateSet.has(e.from));

      // Process files in chunks to prevent EMFILE errors
      const CONCURRENCY_LIMIT = 100; // Increased for better performance
      const promises = [];

      for (let i = 0; i < filesToAnalyze.length; i += CONCURRENCY_LIMIT) {
        const chunk = filesToAnalyze.slice(i, i + CONCURRENCY_LIMIT);
        const chunkPromises = chunk.map(({ file, mtime }) => this.analyzeFile(file, mtime));
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

      // Add new edges
      for (const result of results) {
        if (result.status === 'fulfilled') {
          this.edges.push(...result.value);
        }
      }
    }

    this.lastScanTime = now;

    const scanDuration = performance.now() - scanStart;
    console.debug(`[Performance] Graph scan completed in ${scanDuration.toFixed(2)}ms for ${files.length} files`);

    // Save cache asynchronously
    this.saveCache().catch(e => console.error('Background cache save failed:', e));

    return this.getSummary();
  }

  async analyzeFile(filePath, mtime) {
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

      // Extract Symbols (Basic)
      const symbols = [];
      // Match function declarations, class definitions, and variable exports
      const symbolRegex = /(?:export\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z0-9_]+)/g;
      let symMatch;
      while ((symMatch = symbolRegex.exec(content)) !== null) {
        // Filter out common keywords if regex catches them (unlikely with this pattern but good safety)
        if (!['default', 'if', 'for', 'while', 'switch'].includes(symMatch[1])) {
            symbols.push(symMatch[1]);
        }
      }

      // Basic Node Info
      this.nodes.set(filePath, {
        id: filePath,
        size: content.length,
        type: path.extname(filePath).substring(1),
        mtime: mtime,
        isComponent: /^[A-Z]/.test(path.basename(filePath)) || content.includes('React') || content.includes('Component'),
        symbols: symbols
      });

      const newEdges = [];
      // Extract Imports (Regex based for speed/simplicity without AST parsing overhead)
      const importRegex = /import\s+(?:[\w\s{},*]+)\s+from\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];

        // Resolve relative imports
        if (importPath.startsWith('.')) {
          const absoluteDir = path.dirname(absolutePath);
          const resolvedAbs = path.resolve(absoluteDir, importPath);
          const relativeResolved = path.relative(process.cwd(), resolvedAbs);

          // Add edge
          newEdges.push({
            from: filePath,
            to: relativeResolved, // Note: This might not match exactly if extensions are missing, but good enough for rough graph
            type: 'depends_on'
          });
        } else {
          // Package import
          newEdges.push({
            from: filePath,
            to: importPath,
            type: 'package_dependency'
          });
        }
      }

      return newEdges;

    } catch (e) {
      // Only log errors in debug mode to avoid spamming console
      if (process.env.DEBUG) {
        console.error(`Failed to analyze ${filePath}:`, e.message);
      }
      return [];
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

  findSymbol(name) {
    const results = [];
    const lowerName = name.toLowerCase();
    for (const [file, node] of this.nodes) {
      if (node.symbols) {
        // Exact match or partial match
        const match = node.symbols.find(s => s.toLowerCase() === lowerName || s.toLowerCase().includes(lowerName));
        if (match) {
          results.push({ file, symbol: match, type: 'definition' });
        }
      }
    }
    return results;
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