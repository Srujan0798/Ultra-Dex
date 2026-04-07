#!/usr/bin/env node
/**
 * Batch Migration Tool
 * Migrates all .js files in a directory to TypeScript
 * 
 * Usage: node scripts/migrate-batch.js <directory> [--di] [--preserve-api]
 */

import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const args = process.argv.slice(2);
const dirPath = args[0];
const addDI = args.includes('--di');
const preserveAPI = args.includes('--preserve-api');

if (!dirPath) {
  console.error('Usage: node migrate-batch.js <directory> [--di] [--preserve-api]');
  process.exit(1);
}

const fullPath = join(rootDir, dirPath);

console.log(`\n🔄 Batch Migration: ${dirPath}`);
console.log(`Options: ${addDI ? 'DI ' : ''}${preserveAPI ? 'PreserveAPI' : ''}`);
console.log('=' .repeat(60));

// Find all .js files (non-recursive for safety)
const files = readdirSync(fullPath).filter(f => {
  const stat = statSync(join(fullPath, f));
  return stat.isFile() && extname(f) === '.js' && !f.endsWith('.test.js');
});

console.log(`Found ${files.length} JavaScript files\n`);

let success = 0;
let failed = 0;

for (const file of files) {
  const filePath = join(dirPath, file);
  
  try {
    // Call single file migration
    const cmd = `node ${join(__dirname, 'migrate-file.js')} ${filePath}${addDI ? ' --di' : ''}`;
    execSync(cmd, { stdio: 'inherit' });
    success++;
  } catch (error) {
    console.error(`❌ Failed: ${file}`);
    failed++;
  }
}

console.log('=' .repeat(60));
console.log(`\n✅ Successfully migrated: ${success}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${files.length}\n`);
