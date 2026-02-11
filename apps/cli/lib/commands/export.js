// Copyright (c) 2026 Ultra-Dex

// cli/lib/commands/export.js
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import { join, basename, resolve, dirname } from 'path';
import yaml from 'js-yaml';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

const VALID_FORMATS = ['json', 'html', 'markdown', 'md', 'pdf', 'yaml', 'yml', 'notion'];
const P0_SECTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

const BUILTIN_TEMPLATES = {
  executive: `# Executive Summary

- Vision & goals
- KPIs and business impact
- Risks and mitigations
- Delivery timeline`,
  technical: `# Technical Handoff

- Architecture overview
- Data model
- API contracts
- Deployment and ops notes`,
  handoff: `# Developer Handoff

- What was built
- How to run locally
- Known gaps
- Next tasks`,
};

export const EXPORT_EXAMPLES = [
  {
    command: 'ultra-dex export --format json --output export.json',
    description: 'Export context as JSON',
  },
  {
    command: 'ultra-dex export --format html --include-agents',
    description: 'Export as HTML with agent prompts',
  },
  {
    command: 'ultra-dex export --sections 1,2,3 --format markdown',
    description: 'Export only selected sections',
  },
  {
    command: 'ultra-dex export --pdf --output ultra-dex-export.pdf',
    description: 'Export as PDF using Puppeteer',
  },
  {
    command: 'ultra-dex export --format notion --sections 1-5',
    description: 'Export Notion-compatible markdown',
  },
];

