# Ultra-Dex v3.0 — Codex Implementation Plan

> **Give this entire document to Codex/Claude/Devin to execute**

---

## Project Context

**Repository:** `/Users/roshwinram/Music/Ultra-Dex`  
**GitHub:** github.com/Srujan0798/Ultra-Dex  
**Current Version:** 2.4.0  
**Target Version:** 3.0.0  
**Goal:** Complete the meta-orchestration layer with full 2026 technology integration

---

## Architecture Overview

```
ultra-dex/
├── cli/                    # Main CLI package (npm: ultra-dex)
│   ├── bin/ultra-dex.js   # Entry point
│   ├── lib/
│   │   ├── commands/      # All CLI commands
│   │   ├── mcp/           # MCP server implementation
│   │   ├── providers/     # AI providers (Claude, OpenAI, Gemini, Ollama)
│   │   ├── swarm/         # Agent swarm coordination
│   │   └── utils/         # Helpers
│   ├── assets/            # Bundled templates & agents
│   └── package.json
├── agents/                 # 16 specialized agent prompts
├── cursor-rules/           # 13 .mdc IDE rules
├── vscode-extension/       # VS Code extension (in progress)
└── docs/                   # Documentation
```

---

## PHASE 1: Complete Missing CLI Commands

### 1.1 Create `swarm.js` — Agent Pipeline Command

**File:** `cli/lib/commands/swarm.js`

**Purpose:** Run multiple agents in sequence to complete a task autonomously.

**Requirements:**

- Accept task description as argument
- Define pipeline: planner → cto → backend → frontend → auth → testing → reviewer
- Load each agent prompt from `agents/` directory
- Send to AI provider with context from CONTEXT.md + IMPLEMENTATION-PLAN.md
- Pass output from each agent to the next
- Support `--dry-run` to show pipeline without executing
- Support `--parallel` for parallel execution where possible
- Log progress with ora spinners

**Usage:**

```bash
npx ultra-dex swarm "Build user authentication"
npx ultra-dex swarm "Add payments" --dry-run
npx ultra-dex swarm "Build feature" --parallel
```

**Code Structure:**

```javascript
import chalk from 'chalk';
import ora from 'ora';
import { getProvider } from '../providers/index.js';
import { loadContext, loadAgentPrompt } from '../utils/files.js';

const PIPELINE = [
  { name: 'planner', tier: '1-leadership', desc: 'Break down task' },
  { name: 'cto', tier: '1-leadership', desc: 'Define architecture' },
  { name: 'database', tier: '2-development', desc: 'Design schema' },
  { name: 'backend', tier: '2-development', desc: 'Implement API' },
  { name: 'frontend', tier: '2-development', desc: 'Build UI' },
  { name: 'auth', tier: '3-security', desc: 'Add authentication' },
  { name: 'testing', tier: '5-quality', desc: 'Write tests' },
  { name: 'reviewer', tier: '5-quality', desc: 'Code review' },
];

export async function swarmCommand(task, options) {
  // Implementation here
}
```

---

### 1.2 Create `watch.js` — File Watcher Command

**File:** `cli/lib/commands/watch.js`

**Purpose:** Auto-update project state when files change.

**Requirements:**

- Watch CONTEXT.md, IMPLEMENTATION-PLAN.md, src/, app/, lib/
- Debounce file changes (500ms)
- Call updateState() on change
- Display real-time alignment score
- Support `--interval` for custom polling

**Usage:**

```bash
npx ultra-dex watch
npx ultra-dex watch --interval 1000
```

---

### 1.3 Create `diff.js` — Plan vs Code Comparison

**File:** `cli/lib/commands/diff.js`

**Purpose:** Compare implementation plan against actual code.

**Requirements:**

- Parse IMPLEMENTATION-PLAN.md sections
- Scan codebase for matching implementations
- Calculate alignment percentage per section
- Show visual diff (green=implemented, red=missing)
- Support `--json` for machine-readable output

**Usage:**

```bash
npx ultra-dex diff
npx ultra-dex diff --json > alignment.json
```

---

### 1.4 Create `export.js` — Export Project Context

**File:** `cli/lib/commands/export.js`

**Purpose:** Export project context in various formats.

**Requirements:**

- Support formats: json, html, markdown, pdf
- Include: CONTEXT.md, IMPLEMENTATION-PLAN.md, state.json
- Generate standalone HTML viewer
- Support `--include-agents` to bundle agent prompts

**Usage:**

```bash
npx ultra-dex export --format json
npx ultra-dex export --format html --include-agents
```

---

### 1.5 Create `upgrade.js` — Self-Update Check

**File:** `cli/lib/commands/upgrade.js`

**Purpose:** Check for and install CLI updates.

**Requirements:**

- Query npm registry for latest version
- Compare with current version
- Show changelog diff
- Support `--install` to auto-upgrade

**Usage:**

```bash
npx ultra-dex upgrade --check
npx ultra-dex upgrade --install
```

---

