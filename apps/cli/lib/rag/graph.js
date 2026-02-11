// Copyright (c) 2026 Ultra-Dex

/**
 * Graph RAG - Knowledge Graph Implementation for Context Retrieval
 * Uses Neo4j or FalkorDB for graph-based context storage
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Node types
const NODE_TYPES = {
  FILE: 'File',
  FUNCTION: 'Function',
  CLASS: 'Class',
  VARIABLE: 'Variable',
  MODULE: 'Module',
  DECISION: 'Decision',
};

// Relationship types
const RELATIONSHIPS = {
  IMPORTS: 'IMPORTS',
  CALLS: 'CALLS',
  EXTENDS: 'EXTENDS',
  IMPLEMENTS: 'IMPLEMENTS',
  DEPENDS_ON: 'DEPENDS_ON',
  USED_BY: 'USED_BY',
  EXPORTS: 'EXPORTS',
  CONTAINS: 'CONTAINS',
  AFFECTS: 'AFFECTS',
};

/**
 * Graph RAG Engine
 * Manages knowledge graph for code context
 */
export class GraphRAG {
  constructor(options = {}) {
    this.dbType = options.dbType || 'neo4j'; // 'neo4j' or 'falkordb'
    this.uri = options.uri || process.env.NEO4J_URI || 'bolt://localhost:7687';
    this.user = options.user || process.env.NEO4J_USER || 'neo4j';
    this.password = options.password || process.env.NEO4J_PASSWORD || 'password';
    this.driver = null;
    this.inMemoryGraph = new Map();
    this.useInMemory = options.useInMemory || false;
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    if (this.useInMemory) {
      console.log(chalk.yellow('[GraphRAG] Using in-memory graph storage'));
      return true;
    }

    try {
      if (this.dbType === 'neo4j') {
        const neo4j = await import('neo4j-driver');
        this.driver = neo4j.default.driver(
          this.uri,
          neo4j.default.auth.basic(this.user, this.password)
        );

        // Test connection
        const session = this.driver.session();
        await session.run('RETURN 1');
        await session.close();

        console.log(chalk.green('[GraphRAG] Connected to Neo4j'));
        await this.initializeSchema();
        return true;
      } else if (this.dbType === 'falkordb') {
        console.log(chalk.yellow('[GraphRAG] FalkorDB not configured. Falling back to in-memory graph.'));
        this.useInMemory = true;
        return true;
      }
    } catch (error) {
      console.log(chalk.yellow(`[GraphRAG] Failed to connect to ${this.dbType}: ${error.message}`));
      console.log(chalk.yellow('[GraphRAG] Falling back to in-memory graph storage'));
      this.useInMemory = true;
      return true;
    }
  }

  /**
   * Initialize graph schema with constraints and indexes
   */
  async initializeSchema() {
    if (this.useInMemory || !this.driver) return;

    const session = this.driver.session();
    try {
      // Create constraints
      await session.run(`
        CREATE CONSTRAINT file_path IF NOT EXISTS
        FOR (f:File) REQUIRE f.path IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT function_id IF NOT EXISTS
        FOR (fn:Function) REQUIRE fn.id IS UNIQUE
      `);

      // Create indexes
      await session.run(`
        CREATE INDEX file_type IF NOT EXISTS
        FOR (f:File) ON (f.type)
      `);

      await session.run(`
        CREATE INDEX function_name IF NOT EXISTS
        FOR (fn:Function) ON (fn.name)
      `);

      console.log(chalk.gray('[GraphRAG] Schema initialized'));
    } catch (error) {
      console.log(chalk.yellow(`[GraphRAG] Schema initialization warning: ${error.message}`));
    } finally {
      await session.close();
    }
  }

  /**
   * Parse codebase and build graph
   */
  async indexCodebase(rootDir = process.cwd()) {
    console.log(chalk.blue('[GraphRAG] Indexing codebase...'));

    const files = await glob('**/*.{js,ts,jsx,tsx}', {
      cwd: rootDir,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
    });

    const batchSize = 50;
    let processed = 0;

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      await Promise.all(batch.map((file) => this.indexFile(path.join(rootDir, file))));
      processed += batch.length;

      if (processed % 100 === 0) {
        console.log(chalk.gray(`[GraphRAG] Indexed ${processed}/${files.length} files...`));
      }
    }

