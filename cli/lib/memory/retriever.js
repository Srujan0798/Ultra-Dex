// Copyright (c) 2026 Ultra-Dex

/**
 * Memory Retriever
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { VectorStore } from './vector-store.js';

const DEFAULT_IGNORE = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'];

export async function indexProject(rootDir = process.cwd()) {
  const store = new VectorStore();
  await store.init();

  const files = await glob('**/*.{md,js,ts,tsx,jsx,json}', {
    cwd: rootDir,
    nodir: true,
    ignore: DEFAULT_IGNORE,
  });

  for (const file of files) {
    const content = await fs.readFile(path.join(rootDir, file), 'utf8');
    const chunks = chunkText(content, 800);
    let chunkIndex = 0;
    for (const chunk of chunks) {
      const id = `${file}#${chunkIndex}`;
      await store.add(id, chunk, { file, chunkIndex });
      chunkIndex += 1;
    }
  }

  await store.close();
  return { indexedFiles: files.length };
}

export async function queryMemory(query, limit = 5) {
  const store = new VectorStore();
  await store.init();
  const results = await store.query(query, limit);
  await store.close();
  return results;
}

function chunkText(text, size = 800) {
  const chunks = [];
  let offset = 0;
  while (offset < text.length) {
    chunks.push(text.slice(offset, offset + size));
    offset += size;
  }
  return chunks;
}

export default {
  indexProject,
  queryMemory,
};
