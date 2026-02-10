/**
 * @fileoverview Add License Headers module
 * @module scripts/add-license-headers
 */

import fs from 'fs/promises';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const TARGET_DIR = path.join(ROOT, 'cli', 'lib');
const HEADER = '// Copyright (c) 2026 Ultra-Dex';

const EXCLUDE_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', '.git']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

function addHeader(content) {
  if (content.includes(HEADER)) return content;
  if (content.startsWith('#!')) {
    const [shebang, ...rest] = content.split('\n');
    return [shebang, HEADER, '', ...rest].join('\n');
  }
  return `${HEADER}\n\n${content}`;
}

async function run() {
  const files = await walk(TARGET_DIR);
  let updated = 0;

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const next = addHeader(content);
    if (next !== content) {
      await fs.writeFile(file, next, 'utf8');
      updated += 1;
    }
  }

  console.log(`✅ License headers added to ${updated} files.`);
}

run().catch((error) => {
  console.error('Failed to add headers:', error);
  process.exit(1);
});
