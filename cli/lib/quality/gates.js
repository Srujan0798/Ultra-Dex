/**
 * Automated quality gates
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { runQualityScan } from './scanner.js';

export async function runPreCommitReview() {
  let diff = '';
  try {
    diff = execSync('git diff --cached', { encoding: 'utf8' });
  } catch {
    return { ok: false, reason: 'Git diff unavailable' };
  }

  const issues = [];
  if (diff.includes('TODO')) issues.push('Remove TODO comments before commit');
  if (diff.includes('console.log')) issues.push('Remove console.log statements');

  return {
    ok: issues.length === 0,
    issues,
    diffSize: diff.length
  };
}

export function generateAutoFixSuggestions(issues = []) {
  if (!issues.length) return [];
  return issues.map(issue => `Suggestion: ${issue}`);
}

export async function runSecurityScan(projectDir = process.cwd()) {
  const scanResults = await runQualityScan(projectDir);
  return {
    ok: !scanResults.details?.some(issue => issue.severity === 'critical'),
    findings: scanResults.details || []
  };
}

export async function runPerformanceProfile(projectDir = process.cwd()) {
  const files = await glob('**/*.{js,ts,tsx}', {
    cwd: projectDir,
    nodir: true,
    ignore: ['**/node_modules/**', '**/.git/**', '**/.ultra-dex/**']
  });

  const heavyFiles = [];
  for (const file of files) {
    const fullPath = path.join(projectDir, file);
    const stats = await fs.stat(fullPath);
    if (stats.size > 200 * 1024) {
      heavyFiles.push({ file, size: stats.size });
    }
  }

  return {
    ok: heavyFiles.length === 0,
    heavyFiles
  };
}

export async function runAccessibilityCheck(projectDir = process.cwd()) {
  const files = await glob('**/*.{jsx,tsx,html}', {
    cwd: projectDir,
    nodir: true,
    ignore: ['**/node_modules/**', '**/.git/**', '**/.ultra-dex/**']
  });

  const issues = [];
  for (const file of files.slice(0, 50)) {
    const content = await fs.readFile(path.join(projectDir, file), 'utf8');
    if (content.includes('<img') && !content.includes('alt=')) {
      issues.push({ file, issue: 'Image tag missing alt attribute' });
    }
    if (content.includes('aria-') === false && content.includes('role="button"')) {
      issues.push({ file, issue: 'Button role missing aria-* attributes' });
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
}

export async function runQualityAutomation(projectDir = process.cwd()) {
  const preCommit = await runPreCommitReview();
  const security = await runSecurityScan(projectDir);
  const performance = await runPerformanceProfile(projectDir);
  const accessibility = await runAccessibilityCheck(projectDir);

  return {
    preCommit,
    security,
    performance,
    accessibility,
    suggestions: generateAutoFixSuggestions(preCommit.issues || [])
  };
}

export default {
  runPreCommitReview,
  generateAutoFixSuggestions,
  runSecurityScan,
  runPerformanceProfile,
  runAccessibilityCheck,
  runQualityAutomation
};
