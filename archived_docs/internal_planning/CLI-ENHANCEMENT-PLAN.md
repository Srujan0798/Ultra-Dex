# Ultra-Dex CLI Visual Enhancement Plan

> **Goal:** Make Ultra-Dex CLI look as professional as Claude Code, Gemini CLI

---

## Current State

| Aspect | Current | Target |
|--------|---------|--------|
| Banner | Basic ASCII art | Gradient colored ASCII |
| Spinners | Simple ora | Animated with emojis |
| Tables | Console.log | Boxed styled tables |
| Progress | None | Beautiful progress bars |
| Colors | Basic chalk | Gradient text, themes |
| Interactive | Basic inquirer | Animated selections |
| Help | Plain text | Styled with sections |
| Version | Plain | Styled version card |

---

## Required Dependencies

Add to `cli/package.json`:

```json
{
  "dependencies": {
    "gradient-string": "^2.0.2",
    "boxen": "^7.1.1",
    "cli-table3": "^0.6.3",
    "listr2": "^8.0.0",
    "ink": "^4.4.1",
    "ink-spinner": "^5.0.0",
    "figures": "^6.0.1",
    "terminal-link": "^3.0.0",
    "update-notifier": "^7.0.0"
  }
}
```

---

## Phase 1: Enhanced Banner & Branding

### File: `cli/lib/commands/banner.js`

```javascript
import gradient from 'gradient-string';
import boxen from 'boxen';

const ultraGradient = gradient(['#6366f1', '#8b5cf6', '#d946ef']);

const asciiLogo = `
██╗   ██╗██╗  ████████╗██████╗  █████╗       ██████╗ ███████╗██╗  ██╗
██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗      ██╔══██╗██╔════╝╚██╗██╔╝
██║   ██║██║     ██║   ██████╔╝███████║█████╗██║  ██║█████╗   ╚███╔╝ 
██║   ██║██║     ██║   ██╔══██╗██╔══██║╚════╝██║  ██║██╔══╝   ██╔██╗ 
╚██████╔╝███████╗██║   ██║  ██║██║  ██║      ██████╔╝███████╗██╔╝ ██╗
 ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝`;

export function showBanner(version = '3.1.0') {
  console.log(ultraGradient(asciiLogo));
  console.log(boxen(
    `${ultraGradient.multiline('AI Orchestration Meta-Layer')}\n` +
    `Version ${version} • github.com/Srujan0798/Ultra-Dex`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: '#8b5cf6',
      dimBorder: true
    }
  ));
}
```

---

## Phase 2: Styled Version Display

### File: `cli/lib/utils/version-display.js`

```javascript
import boxen from 'boxen';
import chalk from 'chalk';
import gradient from 'gradient-string';

export function showVersionCard() {
  const version = '3.1.0';
  const ultra = gradient(['#6366f1', '#8b5cf6'])('Ultra-Dex');
  
  console.log(boxen(
    `${ultra} ${chalk.dim('v')}${chalk.bold.white(version)}\n\n` +
    `${chalk.cyan('◆')} AI Orchestration Meta-Layer\n` +
    `${chalk.magenta('◆')} 35 Commands • 16 Agents\n` +
    `${chalk.yellow('◆')} MCP Server • Swarm Mode\n\n` +
    `${chalk.dim('npm install -g ultra-dex')}\n` +
    `${chalk.dim('github.com/Srujan0798/Ultra-Dex')}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: '#8b5cf6',
      title: '🪐 Ultra-Dex',
      titleAlignment: 'center'
    }
  ));
}
```

---

## Phase 3: Enhanced Spinners

### File: `cli/lib/utils/spinners.js`

```javascript
import ora from 'ora';
import chalk from 'chalk';

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function createSpinner(text) {
  return ora({
    text: chalk.cyan(text),
    spinner: {
      interval: 80,
      frames: spinnerFrames
    },
    color: 'magenta'
  });
}

export function success(text) {
  return ora().succeed(chalk.green(text));
}

export function fail(text) {
  return ora().fail(chalk.red(text));
}

export function info(text) {
  return ora().info(chalk.blue(text));
}

export function warn(text) {
  return ora().warn(chalk.yellow(text));
}

// Task list with progress
export async function runTasks(tasks) {
  for (const task of tasks) {
    const spinner = createSpinner(task.title);
    spinner.start();
    try {
      await task.fn();
      spinner.succeed(chalk.green(task.title));
    } catch (error) {
      spinner.fail(chalk.red(`${task.title}: ${error.message}`));
      throw error;
    }
  }
}
```

---

## Phase 4: Styled Tables

### File: `cli/lib/utils/tables.js`

```javascript
import Table from 'cli-table3';
import chalk from 'chalk';
import gradient from 'gradient-string';

