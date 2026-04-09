#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (
      e.isDirectory() &&
      !e.name.includes('node_modules') &&
      !e.name.includes('templates') &&
      !e.name.includes('examples') &&
      !e.name.includes('assets')
    ) {
      results.push(...walk(full));
    } else if (/\.(js|ts|tsx|jsx)$/.test(e.name)) {
      results.push(full);
    }
  }
  return results;
}

const errPattern = /try\s*\{|catch\s*\(|\.catch\(|ErrorBoundar/;
const missing = [];

for (const dir of ['cli/lib', 'dashboard/src']) {
  for (const f of walk(dir)) {
    const c = fs.readFileSync(f, 'utf8');
    if (!errPattern.test(c)) {
      missing.push(f);
    }
  }
}

console.log(`Files without error handling: ${missing.length}`);
console.log(missing.join('\n'));
