/**
 * ultra-dex diff & export commands
 * Compare plan vs code, export to various formats
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

async function readFileSafe(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function getProjectStructure(dir, depth = 3) {
  const structure = [];
  
  async function scan(currentDir, currentDepth, prefix = '') {
    if (currentDepth <= 0) return;
    
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      const filtered = entries.filter(e => 
        !['node_modules', '.git', '.next', 'dist', 'build', '.ultra-dex', '.ultra'].includes(e.name) &&
        !e.name.startsWith('.')
      );
      
      for (const entry of filtered) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(dir, fullPath);
        
        if (entry.isDirectory()) {
          structure.push({ type: 'dir', path: relativePath });
          await scan(fullPath, currentDepth - 1, prefix + '  ');
        } else {
          structure.push({ type: 'file', path: relativePath });
        }
      }
    } catch { /* permission denied or other error */ }
  }
  
  await scan(dir, depth);
  return structure;
}

function extractPlanExpectations(planContent) {
  const expectations = {
    database: [],
    api: [],
    frontend: [],
    auth: [],
    testing: [],
    other: []
  };
  
  if (!planContent) return expectations;
  
  // Extract database expectations (look for schema, tables, models)
  const dbPatterns = /(?:table|schema|model|entity|database|prisma)[\s:]+[`"]?(\w+)[`"]?/gi;
  let match;
  while ((match = dbPatterns.exec(planContent)) !== null) {
    if (!expectations.database.includes(match[1].toLowerCase())) {
      expectations.database.push(match[1].toLowerCase());
    }
  }
  
  // Extract API endpoints
  const apiPatterns = /(?:endpoint|route|api|POST|GET|PUT|DELETE|PATCH)[\s:]+[`"]?([\/\w-]+)[`"]?/gi;
  while ((match = apiPatterns.exec(planContent)) !== null) {
    if (!expectations.api.includes(match[1])) {
      expectations.api.push(match[1]);
    }
  }
  
  // Extract frontend components
  const componentPatterns = /(?:component|page|view|screen)[\s:]+[`"]?(\w+)[`"]?/gi;
  while ((match = componentPatterns.exec(planContent)) !== null) {
    if (!expectations.frontend.includes(match[1])) {
      expectations.frontend.push(match[1]);
    }
  }
  
  // Extract auth features
  const authPatterns = /(?:auth|login|signup|session|jwt|oauth|password)/gi;
  while ((match = authPatterns.exec(planContent)) !== null) {
    if (!expectations.auth.includes(match[0].toLowerCase())) {
      expectations.auth.push(match[0].toLowerCase());
    }
  }
  
  // Extract testing expectations
  const testPatterns = /(?:test|spec|coverage|jest|vitest|cypress)/gi;
  while ((match = testPatterns.exec(planContent)) !== null) {
    if (!expectations.testing.includes(match[0].toLowerCase())) {
      expectations.testing.push(match[0].toLowerCase());
    }
  }
  
  return expectations;
}

function checkCodeImplementation(structure, expectations) {
  const findings = {
    implemented: [],
    missing: [],
    extra: []
  };
  
  const fileNames = structure.filter(s => s.type === 'file').map(s => s.path.toLowerCase());
  const dirNames = structure.filter(s => s.type === 'dir').map(s => s.path.toLowerCase());
  
  // Check database
  const hasSchema = fileNames.some(f => f.includes('schema') || f.includes('prisma'));
  if (expectations.database.length > 0 && hasSchema) {
    findings.implemented.push('Database schema exists');
  } else if (expectations.database.length > 0) {
    findings.missing.push('Database schema (expected models: ' + expectations.database.slice(0, 3).join(', ') + ')');
  }
  
  // Check API
  const hasApi = dirNames.some(d => d.includes('api') || d.includes('routes'));
  if (expectations.api.length > 0 && hasApi) {
    findings.implemented.push('API routes directory exists');
  } else if (expectations.api.length > 0) {
    findings.missing.push('API routes directory');
  }
  
  // Check frontend
  const hasFrontend = dirNames.some(d => d.includes('components') || d.includes('pages') || d.includes('app'));
  if (expectations.frontend.length > 0 && hasFrontend) {
    findings.implemented.push('Frontend components exist');
  } else if (expectations.frontend.length > 0) {
    findings.missing.push('Frontend components');
  }
  
  // Check auth
  const hasAuth = fileNames.some(f => f.includes('auth') || f.includes('login') || f.includes('session'));
  if (expectations.auth.length > 0 && hasAuth) {
    findings.implemented.push('Authentication implemented');
  } else if (expectations.auth.length > 0) {
    findings.missing.push('Authentication (expected: ' + expectations.auth.slice(0, 3).join(', ') + ')');
  }
  
  // Check testing
  const hasTests = fileNames.some(f => f.includes('.test.') || f.includes('.spec.')) ||
                   dirNames.some(d => d.includes('test') || d.includes('__tests__'));
  if (expectations.testing.length > 0 && hasTests) {
    findings.implemented.push('Tests exist');
  } else if (expectations.testing.length > 0) {
    findings.missing.push('Tests');
  }
  
  return findings;
}

export function registerDiffCommand(program) {
  program
    .command('diff')
    .description('Compare implementation plan vs actual code')
    .option('-d, --dir <directory>', 'Directory to analyze', '.')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      console.log(chalk.cyan('\n🔍 Ultra-Dex Diff: Plan vs Code\n'));
      
      const spinner = ora('Analyzing project...').start();
      
      // Load plan
      const plan = await readFileSafe(path.join(options.dir, 'IMPLEMENTATION-PLAN.md'));
      if (!plan) {
        spinner.fail('No IMPLEMENTATION-PLAN.md found');
        return;
      }
      
      // Get project structure
      const structure = await getProjectStructure(path.resolve(options.dir));
      
      // Extract expectations and check implementation
      const expectations = extractPlanExpectations(plan);
      const findings = checkCodeImplementation(structure, expectations);
      
      spinner.succeed('Analysis complete');
      
      // Calculate alignment
      const totalExpected = Object.values(expectations).flat().length;
      const implementedCount = findings.implemented.length;
      const missingCount = findings.missing.length;
      const alignmentScore = totalExpected > 0 
        ? Math.round((implementedCount / (implementedCount + missingCount)) * 100)
        : 0;
      
      if (options.json) {
        console.log(JSON.stringify({
          score: alignmentScore,
          expectations,
          findings,
          structure: structure.slice(0, 50)
        }, null, 2));
        return;
      }
      
      // Display results
      console.log(chalk.bold('\n📊 Alignment Analysis\n'));
      console.log(chalk.gray('─'.repeat(50)));
      
      const scoreColor = alignmentScore >= 80 ? 'green' : alignmentScore >= 50 ? 'yellow' : 'red';
      console.log(chalk[scoreColor](`  Code-to-Plan Alignment: ${alignmentScore}%`));
      
      console.log(chalk.gray('─'.repeat(50)));
      
      if (findings.implemented.length > 0) {
        console.log(chalk.green('\n✅ Implemented:'));
        findings.implemented.forEach(item => console.log(chalk.gray(`   • ${item}`)));
      }
      
      if (findings.missing.length > 0) {
        console.log(chalk.red('\n❌ Missing:'));
        findings.missing.forEach(item => console.log(chalk.yellow(`   • ${item}`)));
      }
      
      console.log(chalk.bold('\n📋 Plan Expectations Found:\n'));
      Object.entries(expectations).forEach(([category, items]) => {
        if (items.length > 0) {
          console.log(chalk.cyan(`  ${category}: `) + chalk.gray(items.slice(0, 5).join(', ') + (items.length > 5 ? '...' : '')));
        }
      });
      
      console.log(chalk.gray('\n─'.repeat(50)));
      console.log(chalk.cyan('\n💡 Run `ultra-dex run planner` to get tasks for missing items.\n'));
    });
}

export function registerExportCommand(program) {
  program
    .command('export')
    .description('Export project to various formats')
    .option('-f, --format <format>', 'Export format: json, markdown, html', 'json')
    .option('-o, --output <file>', 'Output file path')
    .option('--include-code', 'Include code snippets in export')
    .action(async (options) => {
      console.log(chalk.cyan('\n📦 Ultra-Dex Export\n'));
      
      const spinner = ora('Gathering project data...').start();
      
      // Gather all project data
      const data = {
        exportedAt: new Date().toISOString(),
        project: { name: path.basename(process.cwd()) },
        files: {},
        state: null,
        git: null
      };
      
      // Load all markdown files
      const mdFiles = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'CHECKLIST.md', 'QUICK-START.md'];
      for (const file of mdFiles) {
        const content = await readFileSafe(file);
        if (content) {
          data.files[file] = content;
        }
      }
      
      // Load state
      const stateContent = await readFileSafe('.ultra/state.json');
      if (stateContent) {
        try {
          data.state = JSON.parse(stateContent);
        } catch { /* invalid json */ }
      }
      
      // Get git info
      try {
        data.git = {
          branch: execSync('git branch --show-current', { encoding: 'utf8' }).trim(),
          remoteUrl: execSync('git remote get-url origin 2>/dev/null', { encoding: 'utf8' }).trim(),
          lastCommit: execSync('git log -1 --format="%H %s"', { encoding: 'utf8' }).trim()
        };
      } catch { /* not a git repo */ }
      
      spinner.succeed('Data gathered');
      
      let output;
      let extension;
      
      switch (options.format) {
        case 'json':
          output = JSON.stringify(data, null, 2);
          extension = '.json';
          break;
          
        case 'markdown':
          output = `# ${data.project.name} - Ultra-Dex Export

Exported: ${new Date(data.exportedAt).toLocaleString()}

${data.git ? `## Git Info
- Branch: ${data.git.branch}
- Last Commit: ${data.git.lastCommit}
` : ''}

${data.state ? `## Project State
- Score: ${data.state.score}/100
- Sections: ${data.state.sections?.completed || 0}/34
` : ''}

${Object.entries(data.files).map(([name, content]) => `
---

## ${name}

${content}
`).join('\n')}
`;
          extension = '.md';
          break;
          
        case 'html':
          output = `<!DOCTYPE html>
<html>
<head>
  <title>${data.project.name} - Ultra-Dex Export</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { color: #06b6d4; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; overflow-x: auto; border-radius: 0.5rem; }
    .meta { color: #666; font-size: 0.875rem; }
    .section { margin: 2rem 0; padding: 1rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; }
  </style>
</head>
<body>
  <h1>🚀 ${data.project.name}</h1>
  <p class="meta">Exported: ${new Date(data.exportedAt).toLocaleString()}</p>
  
  ${data.state ? `
  <div class="section">
    <h2>📊 Project State</h2>
    <p>Score: <strong>${data.state.score}/100</strong></p>
    <p>Sections: ${data.state.sections?.completed || 0}/34</p>
  </div>
  ` : ''}
  
  ${Object.entries(data.files).map(([name, content]) => `
  <div class="section">
    <h2>📄 ${name}</h2>
    <pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  </div>
  `).join('\n')}
</body>
</html>`;
          extension = '.html';
          break;
          
        default:
          console.log(chalk.red(`Unknown format: ${options.format}`));
          return;
      }
      
      if (options.output) {
        await fs.writeFile(options.output, output);
        console.log(chalk.green(`✅ Exported to: ${options.output}`));
      } else {
        const defaultPath = `ultra-dex-export${extension}`;
        await fs.writeFile(defaultPath, output);
        console.log(chalk.green(`✅ Exported to: ${defaultPath}`));
      }
      
      console.log(chalk.gray(`   Format: ${options.format}`));
      console.log(chalk.gray(`   Size: ${(output.length / 1024).toFixed(1)}KB\n`));
    });
}

