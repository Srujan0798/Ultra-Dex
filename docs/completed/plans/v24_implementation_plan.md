# Ultra-Dex v2.4 Implementation Plan

> **Give this to your AI agent (Copilot CLI, Claude Code, Cursor, etc.)**

---

## Project Context

**Project:** Ultra-Dex CLI  
**Location:** `/Users/roshwinram/Music/Ultra-Dex/cli`  
**Current Version:** 2.2.1  
**Target Version:** 2.4.0

### Existing Architecture
```
cli/
├── bin/ultra-dex.js          # Entry point
├── lib/
│   ├── commands/             # 23 command files (add new ones here)
│   ├── providers/            # AI providers (claude, openai, gemini)
│   ├── templates/            # Prompt templates
│   └── utils/                # Helpers
├── assets/                   # Bundled files
└── package.json
```

---

## Task: Implement Missing v2.4 Commands

### Commands to Create

| Command | Priority | File to Create |
|---------|----------|----------------|
| `swarm` | P1 | `lib/commands/swarm.js` |
| `watch` | P2 | `lib/commands/watch.js` |
| `diff` | P2 | `lib/commands/diff.js` |
| `export` | P3 | `lib/commands/export.js` |
| `upgrade` | P3 | `lib/commands/upgrade.js` |
| `config` | P3 | `lib/commands/config.js` |

---

## 1. SWARM Command (Most Important)

**File:** `cli/lib/commands/swarm.js`

**Purpose:** Run multiple agents in sequence to complete a task autonomously.

**Usage:**
```bash
npx ultra-dex swarm "Build user authentication"
npx ultra-dex swarm "Add payments" --dry-run
```

**Implementation:**

```javascript
// cli/lib/commands/swarm.js
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { getProvider } from '../providers/index.js';
import { readFile, existsSync } from 'fs';
import { join } from 'path';

const AGENT_PIPELINE = [
  { name: 'planner', description: 'Break down task into steps' },
  { name: 'cto', description: 'Define architecture' },
  { name: 'database', description: 'Design schema' },
  { name: 'backend', description: 'Implement API' },
  { name: 'frontend', description: 'Build UI' },
  { name: 'testing', description: 'Write tests' },
  { name: 'reviewer', description: 'Code review' }
];

export async function swarmCommand(task, options) {
  console.log(chalk.cyan.bold('\n🐝 Ultra-Dex Swarm Mode\n'));
  console.log(chalk.white(`Task: "${task}"\n`));

  if (options.dryRun) {
    console.log(chalk.yellow('Dry run - showing pipeline:\n'));
    AGENT_PIPELINE.forEach((agent, i) => {
      console.log(`  ${i + 1}. @${agent.name} - ${agent.description}`);
    });
    return;
  }

  // Load context
  const contextPath = join(process.cwd(), 'CONTEXT.md');
  const planPath = join(process.cwd(), 'IMPLEMENTATION-PLAN.md');
  
  let context = '';
  if (existsSync(contextPath)) {
    context += await readFile(contextPath, 'utf-8');
  }
  if (existsSync(planPath)) {
    context += '\n\n' + await readFile(planPath, 'utf-8');
  }

  // Get AI provider
  const provider = getProvider();
  if (!provider) {
    console.log(chalk.red('No AI provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_KEY'));
    return;
  }

  // Run pipeline
  let previousOutput = '';
  for (const agent of AGENT_PIPELINE) {
    const spinner = ora(`Running @${agent.name}...`).start();
    
    try {
      const agentPrompt = await loadAgentPrompt(agent.name);
      const prompt = `
${agentPrompt}

## Context
${context}

## Previous Agent Output
${previousOutput}

## Task
${task}

Provide your output for the next agent in the pipeline.
`;

      const response = await provider.complete(prompt);
      previousOutput = response;
      
      spinner.succeed(`@${agent.name} complete`);
      console.log(chalk.gray(`  → ${response.slice(0, 100)}...`));
      
    } catch (error) {
      spinner.fail(`@${agent.name} failed: ${error.message}`);
      break;
    }
  }

  console.log(chalk.green.bold('\n✅ Swarm complete!\n'));
}

async function loadAgentPrompt(name) {
  const agentPath = join(process.cwd(), 'agents', `${name}.md`);
  if (existsSync(agentPath)) {
    return await readFile(agentPath, 'utf-8');
  }
  return `You are the @${name} agent.`;
}
```

---

## 2. WATCH Command

**File:** `cli/lib/commands/watch.js`

**Purpose:** Auto-update state when files change.

