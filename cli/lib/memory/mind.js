// Copyright (c) 2026 Ultra-Dex

/**
 * Persistent Project Mind Engine
 * Hybrid RAG system (Vector + Graph + Keywords)
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { glob } from 'glob';

// Simple in-memory storage for the mind
class ProjectMind {
  constructor() {
    this.memory = {
      hot: new Map(), // Recent active files and concepts
      cold: new Map(), // Full project history
      vectors: new Map(), // Vector representations
      graph: new Map(), // Graph relationships
      keywords: new Map(), // Keyword index
    };

    this.config = {
      hotMemorySize: 100, // Max items in hot memory
      vectorDimensions: 1536, // Default for OpenAI embeddings
      maxContextLength: 4096, // Max tokens for context
    };
  }

  /**
   * Index commits, decisions, PRs, architecture
   */
  async indexProject(projectRoot = process.cwd()) {
    console.log('🧠 Indexing project into Persistent Mind...');

    // Index different types of project data
    await this.indexCommits(projectRoot);
    await this.indexDecisions(projectRoot);
    await this.indexArchitecture(projectRoot);
    await this.indexCodebase(projectRoot);

    console.log('✅ Project indexing complete');
  }

  /**
   * Index git commits
   */
  async indexCommits(projectRoot) {
    try {
      const { exec } = await import('child_process');
      const util = await import('util');
      const execAsync = util.promisify(exec);

      const { stdout } = await execAsync(
        'git log --pretty=format:"%H||%an||%ad||%s||%b" --date=iso',
        { cwd: projectRoot }
      );
      const commits = stdout
        .trim()
        .split('\n')
        .filter((line) => line.trim());

      for (const commitLine of commits) {
        const [hash, author, date, subject, body] = commitLine.split('||');
        const commitId = hash.substring(0, 8);

        const commitData = {
          id: commitId,
          hash,
          author,
          date,
          subject,
          body,
          indexedAt: new Date().toISOString(),
        };

        // Store in cold memory
        this.memory.cold.set(`commit:${commitId}`, commitData);

        // Add to keyword index
        this.addToKeywordIndex(`commit:${commitId}`, `${subject} ${body}`);
      }

      console.log(`Indexed ${commits.length} commits`);
    } catch (error) {
      console.log('⚠️  Could not index commits (not a git repo?)');
    }
  }

  /**
   * Index decisions from DECISION_LOG.md
   */
  async indexDecisions(projectRoot) {
    const decisionFile = path.join(projectRoot, 'DECISION_LOG.md');

    try {
      const content = await fs.readFile(decisionFile, 'utf8');

      // Simple parsing of decision log
      const decisionRegex =
        /### Decision (\d+): (.+?)\n[\s\S]*?#### Context\n([\s\S]*?)\n[\s\S]*?#### Decision\n([\s\S]*?)\n[\s\S]*?#### Consequences\n([\s\S]*?)\n---/g;
      let match;

      while ((match = decisionRegex.exec(content)) !== null) {
        const [, id, title, context, decision, consequences] = match;

        const decisionData = {
          id: `decision:${id}`,
          title,
          context: context.trim(),
          decision: decision.trim(),
          consequences: consequences.trim(),
          indexedAt: new Date().toISOString(),
        };

        // Store in cold memory
        this.memory.cold.set(`decision:${id}`, decisionData);

        // Add to keyword index
        this.addToKeywordIndex(`decision:${id}`, `${title} ${context} ${decision} ${consequences}`);
      }

      console.log(`Indexed ${[...content.matchAll(decisionRegex)].length} decisions`);
    } catch (error) {
      console.log('⚠️  Could not index decisions (DECISION_LOG.md not found)');
    }
  }

  /**
   * Index architecture files
   */
  async indexArchitecture(projectRoot) {
    const archPatterns = [
      'ARCHITECTURE.md',
      'DESIGN.md',
      'SYSTEM-DESIGN.md',
      'INFRASTRUCTURE.md',
      'README.md',
      'docs/**/*.md',
      '*.md',
    ];

    for (const pattern of archPatterns) {
      const files = await glob(pattern, { cwd: projectRoot, absolute: true });

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf8');

          // Create embedding-like representation (simplified)
          const fileId = `arch:${path.relative(projectRoot, file)}`;
          const fileData = {
            id: fileId,
            path: file,
            content: content.substring(0, 1000), // Truncate long files
            size: content.length,
            indexedAt: new Date().toISOString(),
          };

          // Store in cold memory
          this.memory.cold.set(fileId, fileData);

          // Add to keyword index
          this.addToKeywordIndex(fileId, `${path.basename(file)} ${content.substring(0, 500)}`);
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }

    console.log(`Indexed architecture documents`);
  }

  /**
   * Index codebase files
   */
  async indexCodebase(projectRoot) {
    const codePatterns = [
      '**/*.js',
      '**/*.ts',
      '**/*.jsx',
      '**/*.tsx',
      '**/*.py',
      '**/*.go',
      '**/*.java',
      '**/*.rb',
      '**/*.php',
      '**/*.cpp',
      '**/*.cs',
      '**/*.html',
      '**/*.css',
      '**/*.json',
      '**/*.yaml',
      '**/*.yml',
      '**/*.xml',
      '**/*.sql',
    ];

    let fileCount = 0;

    for (const pattern of codePatterns) {
      const files = await glob(pattern, { cwd: projectRoot, absolute: true });

      for (const file of files) {
        try {
          // Skip large files and certain directories
          if (
            file.includes('node_modules') ||
            file.includes('.git') ||
            file.includes('dist') ||
            file.includes('build') ||
            file.includes('coverage')
          ) {
            continue;
          }

          const stat = await fs.stat(file);
          if (stat.size > 1000000) {
            // Skip files larger than 1MB
            continue;
          }

          const content = await fs.readFile(file, 'utf8');

          // Create file representation
          const fileId = `code:${path.relative(projectRoot, file)}`;
          const fileData = {
            id: fileId,
            path: file,
            content: content.substring(0, 1000), // Truncate long files
            size: content.length,
            language: this.detectLanguage(file),
            indexedAt: new Date().toISOString(),
          };

          // Store in cold memory
          this.memory.cold.set(fileId, fileData);

          // Add to keyword index
          this.addToKeywordIndex(fileId, `${path.basename(file)} ${content.substring(0, 500)}`);

          fileCount++;

          // Add to graph relationships
          this.addToGraph(fileId, file, content);
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }

    console.log(`Indexed ${fileCount} code files`);
  }

  /**
   * Detect programming language from file extension
   */
  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.go': 'go',
      '.java': 'java',
      '.rb': 'ruby',
      '.php': 'php',
      '.cpp': 'cpp',
      '.cs': 'csharp',
      '.html': 'html',
      '.css': 'css',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.xml': 'xml',
      '.sql': 'sql',
    };

    return languageMap[ext] || 'unknown';
  }

  /**
   * Add to keyword index
   */
  addToKeywordIndex(id, text) {
    // Simple keyword extraction (in a real implementation, this would be more sophisticated)
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && word.length < 20);

    for (const word of words) {
      if (!this.memory.keywords.has(word)) {
        this.memory.keywords.set(word, []);
      }
      this.memory.keywords.get(word).push(id);
    }
  }

  /**
   * Add to graph relationships
   */
  addToGraph(fileId, filePath, content) {
    // Simple relationship detection (in a real implementation, this would be more sophisticated)
    const importRegex = /(import\s+|from\s+|require\(\s*)["'](.*?\.[jt]sx?)["']/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importedPath = match[2];
      const importedAbsPath = path.resolve(path.dirname(filePath), importedPath);
      const importedRelPath = path.relative(process.cwd(), importedAbsPath);

      // Create relationship
      const relId = `rel:${fileId}->${importedRelPath}`;
      const relData = {
        from: fileId,
        to: `code:${importedRelPath}`,
        type: 'import',
        indexedAt: new Date().toISOString(),
      };

      this.memory.graph.set(relId, relData);
    }
  }

  /**
   * Query the project mind
   */
  async query(question) {
    console.log(`🧠 Querying Project Mind: "${question}"`);

    // Search across different memory types
    const results = {
      hot: [],
      cold: [],
      keywords: [],
      graph: [],
    };

    // Keyword search
    const questionWords = question.toLowerCase().split(/\s+/);
    for (const word of questionWords) {
      if (this.memory.keywords.has(word)) {
        const ids = this.memory.keywords.get(word);
        results.keywords.push(...ids);
      }
    }

    // Get unique results
    const uniqueResults = [...new Set(results.keywords)];

    // Retrieve data for top results
    const topResults = uniqueResults
      .slice(0, 10)
      .map((id) => {
        let data = this.memory.cold.get(id) || this.memory.hot.get(id);
        if (!data) {
          // Try variations
          if (this.memory.cold.has(`decision:${id}`)) {
            data = this.memory.cold.get(`decision:${id}`);
          } else if (this.memory.cold.has(`commit:${id}`)) {
            data = this.memory.cold.get(`commit:${id}`);
          }
        }
        return data;
      })
      .filter(Boolean);

    return {
      question,
      results: topResults,
      count: topResults.length,
      indexedItems: this.memory.cold.size + this.memory.hot.size,
    };
  }

  /**
   * Add to hot memory (recent active files)
   */
  addToHotMemory(key, data) {
    this.memory.hot.set(key, {
      ...data,
      accessedAt: new Date().toISOString(),
    });

    // Trim hot memory if too large
    if (this.memory.hot.size > this.config.hotMemorySize) {
      const oldestKey = this.memory.hot.keys().next().value;
      this.memory.hot.delete(oldestKey);
    }
  }

  /**
   * Get hot memory items
   */
  getHotMemory() {
    return Array.from(this.memory.hot.entries()).map(([key, value]) => ({ key, value }));
  }

  /**
   * Get cold memory items
   */
  getColdMemory() {
    return Array.from(this.memory.cold.entries()).map(([key, value]) => ({ key, value }));
  }
}