### 1.6 Enhance `config.js` — Configuration Management

**File:** `cli/lib/commands/config.js`

**Purpose:** Manage Ultra-Dex configuration.

**Requirements:**

- `--mcp`: Generate Claude Desktop MCP config
- `--cursor`: Generate Cursor settings
- `--vscode`: Generate VS Code settings
- `--show`: Display current config
- `--set key=value`: Set config values

**Usage:**

```bash
npx ultra-dex config --mcp
npx ultra-dex config --show
npx ultra-dex config --set provider=claude
```

---

## PHASE 2: Enhance MCP Server

### 2.1 Upgrade `serve.js`

**File:** `cli/lib/commands/serve.js`

**Add Endpoints:**

```
GET  /                    → Server info + version
GET  /context             → CONTEXT.md + IMPLEMENTATION-PLAN.md
GET  /state               → Machine-readable project state
GET  /score               → Alignment score (0-100)
GET  /agents              → List all 16 agents
GET  /agent/:name         → Specific agent prompt
GET  /rules               → List cursor rules
GET  /rule/:name          → Specific rule content
POST /verify              → Run verification check
POST /swarm               → Execute agent swarm
WS   /stream              → Real-time state updates
```

**Requirements:**

- Add WebSocket support for real-time updates
- Add `/swarm` endpoint for programmatic swarm execution
- Add CORS headers for browser access
- Add rate limiting
- Add API key authentication option

---

### 2.2 Create `cli/lib/mcp/websocket.js`

**Purpose:** WebSocket server for real-time updates.

**Requirements:**

- Broadcast state changes to connected clients
- Support multiple connections
- Auto-reconnect handling
- Send alignment score updates every 30 seconds

---

## PHASE 3: VS Code Extension

### 3.1 Complete Extension Features

**Directory:** `vscode-extension/`

**Required Features:**

1. **Sidebar Panel**
   - Show all 16 agents with icons
   - Click to copy agent prompt
   - Show current alignment score
   - Quick actions: generate, build, review

2. **Status Bar**
   - Current alignment score
   - Click to open dashboard

3. **Commands**
   - `Ultra-Dex: Generate Plan`
   - `Ultra-Dex: Start Build Mode`
   - `Ultra-Dex: Run Agent`
   - `Ultra-Dex: Open Dashboard`

4. **Hover Providers**
   - Hover over CONTEXT.md references to preview

**Package this as:** `ultra-dex-vscode`

---

## PHASE 4: CI/CD Integration

### 4.1 Create GitHub Actions Workflow

**File:** `.github/workflows/ultra-dex.yml`

```yaml
name: Ultra-Dex Verification

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Ultra-Dex
        run: npm install -g ultra-dex

      - name: Check Alignment
        run: npx ultra-dex align

      - name: Run Validation
        run: npx ultra-dex validate

      - name: Generate Report
        run: npx ultra-dex export --format json > ultra-dex-report.json

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: ultra-dex-report
          path: ultra-dex-report.json
```

### 4.2 Create Pre-Commit Hook Template

**File:** `cli/assets/hooks/pre-commit`

```bash
#!/bin/sh
# Ultra-Dex Pre-Commit Hook

echo "🔍 Running Ultra-Dex validation..."

# Check alignment score
SCORE=$(npx ultra-dex align --quiet)
if [ "$SCORE" -lt 70 ]; then
  echo "❌ Alignment score too low: $SCORE/100"
  echo "   Run 'npx ultra-dex status' for details"
  exit 1
fi

# Validate structure
npx ultra-dex validate --quiet
if [ $? -ne 0 ]; then
  echo "❌ Validation failed"
  exit 1
fi

echo "✅ Ultra-Dex checks passed (Score: $SCORE/100)"
exit 0
```

---

## PHASE 5: Enhanced Agent System

### 5.1 Create Meta-Orchestrator Agent

**File:** `agents/0-orchestration/meta-orchestrator.md`

**Purpose:** Coordinate all other agents automatically.

**Content:**

```markdown
# Meta-Orchestrator Agent

You are the Ultra-Dex Meta-Orchestrator. Your role is to coordinate
the 16 specialized agents to complete complex tasks.

## Capabilities

- Analyze task requirements
- Select appropriate agents
- Define execution order
- Pass context between agents
- Aggregate results

## Agent Registry

- 1-leadership: CTO, Planner, Research
- 2-development: Backend, Frontend, Database
- 3-security: Auth, Security
- 4-devops: DevOps
- 5-quality: Testing, Documentation, Reviewer, Debugger
- 6-specialist: Performance, Refactoring

## Protocol

1. Receive task description
2. Analyze complexity and requirements
3. Select minimum necessary agents
4. Define execution order (parallel where possible)
5. Execute and collect outputs
6. Synthesize final result
```

---

### 5.2 Add Agent Communication Protocol

**File:** `cli/lib/swarm/protocol.js`

**Purpose:** Standard protocol for agent-to-agent communication.

**Requirements:**