```javascript
// cli/lib/commands/watch.js
import chalk from 'chalk';
import { watch } from 'fs';
import { join } from 'path';
import { updateState } from './state.js';

export function watchCommand(options) {
  console.log(chalk.cyan.bold('\n👁️  Ultra-Dex Watch Mode\n'));
  console.log(chalk.gray('Watching for file changes...\n'));

  const watchPaths = [
    'CONTEXT.md',
    'IMPLEMENTATION-PLAN.md',
    'src',
    'app',
    'lib'
  ];

  let debounceTimer = null;

  watchPaths.forEach(path => {
    const fullPath = join(process.cwd(), path);
    try {
      watch(fullPath, { recursive: true }, (eventType, filename) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          console.log(chalk.yellow(`\n📝 ${filename} changed`));
          await updateState();
          console.log(chalk.green('✅ State updated'));
        }, 500);
      });
    } catch (e) {
      // Path doesn't exist, skip
    }
  });

  console.log(chalk.gray('Press Ctrl+C to stop'));
  
  // Keep process running
  process.stdin.resume();
}
```

---

## 3. DIFF Command

**File:** `cli/lib/commands/diff.js`

**Purpose:** Compare implementation plan vs actual code.

```javascript
// cli/lib/commands/diff.js
import chalk from 'chalk';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export function diffCommand(options) {
  console.log(chalk.cyan.bold('\n📊 Ultra-Dex Diff - Plan vs Code\n'));

  const planPath = join(process.cwd(), 'IMPLEMENTATION-PLAN.md');
  if (!existsSync(planPath)) {
    console.log(chalk.red('No IMPLEMENTATION-PLAN.md found'));
    return;
  }

  const plan = readFileSync(planPath, 'utf-8');
  
  // Extract planned features
  const plannedFeatures = extractFeatures(plan);
  
  // Check what exists in code
  const implemented = checkImplemented(plannedFeatures);
  
  console.log(chalk.white.bold('Planned vs Implemented:\n'));
  
  implemented.forEach(({ feature, exists }) => {
    const icon = exists ? chalk.green('✅') : chalk.red('❌');
    console.log(`  ${icon} ${feature}`);
  });
  
  const score = implemented.filter(f => f.exists).length / implemented.length * 100;
  console.log(chalk.white.bold(`\nAlignment: ${score.toFixed(0)}%`));
}

function extractFeatures(plan) {
  const features = [];
  const lines = plan.split('\n');
  
  lines.forEach(line => {
    if (line.match(/^###?\s+/)) {
      features.push(line.replace(/^#+\s+/, '').trim());
    }
  });
  
  return features.slice(0, 20); // Limit for demo
}

function checkImplemented(features) {
  const srcExists = existsSync(join(process.cwd(), 'src'));
  const appExists = existsSync(join(process.cwd(), 'app'));
  
  return features.map(feature => {
    const keywords = feature.toLowerCase().split(' ');
    const exists = keywords.some(kw => 
      searchInCode(kw, srcExists ? 'src' : appExists ? 'app' : '.')
    );
    return { feature, exists };
  });
}

function searchInCode(keyword, dir) {
  // Simple check - in real impl, use grep
  try {
    const files = readdirSync(join(process.cwd(), dir), { recursive: true });
    return files.some(f => f.toLowerCase().includes(keyword));
  } catch (e) {
    return false;
  }
}
```

---

## 4. EXPORT Command

**File:** `cli/lib/commands/export.js`

```javascript
// cli/lib/commands/export.js
import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export function exportCommand(options) {
  const format = options.format || 'json';
  console.log(chalk.cyan.bold(`\n📦 Exporting as ${format.toUpperCase()}\n`));

  const context = loadContext();
  
  const outputFile = `ultra-dex-export.${format}`;
  
  if (format === 'json') {
    writeFileSync(outputFile, JSON.stringify(context, null, 2));
  } else if (format === 'html') {
    writeFileSync(outputFile, generateHTML(context));
  } else {
    writeFileSync(outputFile, generateMarkdown(context));
  }
  
  console.log(chalk.green(`✅ Exported to ${outputFile}`));
}

function loadContext() {
  const files = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md', 'QUICK-START.md'];
  const context = {};
  
  files.forEach(file => {
    const path = join(process.cwd(), file);
    if (existsSync(path)) {
      context[file] = readFileSync(path, 'utf-8');
    }
  });
  
  return context;
}

function generateHTML(context) {
  return `<!DOCTYPE html>
<html><head><title>Ultra-Dex Export</title></head>
<body><pre>${JSON.stringify(context, null, 2)}</pre></body></html>`;
}

function generateMarkdown(context) {
  return Object.entries(context).map(([file, content]) => 
    `# ${file}\n\n${content}`
  ).join('\n\n---\n\n');
}
```

---

## 5. UPGRADE Command

**File:** `cli/lib/commands/upgrade.js`

```javascript
// cli/lib/commands/upgrade.js
import chalk from 'chalk';
import { execSync } from 'child_process';

