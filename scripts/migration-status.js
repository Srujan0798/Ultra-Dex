#!/usr/bin/env node
/**
 * Migration Status Tracker
 * Shows current migration progress
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║              DIAMOND STATE MIGRATION STATUS                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Count files by type
function countFiles(dir, extension) {
  let count = 0;
  try {
    const items = readdirSync(dir, { recursive: true });
    for (const item of items) {
      const fullPath = join(dir, item);
      try {
        const stat = statSync(fullPath);
        if (stat.isFile() && item.endsWith(extension)) {
          count++;
        }
      } catch {}
    }
  } catch {}
  return count;
}

const tsFiles = countFiles(join(rootDir, 'src/core'), '.ts');
const jsFiles = countFiles(join(rootDir, 'src/core'), '.js');
const totalFiles = tsFiles + jsFiles;
const percentComplete = Math.round((tsFiles / totalFiles) * 100);

console.log('📊 OVERALL PROGRESS');
console.log('────────────────────────────────────────');
console.log(`TypeScript Files: ${tsFiles}`);
console.log(`JavaScript Files: ${jsFiles}`);
console.log(`Total Files:      ${totalFiles}`);
console.log(`Complete:         ${percentComplete}%`);

// Progress bar
const barWidth = 40;
const filled = Math.round((percentComplete / 100) * barWidth);
const empty = barWidth - filled;
const bar = '█'.repeat(filled) + '░'.repeat(empty);
console.log(`\n[${bar}] ${percentComplete}%`);

// By directory
console.log('\n📁 BY DIRECTORY');
console.log('────────────────────────────────────────');

const dirs = [
  'src/core/memory',
  'src/core/orchestration',
  'src/core/ai',
  'src/core/agents',
  'src/core/infrastructure',
  'src/core/routing',
  'src/core/sandbox',
];

for (const dir of dirs) {
  const ts = countFiles(join(rootDir, dir), '.ts');
  const js = countFiles(join(rootDir, dir), '.js');
  const total = ts + js;
  if (total > 0) {
    const pct = Math.round((ts / total) * 100);
    const status = pct === 100 ? '✅' : pct > 50 ? '⏳' : '⏸️';
    console.log(`${status} ${dir.padEnd(35)} ${ts}/${total} (${pct}%)`);
  }
}

// Diamond State status
console.log('\n💎 DIAMOND STATE PILLARS');
console.log('────────────────────────────────────────');
const pillars = [
  ['Foundation (DI)', 'src/core/di/tokens.ts'],
  ['Intelligence', 'src/core/routing/semantic-router.ts'],
  ['Safety', 'src/core/sandbox/isolated-vm-sandbox.ts'],
  ['Autonomy', 'src/core/reliability/site-reliability-agent.ts'],
  ['Observability', 'src/core/telemetry/telemetry-service.ts'],
  ['Scale & UX', 'src/core/mesh/distributed-mesh.ts'],
];

for (const [name, file] of pillars) {
  const exists = statSync(join(rootDir, file), { throwIfNoEntry: false }) !== undefined;
  console.log(`${exists ? '✅' : '❌'} ${name}`);
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  Run: node scripts/migrate-file.js <file.js> to migrate      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');
