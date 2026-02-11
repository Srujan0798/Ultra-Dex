// Copyright (c) 2026 Ultra-Dex

import { projectGraph, GraphRAG } from './graph.js';
import fs from 'fs/promises';
import path from 'path';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../ui/logger.js';

/**
 * ContextEngine - Graph-based context retrieval for RAG
 * Replaces file-based context with graph-based semantic retrieval
 */
export class ContextEngine {
  /**
   * Initialize Context Engine
   * @param {Object} options - Configuration options
   * @param {CodeGraph} [options.graph] - Dependency graph instance
   * @param {boolean} [options.useGraphDB=true] - Enable GraphRAG
   * @param {number} [options.maxContextSize=100000] - Max context tokens/chars
   */
  constructor(options = {}) {
    this.graph = options.graph || projectGraph;
    this.useGraphDB = options.useGraphDB !== false;
    this.maxContextSize = options.maxContextSize || 100000; // Max chars in context
    this.contextCache = new Map();
    this.cacheTimeout = 60000; // 1 minute
    this.initializing = null;
  }

  /**
   * Initialize the context engine and underlying graph
   * @returns {Promise<ContextEngine>} Initialized instance
   */
  async initialize() {
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      try {
        if (this.useGraphDB && !this.graph.graphRAG) {
          await this.graph.initializeGraphRAG();
        }
        await this.graph.scan();
        return this;
      } catch (err) {
        this.initializing = null;
        throw new AppError(`Failed to initialize ContextEngine: ${err.message}`, { cause: err });
      }
    })();

    return this.initializing;
  }

  /**
   * Build rich context for a query using graph relationships
   * @param {string} query - The query or file to get context for
   * @param {object} options - Context building options
   * @returns {object} Context with files, dependencies, and impact analysis
   */
  async buildContext(query, options = {}) {
    if (!query || typeof query !== 'string') {
      throw new ValidationError('Context query must be a non-empty string');
    }

    const startTime = Date.now();

    // Check cache first
    const cacheKey = `${query}:${JSON.stringify(options)}`;
    const cached = this.contextCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.context;
    }

    try {
      const context = {
        query,
        files: [],
        dependencies: [],
        functions: [],
        impact: null,
        decisions: [],
        coupling: null,
        circularDeps: [],
        timestamp: new Date().toISOString(),
      };

      // Determine if query is a file path or symbol
      const isFilePath =
        query.includes('/') ||
        query.includes('\\') ||
        query.endsWith('.js') ||
        query.endsWith('.ts');

      if (isFilePath) {
        // Normalize path
        const normalizedPath = path.normalize(query);
        context.files = await this.getFileContext(normalizedPath, options);
        context.impact = await this.graph.getImpactAnalysis(normalizedPath, {
          maxDepth: options.impactDepth || 5,
          includeFunctions: options.includeFunctions || false,
        });
      } else {
        // Treat as symbol search
        context.functions = await this.graph.searchSymbols(query, { limit: options.limit || 10 });
        context.files = await this.getSymbolContext(query, options);
      }

      // Get graph-based RAG context
      const ragContext = await this.graph.getRAGContext(query, { limit: options.limit || 10 });
      context.dependencies = ragContext.dependencies || [];
      context.decisions = ragContext.decisions || [];

      // Get coupling metrics if requested
      if (options.includeCoupling) {
        context.coupling = await this.graph.getCouplingMetrics();
      }

      // Get circular dependencies if requested
      if (options.includeCircularDeps) {
        context.circularDeps = await this.graph.findCircularDependencies();
      }

      // Read file contents
      context.fileContents = await this.readFileContents(context.files.map((f) => f.path || f));

      // Calculate context size
      context.size = this.calculateContextSize(context);
      context.buildTime = Date.now() - startTime;

      // Cache result
      this.contextCache.set(cacheKey, { context, timestamp: Date.now() });

      return context;
    } catch (err) {
      logger.error(`Error building context for: ${query}`, err);
      throw new AppError(`Failed to build context: ${err.message}`, { cause: err });
    }
  }

  /**
   * Get context for a specific file including its dependencies
   * @param {string} filePath - Path to file
   * @param {Object} options - Traversal options
   * @param {number} [options.depth=2] - Dependency depth
   * @returns {Promise<Array<Object>>} List of related file nodes
   */
  async getFileContext(filePath, options = {}) {
    const context = [];
    const visited = new Set();
    const depth = options.depth || 2;

    const traverse = async (currentPath, currentDepth) => {
      if (currentDepth > depth || visited.has(currentPath)) return;
      visited.add(currentPath);

      const node = this.graph.nodes.get(currentPath);
      if (node) {
        context.push({
          path: currentPath,
          type: node.type,
          symbols: node.symbols || [],
          functions: node.functions || [],
          dataTypes: node.dataTypes || [],
          depth: currentDepth,
        });
      }

      // Get dependencies
      const deps = this.graph.edges.filter(
        (e) => e.from === currentPath && e.type === 'depends_on'
      );
      for (const dep of deps) {
        await traverse(dep.to, currentDepth + 1);
      }
    };

    await traverse(filePath, 0);
    return context;
  }

  /**
   * Get context for a symbol (function, class, etc.)
   * @param {string} symbol - Symbol name to search
   * @param {Object} options - Search options
   * @returns {Promise<Array<Object>>} List of nodes containing the symbol
   */
  async getSymbolContext(symbol, options = {}) {
    const results = this.graph.findSymbol(symbol);
    const context = [];

    for (const result of results) {
      const node = this.graph.nodes.get(result.file);
      if (node) {
        context.push({
          path: result.file,
          type: node.type,
          symbols: node.symbols || [],
          matchedSymbol: result.symbol,
          functions: node.functions || [],
          dataTypes: node.dataTypes || [],
        });
      }
    }

    return context;
  }

  /**
   * Read contents of files
   * @param {string[]} filePaths - List of file paths
   * @returns {Promise<Object>} Map of file paths to content
   */
  async readFileContents(filePaths) {
    const contents = {};

    for (const filePath of filePaths) {
      try {
        const fullPath = path.resolve(process.cwd(), filePath);
        const content = await fs.readFile(fullPath, 'utf8');
        contents[filePath] = content;
      } catch (e) {
        contents[filePath] = `// Error reading file: ${e.message}`;
      }
    }

    return contents;
  }

  /**
   * Calculate total context size in characters
   * @param {Object} context - Context object
   * @returns {number} Size in characters
   */
  calculateContextSize(context) {
    let size = 0;

    if (context.fileContents) {
      for (const [path, content] of Object.entries(context.fileContents)) {
        size += content.length;
      }
    }

    return size;
  }

  /**
   * Format context for LLM consumption
   * @param {Object} context - Raw context object
   * @param {Object} options - Formatting options
   * @returns {string} Formatted markdown string
   */
  formatContextForLLM(context, options = {}) {
    const sections = [];

    // Header
    sections.push(`# Context for: ${context.query}`);
    sections.push(`Generated: ${context.timestamp}`);
    sections.push(`Build time: ${context.buildTime}ms`);
    sections.push('');

    // Impact Analysis
    if (context.impact && !context.impact.error) {
      sections.push('## Impact Analysis');
      sections.push(`**Risk Level:** ${context.impact.riskLevel || 'unknown'}`);
      sections.push(
        `**Total Impacted Files:** ${context.impact.totalImpacted || context.impact.impactedFiles?.length || 0}`
      );

      if (context.impact.impactedFiles && context.impact.impactedFiles.length > 0) {
        sections.push('');
        sections.push('### Files That Depend on This Change:');
        context.impact.impactedFiles.slice(0, 20).forEach((item) => {
          if (typeof item === 'string') {
            sections.push(`- ${item}`);
          } else {
            sections.push(`- ${item.file} (depth: ${item.depth})`);
          }
        });
        if (context.impact.impactedFiles.length > 20) {
          sections.push(`- ... and ${context.impact.impactedFiles.length - 20} more`);
        }
      }

      if (context.impact.impactedFunctions && context.impact.impactedFunctions.length > 0) {
        sections.push('');
        sections.push('### Impacted Functions:');
        context.impact.impactedFunctions.forEach((fn) => {
          sections.push(`- ${fn.function} in ${fn.file}`);
        });
      }

      if (context.impact.relatedDecisions && context.impact.relatedDecisions.length > 0) {
        sections.push('');
        sections.push('### Related Architectural Decisions:');
        context.impact.relatedDecisions.forEach((d) => {
          sections.push(`- **${d.title}**: ${d.description}`);
        });
      }
      sections.push('');
    }

    // Dependencies
    if (context.dependencies && context.dependencies.length > 0) {
      sections.push('## Related Dependencies');
      context.dependencies.forEach((dep) => {
        sections.push(`- ${dep.path} (${dep.type})`);
      });
      sections.push('');
    }

    // Circular Dependencies
    if (context.circularDeps && context.circularDeps.length > 0) {
      sections.push('## ⚠️ Circular Dependencies Detected');
      context.circularDeps.forEach((cycle) => {
        sections.push(`- ${cycle.join(' → ')} → ${cycle[0]}`);
      });
      sections.push('');
    }

    // Coupling Metrics
    if (context.coupling) {
      sections.push('## Coupling Metrics');
      sections.push(`- Average coupling: ${context.coupling.averageCoupling?.toFixed(2) || 'N/A'}`);
      sections.push(`- Max coupling: ${context.coupling.maxCoupling || 'N/A'}`);

      if (context.coupling.highlyCoupledFiles && context.coupling.highlyCoupledFiles.length > 0) {
        sections.push('');
        sections.push('### Highly Coupled Files:');
        context.coupling.highlyCoupledFiles.forEach((f) => {
          sections.push(`- ${f.file} (coupling: ${f.coupling})`);
        });
      }
      sections.push('');
    }

    // Functions
    if (context.functions && context.functions.length > 0) {
      sections.push('## Related Functions');
      context.functions.forEach((fn) => {
        if (typeof fn === 'string') {
          sections.push(`- ${fn}`);
        } else {
          sections.push(`- ${fn.name} (${fn.file})`);
        }
      });
      sections.push('');
    }

    // File Contents
    if (context.fileContents && Object.keys(context.fileContents).length > 0) {
      sections.push('## File Contents');
      sections.push('');

      for (const [filePath, content] of Object.entries(context.fileContents)) {
        // Truncate large files
        const maxFileSize = options.maxFileSize || 5000;
        let truncatedContent = content;
        let wasTruncated = false;

        if (content.length > maxFileSize) {
          truncatedContent = content.substring(0, maxFileSize) + '\n\n... [truncated]';
          wasTruncated = true;
        }

        sections.push(`### ${filePath}${wasTruncated ? ' (truncated)' : ''}`);
        sections.push('```' + path.extname(filePath).substring(1));
        sections.push(truncatedContent);
        sections.push('```');
        sections.push('');
      }
    }

    return sections.join('\n');
  }

  /**
   * Query the graph with a natural language question
   * Example: "What breaks if I change the auth module?"
   * @param {string} question - Natural language query
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Structured answer and context
   */
  async query(question, options = {}) {
    const lowerQuestion = question.toLowerCase();

    // Parse question patterns
    const impactPattern = /what breaks|impact of|depend(s|encies) on/i;
    const couplingPattern = /coupling|tightly connected|highly coupled/i;
    const circularPattern = /circular|cycles?|loop/i;
    const symbolPattern = /where is|find|search for/i;

    if (impactPattern.test(lowerQuestion)) {
      // Extract file path or module name
      const matches = question.match(
        /(?:change|modify|update)\s+(?:the\s+)?(.+?)(?:\?|\s+module|\s+file|$)/i
      );
      const target = matches ? matches[1].trim() : null;

      if (target) {
        const context = await this.buildContext(target, {
          ...options,
          includeFunctions: true,
        });
        return {
          type: 'impact_analysis',
          answer: this.formatImpactAnswer(context),
          context,
        };
      }
    }

    if (couplingPattern.test(lowerQuestion)) {
      const coupling = await this.graph.getCouplingMetrics();
      return {
        type: 'coupling_analysis',
        answer: this.formatCouplingAnswer(coupling),
        coupling,
      };
    }

    if (circularPattern.test(lowerQuestion)) {
      const cycles = await this.graph.findCircularDependencies();
      return {
        type: 'circular_deps',
        answer: this.formatCircularDepsAnswer(cycles),
        cycles,
      };
    }

    if (symbolPattern.test(lowerQuestion)) {
      const matches = question.match(/(?:find|where is|search for)\s+(.+?)(?:\?|$)/i);
      const symbol = matches ? matches[1].trim() : question;

      const results = await this.graph.searchSymbols(symbol, { limit: 10 });
      return {
        type: 'symbol_search',
        answer: this.formatSymbolAnswer(results, symbol),
        results,
      };
    }

    // Default: build general context
    const context = await this.buildContext(question, options);
    return {
      type: 'general_context',
      answer: this.formatContextForLLM(context, options),
      context,
    };
  }

  formatImpactAnswer(context) {
    if (!context.impact || context.impact.error) {
      return `No impact analysis available. ${context.impact?.error || ''}`;
    }

    const lines = [
      `## Impact Analysis for "${context.query}"`,
      '',
      `**Risk Level:** ${context.impact.riskLevel}`,
      `**Total Files Impacted:** ${context.impact.totalImpacted}`,
      '',
    ];

    if (context.impact.impactedFiles.length > 0) {
      lines.push('### Affected Files:');
      context.impact.impactedFiles.slice(0, 15).forEach((item) => {
        const file = typeof item === 'string' ? item : item.file;
        const depth = typeof item === 'string' ? '' : ` (depth: ${item.depth})`;
        lines.push(`- ${file}${depth}`);
      });
      if (context.impact.impactedFiles.length > 15) {
        lines.push(`- ... and ${context.impact.impactedFiles.length - 15} more`);
      }
      lines.push('');
    }

    if (context.impact.relatedDecisions.length > 0) {
      lines.push('### Related Decisions:');
      context.impact.relatedDecisions.forEach((d) => {
        lines.push(`- ${d.title}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  formatCouplingAnswer(coupling) {
    if (!coupling || Object.keys(coupling).length === 0) {
      return 'Coupling metrics not available.';
    }

    const lines = [
      '## Coupling Metrics',
      '',
      `- Average coupling: ${coupling.averageCoupling?.toFixed(2) || 'N/A'}`,
      `- Max coupling: ${coupling.maxCoupling || 'N/A'}`,
      '',
    ];

    if (coupling.highlyCoupledFiles && coupling.highlyCoupledFiles.length > 0) {
      lines.push('### Highly Coupled Files:');
      coupling.highlyCoupledFiles.forEach((f) => {
        lines.push(`- ${f.file} (coupling: ${f.coupling})`);
      });
    }

    return lines.join('\n');
  }

  formatCircularDepsAnswer(cycles) {
    if (!cycles || cycles.length === 0) {
      return 'No circular dependencies found. ✓';
    }

    const lines = [`## ⚠️ Found ${cycles.length} Circular Dependencies`, ''];

    cycles.forEach((cycle, i) => {
      lines.push(`${i + 1}. ${cycle.join(' → ')} → ${cycle[0]}`);
    });

    return lines.join('\n');
  }

  formatSymbolAnswer(results, symbol) {
    if (!results || results.length === 0) {
      return `No results found for "${symbol}".`;
    }

    const lines = [`## Search Results for "${symbol}"`, `Found ${results.length} matches:`, ''];

    results.forEach((r) => {
      lines.push(`- **${r.name || r.symbol}** in ${r.file}${r.type ? ` (${r.type})` : ''}`);
    });

    return lines.join('\n');
  }

  /**
   * Clear context cache
   */
  clearCache() {
    this.contextCache.clear();
  }

  /**
   * Store an architectural decision in the graph
   */
  async storeDecision(decision) {
    return await this.graph.storeDecision(decision);
  }
}

// Singleton instance
export const contextEngine = new ContextEngine();

// Factory function
export function createContextEngine(options = {}) {
  return new ContextEngine(options);
}
