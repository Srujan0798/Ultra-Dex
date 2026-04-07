#!/usr/bin/env node
/**
 * Add DI Decorators Tool
 * Adds @singleton/@inject to existing TypeScript files
 * 
 * Usage: node scripts/add-di-decorators.js <files...>
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const args = process.argv.slice(2);
const patterns = args.length > 0 ? args : ['src/core/**/*.ts'];

console.log(`\n🔄 Adding DI Decorators to: ${patterns.join(', ')}`);
console.log('=' .repeat(60));

// Find all matching files
const files = [];
for (const pattern of patterns) {
  const matches = await glob(pattern);
  files.push(...matches);
}

console.log(`Found ${files.length} TypeScript files\n`);

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let modified = false;

  // Check if already has decorators
  if (content.includes('@singleton') || content.includes('@inject')) {
    console.log(`⏭️  Skipping (already has DI): ${file}`);
    continue;
  }

  // Add tsyringe import if not present
  if (!content.includes('tsyringe')) {
    const importLine = `import { singleton, inject } from 'tsyringe';\nimport { DI_TOKENS } from './di/tokens.js';\n\n`;
    content = importLine + content;
    modified = true;
  }

  // Add @singleton to exported classes
  if (content.includes('export class')) {
    content = content.replace(
      /export\s+class\s+(\w+)(?:\s+extends\s+\w+)?/g,
      '@singleton()\nexport class $1$2'
    );
    modified = true;
  }

  if (modified) {
    writeFileSync(file, content);
    console.log(`✅ Added DI to: ${file}`);
  }
}

console.log('\n✅ DI decoration complete\n');
