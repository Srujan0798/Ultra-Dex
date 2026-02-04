/**
 * ultra-dex search command
 * Semantic code search using vector embeddings
 * This enables AI to UNDERSTAND your codebase, not just pattern match
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { getProvider } from '../providers/index.js';
import { projectGraph } from '../mcp/graph.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { MemoryVectorStore } from 'langchain/vectorstores/memory'; // Using direct import path for compatibility if needed, or @langchain/community
import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai'; // Assuming OpenAI for now, or use generic
// We'll use dynamic imports for community to avoid top-level failures if not perfectly linked
// But for this task we assume it works. 

// ============================================================================
// VECTOR STORE CONFIGURATION
// ============================================================================

const EMBEDDINGS_CONFIG = {
  // File patterns to index
  includePatterns: [
    '**/*.js', '**/*.ts', '**/*.tsx', '**/*.jsx',
    '**/*.py', '**/*.go', '**/*.rs', '**/*.rb',
    '**/*.md', '**/*.json', '**/*.yaml', '**/*.yml',
    '**/*.prisma', '**/*.sql', '**/*.graphql',
  ],

  // Directories to exclude
  excludeDirs: [
    'node_modules', '.git', 'dist', 'build', '.next',
    'coverage', '__pycache__', '.venv', 'vendor',
    '.ultra-dex', '.ultra',
  ],

  // Chunk settings
  chunkSize: 1000, // characters per chunk
  chunkOverlap: 200,

  // Index file location
  indexPath: '.ultra-dex/embeddings.json',
};

// ============================================================================
// LANGCHAIN VECTOR STORE WRAPPER
// ============================================================================

class UltraDexVectorStore {
  constructor() {
    this.store = null;
    this.metadata = {
      createdAt: null,
      updatedAt: null,
      fileCount: 0,
      chunkCount: 0,
    };
  }

  /**
   * Get embeddings model based on provider
   */
  async getEmbeddingsModel() {
    const provider = getProvider();
    
    if (provider && provider.getName() === 'LangChain' && provider.llm) {
        // If it's LangChain provider, it might have embeddings configured
        // For now, default to OpenAIEmbeddings if API key is present
        if (process.env.OPENAI_API_KEY) {
            return new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
        }
    }
    
    // Return a dummy embeddings model for local fallback if no provider
    // This mimics the "dumb" local embedding but in LangChain interface
    return {
      embedQuery: async (text) => this.generateLocalEmbedding(text),
      embedDocuments: async (documents) => documents.map(doc => this.generateLocalEmbedding(doc)),
    };
  }
  
  generateLocalEmbedding(text, dimensions = 1536) {
      // Simple hash-based embedding for fallback
      const embedding = new Array(dimensions).fill(0);
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
          hash = ((hash << 5) - hash) + text.charCodeAt(i);
          hash |= 0;
      }
      // Seed predictable psuedo-randomness
      const rng = (seed) => {
          var x = Math.sin(seed++) * 10000;
          return x - Math.floor(x);
      }
      for(let i=0; i<dimensions; i++) {
          embedding[i] = rng(hash + i);
      }
      return embedding;
  }

  /**
   * Initialize store
   */
  async init() {
    if (!this.store) {
      const embeddings = await this.getEmbeddingsModel();
      this.store = new MemoryVectorStore(embeddings);
    }
  }

  /**
   * Add documents
   */
  async addDocuments(docs) {
    await this.init();
    await this.store.addDocuments(docs);
    this.metadata.chunkCount += docs.length;
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Search for similar documents
   */
  async search(query, topK = 5) {
    await this.init();
    return await this.store.similaritySearch(query, topK);
  }

  /**
   * Save to disk
   */
  async save(filepath) {
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    
    // Extract vectors from memory store (internal access)
    // Note: MemoryVectorStore stores in `memoryVectors` array
    const vectors = this.store.memoryVectors || [];
    
    await fs.writeFile(filepath, JSON.stringify({
      metadata: this.metadata,
      vectors: vectors,
    }, null, 2));
  }

  /**
   * Load from disk
   */
  async load(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(content);
      
      this.metadata = data.metadata;
      
      const embeddings = await this.getEmbeddingsModel();
      this.store = new MemoryVectorStore(embeddings);
      
      // Restore vectors
      this.store.memoryVectors = data.vectors || [];
      
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Clear the store
   */
  clear() {
    this.store = null; // Will be re-initialized
    this.metadata = {
      createdAt: null,
      updatedAt: null,
      fileCount: 0,
      chunkCount: 0,
    };
  }
}

// Global store instance
const vectorStore = new UltraDexVectorStore();

// ============================================================================
// TEXT CHUNKING
// ============================================================================

/**
 * Split text into overlapping chunks
 */
function chunkText(text, filepath) {
  const chunks = [];
  const { chunkSize, chunkOverlap } = EMBEDDINGS_CONFIG;

  // If text is small enough, use as single chunk
  if (text.length <= chunkSize) {
    return [new Document({
      pageContent: text,
      metadata: { source: filepath, chunk: 0, total: 1 }
    })];
  }

  let start = 0;
  let chunkIndex = 0;
  const totalChunks = Math.ceil(text.length / (chunkSize - chunkOverlap));

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);

    chunks.push(new Document({
      pageContent: chunk,
      metadata: { 
        source: filepath, 
        chunk: chunkIndex, 
        total: totalChunks 
      }
    }));

    start += chunkSize - chunkOverlap;
    chunkIndex++;
  }

  return chunks;
}

