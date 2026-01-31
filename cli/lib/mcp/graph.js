import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { glob } from 'glob';

export class CodeGraph {
  constructor() {
    this.nodes = new Map(); // file path -> node info
    this.edges = []; // { from, to, type }
    this.lastScanTime = 0;
    this.cacheTimeout = 30000; // 30 seconds cache
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

    // Memory cache check
    if (useCache && this.nodes.size > 0 && (now - this.lastScanTime) < this.cacheTimeout) {
      return this.getSummary();
    }

    // Try loading persistent cache if memory cache is empty
    if (useCache && this.nodes.size === 0) {
      await this.loadCache();
    }

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

      // Process files in parallel for better performance
      const promises = filesToAnalyze.map(({ file, mtime }) => this.analyzeFile(file, mtime));
      const results = await Promise.allSettled(promises);

      // Add new edges
      for (const result of results) {
        if (result.status === 'fulfilled') {
          this.edges.push(...result.value);
        }
      }
    }

    this.lastScanTime = now;

    // Save cache asynchronously
    this.saveCache().catch(e => console.error('Background cache save failed:', e));

    return this.getSummary();
  }

  async analyzeFile(filePath, mtime) {
    try {
      const content = await fs.readFile(path.resolve(process.cwd(), filePath), 'utf8');
      
      // Basic Node Info
      this.nodes.set(filePath, {
        id: filePath,
        size: content.length,
        type: path.extname(filePath).substring(1),
        mtime: mtime,
        // Simple heuristic for "component" vs "utility"
        isComponent: /^[A-Z]/.test(path.basename(filePath)) || content.includes('React') || content.includes('Component'),
      });

      const newEdges = [];
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
      console.error(`Failed to analyze ${filePath}:`, e);
      return [];
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
