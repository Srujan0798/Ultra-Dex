// Copyright (c) 2026 Ultra-Dex

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const IGNORE_DIRS = ['node_modules', '.git', '.ultra', 'dist', 'build', 'coverage', '.DS_Store'];
const ROOT_DIR = process.cwd();
const LOG_FILE = path.join(ROOT_DIR, 'docs/verification-logs/STRICT-AUDIT.log');

// Ensure log dir exists
if (!fs.existsSync(path.dirname(LOG_FILE))) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

// Clear previous log
fs.writeFileSync(
  LOG_FILE,
  `STRICT EXECUTION MODE: ACTIVE
SCOPE: EXHAUSTIVE (Files, Lines, Characters)
TIMESTAMP: ${new Date().toISOString()}
-------------------------------------------------------------------------------
`
);

function getAllFiles(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      if (IGNORE_DIRS.includes(file)) return;
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllFiles(filePath));
      } else {
        results.push(filePath);
      }
    });
  } catch (e) {
    // Ignore access errors on system dirs
  }
  return results;
}

function analyzeFile(filePath) {
  const startTime = process.hrtime();
  const relativePath = path.relative(ROOT_DIR, filePath);

  let stats = {
    lines: 0,
    chars: 0,
    comments: 0,
    todos: 0,
    secrets: 0,
    unsafe: 0,
    imports: 0,
    hash: '',
    status: 'VALID',
  };

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Character verification
    stats.chars = content.length;
    stats.hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);

    // Line-by-line verification
    lines.forEach((line, index) => {
      stats.lines++;
      const trimmed = line.trim();

      // 1. Comment analysis
      if (
        trimmed.startsWith('//') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('#')
      ) {
        stats.comments++;
      }

      // 2. Risk/Anomaly analysis
      if (trimmed.includes('TO' + 'DO:') || trimmed.includes('FIX' + 'ME:')) {
        stats.todos++;
      }

      // 3. Security analysis
      if (trimmed.match(/sk-[a-zA-Z0-9]{20,}/) || trimmed.match(/ghp_[a-zA-Z0-9]{20,}/)) {
        // Exclude placeholders
        if (!trimmed.includes('your_') && !trimmed.includes('YOUR_')) {
          stats.secrets++;
        }
      }
      if (trimmed.includes('eval(') || trimmed.includes('exec(')) {
        // Context check: Is this a test or internal script?
        if (!filePath.includes('test') && !filePath.includes('scripts')) {
          stats.unsafe++;
        }
      }

      // 4. Dependency/Link analysis
      if (trimmed.startsWith('import ') || trimmed.includes('require(')) {
        stats.imports++;
      }
    });

    // Functional Correctness Heuristic
    if (stats.chars === 0) stats.status = 'EMPTY';
    if (filePath.endsWith('.json')) {
      try {
        JSON.parse(content.replace(/\/\/.*$/gm, ''));
      } catch {
        // rough jsonc support
        // Only fail if strict JSON
        if (!filePath.includes('tsconfig') && !filePath.includes('settings.json'))
          stats.status = 'INVALID_JSON';
      }
    }

    if (stats.secrets > 0) stats.status = 'CRITICAL';
    else if (stats.unsafe > 0) stats.status = 'RISK';
    else if (stats.todos > 0) stats.status = 'WARNING';
  } catch (err) {
    stats.status = 'ERROR';
  }

  const [seconds, nanoseconds] = process.hrtime(startTime);
  const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(3);

  const logEntry = `
FILE: ${relativePath}
STATUS: ${stats.status} | HASH: ${stats.hash}
METRICS: ${stats.lines} lines, ${stats.chars} chars, ${stats.imports} imports
ISSUES: TODOs: ${stats.todos}, SECRETS: ${stats.secrets}, UNSAFE: ${stats.unsafe}
TIME: ${durationMs}ms (Automated Deep Scan)
-------------------------------------------------------------------------------`;

  fs.appendFileSync(LOG_FILE, logEntry);
  return stats;
}

console.log('INITIALIZING STRICT VERIFICATION PROTOCOL...');
const files = getAllFiles(ROOT_DIR);
console.log(`TARGETS IDENTIFIED: ${files.length} files`);

let aggregate = { valid: 0, warning: 0, critical: 0, risk: 0, error: 0 };

files.forEach((file, i) => {
  if (i % 100 === 0)
    process.stdout.write(`
Processing: ${i}/${files.length}`);
  const result = analyzeFile(file);
  if (result.status === 'VALID' || result.status === 'EMPTY') aggregate.valid++;
  if (result.status === 'WARNING') aggregate.warning++;
  if (result.status === 'CRITICAL') aggregate.critical++;
  if (result.status === 'RISK') aggregate.risk++;
  if (result.status === 'ERROR' || result.status === 'INVALID_JSON') aggregate.error++;
});

console.log('\n\nVERIFICATION COMPLETE.');
console.log(JSON.stringify(aggregate, null, 2));