export async function upgradeCommand(options) {
  console.log(chalk.cyan.bold('\n⬆️  Ultra-Dex Upgrade Check\n'));

  try {
    const current = execSync('npm show ultra-dex version', { encoding: 'utf-8' }).trim();
    const local = JSON.parse(
      execSync('npm pkg get version', { encoding: 'utf-8' })
    ).replace(/"/g, '');
    
    console.log(`  Local:  ${local}`);
    console.log(`  Latest: ${current}`);
    
    if (local !== current) {
      console.log(chalk.yellow('\n  Update available!'));
      console.log(chalk.gray('  Run: npm install -g ultra-dex@latest'));
    } else {
      console.log(chalk.green('\n  ✅ You are up to date!'));
    }
  } catch (e) {
    console.log(chalk.red('  Could not check for updates'));
  }
}
```

---

## 6. CONFIG Command

**File:** `cli/lib/commands/config.js`

```javascript
// cli/lib/commands/config.js
import chalk from 'chalk';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

export function configCommand(options) {
  if (options.mcp) {
    generateMCPConfig();
  } else {
    showConfig();
  }
}

function generateMCPConfig() {
  console.log(chalk.cyan.bold('\n🔌 Generating MCP Config for Claude Desktop\n'));
  
  const projectPath = process.cwd();
  
  const config = {
    "mcpServers": {
      "ultra-dex": {
        "command": "npx",
        "args": ["ultra-dex", "serve"],
        "cwd": projectPath
      }
    }
  };
  
  const claudeConfigPath = join(homedir(), 'Library', 'Application Support', 
    'Claude', 'claude_desktop_config.json');
  
  console.log(chalk.white('Add this to your Claude Desktop config:\n'));
  console.log(chalk.gray(claudeConfigPath));
  console.log();
  console.log(JSON.stringify(config, null, 2));
  
  // Also save to project
  writeFileSync('mcp-config.json', JSON.stringify(config, null, 2));
  console.log(chalk.green('\n✅ Saved to mcp-config.json'));
}

function showConfig() {
  console.log(chalk.cyan.bold('\n⚙️  Ultra-Dex Configuration\n'));
  
  const envVars = [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY', 
    'GOOGLE_AI_KEY'
  ];
  
  envVars.forEach(key => {
    const value = process.env[key];
    const status = value ? chalk.green('✓ Set') : chalk.gray('Not set');
    console.log(`  ${key}: ${status}`);
  });
}
```

---

## 7. Register Commands in bin/ultra-dex.js

Add these imports and command registrations:

```javascript
// Add to bin/ultra-dex.js

import { swarmCommand } from '../lib/commands/swarm.js';
import { watchCommand } from '../lib/commands/watch.js';
import { diffCommand } from '../lib/commands/diff.js';
import { exportCommand } from '../lib/commands/export.js';
import { upgradeCommand } from '../lib/commands/upgrade.js';
import { configCommand } from '../lib/commands/config.js';

// Add command definitions

program
  .command('swarm <task>')
  .description('Run autonomous agent pipeline')
  .option('--dry-run', 'Show pipeline without executing')
  .action(swarmCommand);

program
  .command('watch')
  .description('Auto-update state on file changes')
  .action(watchCommand);

program
  .command('diff')
  .description('Compare plan vs implemented code')
  .action(diffCommand);

program
  .command('export')
  .description('Export project context')
  .option('--format <type>', 'Output format: json, html, md', 'json')
  .action(exportCommand);

program
  .command('upgrade')
  .description('Check for CLI updates')
  .option('--check', 'Just check, no install')
  .action(upgradeCommand);

program
  .command('config')
  .description('Show or generate configuration')
  .option('--mcp', 'Generate MCP config for Claude Desktop')
  .action(configCommand);
```

---

## 8. Update package.json Version

```json
{
  "version": "2.4.0"
}
```

---

## 9. Update CHANGELOG.md

Add to top of CHANGELOG.md:

```markdown
## [2.4.0] - 2026-01-27

### Added
- **🐝 `ultra-dex swarm`** - Autonomous agent pipeline
- **👁️ `ultra-dex watch`** - Auto-update on file changes
- **📊 `ultra-dex diff`** - Plan vs code comparison
- **📦 `ultra-dex export`** - Export to JSON/HTML/Markdown
- **⬆️ `ultra-dex upgrade`** - Check for updates
- **⚙️ `ultra-dex config --mcp`** - Generate Claude Desktop config

### Changed
- Total CLI commands: 28+
- Version bump to 2.4.0
```

---

## Verification

After implementation, run:

```bash
cd /Users/roshwinram/Music/Ultra-Dex/cli

# Test each command
node bin/ultra-dex.js swarm "Test task" --dry-run
node bin/ultra-dex.js diff
node bin/ultra-dex.js config --mcp
node bin/ultra-dex.js export --format json
node bin/ultra-dex.js upgrade --check

# If all pass, publish
npm version 2.4.0
npm publish
```

---

## Summary

| Task | File | Priority |
|------|------|----------|
| Create swarm.js | lib/commands/swarm.js | P1 |
| Create watch.js | lib/commands/watch.js | P2 |
| Create diff.js | lib/commands/diff.js | P2 |
| Create export.js | lib/commands/export.js | P3 |
| Create upgrade.js | lib/commands/upgrade.js | P3 |
| Create config.js | lib/commands/config.js | P3 |
| Register in ultra-dex.js | bin/ultra-dex.js | Required |
| Update version | package.json | Required |
| Update changelog | CHANGELOG.md | Required |
| Test & publish | npm publish | Final |