export async function exportCommand(options) {
  const format = options.pdf ? 'pdf' : options.format || 'json';
  const normalizedFormat = format === 'markdown' ? 'md' : format;
  const outputExt =
    normalizedFormat === 'md' || normalizedFormat === 'notion' ? 'md' : normalizedFormat;
  const outputPath = options.output || `ultra-dex-export.${outputExt}`;

  // Parse sections - support both comma-separated and range formats (e.g., "1-5" or "1,2,3")
  let sectionFilter = null;
  if (options.sections) {
    sectionFilter = parseSectionRanges(options.sections);
    if (!sectionFilter || sectionFilter.length === 0) {
      printError(
        chalk.red(
          '❌ Error: Invalid --sections list. Use comma-separated numbers or ranges, e.g. 1,2,3 or 1-5.'
        )
      );
      process.exitCode = 1;
      process.exit(process.exitCode);
    }
  } else if (options.p0) {
    sectionFilter = [...P0_SECTIONS];
  }

  let excludeFilter = null;
  if (options.exclude) {
    excludeFilter = parseSectionRanges(options.exclude);
    if (!excludeFilter || excludeFilter.length === 0) {
      printError(
        chalk.red(
          '❌ Error: Invalid --exclude list. Use comma-separated numbers or ranges, e.g. 15,16 or 1-5.'
        )
      );
      process.exitCode = 1;
      process.exit(process.exitCode);
    }
  }

  // Validate format
  if (!VALID_FORMATS.includes(format)) {
    printError(chalk.red(`❌ Error: Unknown format: ${format}`));
    printError(
      chalk.yellow('   Supported formats: json, html, markdown (md), pdf, yaml (yml), notion')
    );
    process.exitCode = 1;
    process.exit(process.exitCode);
  }

  // Validate output path to prevent path traversal
  const resolvedOutput = resolve(outputPath);
  const cwd = process.cwd();
  let isSafeOutput = false;

  try {
    const realCwd = fs.realpathSync(cwd);
    const realOutputDir = fs.realpathSync(dirname(resolvedOutput));
    isSafeOutput = realOutputDir.startsWith(realCwd);
  } catch (error) {
    isSafeOutput = false;
  }

  if (!isSafeOutput) {
    printError(chalk.red('❌ Error: Invalid output path. Path traversal detected.'));
    process.exitCode = 1;
    process.exit(process.exitCode);
  }

  printInfo(chalk.cyan.bold(`\n📦 Ultra-Dex Export\n`));

  const spinner = ora('Collecting project data...').start();

  try {
    const context = loadContext(options.includeAgents);

    // Filter sections if specified
    if ((sectionFilter || excludeFilter) && context.files['IMPLEMENTATION-PLAN.md']) {
      context.files['IMPLEMENTATION-PLAN.md'] = filterSections(
        context.files['IMPLEMENTATION-PLAN.md'],
        sectionFilter,
        excludeFilter
      );
    }

    spinner.succeed(`Collected ${Object.keys(context.files).length} files`);

    // Apply custom template if specified
    if (options.template) {
      context.template = loadTemplate(options.template);
    }

    const includeToc = Boolean(options.toc) || normalizedFormat === 'md';
    const formatSpinner = ora(`Generating ${format.toUpperCase()} output...`).start();

    let output = '';
    let wroteFile = false;
    let resolvedOutputPath = resolvedOutput;
    let actualFormat = normalizedFormat;

    switch (normalizedFormat) {
      case 'json':
        output = generateJSON(context);
        break;
      case 'html':
        output = generateHTML(context, { includeToc });
        break;
      case 'markdown':
      case 'md':
        output = generateMarkdown(context, { includeToc });
        actualFormat = 'md';
        break;
      case 'pdf':
        try {
          const puppeteerModule = await import('puppeteer');
          const puppeteer = puppeteerModule.default || puppeteerModule;
          formatSpinner.text = 'Launching Chromium for PDF generation...';
          const browser = await puppeteer.launch({ headless: 'new' });
          const page = await browser.newPage();

          const html = generateHTML(context, { forPdf: true, includeToc });
          await page.setContent(html, { waitUntil: 'networkidle0' });
          await page.pdf({
            path: resolvedOutputPath,
            format: 'A4',
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
            printBackground: true,
          });

          await browser.close();
          wroteFile = true;
        } catch (error) {
          formatSpinner.warn('PDF generation failed (Puppeteer required)');
          printInfo(chalk.gray('  Falling back to HTML instead.'));
          actualFormat = 'html';
          const fallbackPath = resolvedOutputPath.toLowerCase().endsWith('.pdf')
            ? resolvedOutputPath.replace(/\.pdf$/i, '.html')
            : `${resolvedOutputPath}.html`;
          resolvedOutputPath = fallbackPath;
          output = generateHTML(context, { forPdf: true, includeToc });
        }
        break;
      case 'yaml':
      case 'yml':
        output = generateYAML(context);
        actualFormat = 'yaml';
        break;
      case 'notion':
        output = generateNotionMarkdown(context, { includeToc });
        actualFormat = 'md';
        break;
    }

    if (!wroteFile) {
      fs.writeFileSync(resolvedOutputPath, output);
    }
    formatSpinner.succeed(`Generated ${actualFormat.toUpperCase()} output`);

    const outputSize = wroteFile ? fs.statSync(resolvedOutputPath).size : output.length;
    printSuccess(chalk.green(`\n✅ Exported to ${chalk.bold(resolvedOutputPath)}`));
    printInfo(chalk.gray(`   Size: ${(outputSize / 1024).toFixed(1)} KB`));

    if (options.includeAgents && context.agents.length > 0) {
      printInfo(chalk.gray(`   Agents bundled: ${context.agents.length}`));
    }

    process.exitCode = 0;
    process.exit(process.exitCode);
  } catch (error) {
    spinner.fail('Export failed');
    printError(chalk.red(`   ${error.message || 'Unknown error'}`));
    await handleError(error, { command: 'export', options });
    process.exitCode = 1;
    process.exit(process.exitCode);
  }
}

function loadContext(includeAgents = false) {
  const coreFiles = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'QUICK-START.md', 'CHECKLIST.md'];
  const context = {
    exportedAt: new Date().toISOString(),
    version: '3.0.0',
    project: basename(process.cwd()),
    files: {},
    state: null,
    agents: [],
  };

  // Load core documentation files
  coreFiles.forEach((file) => {
    const filePath = join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      context.files[file] = fs.readFileSync(filePath, 'utf-8');
    }
  });

  // Load state.json if exists
  const statePath = join(process.cwd(), '.ultra', 'state.json');
  if (fs.existsSync(statePath)) {
    try {
      context.state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    } catch {
      /* invalid state */
    }
  }

  // Load agent prompts if requested
  if (includeAgents) {
    context.agents = loadAgentPrompts();
  }

  return context;
}

