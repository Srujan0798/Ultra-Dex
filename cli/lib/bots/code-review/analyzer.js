import fs from 'fs/promises';

export function analyzeDiff(diffText = '') {
  const issues = [];
  const lines = diffText.split('\n');

  lines.forEach((line, index) => {
    if (!line.startsWith('+') || line.startsWith('+++')) return;
    if (line.includes('TODO')) {
      issues.push({ severity: 'warning', message: 'TODO found', line: index + 1 });
    }
    if (line.includes('console.log')) {
      issues.push({ severity: 'warning', message: 'console.log found', line: index + 1 });
    }
    if (line.match(/password\s*=\s*['"][^'"]+['"]/i)) {
      issues.push({ severity: 'critical', message: 'Hardcoded password', line: index + 1 });
    }
  });

  return issues;
}

export async function analyzeFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return analyzeDiff(content);
}

export function buildSummary(issues = []) {
  const critical = issues.filter(i => i.severity === 'critical');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');
  return { critical: critical.length, warnings: warnings.length, infos: infos.length };
}

export function formatMarkdownReport(issues = []) {
  const summary = buildSummary(issues);
  const lines = [
    '## 🤖 Ultra-Dex Code Review',
    '',
    `### Summary`,
    `- Critical: ${summary.critical}`,
    `- Warnings: ${summary.warnings}`,
    `- Info: ${summary.infos}`,
    ''
  ];

  if (!issues.length) {
    lines.push('✅ No issues found.');
    return lines.join('\n');
  }

  issues.forEach((issue) => {
    lines.push(`- **${issue.severity.toUpperCase()}**: ${issue.message} (line ${issue.line || 'n/a'})`);
  });

  return lines.join('\n');
}

