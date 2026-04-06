#!/usr/bin/env node
/**
 * Simple V8 Coverage Report Generator
 * Generates a text coverage report from NODE_V8_COVERAGE output
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const coverageDir = process.argv[2] || 'coverage/tmp';

// Read all coverage files
const files = readdirSync(coverageDir).filter(f => f.endsWith('.json'));

const fileCoverage = new Map();

for (const file of files) {
  let data;
  try {
    data = JSON.parse(readFileSync(join(coverageDir, file), 'utf8'));
  } catch (e) {
    continue;
  }
  
  for (const result of data.result || []) {
    const url = result.url;
    if (!url || !url.startsWith('file://')) continue;
    
    const path = url.replace('file://', '');
    // Only track project files
    if (!path.includes('/src/') && !path.includes('/apps/') && !path.includes('/packages/')) continue;
    
    if (!fileCoverage.has(path)) {
      fileCoverage.set(path, { ranges: [], source: null });
    }
    
    const cov = fileCoverage.get(path);
    
    // Collect all ranges
    for (const fn of result.functions || []) {
      for (const range of fn.ranges || []) {
        cov.ranges.push(range);
      }
    }
  }
}

// Process each file to calculate line coverage
const fileStats = [];

for (const [path, cov] of fileCoverage) {
  let source;
  try {
    source = readFileSync(path, 'utf8');
  } catch (e) {
    continue;
  }
  
  // Build line offset map
  const lineOffsets = [0];
  let offset = 0;
  for (const char of source) {
    offset++;
    if (char === '\n') {
      lineOffsets.push(offset);
    }
  }
  
  const totalLines = lineOffsets.length;
  const coveredLines = new Set();
  
  // Convert byte ranges to line numbers
  for (const range of cov.ranges) {
    if (range.count === 0) continue; // Not covered
    
    const startLine = lineOffsets.findIndex(o => o > range.startOffset);
    const endLine = lineOffsets.findIndex(o => o >= range.endOffset);
    
    const start = startLine === -1 ? lineOffsets.length : startLine;
    const end = endLine === -1 ? lineOffsets.length : endLine;
    
    for (let i = start; i <= end && i <= totalLines; i++) {
      coveredLines.add(i);
    }
  }
  
  // Skip files with no executable lines (like type definition files)
  const hasExecutableCode = cov.ranges.length > 0;
  
  fileStats.push({
    path,
    totalLines,
    coveredLines: coveredLines.size,
    executableLines: hasExecutableCode ? Math.max(coveredLines.size, 1) : 0,
    ranges: cov.ranges.length
  });
}

// Group by module
const moduleStats = new Map();

for (const stat of fileStats) {
  const path = stat.path;
  
  // Determine module
  let module = 'other';
  if (path.includes('/src/core/')) module = 'src/core';
  else if (path.includes('/src/services/')) module = 'src/services';
  else if (path.includes('/apps/cli/')) module = 'apps/cli';
  else if (path.includes('/apps/dashboard/')) module = 'apps/dashboard';
  else if (path.includes('/packages/')) module = 'packages';
  else if (path.includes('/src/')) module = 'src/other';
  
  if (!moduleStats.has(module)) {
    moduleStats.set(module, { files: 0, lines: 0, covered: 0 });
  }
  
  const stats = moduleStats.get(module);
  stats.files++;
  stats.lines += stat.totalLines;
  stats.covered += stat.coveredLines;
}

// Print report
console.log('=============================== Coverage summary ===============================');
console.log('Module                  | Files |     Lines | Covered |     %   ');
console.log('------------------------+-------+-----------+---------+---------');

let totalFiles = 0;
let totalLines = 0;
let totalCovered = 0;

for (const [module, stats] of [...moduleStats.entries()].sort()) {
  const pct = stats.lines > 0 ? ((stats.covered / stats.lines) * 100).toFixed(2) : '0.00';
  console.log(
    `${module.padEnd(23)} | ${String(stats.files).padStart(5)} | ${String(stats.lines).padStart(9)} | ${String(stats.covered).padStart(7)} | ${pct.padStart(6)}%`
  );
  totalFiles += stats.files;
  totalLines += stats.lines;
  totalCovered += stats.covered;
}

console.log('------------------------+-------+-----------+---------+---------');
const totalPct = totalLines > 0 ? ((totalCovered / totalLines) * 100).toFixed(2) : '0.00';
console.log(
  `${'Total'.padEnd(23)} | ${String(totalFiles).padStart(5)} | ${String(totalLines).padStart(9)} | ${String(totalCovered).padStart(7)} | ${totalPct.padStart(6)}%`
);
console.log('================================================================================');

// Output JSON for further processing
const summary = {
  generatedAt: new Date().toISOString(),
  total: {
    files: totalFiles,
    lines: totalLines,
    covered: totalCovered,
    percentage: parseFloat(totalPct)
  },
  modules: Object.fromEntries([...moduleStats.entries()].sort().map(([m, s]) => [m, {
    files: s.files,
    lines: s.lines,
    covered: s.covered,
    percentage: s.lines > 0 ? parseFloat(((s.covered / s.lines) * 100).toFixed(2)) : 0
  }]))
};

// Save JSON report
import { writeFileSync, mkdirSync } from 'fs';
mkdirSync('coverage', { recursive: true });
writeFileSync('coverage/coverage-summary.json', JSON.stringify(summary, null, 2));

console.log('\nJSON Summary:');
console.log(JSON.stringify(summary, null, 2));