export function registerCheckCommand(program) {
  program
    .command('check')
    .description('Repository health and alignment check (God Mode)')
    .action(async () => {
      console.log(chalk.cyan('\n🩺 Ultra-Dex Repository Check\n'));

      const { buildGraph } = await import('../utils/graph.js');
      const { loadState } = await import('./state.js');

      // 1. Check Graph
      const graphSpinner = (await import('ora')).default('Checking Code Property Graph...').start();
      try {
        const graph = await buildGraph();
        graphSpinner.succeed(chalk.green(`CPG Healthy: ${graph.nodes.length} nodes, ${graph.edges.length} edges`));
      } catch (e) {
        graphSpinner.fail(chalk.red(`CPG Corrupt: ${e.message}`));
      }

      // 2. Check State
      const stateSpinner = (await import('ora')).default('Checking Project State...').start();
      const state = await loadState();
      if (state) {
        stateSpinner.succeed(chalk.green('Project state loaded'));
      } else {
        stateSpinner.warn(chalk.yellow('No .ultra/state.json found. System is stateless.'));
      }

      // 3. Check Core Files
      const files = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'QUICK-START.md'];
      console.log(chalk.bold('\nCore Documents:'));
      for (const file of files) {
        try {
          await fs.access(file);
          console.log(chalk.green(`  ✅ ${file}`));
        } catch {
          console.log(chalk.red(`  ❌ ${file} (Required)`));
        }
      }

      console.log(chalk.cyan('\n💡 Run "ultra-dex audit" for a detailed scoring report.\n'));
    });
}