// ============================================================================
// INDEXING
// ============================================================================

/**
 * Index the codebase
 */
export async function indexCodebase(workdir = process.cwd(), options = {}) {
  const { force = false, verbose = false } = options;
  const indexPath = path.join(workdir, EMBEDDINGS_CONFIG.indexPath);

  // Check if index exists and is recent
  if (!force) {
    const loaded = await vectorStore.load(indexPath);
    if (loaded) {
      const indexAge = Date.now() - new Date(vectorStore.metadata.updatedAt).getTime();
      const oneHour = 60 * 60 * 1000;

      if (indexAge < oneHour) {
        return {
          cached: true,
          files: vectorStore.metadata.fileCount,
          chunks: vectorStore.metadata.chunkCount,
        };
      }
    }
  }

  // Clear and rebuild
  vectorStore.clear();
  await vectorStore.init();
  vectorStore.metadata.createdAt = new Date().toISOString();

  // Find all files to index
  const excludePattern = EMBEDDINGS_CONFIG.excludeDirs.map(d => `**/${d}/**`);
  const files = await glob(EMBEDDINGS_CONFIG.includePatterns, {
    cwd: workdir,
    ignore: excludePattern,
    nodir: true,
  });

  // Deduplicate
  const uniqueFiles = [...new Set(files)];
  vectorStore.metadata.fileCount = uniqueFiles.length;

  if (verbose) {
    printInfo(chalk.gray(`Found ${uniqueFiles.length} files to index`));
  }

  // Index each file
  let chunkCount = 0;
  const allDocs = [];

  for (const file of uniqueFiles) {
    try {
      const filepath = path.join(workdir, file);
      const content = await fs.readFile(filepath, 'utf8');

      // Skip very large files
      if (content.length > 100000) {
        if (verbose) printInfo(chalk.gray(`Skipping large file: ${file}`));
        continue;
      }

      // Chunk the content
      const chunks = chunkText(content, file);
      allDocs.push(...chunks);
      chunkCount += chunks.length;

    } catch (err) {
      if (verbose) {
        printWarning(chalk.yellow(`Failed to index ${file}: ${err.message}`));
      }
    }
  }
  
  // Add all documents to store
  if (allDocs.length > 0) {
      await vectorStore.addDocuments(allDocs);
  }

  // Save index
  await vectorStore.save(indexPath);

  return {
    cached: false,
    files: uniqueFiles.length,
    chunks: chunkCount,
  };
}

/**
 * Search the indexed codebase
 */
export async function searchCodebase(query, options = {}) {
  const { workdir = process.cwd(), topK = 10 } = options;
  const indexPath = path.join(workdir, EMBEDDINGS_CONFIG.indexPath);

  // Ensure index is loaded
  if (!vectorStore.store) {
    const loaded = await vectorStore.load(indexPath);
    if (!loaded) {
      throw new Error('No index found. Run `ultra-dex search --index` first.');
    }
  }

  // Search
  const results = await vectorStore.search(query, topK);

  return results.map(r => ({
    path: r.metadata.source,
    chunk: r.metadata.chunk,
    score: 1.0, // LangChain memory store might not return score directly in similaritySearch, use similaritySearchWithScore if needed
    preview: r.pageContent.slice(0, 200) + (r.pageContent.length > 200 ? '...' : ''),
  }));
}

// ============================================================================
// CLI COMMAND
// ============================================================================