    console.log(chalk.green(`[GraphRAG] Indexed ${processed} files`));
    return { totalFiles: files.length, indexed: processed };
  }

  /**
   * Index a single file
   */
  async indexFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const stats = await fs.stat(filePath);

      const fileNode = {
        id: filePath,
        type: NODE_TYPES.FILE,
        path: filePath,
        extension: path.extname(filePath),
        size: stats.size,
        symbols: [],
      };

      // Extract imports
      const imports = this.extractImports(content, filePath);

      // Extract functions
      const functions = this.extractFunctions(content, filePath);

      // Extract classes
      const classes = this.extractClasses(content, filePath);

      fileNode.symbols = [...functions, ...classes];

      if (this.useInMemory) {
        this.inMemoryGraph.set(filePath, {
          node: fileNode,
          imports,
          functions,
          classes,
        });
      } else {
        await this.saveToDatabase(fileNode, imports, functions, classes);
      }
    } catch (error) {
      console.log(chalk.yellow(`[GraphRAG] Failed to index ${filePath}: ${error.message}`));
    }
  }

  /**
   * Extract imports from file content
   */
  extractImports(content, filePath) {
    const imports = [];

    // ES6 imports
    const es6Regex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"];?/g;
    let match;
    while ((match = es6Regex.exec(content)) !== null) {
      imports.push({
        source: match[1],
        type: 'es6',
        file: filePath,
      });
    }

    // CommonJS requires
    const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = cjsRegex.exec(content)) !== null) {
      imports.push({
        source: match[1],
        type: 'commonjs',
        file: filePath,
      });
    }

    return imports;
  }

  /**
   * Extract function definitions
   */
  extractFunctions(content, filePath) {
    const functions = [];

    // Function declarations
    const funcRegex = /(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+(\w+)\s*\(/g;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        type: 'function',
        file: filePath,
        id: `${filePath}#${match[1]}`,
      });
    }

    // Arrow functions with exports
    const arrowRegex = /export\s+(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/g;
    while ((match = arrowRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        type: 'arrow',
        file: filePath,
        id: `${filePath}#${match[1]}`,
      });
    }

    // Method definitions
    const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/g;
    while ((match = methodRegex.exec(content)) !== null) {
      if (!['if', 'while', 'for', 'switch', 'catch'].includes(match[1])) {
        functions.push({
          name: match[1],
          type: 'method',
          file: filePath,
          id: `${filePath}#${match[1]}`,
        });
      }
    }

    return functions;
  }

  /**
   * Extract class definitions
   */
  extractClasses(content, filePath) {
    const classes = [];

    const classRegex = /(?:export\s+(?:default\s+)?)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      classes.push({
        name: match[1],
        extends: match[2] || null,
        file: filePath,
        id: `${filePath}#${match[1]}`,
      });
    }

    return classes;
  }

  /**
   * Save nodes to database
   */
  async saveToDatabase(fileNode, imports, functions, classes) {
    if (!this.driver) return;

    const session = this.driver.session();
    try {
      // Create file node
      await session.run(
        `
        MERGE (f:File {path: $path})
        SET f.type = $type,
            f.extension = $extension,
            f.size = $size,
            f.symbols = $symbols
      `,
        fileNode
      );

      // Create function nodes
      for (const fn of functions) {
        await session.run(
          `
          MERGE (fn:Function {id: $id})
          SET fn.name = $name,
              fn.type = $type,
              fn.file = $file
          WITH fn
          MATCH (f:File {path: $file})
          MERGE (f)-[:CONTAINS]->(fn)
        `,
          fn
        );
      }

      // Create class nodes
      for (const cls of classes) {
        await session.run(
          `
          MERGE (c:Class {id: $id})
          SET c.name = $name,
              c.file = $file
          WITH c
          MATCH (f:File {path: $file})
          MERGE (f)-[:CONTAINS]->(c)
        `,
          cls
        );

        // Create extends relationship
        if (cls.extends) {
          await session.run(
            `
            MATCH (c:Class {id: $id})
            MATCH (parent:Class {name: $extends})
            MERGE (c)-[:EXTENDS]->(parent)
          `,
            cls
          );
        }
      }

      // Create import relationships
      for (const imp of imports) {
        await session.run(
          `
          MATCH (f:File {path: $file})
          MERGE (target:File {path: $source})
          ON CREATE SET target.path = $source
          MERGE (f)-[:IMPORTS]->(target)
        `,
          imp
        );
      }
    } finally {
      await session.close();
    }
  }

  /**
   * Query the graph for context
   */
  async query(queryText, options = {}) {
    const { limit = 10, depth = 2 } = options;

    if (this.useInMemory) {
      return this.queryInMemory(queryText, limit);
    }

    const session = this.driver.session();
    try {
      // Search for files matching query
      const result = await session.run(
        `
        MATCH (f:File)
        WHERE f.path CONTAINS $query OR ANY(symbol IN f.symbols WHERE symbol CONTAINS $query)
        RETURN f.path AS path, f.symbols AS symbols
        LIMIT $limit
      `,
        { query: queryText.toLowerCase(), limit: parseInt(limit) }
      );

      return result.records.map((record) => ({
        path: record.get('path'),
        symbols: record.get('symbols') || [],
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * In-memory query (fallback)
   */
  queryInMemory(queryText, limit) {
    const results = [];
    const query = queryText.toLowerCase();

    for (const [path, data] of this.inMemoryGraph) {
      if (path.toLowerCase().includes(query)) {
        results.push({
          path,
          symbols: data.node.symbols,
        });
      } else {
        const matchingSymbols = data.node.symbols.filter((s) =>
          s.name.toLowerCase().includes(query)
        );
        if (matchingSymbols.length > 0) {
          results.push({
            path,
            symbols: matchingSymbols,
          });
        }
      }

      if (results.length >= limit) break;
    }

    return results;
  }

  /**
   * Get impact analysis for a file
   */
  async getImpactAnalysis(filePath, depth = 2) {
    if (this.useInMemory) {
      return this.getImpactAnalysisInMemory(filePath, depth);
    }

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH path = (f:File {path: $path})-[:IMPORTS*1..${depth}]->(dependent:File)
        RETURN dependent.path AS impactedFile, length(path) AS distance
        ORDER BY distance
      `,
        { path: filePath }
      );

      const impactedFiles = result.records.map((record) => ({
        path: record.get('impactedFile'),
        distance: record.get('distance').toNumber(),
      }));

      const riskLevel =
        impactedFiles.length > 10 ? 'high' : impactedFiles.length > 5 ? 'medium' : 'low';

      return {
        file: filePath,
        riskLevel,
        impactedFiles,
        impactedCount: impactedFiles.length,
      };
    } finally {
      await session.close();
    }
  }

  /**
   * In-memory impact analysis
   */
  getImpactAnalysisInMemory(filePath, depth) {
    const impacted = new Set();
    const queue = [{ path: filePath, distance: 0 }];
    const visited = new Set();

    while (queue.length > 0) {
      const { path: currentPath, distance } = queue.shift();

      if (visited.has(currentPath) || distance > depth) continue;
      visited.add(currentPath);

      const data = this.inMemoryGraph.get(currentPath);
      if (data) {
        for (const imp of data.imports) {
          if (!visited.has(imp.source)) {
            impacted.add(imp.source);
            queue.push({ path: imp.source, distance: distance + 1 });
          }
        }
      }
    }

    const impactedFiles = Array.from(impacted).map((p, i) => ({
      path: p,
      distance: Math.floor(i / 5) + 1,
    }));

    const riskLevel =
      impactedFiles.length > 10 ? 'high' : impactedFiles.length > 5 ? 'medium' : 'low';

    return {
      file: filePath,
      riskLevel,
      impactedFiles,
      impactedCount: impactedFiles.length,
    };
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.driver) {
      await this.driver.close();
      console.log(chalk.gray('[GraphRAG] Database connection closed'));
    }
  }
}

// Export singleton instance
export const graphRAG = new GraphRAG();

// Export constants
export { NODE_TYPES, RELATIONSHIPS };
