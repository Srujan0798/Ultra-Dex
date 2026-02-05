/**
 * Quality Gate Runner
 */

import fs from 'fs/promises';
import path from 'path';
import { loadQualityRules } from './rules.js';
import { runAllGates } from '../gates/index.js';

async function checkP0Completeness(projectDir) {
  const planPath = path.join(projectDir, 'IMPLEMENTATION-PLAN.md');
  try {
    const content = await fs.readFile(planPath, 'utf8');
    const sections = new Map();
    const lines = content.split('\n');
    let current = null;
    for (const line of lines) {
      const match = line.match(/^##\s+(?:SECTION\s+)?(\d+)[:.]?\s*(.*)/i);
      if (match) {
        current = parseInt(match[1], 10);
        sections.set(current, []);
        continue;
      }
      if (current) sections.get(current).push(line);
    }
    const p0 = Array.from({ length: 12 }, (_, i) => i + 1);
    let filled = 0;
    p0.forEach((num) => {
      const contentLines = sections.get(num) || [];
      if (contentLines.join('\n').trim().length > 50) filled += 1;
    });
    const percentage = Math.round((filled / p0.length) * 100);
    return { status: percentage, details: { filled, total: p0.length } };
  } catch {
    return { status: 0, details: { error: 'IMPLEMENTATION-PLAN.md not found' } };
  }
}

async function checkAlignment(projectDir) {
  const coreFiles = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'README.md', 'CHECKLIST.md'];
  let exists = 0;
  for (const file of coreFiles) {
    try {
      await fs.access(path.join(projectDir, file));
      exists += 1;
    } catch {
      // missing
    }
  }
  const score = Math.round((exists / coreFiles.length) * 100);
  return { status: score, details: { filesPresent: exists, total: coreFiles.length } };
}

async function checkCoverage(projectDir) {
  const coveragePath = path.join(projectDir, 'coverage', 'coverage-summary.json');
  try {
    const content = await fs.readFile(coveragePath, 'utf8');
    const summary = JSON.parse(content);
    const pct = summary.total?.lines?.pct ?? summary.total?.statements?.pct ?? 0;
    return { status: pct, details: summary.total || {} };
  } catch {
    return { status: null, details: { warning: 'coverage-summary.json not found' } };
  }
}

async function checkLint(projectDir) {
  const lintPath = path.join(projectDir, 'lint-report.json');
  try {
    const content = await fs.readFile(lintPath, 'utf8');
    const report = JSON.parse(content);
    const errorCount = report.errorCount ?? 0;
    return { status: errorCount, details: { errorCount } };
  } catch {
    return { status: 0, details: { warning: 'lint-report.json not found' } };
  }
}

async function checkSecurity(projectDir) {
  const auditPath = path.join(projectDir, 'audit-report.json');
  try {
    const content = await fs.readFile(auditPath, 'utf8');
    const report = JSON.parse(content);
    const critical = report.metadata?.vulnerabilities?.critical ?? 0;
    return { status: critical, details: report.metadata?.vulnerabilities || {} };
  } catch {
    return { status: 0, details: { warning: 'audit-report.json not found' } };
  }
}

export async function runQualityGates(projectDir = process.cwd()) {
  const rules = await loadQualityRules(projectDir);
  const results = [];

  const p0 = await checkP0Completeness(projectDir);
  results.push({ id: 'p0-complete', value: p0.status, details: p0.details, rule: rules.gates['p0-complete'] });

  const alignment = await checkAlignment(projectDir);
  results.push({ id: 'alignment', value: alignment.status, details: alignment.details, rule: rules.gates.alignment });

  const coverage = await checkCoverage(projectDir);
  results.push({ id: 'test-coverage', value: coverage.status, details: coverage.details, rule: rules.gates['test-coverage'] });

  const lint = await checkLint(projectDir);
  results.push({ id: 'lint-clean', value: lint.status, details: lint.details, rule: rules.gates['lint-clean'] });

  const security = await checkSecurity(projectDir);
  results.push({ id: 'security-critical', value: security.status, details: security.details, rule: rules.gates['security-critical'] });

  if (rules.gates?.syntax || rules.gates?.linting || rules.gates?.typecheck || rules.gates?.testing || rules.gates?.architecture) {
    const extraResults = await runAllGates(projectDir, rules);
    extraResults.forEach((result) => {
      const rule = rules.gates[result.id] || rules.gates?.architecture || { threshold: 0, severity: 'warning' };
      results.push({ id: result.id, value: result.value, details: result.details, rule });
    });
  }

  return { rules, results };
}

export default {
  runQualityGates
};