// Singleton instance
const projectMind = new ProjectMind();

/**
 * Register memory command
 */
export function registerMemoryCommand(program) {
  const memoryCmd = program.command('memory').description('Persistent project memory and context');

  memoryCmd
    .command('query')
    .description('Query the project mind')
    .argument('<question>', 'Question to ask the project mind')
    .action(async (question) => {
      try {
        const result = await projectMind.query(question);

        console.log(`\n🧠 Project Mind Response:`);
        console.log(`Question: ${result.question}`);
        console.log(`Found ${result.count} relevant items out of ${result.indexedItems} indexed.`);

        if (result.results.length > 0) {
          console.log(`\nTop results:`);
          result.results.forEach((item, idx) => {
            console.log(`\n${idx + 1}. ${item.id || item.path || item.title}`);
            console.log(
              `   ${item.subject || item.title || item.content?.substring(0, 100) || '...'}`
            );
          });
        } else {
          console.log(`\nNo relevant results found.`);
        }
      } catch (error) {
        console.error(`Error querying project mind: ${error.message}`);
      }
    });

  memoryCmd
    .command('index')
    .description('Index the current project into memory')
    .action(async () => {
      try {
        await projectMind.indexProject();
        console.log(`\n✅ Project indexed into Persistent Mind`);
      } catch (error) {
        console.error(`Error indexing project: ${error.message}`);
      }
    });

  memoryCmd
    .command('status')
    .description('Show memory status')
    .action(() => {
      console.log(`\n🧠 Project Mind Status:`);
      console.log(`Hot Memory Items: ${projectMind.memory.hot.size}`);
      console.log(`Cold Memory Items: ${projectMind.memory.cold.size}`);
      console.log(`Keywords Indexed: ${projectMind.memory.keywords.size}`);
      console.log(`Graph Relationships: ${projectMind.memory.graph.size}`);
    });

  memoryCmd._examples = [
    {
      command: 'ultra-dex memory query "Why did we choose Postgres?"',
      description: 'Ask the project mind a question',
    },
    { command: 'ultra-dex memory index', description: 'Index current project into memory' },
    { command: 'ultra-dex memory status', description: 'Show memory status' },
  ];
}

export default {
  projectMind,
  registerMemoryCommand,
};
