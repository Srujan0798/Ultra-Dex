// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { performance } from 'perf_hooks';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import neo4j from 'neo4j-driver';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../ui/logger.js';

/**
 * GraphRAG - Deep Graph RAG Implementation with Neo4j
 * Provides graph-based context storage, relationship mapping, and impact analysis
 */
export class GraphRAG {
  /**
   * Initialize GraphRAG instance
   * @param {Object} config - Configuration options
   * @param {string} [config.uri] - Neo4j URI
   * @param {string} [config.user] - Neo4j user
   * @param {string} [config.password] - Neo4j password
   * @param {string} [config.projectId] - Project identifier
   */
  constructor(config = {}) {
    this.uri = config.uri || process.env.NEO4J_URI || 'bolt://localhost:7687';
    this.user = config.user || process.env.NEO4J_USER || 'neo4j';
    this.password = config.password || process.env.NEO4J_PASSWORD || 'password';
    this.driver = null;
    this.isConnected = false;
    this.projectId = config.projectId || 'default';
    this.connecting = null;
  }

  /**
   * Connect to Neo4j database
   * @returns {Promise<boolean>} Connection status
   */
  async connect() {
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      // Check if Neo4j is explicitly enabled
      const neo4jEnabled = process.env.NEO4J_ENABLED === 'true' || !!process.env.NEO4J_URI;

      if (!neo4jEnabled) {
        // Default: in-memory mode (Neo4j is optional)
        logger.info('[GraphRAG] Running in IN-MEMORY mode (set NEO4J_ENABLED=true for Neo4j)');
        this.isConnected = false;
        this.connecting = null;
        return false;
      }

      try {
        this.driver = neo4j.driver(this.uri, neo4j.auth.basic(this.user, this.password));
        await this.driver.verifyConnectivity();
        this.isConnected = true;
        logger.info(`[GraphRAG] Connected to Neo4j at ${this.uri}`);
        await this.initializeSchema();
        return true;
      } catch (error) {
        logger.warn(`[GraphRAG] Neo4j unavailable: ${error.message}`);
        logger.warn('[GraphRAG] Falling back to in-memory mode');
        this.isConnected = false;
        this.connecting = null;
        return false;
      }
    })();

    return this.connecting;
  }

  /**
   * Disconnect from Neo4j
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.driver) {
      await this.driver.close();
      this.isConnected = false;
    }
  }

  /**
   * Initialize graph schema with constraints and indexes
   * @returns {Promise<void>}
   */
  async initializeSchema() {
    if (!this.isConnected) return;

    const session = this.driver.session();
    try {
      // Create constraints and indexes
      await session.run(`
        CREATE CONSTRAINT file_path IF NOT EXISTS
        FOR (f:File) REQUIRE f.path IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT function_name IF NOT EXISTS
        FOR (fn:Function) REQUIRE (fn.name, fn.file) IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT datatype_name IF NOT EXISTS
        FOR (d:DataType) REQUIRE (d.name, d.file) IS UNIQUE
      `);

      await session.run(`
        CREATE INDEX file_type_idx IF NOT EXISTS
        FOR (f:File) ON (f.type)
      `);

      await session.run(`
        CREATE INDEX relationship_type_idx IF NOT EXISTS
        FOR ()-[r:DEPENDS_ON]-() ON (r.type)
      `);

      logger.debug('[GraphRAG] Schema initialized');
    } finally {
      await session.close();
    }
  }

  /**
   * Clear all data for current project
   * @returns {Promise<void>}
   */
  async clearProject() {
    if (!this.isConnected) return;

    const session = this.driver.session();
    try {
      await session.run(
        `
        MATCH (n)
        WHERE n.project = $projectId
        DETACH DELETE n
      `,
        { projectId: this.projectId }
      );
      logger.info(`[GraphRAG] Cleared project: ${this.projectId}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Sync in-memory code graph to Neo4j
   * @param {CodeGraph} codeGraph - Source code graph
   * @returns {Promise<boolean>} Success status
   */
  async syncFromCodeGraph(codeGraph) {
    if (!codeGraph) {
      throw new ValidationError('codeGraph is required for sync');
    }

    if (!this.isConnected) {
      logger.warn('[GraphRAG] Not connected to Neo4j, skipping sync');
      return false;
    }

    const session = this.driver.session();
    try {
      const summary = codeGraph.getSummary();

      // Batch insert files
      const files = Array.from(codeGraph.nodes.entries());
      const BATCH_SIZE = 100;

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        await session.run(
          `
          UNWIND $files as file
          MERGE (f:File {path: file.path, project: $projectId})
          SET f.size = file.size,
              f.type = file.type,
              f.mtime = file.mtime,
              f.isComponent = file.isComponent,
              f.symbols = file.symbols,
              f.lastUpdated = datetime()
        `,
          {
            files: batch.map(([path, node]) => ({
              path,
              size: node.size,
              type: node.type,
              mtime: node.mtime,
              isComponent: node.isComponent,
              symbols: node.symbols || [],
            })),
            projectId: this.projectId,
          }
        );
      }

      // Batch insert functions from symbols
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const symbolBatch = [];

        for (const [filePath, node] of batch) {
          if (node.symbols && node.symbols.length > 0) {
            symbolBatch.push({
              filePath,
              symbols: node.symbols,
            });
          }
        }

        if (symbolBatch.length > 0) {
          await session.run(
            `
            UNWIND $batch as item
            MATCH (f:File {path: item.filePath, project: $projectId})
            UNWIND item.symbols as symbol
            MERGE (fn:Function {name: symbol, file: item.filePath, project: $projectId})
            SET fn.lastUpdated = datetime()
            MERGE (f)-[:CONTAINS]->(fn)
          `,
            {
              batch: symbolBatch,
              projectId: this.projectId,
            }
          );
        }
      }

      // Batch insert edges
      for (let i = 0; i < summary.dependencies.length; i += BATCH_SIZE) {
        const batch = summary.dependencies.slice(i, i + BATCH_SIZE);
        await session.run(
          `
          UNWIND $edges as edge
          MATCH (from:File {path: edge.from, project: $projectId})
          MATCH (to:File {path: edge.to, project: $projectId})
          MERGE (from)-[r:DEPENDS_ON {type: edge.type}]->(to)
          SET r.lastUpdated = datetime()
        `,
          {
            edges: batch,
            projectId: this.projectId,
          }
        );
      }

      logger.info(
        `[GraphRAG] Synced ${files.length} files and ${summary.dependencies.length} dependencies`
      );
      return true;
    } finally {
      await session.close();
    }
  }

  /**
   * Impact Analysis: Find all files that depend on a given file (transitive)
   * Answer: "What breaks if I change X?"
   * @param {string} filePath - Path of the file change
   * @param {Object} options - Analysis options
   * @param {number} [options.maxDepth=10] - Max dependency depth
   * @param {boolean} [options.includeFunctions=false] - Include function-level analysis
   * @returns {Promise<Object>} Impact analysis report
   */
  async getImpactAnalysis(filePath, options = {}) {
    if (!this.isConnected) {
      return { error: 'Neo4j not connected', impactedFiles: [] };
    }

    const session = this.driver.session();
    try {
      const maxDepth = options.maxDepth || 10;
      const includeFunctions = options.includeFunctions || false;

      // Get transitive dependents
      const result = await session.run(
        `
        MATCH path = (dependent:File)-[:DEPENDS_ON*1..${maxDepth}]->(target:File {path: $filePath, project: $projectId})
        WHERE dependent.project = $projectId
        WITH dependent, length(path) as depth
        RETURN DISTINCT dependent.path as file, depth
        ORDER BY depth ASC
      `,
        { filePath, projectId: this.projectId }
      );

      const impactedFiles = result.records.map((record) => ({
        file: record.get('file'),
        depth: record.get('depth').toNumber(),
      }));

      // Also get functions that might be affected
      let impactedFunctions = [];
      if (includeFunctions) {
        const funcResult = await session.run(
          `
          MATCH (target:File {path: $filePath, project: $projectId})-[:CONTAINS]->(fn:Function)
          WITH collect(fn.name) as targetFunctions
          MATCH (dependent:File)-[:CONTAINS]->(caller:Function)
          WHERE dependent.project = $projectId
          AND any(fnName IN targetFunctions WHERE caller.name CONTAINS fnName OR caller.calls CONTAINS fnName)
          RETURN DISTINCT caller.name as function, dependent.path as file
        `,
          { filePath, projectId: this.projectId }
        );

        impactedFunctions = funcResult.records.map((record) => ({
          function: record.get('function'),
          file: record.get('file'),
        }));
      }

      // Get architectural decisions that might be related
      const decisionsResult = await session.run(
        `
        MATCH (d:Decision)-[:AFFECTS]->(f:File {path: $filePath, project: $projectId})
        RETURN d.title as decision, d.description as description
      `,
        { filePath, projectId: this.projectId }
      );

      const relatedDecisions = decisionsResult.records.map((record) => ({
        title: record.get('decision'),
        description: record.get('description'),
      }));

      return {
        file: filePath,
        totalImpacted: impactedFiles.length,
        impactedFiles,
        impactedFunctions,
        relatedDecisions,
        riskLevel: impactedFiles.length > 10 ? 'high' : impactedFiles.length > 5 ? 'medium' : 'low',
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Find circular dependencies in the graph
   * @returns {Promise<Array<string[]>>} List of circular dependency chains
   */
  async findCircularDependencies() {
    if (!this.isConnected) {
      return [];
    }

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH path = (f:File)-[:DEPENDS_ON*2..10]->(f)
        WHERE f.project = $projectId
        WITH path, [node in nodes(path) | node.path] as files
        RETURN DISTINCT files
        LIMIT 20
      `,
        { projectId: this.projectId }
      );

      return result.records.map((record) => record.get('files'));
    } finally {
      await session.close();
    }
  }

  /**
   * Get dependency graph for visualization
   * @param {string} filePath - Root file path
   * @param {number} [depth=2] - Traversal depth
   * @returns {Promise<Object>} Nodes and edges for visualization
   */
  async getDependencyGraph(filePath, depth = 2) {
    if (!this.isConnected) {
      return { nodes: [], edges: [] };
    }

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH path = (f:File {path: $filePath, project: $projectId})-[:DEPENDS_ON*0..${depth}]-(connected:File)
        WHERE connected.project = $projectId
        WITH f, connected, relationships(path) as rels
        RETURN collect(DISTINCT {id: f.path, type: f.type, size: f.size}) + 
               collect(DISTINCT {id: connected.path, type: connected.type, size: connected.size}) as nodes,
               collect(DISTINCT {from: startNode(r).path, to: endNode(r).path, type: type(r)}) as edges
      `,
        { filePath, projectId: this.projectId }
      );

      if (result.records.length === 0) {
        return { nodes: [], edges: [] };
      }

      return {
        nodes: result.records[0].get('nodes'),
        edges: result.records[0].get('edges'),
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Search for symbols across the graph
   * @param {string} query - Symbol name query
   * @param {Object} options - Search options
   * @param {number} [options.limit=20] - Max results
   * @returns {Promise<Array<Object>>} Matching symbols
   */
  async searchSymbols(query, options = {}) {
    if (!this.isConnected) {
      return [];
    }

    const session = this.driver.session();
    try {
      const limit = options.limit || 20;

      const result = await session.run(
        `
        MATCH (fn:Function)
        WHERE fn.project = $projectId
        AND fn.name CONTAINS $query
        MATCH (f:File {path: fn.file, project: $projectId})
        RETURN fn.name as name, fn.file as file, f.type as type
        LIMIT $limit
      `,
        { query, projectId: this.projectId, limit: parseInt(limit) }
      );

      return result.records.map((record) => ({
        name: record.get('name'),
        file: record.get('file'),
        type: record.get('type'),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Get coupling metrics - how tightly coupled files are
   * @returns {Promise<Object>} Coupling statistics
   */
  async getCouplingMetrics() {
    if (!this.isConnected) {
      return {};
    }

    const session = this.driver.session();
    try {
      const result = await session.run(
        `
        MATCH (f:File {project: $projectId})
        OPTIONAL MATCH (f)-[out:DEPENDS_ON]->()
        OPTIONAL MATCH ()-[in:DEPENDS_ON]->(f)
        WITH f, count(DISTINCT out) as outDegree, count(DISTINCT in) as inDegree
        RETURN avg(outDegree + inDegree) as avgCoupling,
               max(outDegree + inDegree) as maxCoupling,
               collect(CASE WHEN outDegree + inDegree > 10 THEN {file: f.path, coupling: outDegree + inDegree} END) as highlyCoupled
      `,
        { projectId: this.projectId }
      );

      const record = result.records[0];
      return {
        averageCoupling: record.get('avgCoupling'),
        maxCoupling: record.get('maxCoupling'),
        highlyCoupledFiles: record.get('highlyCoupled').filter(Boolean),
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Store architectural decision in the graph
   * @param {Object} decision - ADR object
   * @returns {Promise<boolean>} Success status
   */
  async storeDecision(decision) {
    if (!this.isConnected) return false;

    const session = this.driver.session();
    try {
      await session.run(
        `
        MERGE (d:Decision {id: $id, project: $projectId})
        SET d.title = $title,
            d.description = $description,
            d.date = datetime(),
            d.status = $status
        WITH d
        UNWIND $affectedFiles as filePath
        MATCH (f:File {path: filePath, project: $projectId})
        MERGE (d)-[:AFFECTS]->(f)
      `,
        {
          id: decision.id || `${Date.now()}`,
          title: decision.title,
          description: decision.description,
          status: decision.status || 'active',
          affectedFiles: decision.affectedFiles || [],
          projectId: this.projectId,
        }
      );
      return true;
    } finally {
      await session.close();
    }
  }

  /**
   * Get related context for RAG
   * Returns files, functions, and decisions related to a query
   * @param {string} query - Context query
   * @param {Object} options - Retrieval options
   * @param {number} [options.limit=10] - Max items per category
   * @returns {Promise<Object>} RAG context object
   */
  async getRAGContext(query, options = {}) {
    if (!this.isConnected) {
      return { files: [], functions: [], decisions: [], dependencies: [] };
    }

    const session = this.driver.session();
    try {
      const limit = options.limit || 10;

      // Search for matching files
      const filesResult = await session.run(
        `
        MATCH (f:File)
        WHERE f.project = $projectId
        AND (f.path CONTAINS $query OR any(symbol IN f.symbols WHERE symbol CONTAINS $query))
        RETURN f.path as path, f.symbols as symbols, f.type as type
        LIMIT $limit
      `,
        { query, projectId: this.projectId, limit: parseInt(limit) }
      );

      // Search for matching functions
      const funcResult = await session.run(
        `
        MATCH (fn:Function)
        WHERE fn.project = $projectId
        AND fn.name CONTAINS $query
        RETURN fn.name as name, fn.file as file
        LIMIT $limit
      `,
        { query, projectId: this.projectId, limit: parseInt(limit) }
      );

      // Get related decisions
      const decisionResult = await session.run(
        `
        MATCH (d:Decision)
        WHERE d.project = $projectId
        AND (d.title CONTAINS $query OR d.description CONTAINS $query)
        RETURN d.title as title, d.description as description
        LIMIT $limit
      `,
        { query, projectId: this.projectId, limit: parseInt(limit) }
      );

      // Get dependency chains for matched files
      const matchedFiles = filesResult.records.map((r) => r.get('path'));
      let dependencies = [];
      if (matchedFiles.length > 0) {
        const depResult = await session.run(
          `
          UNWIND $files as filePath
          MATCH (f:File {path: filePath, project: $projectId})-[:DEPENDS_ON|DEPENDED_ON_BY*1..2]-(related:File)
          WHERE related.project = $projectId
          RETURN DISTINCT related.path as path, related.type as type
          LIMIT $limit
        `,
          { files: matchedFiles, projectId: this.projectId, limit: parseInt(limit) }
        );
        dependencies = depResult.records.map((r) => ({
          path: r.get('path'),
          type: r.get('type'),
        }));
      }

      return {
        files: filesResult.records.map((r) => ({
          path: r.get('path'),
          symbols: r.get('symbols'),
          type: r.get('type'),
        })),
        functions: funcResult.records.map((r) => ({
          name: r.get('name'),
          file: r.get('file'),
        })),
        decisions: decisionResult.records.map((r) => ({
          title: r.get('title'),
          description: r.get('description'),
        })),
        dependencies,
      };
    } finally {
      await session.close();
    }
  }
}

/**
 * CodeGraph - Enhanced with GraphRAG support
 * Maintains backward compatibility while adding graph database capabilities
 */
export class CodeGraph {
  /**
   * Initialize CodeGraph
   * @param {Object} options - Graph options
   * @param {GraphRAG} [options.graphRAG] - Optional GraphRAG instance
   * @param {boolean} [options.useGraphDB=true] - Enable Neo4j integration
   */
  constructor(options = {}) {
    this.nodes = new Map(); // file path -> node info
    this.edges = []; // { from, to, type }
    this.incomingEdges = new Map(); // file path -> edge[]
    this.lastScanTime = 0;
    this.cacheTimeout = 30000; // 30 seconds cache
    this.fileHashes = new Map(); // Track file changes for selective updates
    this.cacheDir = path.resolve(process.cwd(), '.ultra-dex');
    this.cacheFile = path.resolve(this.cacheDir, 'graph.json');

    // GraphRAG integration
    this.graphRAG = options.graphRAG || null;
    this.useGraphDB = options.useGraphDB !== false; // Default to true
    this.isScanning = false;
    this.initializingRAG = null;
  }

  /**
   * Load graph from local JSON cache
   * @returns {Promise<boolean>} Success status
   */
  async loadCache() {
    try {
      if (existsSync(this.cacheFile)) {
        const data = await fs.readFile(this.cacheFile, 'utf8');
        const json = JSON.parse(data);
        this.nodes = new Map(json.nodes);
        this.edges = json.edges;
        this.lastScanTime = json.lastScanTime || 0;
        this._rebuildIndex();
        return true;
      }
    } catch (e) {
      logger.debug(`Failed to load graph cache: ${e.message}`);
    }
    return false;
  }

  /**
   * Save graph to local JSON cache
   * @returns {Promise<void>}
   */
  async saveCache() {
    try {
      if (!existsSync(this.cacheDir)) {
        await fs.mkdir(this.cacheDir, { recursive: true });
      }
      const json = {
        nodes: Array.from(this.nodes.entries()),
        edges: this.edges,
        lastScanTime: Date.now(),
      };
      await fs.writeFile(this.cacheFile, JSON.stringify(json, null, 2));
    } catch (e) {
      logger.debug(`Failed to save graph cache: ${e.message}`);
    }
  }

  /**
   * Initialize GraphRAG connection
   * @returns {Promise<boolean>} Connection status
   */
  async initializeGraphRAG() {
    if (this.graphRAG || !this.useGraphDB) return false;
    if (this.initializingRAG) return this.initializingRAG;

    this.initializingRAG = (async () => {
      try {
        this.graphRAG = new GraphRAG({ projectId: path.basename(process.cwd()) });
        const connected = await this.graphRAG.connect();

        if (connected) {
          logger.info('[CodeGraph] GraphRAG initialized and connected');
        }

        return connected;
      } catch (err) {
        this.initializingRAG = null;
        logger.error('[CodeGraph] Failed to initialize GraphRAG', err);
        return false;
      }
    })();

    return this.initializingRAG;
  }

  /**
   * Scan codebase and build dependency graph
   * @param {boolean} [useCache=true] - Use cached graph if valid
   * @returns {Promise<Object>} Graph summary
   */
  async scan(useCache = true) {
    if (this.isScanning) {
      logger.debug('[CodeGraph] Scan already in progress, skipping');
      return this.getSummary();
    }

    this.isScanning = true;
    try {
      const now = Date.now();

      // Try loading persistent cache if memory cache is empty
      if (useCache && this.nodes.size === 0) {
        await this.loadCache();
      }

      // Check if we can use cached results
      if (useCache && this.nodes.size > 0 && now - this.lastScanTime < this.cacheTimeout) {
        return this.getSummary();
      }

      // Initialize GraphRAG if not already done
      if (this.useGraphDB && !this.graphRAG) {
        await this.initializeGraphRAG();
      }

      // Start performance tracking
      const scanStart = performance.now();

      // Find all js/ts/jsx/tsx files
      const files = await glob('**/*.{js,ts,jsx,tsx}', {
        ignore: ['**/node_modules/**', '.git/**', 'dist/**', 'build/**', '.next/**'],
        absolute: false,
        cwd: process.cwd(),
        nodir: true,
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
          logger.debug(`Failed to stat ${file}: ${e.message}`);
        }
      }

      // Identify deleted files
      for (const [file] of this.nodes) {
        if (!currentFiles.has(file)) {
          this.nodes.delete(file);
          // Remove both outgoing and incoming edges to prevent dangling references
          this.edges = this.edges.filter((e) => e.from !== file && e.to !== file);
        }
      }

      // Remove old edges from files being re-analyzed
      if (filesToAnalyze.length > 0) {
        const filesToUpdateSet = new Set(filesToAnalyze.map((f) => f.file));
        this.edges = this.edges.filter((e) => !filesToUpdateSet.has(e.from));

        // Process files in chunks
        const CONCURRENCY_LIMIT = 50; // Reduced concurrency for stability
        const promises = [];

        for (let i = 0; i < filesToAnalyze.length; i += CONCURRENCY_LIMIT) {
          const chunk = filesToAnalyze.slice(i, i + CONCURRENCY_LIMIT);
          const chunkPromises = chunk.map(({ file, mtime }) => this.analyzeFile(file, mtime));
          promises.push(...chunkPromises);
        }

        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            logger.error(`Failed to analyze file at index ${index}`, result.reason);
          }
        });

        for (const result of results) {
          if (result.status === 'fulfilled') {
            this.edges.push(...result.value.edges);
          }
        }
      }

      this.lastScanTime = now;
      this._rebuildIndex();

      const scanDuration = performance.now() - scanStart;
      logger.debug(
        `[Performance] Graph scan completed in ${scanDuration.toFixed(2)}ms for ${files.length} files`
      );

      // Sync to GraphRAG if connected
      if (this.graphRAG && this.graphRAG.isConnected) {
        await this.graphRAG.syncFromCodeGraph(this);
      }

      // Save cache asynchronously
      this.saveCache().catch((e) => logger.debug(`Background cache save failed: ${e.message}`));

      return this.getSummary();
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Analyze a single file for symbols and dependencies
   * @param {string} filePath - Path to file
   * @param {number} mtime - Last modified time
   * @returns {Promise<Object>} File metadata and edges
   */
  async analyzeFile(filePath, mtime) {
    if (!filePath) throw new ValidationError('filePath is required for analysis');
    try {
      const absolutePath = path.resolve(process.cwd(), filePath);
      const stats = await fs.stat(absolutePath);

      const currentHash = `${stats.mtimeMs}-${stats.size}`;
      this.fileHashes.set(filePath, currentHash);

      const content = await fs.readFile(absolutePath, 'utf8');

      // Extract Symbols, Imports, and detailed function info
      const symbols = [];
      const functions = [];
      const dataTypes = [];
      const newEdges = [];

      try {
        const ext = path.extname(filePath);
        if (ext === '.js' || ext === '.jsx' || ext === '.mjs') {
          const ast = acorn.parse(content, {
            ecmaVersion: 'latest',
            sourceType: 'module',
            allowImportExportEverywhere: true,
            allowReturnOutsideFunction: true,
          });

          walk.simple(ast, {
            VariableDeclarator(node) {
              if (node.id.type === 'Identifier') symbols.push(node.id.name);
            },
            FunctionDeclaration(node) {
              if (node.id && node.id.type === 'Identifier') {
                symbols.push(node.id.name);
                functions.push({
                  name: node.id.name,
                  line: node.loc?.start?.line || 0,
                  params: node.params.map((p) => p.name || p.value || 'param'),
                });
              }
            },
            ClassDeclaration(node) {
              if (node.id && node.id.type === 'Identifier') {
                symbols.push(node.id.name);
                dataTypes.push({
                  name: node.id.name,
                  kind: 'class',
                  line: node.loc?.start?.line || 0,
                });
              }
            },
            ImportDeclaration(node) {
              const importPath = node.source.value;
              if (importPath.startsWith('.')) {
                const absoluteDir = path.dirname(absolutePath);
                const resolvedAbs = path.resolve(absoluteDir, importPath);
                const relativeResolved = path.relative(process.cwd(), resolvedAbs);
                newEdges.push({ from: filePath, to: relativeResolved, type: 'depends_on' });
              } else {
                newEdges.push({ from: filePath, to: importPath, type: 'package_dependency' });
              }
            },
            ExportNamedDeclaration(node) {
              if (node.declaration) {
                if (node.declaration.id) symbols.push(node.declaration.id.name);
                if (node.declaration.declarations) {
                  node.declaration.declarations.forEach((d) => {
                    if (d.id.type === 'Identifier') symbols.push(d.id.name);
                  });
                }
              }
            },
          });
        } else {
          throw new Error('Not a JS/JSX file, using regex fallback');
        }
      } catch (_e) {
        // Fallback to Regex
        const symbolRegex =
          /(?:export\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z0-9_]+)/g;
        let symMatch;
        while ((symMatch = symbolRegex.exec(content)) !== null) {
          if (!['default', 'if', 'for', 'while', 'switch'].includes(symMatch[1])) {
            symbols.push(symMatch[1]);
          }
        }

        const importRegex = /import\s+(?:[\w\s{},*]+)\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1];
          if (importPath.startsWith('.')) {
            const absoluteDir = path.dirname(absolutePath);
            const resolvedAbs = path.resolve(absoluteDir, importPath);
            const relativeResolved = path.relative(process.cwd(), resolvedAbs);
            newEdges.push({ from: filePath, to: relativeResolved, type: 'depends_on' });
          } else {
            newEdges.push({ from: filePath, to: importPath, type: 'package_dependency' });
          }
        }
      }

      // Store node info
      this.nodes.set(filePath, {
        id: filePath,
        size: content.length,
        type: path.extname(filePath).substring(1),
        mtime: mtime,
        isComponent:
          /^[A-Z]/.test(path.basename(filePath)) ||
          content.includes('React') ||
          content.includes('Component'),
        symbols: [...new Set(symbols)],
        functions,
        dataTypes,
      });

      return { edges: newEdges };
    } catch (e) {
      if (process.env.DEBUG) {
        logger.error(`Failed to analyze ${filePath}`, e);
      }
      return { edges: [] };
    }
  }

  getSummary() {
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.length,
      files: Array.from(this.nodes.keys()),
      dependencies: this.edges,
      lastScanTime: this.lastScanTime,
      cacheHit: this.nodes.size > 0,
      graphDBConnected: this.graphRAG?.isConnected || false,
    };
  }

  findReferences(fileName) {
    if (!fileName) return [];

    // Use optimized index for O(1) exact match lookup
    if (this.incomingEdges.has(fileName)) {
      return this.incomingEdges.get(fileName);
    }

    // Fallback to partial match scan if exact match not found
    // This maintains backward compatibility for tests relying on substring matching
    return this.edges.filter((e) => e.to.includes(fileName));
  }

  // Backwards-compatible misspelling (tests rely on it)
  findRefereces(fileName) {
    return this.findReferences(fileName);
  }

  findSymbol(name) {
    if (!name) return [];
    const results = [];
    const lowerName = name.toLowerCase();
    for (const [file, node] of this.nodes) {
      if (node.symbols) {
        const match = node.symbols.find(
          (s) => s.toLowerCase() === lowerName || s.toLowerCase().includes(lowerName)
        );
        if (match) {
          results.push({ file, symbol: match, type: 'definition' });
        }
      }
    }
    return results;
  }

  getImpact(filePath) {
    if (!filePath) throw new ValidationError('filePath is required for impact analysis');
    // Use GraphRAG if available for more sophisticated impact analysis
    if (this.graphRAG && this.graphRAG.isConnected) {
      return this.graphRAG.getImpactAnalysis(filePath);
    }

    // Fallback to in-memory traversal
    const impact = new Set();
    const visited = new Set();

    const findDependents = (currentPath) => {
      if (visited.has(currentPath)) return;
      visited.add(currentPath);

      // Use index for O(1) lookup
      const dependents = this.incomingEdges.get(currentPath) || [];
      for (const edge of dependents) {
        if (edge.from !== filePath) {
          impact.add(edge.from);
        }
        findDependents(edge.from);
      }
    };

    findDependents(filePath);
    return Array.from(impact);
  }

  async updateChangedFiles(changedFiles) {
    if (!Array.isArray(changedFiles)) return;
    const updateStart = performance.now();

    for (const file of changedFiles) {
      // Remove old edges originating from this file
      this.edges = this.edges.filter((e) => e.from !== file);

      const { edges } = await this.analyzeFile(file);
      if (edges && edges.length > 0) {
        this.edges.push(...edges);
      }
    }

    this._rebuildIndex();

    // Resync to GraphRAG
    if (this.graphRAG && this.graphRAG.isConnected) {
      await this.graphRAG.syncFromCodeGraph(this);
    }

    const updateDuration = performance.now() - updateStart;
    logger.debug(
      `[Performance] Updated ${changedFiles.length} changed files in ${updateDuration.toFixed(2)}ms`
    );
  }

  clearCache() {
    this.nodes.clear();
    this.edges = [];
    this.incomingEdges.clear();
    this.fileHashes.clear();
    this.lastScanTime = 0;
  }

  /**
   * Rebuild the incoming edges index for faster querying
   * @private
   */
  _rebuildIndex() {
    this.incomingEdges.clear();
    for (const edge of this.edges) {
      if (!this.incomingEdges.has(edge.to)) {
        this.incomingEdges.set(edge.to, []);
      }
      this.incomingEdges.get(edge.to).push(edge);
    }
  }

  // GraphRAG passthrough methods
  async getImpactAnalysis(filePath, options) {
    if (!filePath) throw new ValidationError('filePath is required');
    if (this.graphRAG && this.graphRAG.isConnected) {
      return await this.graphRAG.getImpactAnalysis(filePath, options);
    }
    return { error: 'GraphRAG not connected', impactedFiles: this.getImpact(filePath) };
  }

  async findCircularDependencies() {
    if (this.graphRAG && this.graphRAG.isConnected) {
      return await this.graphRAG.findCircularDependencies();
    }

    // In-memory cycle detection using DFS
    const outgoing = new Map();
    for (const edge of this.edges) {
      if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
      outgoing.get(edge.from).push(edge.to);
    }

    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    // Helper function for DFS
    const detectCycle = (node, path) => {
      visited.add(node);
      recursionStack.add(node);

      const children = outgoing.get(node) || [];
      for (const child of children) {
        if (!visited.has(child)) {
          detectCycle(child, [...path, child]);
        } else if (recursionStack.has(child)) {
          // Cycle detected: from current node back to 'child' which is in recursion stack
          const cycleStart = path.indexOf(child);
          if (cycleStart !== -1) {
            cycles.push([...path.slice(cycleStart), child]);
          }
        }
      }

      recursionStack.delete(node);
    };

    for (const node of this.nodes.keys()) {
      if (!visited.has(node)) {
        detectCycle(node, [node]);
      }
    }

    return cycles;
  }

  async getCouplingMetrics() {
    if (this.graphRAG && this.graphRAG.isConnected) {
      return await this.graphRAG.getCouplingMetrics();
    }
    return {};
  }

  async searchSymbols(query, options) {
    if (!query) return [];
    if (this.graphRAG && this.graphRAG.isConnected) {
      return await this.graphRAG.searchSymbols(query, options);
    }
    return this.findSymbol(query);
  }

  async getRAGContext(query, options) {
    if (!query) return { files: [], functions: [], decisions: [], dependencies: [] };
    if (this.graphRAG && this.graphRAG.isConnected) {
      return await this.graphRAG.getRAGContext(query, options);
    }
    return { files: [], functions: [], decisions: [], dependencies: [] };
  }

  async storeDecision(decision) {
    if (!decision) throw new ValidationError('decision is required');
    if (this.graphRAG && this.graphRAG.isConnected) {
      return await this.graphRAG.storeDecision(decision);
    }
    return false;
  }
}

// Singleton instance with GraphRAG support
export const projectGraph = new CodeGraph({ useGraphDB: true });
