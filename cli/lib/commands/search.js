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
// SIMPLE VECTOR STORE (In-Memory + File Persistence)
// ============================================================================

class VectorStore {
  constructor() {
    this.documents = []; // { id, path, content, embedding, chunk }
    this.metadata = {
      createdAt: null,
      updatedAt: null,
      fileCount: 0,
      chunkCount: 0,
    };
  }

  /**
   * Cosine similarity between two vectors
   */
  cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Add document with embedding
   */
  addDocument(doc) {
    this.documents.push(doc);
    this.metadata.chunkCount = this.documents.length;
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Search for similar documents
   */
  search(queryEmbedding, topK = 5) {
    const results = this.documents.map(doc => ({
      ...doc,
      score: this.cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Save to disk
   */
  async save(filepath) {
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify({
      metadata: this.metadata,
      documents: this.documents,
    }, null, 2));
  }

  /**
   * Load from disk
   */
  async load(filepath) {
    try {
      const data = JSON.parse(await fs.readFile(filepath, 'utf8'));
      this.metadata = data.metadata;
      this.documents = data.documents;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear the store
   */
  clear() {
    this.documents = [];
    this.metadata = {
      createdAt: null,
      updatedAt: null,
      fileCount: 0,
      chunkCount: 0,
    };
  }
}

// Global store instance
const vectorStore = new VectorStore();

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
    return [{
      content: text,
      path: filepath,
      chunk: 0,
      total: 1,
    }];
  }

  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);

    chunks.push({
      content: chunk,
      path: filepath,
      chunk: chunkIndex,
      total: Math.ceil(text.length / (chunkSize - chunkOverlap)),
    });

    start += chunkSize - chunkOverlap;
    chunkIndex++;
  }

  return chunks;
}

// ============================================================================
// EMBEDDING GENERATION
// ============================================================================

/**
 * Generate embeddings using AI provider
 * Falls back to simple TF-IDF-like approach if no API key
 */
async function generateEmbedding(text, provider = null) {
  // If we have an OpenAI-compatible provider, use their embeddings API
  if (provider && provider.getEmbedding) {
    try {
      return await provider.getEmbedding(text);
    } catch (err) {
      console.log(chalk.yellow(`\n⚠️  Embedding API failed, falling back to local method: ${err.message}`));
    }
  } else if (provider) {
    console.log(chalk.yellow(`\n⚠️  Provider ${provider.getName()} does not support embeddings. Using local fallback.`));
  } else {
    // Only warn once per session ideally, but for now simple warning
    // console.log(chalk.gray('Using local "dumb" embeddings (no AI provider).'));
  }

  // Fallback: Simple bag-of-words embedding
  // This is a basic implementation - real embeddings would be much better
  return generateLocalEmbedding(text);
}

/**
 * Simple local embedding using TF-IDF-like approach
 * This is a fallback when no API is available
 */
function generateLocalEmbedding(text, dimensions = 384) {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  // Create a simple hash-based embedding
  const embedding = new Array(dimensions).fill(0);

  for (const word of words) {
    // Hash the word to get consistent positions
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }

    // Use hash to update multiple positions
    for (let i = 0; i < 3; i++) {
      const pos = Math.abs((hash + i * 127) % dimensions);
      embedding[pos] += 1;
    }
  }

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

// ============================================================================
// INDEXING
// ============================================================================

/**
 * Index the codebase
 */
export async function indexCodebase(workdir = process.cwd(), options = {}) {
  const { force = false, verbose = false, provider = null } = options;
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
    console.log(chalk.gray(`Found ${uniqueFiles.length} files to index`));
  }

  // Get Provider
  const activeProvider = provider || getProvider();
  if (!activeProvider) {
    console.log(chalk.yellow('\n⚠️  No AI provider configured. Using "dumb" local embeddings (bag-of-words).'));
    console.log(chalk.gray('   For smart search, set OPENAI_API_KEY or use Ollama.\n'));
  } else {
    if (verbose) console.log(chalk.green(`Using ${activeProvider.getName()} for embeddings.`));
  }

  // Index each file
  let chunkCount = 0;
  for (const file of uniqueFiles) {
    try {
      const filepath = path.join(workdir, file);
      const content = await fs.readFile(filepath, 'utf8');

      // Skip very large files
      if (content.length > 100000) {
        if (verbose) console.log(chalk.gray(`Skipping large file: ${file}`));
        continue;
      }

      // Chunk the content
      const chunks = chunkText(content, file);

      // Generate embeddings for each chunk
      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.content, activeProvider);

        vectorStore.addDocument({
          id: `${file}:${chunk.chunk}`,
          path: chunk.path,
          content: chunk.content,
          embedding,
          chunk: chunk.chunk,
          total: chunk.total,
        });

        chunkCount++;
      }
    } catch (err) {
      if (verbose) {
        console.log(chalk.yellow(`Failed to index ${file}: ${err.message}`));
      }
    }
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
  if (vectorStore.documents.length === 0) {
    const loaded = await vectorStore.load(indexPath);
    if (!loaded) {
      throw new Error('No index found. Run `ultra-dex search --index` first.');
    }
  }

