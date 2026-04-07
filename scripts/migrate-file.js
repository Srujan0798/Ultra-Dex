#!/usr/bin/env node
/**
 * Migration Tool for Labor Agents
 * Migrates a single JavaScript file to TypeScript with DI
 * 
 * Usage: node scripts/migrate-file.js <file.js> [--di] [--strict]
 */

import { readFileSync, writeFileSync, existsSync, renameSync } from 'fs';
import { dirname, basename, extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const args = process.argv.slice(2);
const filePath = args[0];
const addDI = args.includes('--di');
const strict = args.includes('--strict');

if (!filePath) {
  console.error('Usage: node migrate-file.js <file.js> [--di] [--strict]');
  process.exit(1);
}

const fullPath = join(rootDir, filePath);
if (!existsSync(fullPath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

console.log(`\n🔄 Migrating: ${filePath}`);

// Read original file
const content = readFileSync(fullPath, 'utf-8');
const lines = content.split('\n');

// Extract class names, functions, exports
const classMatches = content.match(/export\s+class\s+(\w+)/g) || [];
const functionMatches = content.match(/export\s+(?:async\s+)?function\s+(\w+)/g) || [];
const defaultExportMatch = content.match(/export\s+default\s+(?:class\s+)?(\w+)/);

console.log(`  Found ${classMatches.length} classes, ${functionMatches.length} functions`);

// Transform to TypeScript
let tsContent = content;

// 1. Add .js to relative imports (only if not already present)
tsContent = tsContent.replace(/from\s+['"](\.\/[^'"]+?)(?:\.js)?['"]/g, "from '$1.js'");
tsContent = tsContent.replace(/from\s+['"](\.\.\/[^'"]+?)(?:\.js)?['"]/g, "from '$1.js'");

// 2. Add type imports if DI enabled
if (addDI && classMatches.length > 0) {
  const diImport = `import { singleton, inject } from 'tsyringe';\nimport { DI_TOKENS } from '../di/tokens.js';\n`;
  tsContent = diImport + tsContent;
}

// 3. Add @singleton to exported classes
if (addDI) {
  tsContent = tsContent.replace(
    /export\s+class\s+(\w+)/g,
    '@singleton()\nexport class $1'
  );
}

// 4. Add basic type annotations
if (strict) {
  // Add explicit 'any' return types for functions (to be refined later)
  tsContent = tsContent.replace(
    /export\s+(?:async\s+)?function\s+(\w+)\s*\(/g,
    'export function $1('
  );
}

// 5. Write TypeScript file
const tsPath = fullPath.replace('.js', '.ts');
writeFileSync(tsPath, tsContent);

console.log(`  ✅ Created: ${basename(tsPath)}`);

// 6. Optionally rename original (backup)
// renameSync(fullPath, fullPath + '.backup');
// console.log(`  📦 Backed up original`);

// 7. Update migration status
console.log(`  📝 Update migration status: ${filePath} → COMPLETE`);

console.log(`\n✅ Migration complete for: ${filePath}\n`);