export function registerUpgradeCommand(program) {
  program
    .command('upgrade')
    .description('Check for and install Ultra-Dex updates')
    .option('--check', 'Only check for updates, don\'t install')
    .action(async (options) => {
      console.log(chalk.cyan('\n🔄 Ultra-Dex Upgrade\n'));
      
      const spinner = ora('Checking for updates...').start();
      
      try {
        // Get current version
        const currentVersion = '2.4.0';
        
        // Check npm for latest version
        const latestInfo = execSync('npm view ultra-dex version 2>/dev/null', { encoding: 'utf8' }).trim();
        const latestVersion = latestInfo || currentVersion;
        
        spinner.succeed('Version check complete');
        
        console.log(chalk.gray(`  Current: v${currentVersion}`));
        console.log(chalk.gray(`  Latest:  v${latestVersion}`));
        
        if (currentVersion === latestVersion) {
          console.log(chalk.green('\n✅ You\'re on the latest version!\n'));
          return;
        }
        
        if (options.check) {
          console.log(chalk.yellow(`\n⬆️  Update available: v${currentVersion} → v${latestVersion}`));
          console.log(chalk.gray('   Run `ultra-dex upgrade` to install.\n'));
          return;
        }
        
        // Install update
        const installSpinner = ora('Installing update...').start();
        execSync('npm install -g ultra-dex@latest', { encoding: 'utf8' });
        installSpinner.succeed('Update installed!');
        
        console.log(chalk.green(`\n✅ Upgraded to v${latestVersion}!\n`));
        console.log(chalk.gray('   Run `ultra-dex --version` to verify.\n'));
        
      } catch (err) {
        spinner.fail('Upgrade check failed');
        console.log(chalk.yellow('\n⚠️  Could not check for updates.'));
        console.log(chalk.gray('   You may not be connected to npm, or ultra-dex is not published yet.'));
        console.log(chalk.gray(`   Current version: v3.0.0\n`));
      }
    });
}

export default { registerDiffCommand, registerExportCommand, registerUpgradeCommand };
