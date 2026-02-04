// cli/lib/commands/export.js
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import { join, basename, resolve } from 'path';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';
import { handleError } from '../utils/error-handler.js';

const VALID_FORMATS = ['json', 'html', 'markdown', 'md', 'pdf'];

export async function exportCommand(options) {
  const format = options.format || 'json';
  const outputPath = options.output || `ultra-dex-export.${format === 'md' ? 'md' : format}`;
  
  // Validate format
  if (!VALID_FORMATS.includes(format)) {
    printError(chalk.red(`❌ Error: Unknown format: ${format}`));
    printError(chalk.yellow('   Supported formats: json, html, markdown (md), pdf'));
    process.exitCode = 1;
    process.exit(process.exitCode);
  }

  // Validate output path to prevent path traversal
  const resolvedOutput = resolve(outputPath);
  const cwd = process.cwd();
  if (!resolvedOutput.startsWith(cwd)) {
    printError(chalk.red('❌ Error: Invalid output path. Path traversal detected.'));
    process.exitCode = 1;
    process.exit(process.exitCode);
  }

  printInfo(chalk.cyan.bold(`\n📦 Ultra-Dex Export\n`));
  
  const spinner = ora('Collecting project data...').start();
  
  try {
    const context = loadContext(options.includeAgents);
    spinner.succeed(`Collected ${Object.keys(context.files).length} files`);
    
    const formatSpinner = ora(`Generating ${format.toUpperCase()} output...`).start();
    
    let output;
    switch (format) {
      case 'json':
        output = generateJSON(context);
        break;
      case 'html':
        output = generateHTML(context);
        break;
      case 'markdown':
      case 'md':
        output = generateMarkdown(context);
        break;
      case 'pdf':
        formatSpinner.warn('PDF export requires external tools');
        printInfo(chalk.gray('  Generating HTML instead. Convert with: '));
        printInfo(chalk.gray('  wkhtmltopdf ultra-dex-export.html ultra-dex-export.pdf'));
        output = generateHTML(context, { forPdf: true });
        break;
    }
    
    fs.writeFileSync(resolvedOutput, output);
    formatSpinner.succeed(`Generated ${format.toUpperCase()} output`);

    printSuccess(chalk.green(`\n✅ Exported to ${chalk.bold(resolvedOutput)}`));
    printInfo(chalk.gray(`   Size: ${(output.length / 1024).toFixed(1)} KB`));

    if (options.includeAgents && context.agents.length > 0) {
      printInfo(chalk.gray(`   Agents bundled: ${context.agents.length}`));
    }

    process.exitCode = 0;
    process.exit(process.exitCode);
  } catch (error) {
    spinner.fail('Export failed');
    printError(chalk.red(`   ${error.message || 'Unknown error'}`));
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
    agents: []
  };
  
  // Load core documentation files
  coreFiles.forEach(file => {
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
    } catch { /* invalid state */ }
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
              content
            });
          } catch { /* skip unreadable */ }
        }
      }
    } catch { /* skip inaccessible dirs */ }
  };
  
  walkDir(agentsDir);
  return agents;
}

function generateJSON(context) {
  return JSON.stringify(context, null, 2);
}

function generateHTML(context, options = {}) {
  const { forPdf = false } = options;
  
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

  const escapeHtml = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const fileEntries = Object.entries(context.files);
  const toc = fileEntries.map(([file]) => 
    `<li><a href="#${file.replace(/\./g, '-')}">${file}</a></li>`
  ).join('');

  const fileSections = fileEntries.map(([file, content]) => `
    <section id="${file.replace(/\./g, '-')}">
      <h2>📄 ${file}</h2>
      <div class="content">${escapeHtml(content)}</div>
    </section>
  `).join('');

  const stateSection = context.state ? `
    <section>
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
  ` : '';

  const agentsSection = context.agents.length > 0 ? `
    <section>
      <h2>🤖 Bundled Agents (${context.agents.length})</h2>
      <div class="agents-grid">
        ${context.agents.map(agent => `
          <div class="agent-card">
            <h4>@${agent.name} <span style="color: var(--text-secondary); font-weight: normal;">(${agent.category})</span></h4>
            <div class="preview">${escapeHtml(agent.content.substring(0, 300))}...</div>
          </div>
        `).join('')}
      </div>
    </section>
  ` : '';

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

    <nav>
      <h3>📑 Contents</h3>
      <ul>${toc}</ul>
    </nav>

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

function generateMarkdown(context) {
  const lines = [
    `# Ultra-Dex Export`,
    ``,
    `> **Project:** ${context.project}`,
    `> **Exported:** ${new Date(context.exportedAt).toLocaleString()}`,
    `> **Version:** ${context.version}`,
    ``,
    `---`,
    ``
  ];

  // Table of contents
  lines.push(`## Table of Contents`, ``);
  Object.keys(context.files).forEach((file, i) => {
    lines.push(`${i + 1}. [${file}](#${file.toLowerCase().replace(/\./g, '')})`);
  });
  if (context.state) lines.push(`${Object.keys(context.files).length + 1}. [Project State](#project-state)`);
  if (context.agents.length > 0) lines.push(`${Object.keys(context.files).length + 2}. [Agents](#agents)`);
  lines.push(``, `---`, ``);

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
    context.agents.forEach(agent => {
      lines.push(`### @${agent.name} (${agent.category})`, ``);
      lines.push('```markdown');
      lines.push(agent.content.substring(0, 500) + (agent.content.length > 500 ? '\n...(truncated)' : ''));
      lines.push('```', ``);
    });
  }

  return lines.join('\n');
}

export function registerExportCommand(program) {
  program
    .command('export')
    .description('Export project metadata to various formats')
    .option('-f, --format <format>', 'Export format: json, markdown, html, pdf', 'json')
    .option('-o, --output <file>', 'Output file path')
    .option('--include-agents', 'Include agent prompts in export')
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