function loadAgentPrompts() {
  const agents = [];
  const agentsDir = join(process.cwd(), 'agents');

  if (!fs.existsSync(agentsDir)) return agents;

  const walkDir = (dir, category = '') => {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          walkDir(itemPath, item);
        } else if (item.endsWith('.md') && !item.startsWith('README') && !item.startsWith('00-')) {
          try {
            const content = fs.readFileSync(itemPath, 'utf-8');
            agents.push({
              name: basename(item, '.md'),
              category: category || 'root',
              path: itemPath.replace(process.cwd(), '.'),
              content,
            });
          } catch {
            /* skip unreadable */
          }
        }
      }
    } catch {
      /* skip inaccessible dirs */
    }
  };

  walkDir(agentsDir);
  return agents;
}

function generateJSON(context) {
  return JSON.stringify(context, null, 2);
}

function filterSections(content, sectionNumbers, excludeNumbers = null) {
  const lines = content.split('\n');
  const filteredLines = [];
  let inTargetSection = false;
  let currentSectionNumber = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(?:SECTION\s+)?(\d+)[:.]?\s*/i);
    if (sectionMatch) {
      const num = parseInt(sectionMatch[1]);
      currentSectionNumber = num;
      const included = sectionNumbers ? sectionNumbers.includes(num) : true;
      const excluded = excludeNumbers ? excludeNumbers.includes(num) : false;
      inTargetSection = included && !excluded;

      if (inTargetSection) {
        filteredLines.push(line);
      }
    } else {
      if (inTargetSection) {
        filteredLines.push(line);
      }
    }
  }

  return filteredLines.join('\n');
}

function generateYAML(context) {
  // Convert context to a simpler structure for YAML
  const yamlContext = {
    exportedAt: context.exportedAt,
    version: context.version,
    project: context.project,
    files: context.files,
    state: context.state,
    agentCount: context.agents?.length || 0,
  };

  return yaml.dump(yamlContext, { lineWidth: -1 });
}

/**
 * Parse section ranges (e.g., "1,2,3" or "1-5" or "1-3,5,7-9")
 */
function parseSectionRanges(rangesString) {
  if (!rangesString) return null;

  const sections = new Set();

  // Split by commas to handle multiple ranges/values
  const parts = rangesString.split(',');

  for (const part of parts) {
    const trimmed = part.trim();

    // Check if it's a range (contains hyphen)
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      if (isNaN(start) || isNaN(end) || start > end) {
        return null; // Invalid range
      }

      for (let i = start; i <= end; i++) {
        sections.add(i);
      }
    } else {
      // Single number
      const num = Number(trimmed);
      if (isNaN(num)) {
        return null; // Invalid number
      }
      sections.add(num);
    }
  }

  return Array.from(sections).sort((a, b) => a - b);
}

/**
 * Load custom template file
 */
function loadTemplate(templatePath) {
  try {
    if (BUILTIN_TEMPLATES[templatePath]) {
      return BUILTIN_TEMPLATES[templatePath];
    }
    const resolvedPath = resolve(templatePath);
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    return content;
  } catch (error) {
    printError(chalk.red(`❌ Error loading template: ${error.message}`));
    process.exitCode = 1;
    process.exit(process.exitCode);
  }
}

/**
 * Generate markdown with TOC
 */
