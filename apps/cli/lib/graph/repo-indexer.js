// Copyright (c) 2026 Ultra-Dex

/**
 * Repo Knowledge Graph
 * Parse codebase to build dependency graph
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { createHash } from 'crypto';

// Knowledge graph representation
class RepoKnowledgeGraph {
  constructor() {
    this.nodes = new Map(); // nodeId -> nodeData
    this.edges = new Map(); // edgeId -> edgeData
    this.indices = {
      files: new Map(),
      functions: new Map(),
      classes: new Map(),
      imports: new Map(),
    };
  }

  /**
   * Build the knowledge graph from the codebase
   */
  async buildGraph(projectRoot = process.cwd()) {
    console.log('🏗️  Building repository knowledge graph...');

    // Clear existing graph
    this.nodes.clear();
    this.edges.clear();
    this.indices = {
      files: new Map(),
      functions: new Map(),
      classes: new Map(),
      imports: new Map(),
    };

    // Parse different file types
    await this.parseJavaScriptFiles(projectRoot);
    await this.parseTypeScriptFiles(projectRoot);
    await this.parsePythonFiles(projectRoot);

    console.log(`✅ Graph built: ${this.nodes.size} nodes, ${this.edges.size} edges`);
  }

  /**
   * Parse JavaScript files
   */
  async parseJavaScriptFiles(projectRoot) {
    const jsFiles = await glob('**/*.js', {
      cwd: projectRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
    });

    for (const filePath of jsFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        await this.parseJSFile(filePath, content);
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }

  /**
   * Parse TypeScript files
   */
  async parseTypeScriptFiles(projectRoot) {
    const tsFiles = await glob('**/*.ts', {
      cwd: projectRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
    });

    for (const filePath of tsFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        await this.parseTSFile(filePath, content);
      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Also parse TSX files
    const tsxFiles = await glob('**/*.tsx', {
      cwd: projectRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
    });

    for (const filePath of tsxFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        await this.parseTSXFile(filePath, content);
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }

  /**
   * Parse Python files
   */
  async parsePythonFiles(projectRoot) {
    const pyFiles = await glob('**/*.py', {
      cwd: projectRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
    });

    for (const filePath of pyFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        await this.parsePyFile(filePath, content);
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }

  /**
   * Parse a JavaScript file
   */
  async parseJSFile(filePath, content) {
    const relativePath = path.relative(process.cwd(), filePath);
    const nodeId = `file:${relativePath}`;

    // Add file node
    const fileNode = {
      id: nodeId,
      type: 'file',
      path: filePath,
      relativePath,
      language: 'javascript',
      content: content.substring(0, 1000), // Truncate long files
      size: content.length,
      createdAt: new Date().toISOString(),
    };

    this.nodes.set(nodeId, fileNode);
    this.indices.files.set(relativePath, nodeId);

    // Extract functions
    const functionRegex =
      /(?:function\s+([a-zA-Z_$][a-zA-Z_$0-9]*)|([a-zA-Z_$][a-zA-Z_$0-9]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|([a-zA-Z_$][a-zA-Z_$0-9]*)\s*:\s*(?:async\s+)?\([^)]*\)\s*=>)/g;
    let funcMatch;

    while ((funcMatch = functionRegex.exec(content)) !== null) {
      const funcName = funcMatch[1] || funcMatch[2] || funcMatch[3];
      if (funcName) {
        const funcNodeId = `function:${relativePath}:${funcName}`;

        const funcNode = {
          id: funcNodeId,
          type: 'function',
          name: funcName,
          file: nodeId,
          language: 'javascript',
          line: this.getLineNumberOfMatch(content, funcMatch.index),
          createdAt: new Date().toISOString(),
        };

        this.nodes.set(funcNodeId, funcNode);
        this.indices.functions.set(`${relativePath}:${funcName}`, funcNodeId);

        // Create edge from file to function
        const edgeId = `edge:${nodeId}-contains->${funcNodeId}`;
        this.edges.set(edgeId, {
          id: edgeId,
          from: nodeId,
          to: funcNodeId,
          type: 'contains',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Extract imports
    const importRegex = /(import\s+|from\s+|require\(\s*)["'](.*?\.[jt]sx?)["']/g;
    let importMatch;

    while ((importMatch = importRegex.exec(content)) !== null) {
      const importedPath = importMatch[2];
      const importedAbsPath = path.resolve(path.dirname(filePath), importedPath);
      const importedRelPath = path.relative(process.cwd(), importedAbsPath);

      // Add import edge
      const edgeId = `edge:${nodeId}-imports->${importedRelPath}`;
      this.edges.set(edgeId, {
        id: edgeId,
        from: nodeId,
        to: `file:${importedRelPath}`,
        type: 'imports',
        importedPath: importedPath,
        createdAt: new Date().toISOString(),
      });

      // Track import in index
      if (!this.indices.imports.has(relativePath)) {
        this.indices.imports.set(relativePath, []);
      }
      this.indices.imports.get(relativePath).push({
        importedPath,
        importedRelPath,
        line: this.getLineNumberOfMatch(content, importMatch.index),
      });
    }
  }

  /**
   * Parse a TypeScript file
   */
  async parseTSFile(filePath, content) {
    // Similar to JS but with TS-specific patterns
    await this.parseJSFile(filePath, content); // Reuse JS parsing for now

    const relativePath = path.relative(process.cwd(), filePath);
    const nodeId = `file:${relativePath}`;

    // Extract TypeScript-specific elements like interfaces, types, etc.
    const interfaceRegex = /(?:export\s+)?(?:declare\s+)?interface\s+([a-zA-Z_$][a-zA-Z_$0-9]*)/g;
    let interfaceMatch;

    while ((interfaceMatch = interfaceRegex.exec(content)) !== null) {
      const interfaceName = interfaceMatch[1];
      const interfaceNodeId = `interface:${relativePath}:${interfaceName}`;

      const interfaceNode = {
        id: interfaceNodeId,
        type: 'interface',
        name: interfaceName,
        file: nodeId,
        language: 'typescript',
        line: this.getLineNumberOfMatch(content, interfaceMatch.index),
        createdAt: new Date().toISOString(),
      };

      this.nodes.set(interfaceNodeId, interfaceNode);

      // Create edge from file to interface
      const edgeId = `edge:${nodeId}-contains->${interfaceNodeId}`;
      this.edges.set(edgeId, {
        id: edgeId,
        from: nodeId,
        to: interfaceNodeId,
        type: 'contains',
        createdAt: new Date().toISOString(),
      });
    }

    // Extract types
    const typeRegex = /(?:export\s+)?(?:declare\s+)?type\s+([a-zA-Z_$][a-zA-Z_$0-9]*)/g;
    let typeMatch;

    while ((typeMatch = typeRegex.exec(content)) !== null) {
      const typeName = typeMatch[1];
      const typeNodeId = `type:${relativePath}:${typeName}`;

      const typeNode = {
        id: typeNodeId,
        type: 'type',
        name: typeName,
        file: nodeId,
        language: 'typescript',
        line: this.getLineNumberOfMatch(content, typeMatch.index),
        createdAt: new Date().toISOString(),
      };

      this.nodes.set(typeNodeId, typeNode);

      // Create edge from file to type
      const edgeId = `edge:${nodeId}-contains->${typeNodeId}`;
      this.edges.set(edgeId, {
        id: edgeId,
        from: nodeId,
        to: typeNodeId,
        type: 'contains',
        createdAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Parse a TSX file
   */
  async parseTSXFile(filePath, content) {
    await this.parseTSFile(filePath, content);
  }

  /**
   * Parse a Python file
   */
  async parsePyFile(filePath, content) {
    const relativePath = path.relative(process.cwd(), filePath);
    const nodeId = `file:${relativePath}`;

    // Add file node
    const fileNode = {
      id: nodeId,
      type: 'file',
      path: filePath,
      relativePath,
      language: 'python',
      content: content.substring(0, 1000), // Truncate long files
      size: content.length,
      createdAt: new Date().toISOString(),
    };

    this.nodes.set(nodeId, fileNode);
    this.indices.files.set(relativePath, nodeId);

    // Extract functions (def statements)
    const funcRegex = /^(\s*)def\s+([a-zA-Z_$][a-zA-Z_$0-9_]*)\s*\(/gm;
    let funcMatch;

    while ((funcMatch = funcRegex.exec(content)) !== null) {
      const funcName = funcMatch[2];
      const indent = funcMatch[1];
      const funcNodeId = `function:${relativePath}:${funcName}`;

      const funcNode = {
        id: funcNodeId,
        type: 'function',
        name: funcName,
        file: nodeId,
        language: 'python',
        line: this.getLineNumberOfMatch(content, funcMatch.index),
        indentLevel: indent.length / 2, // Approximate indentation level
        createdAt: new Date().toISOString(),
      };

      this.nodes.set(funcNodeId, funcNode);
      this.indices.functions.set(`${relativePath}:${funcName}`, funcNodeId);

      // Create edge from file to function
      const edgeId = `edge:${nodeId}-contains->${funcNodeId}`;
      this.edges.set(edgeId, {
        id: edgeId,
        from: nodeId,
        to: funcNodeId,
        type: 'contains',
        createdAt: new Date().toISOString(),
      });
    }

    // Extract classes
    const classRegex = /^(\s*)class\s+([a-zA-Z_$][a-zA-Z_$0-9_]*)/gm;
    let classMatch;

    while ((classMatch = classRegex.exec(content)) !== null) {
      const className = classMatch[2];
      const classNodeId = `class:${relativePath}:${className}`;

      const classNode = {
        id: classNodeId,
        type: 'class',
        name: className,
        file: nodeId,
        language: 'python',
        line: this.getLineNumberOfMatch(content, classMatch.index),
        indentLevel: classMatch[1].length / 2,
        createdAt: new Date().toISOString(),
      };

      this.nodes.set(classNodeId, classNode);
      this.indices.classes.set(`${relativePath}:${className}`, classNodeId);

      // Create edge from file to class
      const edgeId = `edge:${nodeId}-contains->${classNodeId}`;
      this.edges.set(edgeId, {
        id: edgeId,
        from: nodeId,
        to: classNodeId,
        type: 'contains',
        createdAt: new Date().toISOString(),
      });
    }

    // Extract imports
    const importRegex = /^(?:from\s+(.+?)\s+)?import\s+(.+)$/gm;
    let importMatch;

    while ((importMatch = importRegex.exec(content)) !== null) {
      const fromModule = importMatch[1];
      const importedNames = importMatch[2];

      // Add import edge
      const edgeId = `edge:${nodeId}-imports->${fromModule || importedNames}`;
      this.edges.set(edgeId, {
        id: edgeId,
        from: nodeId,
        to: `module:${fromModule || importedNames}`,
        type: 'imports',
        fromModule,
        importedNames,
        line: this.getLineNumberOfMatch(content, importMatch.index),
        createdAt: new Date().toISOString(),
      });

      // Track import in index
      if (!this.indices.imports.has(relativePath)) {
        this.indices.imports.set(relativePath, []);
      }
      this.indices.imports.get(relativePath).push({
        fromModule,
        importedNames,
        line: this.getLineNumberOfMatch(content, importMatch.index),
      });
    }
  }

  /**
   * Get line number of a match in content
   */
  getLineNumberOfMatch(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Find what would be impacted by changing a file
   */
  async analyzeImpact(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    const fileId = `file:${relativePath}`;

    // Find all files that import this file
    const impactedByImports = [];
    for (const [sourceFile, imports] of this.indices.imports.entries()) {
      for (const imp of imports) {
        if (
          imp.importedRelPath === relativePath ||
          imp.fromModule === relativePath ||
          imp.importedPath.includes(path.basename(relativePath, path.extname(relativePath)))
        ) {
          impactedByImports.push(sourceFile);
        }
      }
    }

    // Find all functions in this file
    const functionsInFile = [];
    for (const [key, nodeId] of this.indices.functions.entries()) {
      if (key.startsWith(`${relativePath}:`)) {
        functionsInFile.push(nodeId);
      }
    }

    // Find all usages of these functions in other files
    const functionUsages = [];
    // This would require more sophisticated analysis in a real implementation

    return {
      file: relativePath,
      importedBy: [...new Set(impactedByImports)], // Remove duplicates
      functions: functionsInFile,
      totalFilesAffected: impactedByImports.length + 1, // +1 for the file itself
      analysisDate: new Date().toISOString(),
    };
  }

  /**
   * Get all dependencies of a file
   */
  getFileDependencies(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    const imports = this.indices.imports.get(relativePath) || [];

    return imports.map((imp) => ({
      path: imp.importedRelPath || imp.fromModule,
      type: 'import',
      line: imp.line,
    }));
  }

  /**
   * Get all dependents of a file (files that import this file)
   */
  getFileDependents(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    const dependents = [];

    for (const [sourceFile, imports] of this.indices.imports.entries()) {
      for (const imp of imports) {
        if (
          imp.importedRelPath === relativePath ||
          imp.fromModule === relativePath ||
          imp.importedPath.includes(path.basename(relativePath, path.extname(relativePath)))
        ) {
          dependents.push(sourceFile);
        }
      }
    }

    return [...new Set(dependents)]; // Remove duplicates
  }

  /**
   * Find all functions that call a specific function
   */
  findFunctionCallers(functionName) {
    // This would require more sophisticated analysis in a real implementation
    // For now, return empty array
    return [];
  }

  /**
   * Find all functions called by a specific function
   */
  findFunctionCallees(functionName) {
    // This would require more sophisticated analysis in a real implementation
    // For now, return empty array
    return [];
  }

  /**
   * Export graph in various formats
   */
  export(format = 'json') {
    const graphData = {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      indices: {
        files: Object.fromEntries(this.indices.files),
        functions: Object.fromEntries(this.indices.functions),
        classes: Object.fromEntries(this.indices.classes),
        imports: Object.fromEntries(this.indices.imports),
      },
      exportedAt: new Date().toISOString(),
    };

    if (format === 'json') {
      return JSON.stringify(graphData, null, 2);
    } else if (format === 'dot') {
      // Generate DOT format for Graphviz
      let dot = 'digraph KnowledgeGraph {\n  rankdir=TB;\n\n';

      // Add nodes
      for (const node of this.nodes.values()) {
        const label =
          node.type === 'file' ? path.basename(node.relativePath) : node.name || node.type;
        dot += `  "${node.id}" [label="${label}", shape=${node.type === 'file' ? 'folder' : 'ellipse'}];\n`;
      }

      // Add edges
      for (const edge of this.edges.values()) {
        dot += `  "${edge.from}" -> "${edge.to}" [label="${edge.type}"];\n`;
      }

      dot += '}\n';
      return dot;
    }

    return graphData;
  }
}

// Singleton instance
const repoKnowledgeGraph = new RepoKnowledgeGraph();

export async function indexRepo(rootDir = process.cwd()) {
  await repoKnowledgeGraph.buildGraph(rootDir);

  const nodes = {};
  for (const node of repoKnowledgeGraph.nodes.values()) {
    if (node.type === 'file' && node.path) {
      nodes[node.path] = node;
    }
  }

  const stripFilePrefix = (value) => (value?.startsWith('file:') ? value.slice(5) : value);

  const edges = Array.from(repoKnowledgeGraph.edges.values()).map((edge) => ({
    ...edge,
    from: stripFilePrefix(edge.from),
    to: edge.importedPath || stripFilePrefix(edge.to),
  }));

  return { nodes, edges };
}

/**
 * Register knowledge graph command
 */
export function registerRepoGraphCommand(program) {
  const graphCmd = program
    .command('graph')
    .alias('knowledge-graph')
    .description('Repository knowledge graph and impact analysis');

  graphCmd
    .command('build')
    .description('Build knowledge graph from codebase')
    .option('-r, --root <path>', 'Project root path', process.cwd())
    .action(async (options) => {
      try {
        console.log('🏗️  Building repository knowledge graph...');
        await repoKnowledgeGraph.buildGraph(options.root);
        console.log(
          `✅ Graph built with ${repoKnowledgeGraph.nodes.size} nodes and ${repoKnowledgeGraph.edges.size} edges`
        );
      } catch (error) {
        console.error(`Error building graph: ${error.message}`);
      }
    });

  graphCmd
    .command('impact')
    .description('Analyze impact of changing a file')
    .argument('<file>', 'File path to analyze')
    .action(async (file) => {
      try {
        console.log(`🔍 Analyzing impact of changes to: ${file}`);

        const impact = await repoKnowledgeGraph.analyzeImpact(file);

        console.log(`\n📊 Impact Analysis for: ${impact.file}`);
        console.log(`Files importing this: ${impact.importedBy.length}`);
        console.log(`Functions in file: ${impact.functions.length}`);
        console.log(`Total files potentially affected: ${impact.totalFilesAffected}`);

        if (impact.importedBy.length > 0) {
          console.log(`\nFiles that would be affected:`);
          impact.importedBy.forEach((f) => console.log(`  - ${f}`));
        }
      } catch (error) {
        console.error(`Error analyzing impact: ${error.message}`);
      }
    });

  graphCmd
    .command('dependencies')
    .description('Show dependencies of a file')
    .argument('<file>', 'File path')
    .action(async (file) => {
      try {
        console.log(`🔗 Dependencies of: ${file}`);

        const deps = repoKnowledgeGraph.getFileDependencies(file);

        if (deps.length === 0) {
          console.log('No dependencies found');
          return;
        }

        deps.forEach((dep) => {
          console.log(`  - ${dep.path} (line ${dep.line})`);
        });
      } catch (error) {
        console.error(`Error getting dependencies: ${error.message}`);
      }
    });

  graphCmd
    .command('dependents')
    .description('Show dependents of a file (files that import it)')
    .argument('<file>', 'File path')
    .action(async (file) => {
      try {
        console.log(`↩️  Dependents of: ${file}`);

        const dependents = repoKnowledgeGraph.getFileDependents(file);

        if (dependents.length === 0) {
          console.log('No dependents found');
          return;
        }

        dependents.forEach((dep) => {
          console.log(`  - ${dep}`);
        });
      } catch (error) {
        console.error(`Error getting dependents: ${error.message}`);
      }
    });

  graphCmd
    .command('export')
    .description('Export knowledge graph')
    .option('-f, --format <format>', 'Export format (json, dot)', 'json')
    .option('-o, --output <path>', 'Output file path')
    .action(async (options) => {
      try {
        console.log(`📤 Exporting knowledge graph in ${options.format} format...`);

        const exported = repoKnowledgeGraph.export(options.format);

        if (options.output) {
          await fs.writeFile(options.output, exported);
          console.log(`✅ Graph exported to: ${options.output}`);
        } else {
          console.log(exported);
        }
      } catch (error) {
        console.error(`Error exporting graph: ${error.message}`);
      }
    });

  graphCmd._examples = [
    { command: 'ultra-dex graph build', description: 'Build knowledge graph from codebase' },
    {
      command: 'ultra-dex graph impact src/User.js',
      description: 'Analyze impact of changing User.js',
    },
    {
      command: 'ultra-dex graph dependencies src/api.js',
      description: 'Show dependencies of api.js',
    },
    {
      command: 'ultra-dex graph dependents src/utils.js',
      description: 'Show files that import utils.js',
    },
    {
      command: 'ultra-dex graph export --format dot -o graph.dot',
      description: 'Export graph in DOT format',
    },
  ];
}

export default {
  repoKnowledgeGraph,
  registerRepoGraphCommand,
  indexRepo,
};