  // Get Provider
  const provider = getProvider();

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query, provider);

  // Search
  const results = vectorStore.search(queryEmbedding, topK);

  return results.map(r => ({
    path: r.path,
    chunk: r.chunk,
    score: r.score,
    preview: r.content.slice(0, 200) + (r.content.length > 200 ? '...' : ''),
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
    .option('-k, --top <n>', 'Number of results', '10')
    .option('-v, --verbose', 'Show detailed output')
    .option('--stats', 'Show index statistics')
    .action(async (query, options) => {
      console.log(chalk.cyan('\n🔍 Ultra-Dex Search\n'));

      if (options.symbol) {
          const spinner = ora('Scanning code graph...').start();
          try {
              await projectGraph.scan();
              const results = projectGraph.findSymbol(query);
              spinner.succeed(`Graph scan complete. Found ${results.length} symbol matches.`);
              
              if (results.length === 0) {
                  console.log(chalk.yellow(`No symbols found matching "${query}"`));
                  return;
              }
              
              console.log(chalk.bold('\nDefinitions found:'));
              results.forEach(r => {
                  console.log(`  ${chalk.green(r.symbol)} in ${chalk.gray(r.file)}`);
              });
              return;
          } catch (e) {
              spinner.fail(`Symbol search failed: ${e.message}`);
              return;
          }
      }

      const workdir = process.cwd();
      const indexPath = path.join(workdir, EMBEDDINGS_CONFIG.indexPath);

      if (options.stats) {
        // Show index stats
        const loaded = await vectorStore.load(indexPath);
        if (!loaded) {
          console.log(chalk.yellow('No index found.'));
          return;
        }

        console.log(chalk.bold('Index Statistics:'));
        console.log(`  Created: ${vectorStore.metadata.createdAt}`);
        console.log(`  Updated: ${vectorStore.metadata.updatedAt}`);
        console.log(`  Files: ${vectorStore.metadata.fileCount}`);
        console.log(`  Chunks: ${vectorStore.metadata.chunkCount}`);
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
          console.log(chalk.gray('\nIndex ready. Use `ultra-dex search "your query"` to search.'));
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
          console.log(chalk.yellow('No matches found. Try different keywords or rebuild the index.'));
          return;
        }

        // Display results
        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          const scoreColor = r.score > 0.7 ? chalk.green : r.score > 0.4 ? chalk.yellow : chalk.gray;

          console.log(chalk.bold(`${i + 1}. ${r.path}`) + chalk.gray(` (chunk ${r.chunk})`));
          console.log(`   Score: ${scoreColor(r.score.toFixed(3))}`);
          console.log(chalk.gray(`   ${r.preview.replace(/\n/g, ' ')}`));
          console.log();
        }

        // Hint
        console.log(chalk.gray('Tip: Use --index --force to rebuild embeddings if results seem stale.'));

      } catch (err) {
        spinner.fail(`Search failed: ${err.message}`);
      }
    });
}

export default {
  registerSearchCommand,
  indexCodebase,
  searchCodebase,
  vectorStore,
};