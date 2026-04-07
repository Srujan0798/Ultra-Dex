// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex vector-search command
 * Vector search using LangChain community vector stores
 */

import chalk from 'chalk';
import ora from '../utils/ora.js';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { validateSafePath } from '../utils/validation.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { logger } from '../utils/logger.js';

const DEFAULT_INCLUDE = [
  '**/*.js',
  '**/*.ts',
  '**/*.tsx',
  '**/*.jsx',
  '**/*.py',
  '**/*.go',
  '**/*.rs',
  '**/*.rb',
  '**/*.md',
  '**/*.json',
  '**/*.yaml',
  '**/*.yml',
];

const DEFAULT_EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '__pycache__',
  '.venv',
  'vendor',
  '.ultra-dex',
  '.ultra',
];

function chunkText(text, size = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + size);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start < 0) start = 0;
  }
  return chunks;
}

async function collectFiles(rootDir, includePatterns, excludeDirs) {
  const patterns = includePatterns && includePatterns.length ? includePatterns : DEFAULT_INCLUDE;
  const ignore = excludeDirs.map((dir) => `**/${dir}/**`);
  const files = await glob(patterns, {
    cwd: rootDir,
    ignore,
    nodir: true,
  });
  return files.map((file) => path.join(rootDir, file));
}

export function registerVectorSearchCommand(program) {
  program
    .command('vector-search <query>')
    .alias('vsearch')
    .description('Vector search using LangChain memory vector store')
    .option('-d, --dir <dir>', 'Directory to search', '.')
    .option('-i, --include <pattern...>', 'Glob patterns to include')
    .option('-x, --exclude <dir...>', 'Directories to exclude')
    .option('-k, --top <number>', 'Top results to return', '5')
    .option('--chunk-size <number>', 'Chunk size in characters', '1000')
    .option('--chunk-overlap <number>', 'Chunk overlap in characters', '200')
    .action(async (query, options) => {
      try {
        const dirValidation = validateSafePath(options.dir, 'Search directory');
        if (dirValidation !== true) {
          printError(dirValidation);
          return;
        }

        if (!process.env.OPENAI_API_KEY) {
          printWarning('OPENAI_API_KEY not set. Vector search requires OpenAI embeddings.');
          return;
        }

        const rootDir = path.resolve(process.cwd(), options.dir);
        const include =
          options.include && options.include.length > 0 ? options.include : DEFAULT_INCLUDE;
        const exclude =
          options.exclude && options.exclude.length > 0 ? options.exclude : DEFAULT_EXCLUDE_DIRS;

        const spinner = ora('Building vector index...').start();
        const files = await collectFiles(rootDir, include, exclude);
        if (files.length === 0) {
          spinner.fail('No files matched for vector search.');
          return;
        }

        const documents = [];
        const chunkSize = parseInt(options.chunkSize, 10);
        const chunkOverlap = parseInt(options.chunkOverlap, 10);

        for (const filePath of files) {
          const content = await fs.readFile(filePath, 'utf8');
          const chunks = chunkText(content, chunkSize, chunkOverlap);
          chunks.forEach((chunk, index) => {
            documents.push(
              new Document({
                pageContent: chunk,
                metadata: { path: path.relative(process.cwd(), filePath), chunk: index },
              })
            );
          });
        }

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: 'text-embedding-3-small',
        });

        const store = await MemoryVectorStore.fromDocuments(documents, embeddings);
        spinner.succeed(`Indexed ${files.length} files, ${documents.length} chunks.`);

        const topK = parseInt(options.top, 10);
        const results = await store.similaritySearch(query, topK);

        if (results.length === 0) {
          printWarning('No vector matches found.');
          return;
        }

        printInfo(`\n🔍 Vector Search Results for: "${query}"\n`);
        results.forEach((result, idx) => {
          const snippet = result.pageContent.replace(/\s+/g, ' ').slice(0, 200);
          logger.log(chalk.cyan(`${idx + 1}. ${result.metadata?.path || 'unknown'}`));
          logger.log(chalk.gray(`   ${snippet}${result.pageContent.length > 200 ? '...' : ''}`));
          logger.log('');
        });

        printSuccess(`Returned ${results.length} result(s).`);
      } catch (error) {
        printError(`Vector search failed: ${error.message}`);
      }
    });
}

export default { registerVectorSearchCommand };
