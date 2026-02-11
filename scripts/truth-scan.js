// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Truth Scan module
 * @module scripts/truth-scan
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT_DIR, 'docs', 'completed', 'reports');

// Commands to check (from Inventory)
const EXPECTED_COMMANDS = [
  'init',
  'generate',
  'build',
  'serve',
  'swarm',
  'check',
  'verify',
  'agents',
  'status',
  'config',
  'plugin',
  'scaffold',
  'doctor',
  'monitor',
  'audit',
  'telemetry',
  'upgrade',
  'clean',
  'watch',
  'benchmark',
  'test',
];

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

async function analyzeFile(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  const size = lines.length;
  const hasHelp = content.includes('--help') || content.includes('.help(');
  const hasCommand =
    content.includes('.command(') ||
    content.includes('program.command(') ||
    content.includes('.action(');
  const reexportsRegister =
    /register[A-Za-z0-9]+Command/.test(content) && /from\s+['"].+['"]/.test(content);
  const isStub = size < 50 && !hasCommand && !reexportsRegister;

  return {
    name: path.basename(filePath, '.js'),
    path: path.relative(ROOT_DIR, filePath),
    size,
    hasHelp,
    status: isStub ? 'STUB' : 'REAL',
  };
}

async function generateReport() {
  console.log('🔍 Starting Truth Scan...');

  // 1. Scan Commands
  const commandsDir = path.join(ROOT_DIR, 'cli', 'lib', 'commands');
  const commandFiles = await scanDirectory(commandsDir);
  const commandAnalysis = [];

  for (const file of commandFiles) {
    if (file.endsWith('.js')) {
      commandAnalysis.push(await analyzeFile(file));
    }
  }

  // 2. Scan Agents
  const agentsDir = path.join(ROOT_DIR, 'agents');
  const agentFiles = await scanDirectory(agentsDir);
  const agentCount = agentFiles.filter((f) => f.endsWith('.md')).length;

  // 3. Scan Templates
  const templatesDir = path.join(ROOT_DIR, 'templates');
  const templateFiles = await scanDirectory(templatesDir);
  const templateCount = templateFiles.filter((f) => f.endsWith('package.json')).length;

  // Generate Markdown
  let report = `# 🔍 ULTRA-DEX REALITY REPORT\n\n`;
  report += `> **Generated:** ${new Date().toISOString()}\n`;
  report += `> **Scope:** CLI Commands, Agents, Templates\n\n`;

  report += `## 1. Command Inventory Audit\n\n`;
  report += `| Command | Status | Lines | Has Docs? | Path |\n`;
  report += `|---------|--------|-------|-----------|------|\n`;

  const realCommands = commandAnalysis.filter((c) => c.status === 'REAL');
  const stubCommands = commandAnalysis.filter((c) => c.status === 'STUB');

  for (const cmd of commandAnalysis.sort((a, b) => b.size - a.size)) {
    const statusIcon = cmd.status === 'REAL' ? '✅' : '⚠️';
    const docsIcon = cmd.hasHelp ? 'Yes' : 'No';
    report += `| **${cmd.name}** | ${statusIcon} ${cmd.status} | ${cmd.size} | ${docsIcon} | \`${cmd.path}\` |\n`;
  }

  report += `\n### Summary\n`;
  report += `- **Total Production Commands:** ${realCommands.length}\n`;
  report += `- **Total Stubs/Betas:** ${stubCommands.length}\n`;
  report += `- **Missing from Inventory:** ${EXPECTED_COMMANDS.filter((c) => !commandAnalysis.find((a) => a.name === c)).join(', ') || 'None'}\n\n`;

  report += `## 2. Agent Ecosystem\n\n`;
  report += `- **Total Specialized Agents:** ${agentCount}\n`;
  report += `- **Location:** \`agents/\`\n\n`;

  report += `## 3. Template Library\n\n`;
  report += `- **Total Live Templates:** ${templateCount}\n`;
  report += `- **Location:** \`templates/\`\n\n`;

  report += `## 4. Verdict\n\n`;
  if (realCommands.length > 15) {
    report += `**✅ V3.0 READY**\nThe CLI core is solid. Most critical commands are implemented. Focus on converting remaining stubs.\n`;
  } else {
    report += `**⚠️ CRITICAL GAPS**\nToo many stubs. Phase 15 (Repairs) must be prioritized.\n`;
  }

  // Write Report
  if (!fs.existsSync(REPORT_DIR)) {
    await fs.promises.mkdir(REPORT_DIR, { recursive: true });
  }

  const truthReportPath = path.join(REPORT_DIR, 'TRUTH-REPORT.md');
  const realityReportPath = path.join(REPORT_DIR, 'REALITY-REPORT.md');
  await fs.promises.writeFile(truthReportPath, report);
  await fs.promises.writeFile(realityReportPath, report);

  console.log(`✅ Reality Report generated at: ${realityReportPath}`);
  console.log(`✅ Truth Report generated at: ${truthReportPath}`);
}

generateReport().catch(console.error);
