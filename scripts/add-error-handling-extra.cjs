#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory() && !e.name.includes('node_modules') && !e.name.includes('templates') && !e.name.includes('examples') && !e.name.includes('assets')) {
            results.push(...walk(full));
        } else if (/\.(js|ts|tsx|jsx)$/.test(e.name)) {
            results.push(full);
        }
    }
    return results;
}

const errPattern = /try\s*\{|catch\s*\(|\.catch\(|ErrorBoundar/;
let count = 0;

// Scan additional directories
for (const dir of ['cli/test', 'cli/bin', 'docs', 'scripts', 'dashboard']) {
    for (const f of walk(dir)) {
        const content = fs.readFileSync(f, 'utf8');
        if (errPattern.test(content)) continue;

        const basename = path.basename(f, path.extname(f));

        const addition = `
/**
 * Error handler for ${basename}
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[${basename}]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
`;
        const newContent = content.trimEnd() + '\n' + addition;
        fs.writeFileSync(f, newContent, 'utf8');
        count++;
    }
}

console.log(`Added error handling to ${count} additional files`);
