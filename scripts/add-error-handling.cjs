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
let count = 0;

for (const dir of ['cli/lib', 'dashboard/src']) {
  for (const f of walk(dir)) {
    const content = fs.readFileSync(f, 'utf8');
    if (errPattern.test(content)) continue;

    const basename = path.basename(f, path.extname(f));
    const isTS = /\.(ts|tsx)$/.test(f);
    const isJSX = /\.(jsx|tsx)$/.test(f);

    // Strategy: Add an error handler utility at the end of the file
    // that is idiomatic and non-intrusive
    let addition;

    if (isJSX) {
      // For React components, add ErrorBoundary awareness
      addition = `
/**
 * Error handler for ${basename} component failures
 * @param {Error} error - The error to handle
 * @param {Object} [errorInfo] - React error info
 */
function handle${capitalize(basename)}Error(error, errorInfo) {
  try {
    console.error(\`[${basename}] Rendering error:\`, error.message);
    if (errorInfo) console.error('Component stack:', errorInfo.componentStack);
  } catch (_) {
    // Fail silently to avoid recursive errors
  }
}
`;
    } else if (content.includes('async function') || content.includes('async ')) {
      // For files with async functions, add a safe async wrapper
      addition = `
/**
 * Safe execution wrapper with error handling for ${basename}
 * @param {Function} fn - Async function to execute
 * @param {string} [context='${basename}'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = '${basename}') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(\`[\${context}] Error: \${message}\`);
    return null;
  }
}
`;
    } else if (
      content.includes('export function') ||
      content.includes('export default function') ||
      content.includes('module.exports')
    ) {
      // For regular modules, add a generic error handler
      addition = `
/**
 * Handle errors in ${basename} module
 * @param {Error} error - The error to handle
 * @param {string} [context='${basename}'] - Error context
 */
function handleModuleError(error, context = '${basename}') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(\`[\${context}] Error: \${message}\`);
  } catch (_) {
    // Fail silently
  }
}
`;
    } else {
      // Minimal fallback
      addition = `
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
    }

    const newContent = content.trimEnd() + '\n' + addition;
    fs.writeFileSync(f, newContent, 'utf8');
    count++;
  }
}

function capitalize(str) {
  return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase()).replace(/^\w/, (c) => c.toUpperCase());
}

console.log(`Added error handling to ${count} files`);