function slugifyHeading(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

function generateMarkdown(context, options = {}) {
  const { includeToc = true } = options;
  const lines = [
    `# Ultra-Dex Export`,
    ``,
    `> **Project:** ${context.project}`,
    `> **Exported:** ${new Date(context.exportedAt).toLocaleString()}`,
    `> **Version:** ${context.version}`,
    ``,
  ];

  if (context.template) {
    lines.push(`## Template Summary`, ``);
    lines.push(context.template);
    lines.push(``, `---`, ``);
  }

  // Add table of contents if requested
  if (includeToc) {
    lines.push(`## Table of Contents`, ``);
    Object.keys(context.files).forEach((file) => {
      lines.push(`- [${file}](#${slugifyHeading(file)})`);
    });
    if (context.state) lines.push(`- [Project State](#${slugifyHeading('Project State')})`);
    if (context.agents.length > 0) lines.push(`- [Agents](#${slugifyHeading('Agents')})`);
    lines.push(``, `---`, ``);
  } else {
    lines.push(`---`, ``);
  }

  // File contents
  Object.entries(context.files).forEach(([file, content]) => {
    lines.push(`## ${file}`, ``);
    lines.push('```markdown');
    lines.push(content);
    lines.push('```', ``);
    lines.push(`---`, ``);
  });

  // State
  if (context.state) {
    lines.push(`## Project State`, ``);
    lines.push('```json');
    lines.push(JSON.stringify(context.state, null, 2));
    lines.push('```', ``);
    lines.push(`---`, ``);
  }

  // Agents
  if (context.agents.length > 0) {
    lines.push(`## Agents`, ``);
    lines.push(`Bundled ${context.agents.length} agent prompts:`, ``);
    context.agents.forEach((agent) => {
      lines.push(`### @${agent.name} (${agent.category})`, ``);
      lines.push('```markdown');
      lines.push(
        agent.content.substring(0, 500) + (agent.content.length > 500 ? '\n...(truncated)' : '')
      );
      lines.push('```', ``);
    });
  }

  return lines.join('\n');
}

function generateNotionMarkdown(context, options = {}) {
  const markdown = generateMarkdown(context, options);
  // Notion is happiest with Markdown + inline headings; strip HTML if any.
  return markdown.replace(/<[^>]*>/g, '');
}

/**
 * Generate HTML with TOC
 */
function generateHTML(context, options = {}) {
  const { forPdf = false, includeToc = false } = options;

  const styles = `
    :root {
      --bg-primary: #0d1117;
      --bg-secondary: #161b22;
      --bg-tertiary: #21262d;
      --text-primary: #c9d1d9;
      --text-secondary: #8b949e;
      --accent: #58a6ff;
      --accent-green: #3fb950;
      --accent-yellow: #d29922;
      --border: #30363d;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      padding: 0;
    }
    .container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
    header {
      text-align: center;
      padding: 40px 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 40px;
    }
    header h1 {
      font-size: 2.5rem;
      color: var(--accent);
      margin-bottom: 10px;
    }
    header .meta { color: var(--text-secondary); font-size: 0.9rem; }
    nav {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 30px;
    }
    nav h3 { color: var(--accent); margin-bottom: 15px; }
    nav ul { list-style: none; display: flex; flex-wrap: wrap; gap: 10px; }
    nav a {
      color: var(--text-primary);
      text-decoration: none;
      padding: 6px 12px;
      background: var(--bg-tertiary);
      border-radius: 4px;
      font-size: 0.9rem;
    }
    nav a:hover { background: var(--accent); color: var(--bg-primary); }
    section {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-bottom: 30px;
      overflow: hidden;
    }
    section h2 {
      background: var(--bg-tertiary);
      padding: 15px 20px;
      font-size: 1.2rem;
      border-bottom: 1px solid var(--border);
      color: var(--accent-green);
    }
    section .content {
      padding: 20px;
      white-space: pre-wrap;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      font-size: 0.85rem;
      max-height: ${forPdf ? 'none' : '600px'};
      overflow-y: auto;
    }
    .state-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      padding: 20px;
    }
    .state-card {
      background: var(--bg-tertiary);
      padding: 15px;
      border-radius: 6px;
    }
    .state-card label {
      color: var(--text-secondary);
      font-size: 0.8rem;
      text-transform: uppercase;
    }
    .state-card .value {
      font-size: 1.5rem;
      color: var(--accent);
      margin-top: 5px;
    }
    .agents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
      padding: 20px;
    }
    .agent-card {
      background: var(--bg-tertiary);
      border-radius: 6px;
      overflow: hidden;
    }
    .agent-card h4 {
      padding: 10px 15px;
      background: var(--bg-primary);
      color: var(--accent-yellow);
      font-size: 0.9rem;
    }
    .agent-card .preview {
      padding: 15px;
      font-family: monospace;
      font-size: 0.75rem;
      color: var(--text-secondary);
      max-height: 150px;
      overflow: hidden;
    }
    footer {
      text-align: center;
      padding: 30px;
      color: var(--text-secondary);
      font-size: 0.85rem;
      border-top: 1px solid var(--border);
    }
    @media print {
      body { background: white; color: black; }
      section .content { max-height: none; }
    }
  `;

  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Generate table of contents if requested
  const fileEntries = Object.entries(context.files);
  let toc = '';
  if (includeToc) {
    const tocItems = [];
    fileEntries.forEach(([file], index) => {
      tocItems.push(`<li><a href="#${file.replace(/\./g, '-')}">${file}</a></li>`);
    });

    if (context.state) {
      tocItems.push(`<li><a href="#project-state">Project State</a></li>`);
    }

    if (context.agents.length > 0) {
      tocItems.push(`<li><a href="#agents">Agents (${context.agents.length})</a></li>`);
    }

    toc = `
    <nav>
      <h3>📑 Table of Contents</h3>
      <ul>${tocItems.join('')}</ul>
    </nav>
    `;
  }

  const fileSections = fileEntries
    .map(
      ([file, content]) => `
    <section id="${file.replace(/\./g, '-')}">
      <h2>📄 ${file}</h2>
      <div class="content">${escapeHtml(content)}</div>
    </section>
  `
    )
    .join('');

  const stateSection = context.state
    ? `
    <section id="project-state">
      <h2>📊 Project State</h2>
      <div class="state-summary">
        <div class="state-card">
          <label>Score</label>
          <div class="value">${context.state.score || 'N/A'}/100</div>
        </div>
        <div class="state-card">
          <label>Mode</label>
          <div class="value">${context.state.project?.mode || 'Standard'}</div>
        </div>
        <div class="state-card">
          <label>Updated</label>
          <div class="value" style="font-size: 0.9rem;">${context.state.updatedAt?.split('T')[0] || 'N/A'}</div>
        </div>
      </div>
    </section>
  `
    : '';

  const agentsSection =
    context.agents.length > 0
      ? `
    <section id="agents">
      <h2>🤖 Bundled Agents (${context.agents.length})</h2>
      <div class="agents-grid">
        ${context.agents
          .map(
            (agent) => `
          <div class="agent-card">
            <h4>@${agent.name} <span style="color: var(--text-secondary); font-weight: normal;">(${agent.category})</span></h4>
            <div class="preview">${escapeHtml(agent.content.substring(0, 300))}...</div>
          </div>
        `
          )
          .join('')}
      </div>
    </section>
  `
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ultra-Dex Export - ${context.project}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="container">
    <header>
      <h1>⚡ Ultra-Dex Export</h1>
      <div class="meta">
        Project: <strong>${context.project}</strong> |
        Exported: ${new Date(context.exportedAt).toLocaleString()} |
        Version: ${context.version}
      </div>
    </header>

    ${toc}

    ${stateSection}
    ${fileSections}
    ${agentsSection}

    <footer>
      Generated by Ultra-Dex v${context.version} |
      <a href="https://github.com/Srujan0798/Ultra-Dex" style="color: var(--accent);">GitHub</a>
    </footer>
  </div>
</body>
</html>`;
}

export function registerExportCommand(program) {
  program
    .command('export')
    .description('Export project metadata to various formats')
    .option('-f, --format <format>', 'Export format: json, markdown, html, pdf, yaml, notion', 'json')
    .option('--pdf', 'Shortcut for --format pdf')
    .option('-o, --output <file>', 'Output file path')
    .option('--include-agents', 'Include agent prompts in export')
    .option(
      '--sections <ranges>',
      'Export specific sections only (comma-separated numbers or ranges, e.g. 1,2,3 or 1-5)'
    )
    .option('--exclude <ranges>', 'Exclude specific sections (e.g., 15,16 or 10-12)')
    .option('--p0', 'Export only P0 (priority 0) sections')
    .option('--toc', 'Include auto-generated table of contents')
    .option('--template <name>', 'Use built-in template: executive, technical, handoff')
    .addHelpText('after', `

Built-in Templates:
  executive  - High-level summary with vision, goals, KPIs, risks
  technical  - Technical handoff with architecture, data model, APIs
  handoff    - Developer handoff with setup, gaps, next tasks

Formats:
  json       - Structured JSON export
  markdown   - Markdown with optional TOC
  html       - Styled HTML with dark theme
  pdf        - PDF export (requires Puppeteer)
  yaml       - YAML format
  notion     - Notion-compatible markdown

Examples:
  $ ultra-dex export --format json --output export.json
  $ ultra-dex export --format html --toc --include-agents
  $ ultra-dex export --sections 1-5 --format markdown
  $ ultra-dex export --p0 --format pdf --output p0-sections.pdf
  $ ultra-dex export --template executive --format markdown
  $ ultra-dex export --exclude 15,16 --format notion
    `)
    .action(async (options) => {
      try {
        await exportCommand(options);
      } catch (error) {
        await handleError(error, { command: 'export', options });
        process.exitCode = error.exitCode || 1;
        process.exit(process.exitCode);
      }
    });
}