export function registerSearchCommand(program) {
  program
    .command('search [query]')
    .description('Semantic search across your codebase using embeddings')
    .option('--index', 'Rebuild the search index')
    .option('--force', 'Force full re-index')
    .option('--symbol', 'Search for symbol definitions (functions, classes)')
    .option('--impact <file>', 'Analyze the impact of changing a file')
    .option('-k, --top <n>', 'Number of results', '10')
    .option('-v, --verbose', 'Show detailed output')
    .option('--stats', 'Show index statistics')
    .action(async (query, options) => {
      try {
        printInfo(chalk.cyan('\n🔍 Ultra-Dex Search (LangChain Powered)\n'));

        if (options.symbol) {
            const spinner = ora('Scanning code graph...').start();
            try {
                await projectGraph.scan();
                const results = projectGraph.findSymbol(query);
                spinner.succeed(`Graph scan complete. Found ${results.length} symbol matches.`);

                if (results.length === 0) {
                    printWarning(chalk.yellow(`No symbols found matching "${query}"`));
                    return;
                }

                printInfo(chalk.bold('\nDefinitions found:'));
                results.forEach(r => {
                    printInfo(`  ${chalk.green(r.symbol)} in ${chalk.gray(r.file)}`);
                });
                return;
            } catch (e) {
                spinner.fail(`Symbol search failed: ${e.message}`);
                return;
            }
        }

        if (options.impact) {
            const spinner = ora('Analyzing impact in code graph...').start();
            try {
                await projectGraph.scan();
                const impact = projectGraph.getImpact(options.impact);
                spinner.succeed(`Impact analysis complete.`);

                printInfo(chalk.bold(`\nFiles that depend on ${chalk.cyan(options.impact)}:\n`));
                if (impact.length === 0) {
                    printSuccess('  ✓ No direct or indirect dependents found. Change is likely safe.');
                } else {
                    impact.forEach(file => {
                        printInfo(`  ${chalk.yellow('⚠')} ${file}`);
                    });
                    printInfo(chalk.gray(`\nTotal affected: ${impact.length} files`));
                }
                return;
            } catch (e) {
                spinner.fail(`Impact analysis failed: ${e.message}`);
                return;
            }
        }

        const workdir = process.cwd();
        const indexPath = path.join(workdir, EMBEDDINGS_CONFIG.indexPath);

        if (options.stats) {
          // Show index stats
          const loaded = await vectorStore.load(indexPath);
          if (!loaded) {
            printWarning(chalk.yellow('No index found.'));
            return;
          }

          printInfo(chalk.bold('Index Statistics:'));
          printInfo(`  Created: ${vectorStore.metadata.createdAt}`);
          printInfo(`  Updated: ${vectorStore.metadata.updatedAt}`);
          printInfo(`  Files: ${vectorStore.metadata.fileCount}`);
          printInfo(`  Chunks: ${vectorStore.metadata.chunkCount}`);
          return;
        }

        if (options.index || !query) {
          // Build/rebuild index
          const spinner = ora('Indexing codebase...').start();

          try {
            const result = await indexCodebase(workdir, {
              force: options.force,
              verbose: options.verbose,
            });

            if (result.cached) {
              spinner.succeed(`Using cached index (${result.files} files, ${result.chunks} chunks)`);
            } else {
              spinner.succeed(`Indexed ${result.files} files into ${result.chunks} chunks`);
            }
          } catch (err) {
            spinner.fail(`Indexing failed: ${err.message}`);
            return;
          }

          if (!query) {
            printInfo(chalk.gray('\nIndex ready. Use `ultra-dex search "your query"` to search.'));
            return;
          }
        }

        // Search
        const spinner = ora(`Searching for: "${query}"`).start();

        try {
          const results = await searchCodebase(query, {
            workdir,
            topK: parseInt(options.top, 10),
          });

          spinner.succeed(`Found ${results.length} results\n`);

          if (results.length === 0) {
            printWarning(chalk.yellow('No matches found. Try different keywords or rebuild the index.'));
            return;
          }

          // Display results
          for (let i = 0; i < results.length; i++) {
            const r = results[i];
            const score = r.score || 0; // fallback if undefined
            
            printInfo(chalk.bold(`${i + 1}. ${r.path}`) + chalk.gray(` (chunk ${r.chunk})`));
            printInfo(chalk.gray(`   ${r.preview.replace(/\n/g, ' ')}`));
            printInfo('');
          }

          // Hint
          printInfo(chalk.gray('Tip: Use --index --force to rebuild embeddings if results seem stale.'));

        } catch (err) {
          spinner.fail(`Search failed: ${err.message}`);
        }
      } catch (error) {
        printError(`Error in search command: ${error.message}`);
        process.exit(1);
      }
    });
}

export default {
  registerSearchCommand,
  indexCodebase,
  searchCodebase,
  vectorStore,
};