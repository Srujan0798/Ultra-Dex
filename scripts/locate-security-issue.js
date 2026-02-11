// Copyright (c) 2026 Ultra-Dex

#!/usr/bin/env node
// Copyright (c) 2026 Ultra-Dex

/**
 * Security Issue Locator
 * Scans the repo for common security footguns and secret patterns.
 *
 * Usage:
 *   node scripts/locate-security-issue.js
 *   node scripts/locate-security-issue.js --json
 *   node scripts/locate-security-issue.js --path cli
 */

import fs from 'fs/promises';
import path from 'path';

const argv = process.argv.slice(2);
const wantJson = argv.includes('--json');
const pathArgIndex = argv.indexOf('--path');
const rootOverride = pathArgIndex >= 0 ? argv[pathArgIndex + 1] : null;

const repoRoot = process.cwd();
const scanRoot = rootOverride ? path.resolve(repoRoot, rootOverride) : repoRoot;

const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'dashboard/dist',
  '.next',
  '.turbo',
  '.cache',
  '.ultra-dex',
]);

const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico',
  '.pdf', '.zip', '.tar', '.gz', '.tgz', '.7z',
  '.mp4', '.mp3', '.mov', '.avi', '.woff', '.woff2',
]);

const RULES = [
  {
    id: 'hardcoded-secret',
    severity: 'high',
    description: 'Potential hardcoded secret/token',
    pattern: /(api_key|apikey|secret|token|access_key|auth_key)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/gi,
  },
  {
    id: 'private-key',
    severity: 'critical',
    description: 'Private key material found',
    pattern: /BEGIN\s+(RSA|EC|OPENSSH)\s+PRIVATE\s+KEY/gi,
  },
  {
    id: 'eval',
    severity: 'medium',
    description: 'Use of eval()',
    pattern: /\beval\s*\(/g,
  },
  {
    id: 'child-process-exec',
    severity: 'medium',
    description: 'Use of child_process.exec (review input sanitization)',
    pattern: /\bexec\s*\(/g,
  },
  {
    id: 'unsafe-path',
    severity: 'medium',
    description: 'Potential path traversal (.. in path join)',
    pattern: /\.{2}\/|\\\.\./g,
  },
  {
    id: 'sql-string-concat',
    severity: 'high',
    description: 'Possible SQL string concatenation',
    pattern: /(SELECT|INSERT|UPDATE|DELETE)\s+.*\+\s*.+/gi,
  },
];

function isExcludedDir(dirName) {
  if (EXCLUDED_DIRS.has(dirName)) return true;
  for (const blocked of EXCLUDED_DIRS) {
    if (dirName.endsWith(blocked)) return true;
  }
  return false;
}

async function collectFiles(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (isExcludedDir(entry.name) || isExcludedDir(fullPath)) continue;
      await collectFiles(fullPath, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (BINARY_EXTS.has(ext)) continue;
      files.push(fullPath);
    }
  }
  return files;
}

function extractMatches(content, rule) {
  const matches = [];
  let match;
  while ((match = rule.pattern.exec(content)) !== null) {
    matches.push({ index: match.index, match: match[0] });
  }
  return matches;
}

function lineInfo(content, index) {
  const before = content.slice(0, index);
  const line = before.split('\n').length;
  const col = index - before.lastIndexOf('\n');
  return { line, col };
}

async function scanFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const findings = [];

  for (const rule of RULES) {
    const matches = extractMatches(content, rule);
    for (const found of matches) {
      const { line, col } = lineInfo(content, found.index);
      findings.push({
        id: rule.id,
        severity: rule.severity,
        description: rule.description,
        file: path.relative(repoRoot, filePath),
        line,
        col,
        snippet: found.match.slice(0, 120),
      });
    }
  }

  return findings;
}

function summarize(findings) {
  const summary = { total: findings.length, critical: 0, high: 0, medium: 0, low: 0 };
  for (const item of findings) {
    if (summary[item.severity] !== undefined) summary[item.severity] += 1;
  }
  return summary;
}

async function main() {
  const files = await collectFiles(scanRoot);
  const allFindings = [];

  for (const file of files) {
    try {
      const findings = await scanFile(file);
      allFindings.push(...findings);
    } catch (error) {
      // Ignore unreadable files
    }
  }

  const summary = summarize(allFindings);

  if (wantJson) {
    process.stdout.write(JSON.stringify({ summary, findings: allFindings }, null, 2));
    return;
  }

  console.log('\nSecurity Issue Locator Report');
  console.log('Scan root:', scanRoot);
  console.log('Total findings:', summary.total);
  console.log(`Critical: ${summary.critical}  High: ${summary.high}  Medium: ${summary.medium}  Low: ${summary.low}`);

  if (!allFindings.length) {
    console.log('No issues detected.');
    return;
  }

  for (const finding of allFindings) {
    console.log(`\n[${finding.severity.toUpperCase()}] ${finding.id}`);
    console.log(`File: ${finding.file}:${finding.line}:${finding.col}`);
    console.log(`Issue: ${finding.description}`);
    console.log(`Snippet: ${finding.snippet}`);
  }
}

main().catch((err) => {
  console.error('Security scan failed:', err.message);
  process.exit(1);
});