export function createTable(headers, rows) {
  const table = new Table({
    head: headers.map(h => gradient(['#6366f1', '#8b5cf6'])(h)),
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '╭', 'top-right': '╮',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '╰', 'bottom-right': '╯',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│'
    },
    style: {
      head: ['magenta'],
      border: ['dim']
    }
  });
  
  rows.forEach(row => table.push(row));
  return table.toString();
}

export function showAgentsTable(agents) {
  const headers = ['Tier', 'Agent', 'Status'];
  const rows = agents.map(a => [
    chalk.dim(a.tier),
    chalk.cyan(a.name),
    a.status === 'ready' ? chalk.green('●') : chalk.yellow('○')
  ]);
  console.log(createTable(headers, rows));
}

export function showCommandsTable(commands) {
  const headers = ['Command', 'Description'];
  const rows = commands.map(c => [
    chalk.cyan(c.name),
    chalk.dim(c.description)
  ]);
  console.log(createTable(headers, rows));
}
```

---

## Phase 5: Interactive Prompts

### File: `cli/lib/utils/prompts.js`

```javascript
import inquirer from 'inquirer';
import chalk from 'chalk';
import gradient from 'gradient-string';

export async function selectAgent() {
  const agents = [
    { name: '🏛️  CTO - Architecture decisions', value: 'cto' },
    { name: '📋  Planner - Task breakdown', value: 'planner' },
    { name: '🔧  Backend - API & server', value: 'backend' },
    { name: '🎨  Frontend - UI components', value: 'frontend' },
    { name: '💾  Database - Schema & queries', value: 'database' },
    { name: '🔐  Auth - Authentication', value: 'auth' },
    { name: '🛡️  Security - Security review', value: 'security' },
    { name: '📝  Testing - Write tests', value: 'testing' },
    { name: '📖  Docs - Documentation', value: 'documentation' },
    { name: '👀  Reviewer - Code review', value: 'reviewer' }
  ];

  const { agent } = await inquirer.prompt([{
    type: 'list',
    name: 'agent',
    message: gradient(['#6366f1', '#8b5cf6'])('Select an agent:'),
    choices: agents,
    pageSize: 12
  }]);
  
  return agent;
}

export async function confirmAction(message) {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: chalk.yellow(message),
    default: false
  }]);
  return confirm;
}

export async function inputText(message, defaultValue = '') {
  const { value } = await inquirer.prompt([{
    type: 'input',
    name: 'value',
    message: chalk.cyan(message),
    default: defaultValue
  }]);
  return value;
}
```

---

## Phase 6: Progress Bars

### File: `cli/lib/utils/progress.js`

```javascript
import chalk from 'chalk';

export function createProgressBar(total, width = 40) {
  let current = 0;
  
  function update(value, label = '') {
    current = value;
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    
    const bar = 
      chalk.magenta('█'.repeat(filled)) + 
      chalk.dim('░'.repeat(empty));
    
    process.stdout.write(`\r${bar} ${chalk.cyan(percentage + '%')} ${chalk.dim(label)}`);
    
    if (current >= total) {
      console.log(''); // New line at complete
    }
  }
  
  return { update };
}

// Swarm mode progress
export function showSwarmProgress(agents, currentIdx) {
  const total = agents.length;
  const filled = currentIdx + 1;
  
  console.log('');
  agents.forEach((agent, idx) => {
    let icon = '○';
    let color = chalk.dim;
    
    if (idx < currentIdx) {
      icon = '●';
      color = chalk.green;
    } else if (idx === currentIdx) {
      icon = '◉';
      color = chalk.yellow;
    }
    
    console.log(`  ${color(icon)} ${color(agent.name)}`);
  });
  console.log('');
}
```

---

## Phase 7: Enhanced Help Display

### File: `cli/lib/utils/help.js`

```javascript
import boxen from 'boxen';
import chalk from 'chalk';
import gradient from 'gradient-string';

