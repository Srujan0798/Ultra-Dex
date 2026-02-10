/**
 * @fileoverview Agprompts Audit module
 * @module scripts/agprompts-audit
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PROMPTS_DIR = path.join(ROOT_DIR, 'docs', 'AgPrompts');
const REPORT_DIR = path.join(ROOT_DIR, 'docs', 'completed', 'reports');

const PATH_PREFIXES = [
  'cli',
  'templates',
  'docs',
  'dashboard',
  'vscode-extension',
  'packages',
  'agents',
  'cloud',
  'web',
  'mobile',
  'sdk',
  'scripts',
];

const PATH_REGEX = new RegExp(
  '(?:^|[\\s(\\[\\`\\\'"])((' +
    PATH_PREFIXES.join('|') +
    ')/[^\\s\\]\\)\\`\\\'"]+)',
  'g'
);

async function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const res = path.resolve(dir, entry.name);
      return entry.isDirectory() ? scanDirectory(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

function normalizePath(rawPath) {
  let cleaned = rawPath.trim();
  cleaned = cleaned.replace(/^[`'"]+|[`'"]+$/g, '');
  cleaned = cleaned.replace(/[),.;:]+$/g, '');
  return cleaned;
}

function resolveAlias(cleaned) {
  if (cleaned.startsWith('cli/templates/')) {
    const mapped = cleaned.replace(/^cli\/templates\//, 'templates/');
    if (fs.existsSync(path.join(ROOT_DIR, mapped))) return mapped;
  }
  return cleaned;
}

async function analyzePrompt(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const matches = [];
  let match;
  while ((match = PATH_REGEX.exec(content)) !== null) {
    const raw = match[1] || match[0];
    if (raw) {
      const normalized = normalizePath(raw);
      if (normalized.includes('*')) continue;
      if (normalized.includes('...')) continue;
      matches.push(resolveAlias(normalized));
    }
  }
  const unique = Array.from(new Set(matches));
  const missing = unique.filter((p) => !fs.existsSync(path.join(ROOT_DIR, p)));
  return { filePath, references: unique, missing };
}

async function generateReport() {
  const promptFiles = (await scanDirectory(PROMPTS_DIR)).filter((f) => f.endsWith('.md'));
  const analyses = [];
  for (const file of promptFiles) {
    analyses.push(await analyzePrompt(file));
  }

  const totalRefs = analyses.reduce((sum, entry) => sum + entry.references.length, 0);
  const totalMissing = analyses.reduce((sum, entry) => sum + entry.missing.length, 0);

  let report = `# 📋 AgPrompts Audit Report\n\n`;
  report += `> **Generated:** ${new Date().toISOString()}\n`;
  report += `> **Prompts Scanned:** ${promptFiles.length}\n`;
  report += `> **References Found:** ${totalRefs}\n`;
  report += `> **Missing References:** ${totalMissing}\n\n`;

  for (const entry of analyses) {
    if (!entry.references.length) continue;
    const relativePath = path.relative(ROOT_DIR, entry.filePath);
    report += `## ${relativePath}\n\n`;
    report += `- References: ${entry.references.length}\n`;
    report += `- Missing: ${entry.missing.length}\n`;
    if (entry.missing.length) {
      report += `\nMissing paths:\n`;
      entry.missing.forEach((missingPath) => {
        report += `- \`${missingPath}\`\n`;
      });
    }
    report += `\n`;
  }

  if (!fs.existsSync(REPORT_DIR)) {
    await fs.promises.mkdir(REPORT_DIR, { recursive: true });
  }

  const reportPath = path.join(REPORT_DIR, 'AGPROMPTS-AUDIT.md');
  await fs.promises.writeFile(reportPath, report);

  console.log(`✅ AgPrompts audit report generated at: ${reportPath}`);
}

generateReport().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
