// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const DANGEROUS_PATTERNS = [
  /child_process\./g,
  /exec\(/g,
  /spawn\(/g,
  /rm\s+-rf/g,
  /process\.env/g,
  /fs\.writeFile\(/g,
  /net\.connect\(/g,
];

export async function scanPlugin(pluginPath) {
  const findings = [];
  const manifestPath = path.join(pluginPath, 'capability_manifest.json');
  try {
    await fs.access(manifestPath);
  } catch {
    findings.push({
      file: 'capability_manifest.json',
      pattern: 'Missing capability manifest (required for v4.1)',
    });
  }

  const files = await glob('**/*.{js,ts,mjs,cjs}', {
    cwd: pluginPath,
    nodir: true,
    ignore: ['**/node_modules/**'],
  });

  for (const file of files) {
    const fullPath = path.join(pluginPath, file);
    const content = await fs.readFile(fullPath, 'utf8');
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        findings.push({ file, pattern: pattern.toString() });
      }
    }
  }
  return findings;
}