- Define input/output schema for each agent
- Support handoff messages
- Track execution history
- Enable rollback on failure

---

## PHASE 6: Dashboard Enhancement

### 6.1 Upgrade `dashboard.js`

**Requirements:**

- Real-time alignment score chart
- Agent status panel
- Recent actions timeline
- Quick action buttons
- Dark/light theme toggle
- Export report button

**Add Dependencies:**

```json
{
  "chart.js": "^4.x.x"
}
```

---

## PHASE 7: Documentation Updates

### 7.1 Update README.md

Add sections:

- v3.0 features
- MCP integration guide
- VS Code extension usage
- CI/CD setup guide

### 7.2 Create `docs/MCP-INTEGRATION.md`

Full guide for:

- Claude Desktop setup
- Cursor integration
- Custom MCP clients
- API reference

### 7.3 Create `docs/CICD-GUIDE.md`

Full guide for:

- GitHub Actions setup
- Pre-commit hooks
- Quality gates
- Automated releases

---

## PHASE 8: Testing

### 8.1 Add Command Tests

**File:** `cli/test/commands.test.js`

Test each new command:

- swarm (with mocked AI)
- watch (with file mocks)
- diff (with sample data)
- export (all formats)
- upgrade (mocked npm)
- config (all options)

### 8.2 Add MCP Tests

**File:** `cli/test/mcp.test.js`

Test all endpoints:

- GET endpoints return correct data
- POST endpoints execute correctly
- WebSocket connections work
- Error handling

---

## PHASE 9: Package & Publish

### 9.1 Update `cli/package.json`

```json
{
  "name": "ultra-dex",
  "version": "3.0.0",
  "description": "AI Orchestration Meta-Layer for SaaS Development",
  "keywords": [
    "ai",
    "orchestration",
    "saas",
    "mcp",
    "langchain",
    "claude",
    "openai",
    "gemini",
    "agents",
    "swarm"
  ]
}
```

### 9.2 Publish Checklist

```bash
cd cli
npm run test          # All tests pass
npm run lint          # No lint errors
npm version 3.0.0     # Bump version
npm publish           # Publish to npm
```

---

## Command Registration

Add all new commands to `cli/bin/ultra-dex.js`:

```javascript
import { swarmCommand } from '../lib/commands/swarm.js';
import { watchCommand } from '../lib/commands/watch.js';
import { diffCommand } from '../lib/commands/diff.js';
import { exportCommand } from '../lib/commands/export.js';
import { upgradeCommand } from '../lib/commands/upgrade.js';
import { configCommand } from '../lib/commands/config.js';

program
  .command('swarm <task>')
  .description('Run autonomous agent pipeline')
  .option('--dry-run', 'Show pipeline without executing')
  .option('--parallel', 'Run independent agents in parallel')
  .action(swarmCommand);

program
  .command('watch')
  .description('Watch files and auto-update state')
  .option('--interval <ms>', 'Polling interval', '500')
  .action(watchCommand);

program
  .command('diff')
  .description('Compare plan vs implemented code')
  .option('--json', 'Output as JSON')
  .action(diffCommand);

program
  .command('export')
  .description('Export project context')
  .option('--format <type>', 'Output format: json, html, md', 'json')
  .option('--include-agents', 'Include agent prompts')
  .action(exportCommand);

program
  .command('upgrade')
  .description('Check for CLI updates')
  .option('--check', 'Check only')
  .option('--install', 'Install update')
  .action(upgradeCommand);

program
  .command('config')
  .description('Manage configuration')
  .option('--mcp', 'Generate MCP config')
  .option('--cursor', 'Generate Cursor config')
  .option('--vscode', 'Generate VS Code config')
  .option('--show', 'Show current config')
  .option('--set <kv>', 'Set config value')
  .action(configCommand);
```

---

## Summary

| Phase     | Tasks              | Est. Time       |
| --------- | ------------------ | --------------- |
| Phase 1   | 6 new commands     | 4-6 hours       |
| Phase 2   | MCP server upgrade | 2-3 hours       |
| Phase 3   | VS Code extension  | 3-4 hours       |
| Phase 4   | CI/CD integration  | 1-2 hours       |
| Phase 5   | Agent system       | 2-3 hours       |
| Phase 6   | Dashboard          | 2-3 hours       |
| Phase 7   | Documentation      | 2-3 hours       |
| Phase 8   | Testing            | 2-3 hours       |
| Phase 9   | Publish            | 1 hour          |
| **TOTAL** |                    | **20-28 hours** |

---

## Success Criteria

After implementation:

```bash
# All these should work
npx ultra-dex swarm "Build auth" --dry-run  ✓
npx ultra-dex watch                          ✓
npx ultra-dex diff                           ✓
npx ultra-dex export --format html           ✓
npx ultra-dex upgrade --check                ✓
npx ultra-dex config --mcp                   ✓
npx ultra-dex serve                          ✓ (with WebSocket)
```

---

_Implementation Plan v3.0 — January 28, 2026_
