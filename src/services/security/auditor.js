// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const DEFAULT_GLOBS = [
  '**/*.js',
  '**/*.ts',
  '**/*.tsx',
  '**/*.jsx',
  '**/*.py',
  '**/*.rb',
  '**/*.go',
  '**/*.java',
];

const IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.ultra-dex/**',
  '**/.ultra/**',
  '**/dist/**',
  '**/build/**',
];

const RULES = [
  { regex: /eval\(/, severity: 'warning', message: 'Use of eval detected' },
  {
    regex: /child_process\.exec\(/,
    severity: 'warning',
    message: 'Shell execution via child_process.exec',
  },
  { regex: /innerHTML\s*=/, severity: 'info', message: 'Direct innerHTML assignment' },
  {
    regex: /dangerouslySetInnerHTML/,
    severity: 'info',
    message: 'React dangerouslySetInnerHTML usage',
  },
  { regex: /SELECT \* FROM/i, severity: 'info', message: 'Wildcard SQL query' },
  {
    regex: /(api[_-]?key|secret|token)\s*[:=]/i,
    severity: 'warning',
    message: 'Possible hardcoded secret',
  },
];

export async function scanProject(root = process.cwd()) {
  const files = await glob(DEFAULT_GLOBS, { cwd: root, ignore: IGNORE, nodir: true });
  const findings = [];

  for (const file of files) {
    const fullPath = path.join(root, file);
    let content = '';
    try {
      content = await fs.readFile(fullPath, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    lines.forEach((line, index) => {
      RULES.forEach((rule) => {
        if (rule.regex.test(line)) {
          findings.push({
            severity: rule.severity,
            message: rule.message,
            file,
            line: index + 1,
            snippet: line.trim().slice(0, 160),
          });
        }
      });
    });
  }

  return findings;
}