export function showHelp() {
  const ultra = gradient(['#6366f1', '#8b5cf6'])('Ultra-Dex');
  
  const sections = [
    {
      title: '🚀 Getting Started',
      commands: [
        ['init', 'Initialize new project'],
        ['generate <idea>', 'AI-generate implementation plan'],
        ['doctor', 'Check project health']
      ]
    },
    {
      title: '🤖 AI Agents',
      commands: [
        ['agents', 'List all 16 agents'],
        ['run <agent>', 'Run specific agent'],
        ['swarm <task>', 'Run agent pipeline']
      ]
    },
    {
      title: '📊 State & Monitoring',
      commands: [
        ['status', 'Show project status'],
        ['dashboard', 'Open web dashboard'],
        ['align', 'Check plan alignment']
      ]
    },
    {
      title: '🔌 Integration',
      commands: [
        ['serve', 'Start MCP server'],
        ['config --mcp', 'Generate MCP config'],
        ['hooks', 'Install git hooks']
      ]
    }
  ];
  
  console.log('');
  console.log(`  ${ultra} ${chalk.dim('v3.1.0')}`);
  console.log(`  ${chalk.dim('AI Orchestration Meta-Layer')}`);
  console.log('');
  
  sections.forEach(section => {
    console.log(`  ${chalk.yellow(section.title)}`);
    section.commands.forEach(([cmd, desc]) => {
      console.log(`    ${chalk.cyan(cmd.padEnd(20))} ${chalk.dim(desc)}`);
    });
    console.log('');
  });
  
  console.log(`  ${chalk.dim('Run')} ${chalk.cyan('ultra-dex <command> --help')} ${chalk.dim('for details')}`);
  console.log('');
}
```

---

## Phase 8: Status Indicators

### File: `cli/lib/utils/status.js`

```javascript
import chalk from 'chalk';
import figures from 'figures';

export const icons = {
  success: chalk.green(figures.tick),
  error: chalk.red(figures.cross),
  warning: chalk.yellow(figures.warning),
  info: chalk.blue(figures.info),
  pending: chalk.gray(figures.circle),
  running: chalk.yellow(figures.play),
  pointer: chalk.magenta(figures.pointer),
  bullet: chalk.dim(figures.bullet)
};

export function statusLine(icon, text) {
  console.log(`  ${icon} ${text}`);
}

export function header(text) {
  console.log('');
  console.log(chalk.bold.white(`  ${text}`));
  console.log(chalk.dim('  ' + '─'.repeat(50)));
}

export function separator() {
  console.log('');
}
```

---

## Phase 9: Update-Notifier Integration

### File: `cli/bin/ultra-dex.js` (add at top)

```javascript
import updateNotifier from 'update-notifier';
import boxen from 'boxen';
import chalk from 'chalk';

// Check for updates
const pkg = { name: 'ultra-dex', version: '3.1.0' };
const notifier = updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 });

if (notifier.update) {
  console.log(boxen(
    `Update available! ${chalk.dim(notifier.update.current)} → ${chalk.green(notifier.update.latest)}\n` +
    `Run ${chalk.cyan('npm install -g ultra-dex')} to update`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'yellow'
    }
  ));
}
```

---

## Phase 10: Theme System

### File: `cli/lib/config/theme.js`

```javascript
import chalk from 'chalk';

export const themes = {
  default: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#d946ef',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    dim: '#6b7280'
  },
  ocean: {
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    accent: '#14b8a6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#f43f5e',
    dim: '#64748b'
  },
  forest: {
    primary: '#22c55e',
    secondary: '#10b981',
    accent: '#14b8a6',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    dim: '#6b7280'
  }
};

let currentTheme = themes.default;

export function getTheme() {
  return currentTheme;
}

export function setTheme(name) {
  if (themes[name]) {
    currentTheme = themes[name];
  }
}

export function styled(type, text) {
  return chalk.hex(currentTheme[type])(text);
}
```

---

## File Changes Summary

| File | Action |
|------|--------|
| `cli/package.json` | Add dependencies |
| `cli/lib/commands/banner.js` | Rewrite with gradient |
| `cli/lib/utils/version-display.js` | Create new |
| `cli/lib/utils/spinners.js` | Create new |
| `cli/lib/utils/tables.js` | Create new |
| `cli/lib/utils/prompts.js` | Create new |
| `cli/lib/utils/progress.js` | Create new |
| `cli/lib/utils/help.js` | Create new |
| `cli/lib/utils/status.js` | Create new |
| `cli/lib/config/theme.js` | Create new |
| `cli/bin/ultra-dex.js` | Add update-notifier |

---

## Visual Preview

After implementation:

```
╭──────────────────────────────────────────────────────────╮
│                                                          │
│  ██╗   ██╗██╗  ████████╗██████╗  █████╗       ██████╗   │
│  ██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗      ██╔══██╗  │
│  ██║   ██║██║     ██║   ██████╔╝███████║█████╗██║  ██║  │
│  (gradient magenta → purple → pink)                      │
│                                                          │
│        🪐 Ultra-Dex v3.1.0                               │
│        AI Orchestration Meta-Layer                       │
│                                                          │
╰──────────────────────────────────────────────────────────╯

  🚀 Getting Started
    init                  Initialize new project
    generate <idea>       AI-generate implementation plan
    doctor                Check project health

  🤖 AI Agents
    agents                List all 16 agents
    run <agent>           Run specific agent
    swarm <task>          Run agent pipeline

  Run ultra-dex <command> --help for details
```

---

*Implementation ready for execution*
