---
id: PHASE-06-PROMPTS
title: 'Phase 6 - Archived Tasks Prompts'
category: phases
priority: high
status: completed
version: 6.0.0
last-updated: 2026-02-10
author: Ultra-Dex Team
related:
  - PROMPT-06-INFRASTRUCTURE
  - SPEC-CLI-FRAMEWORK
tags:
  - infrastructure
  - cli
  - commands
dependencies: []
testing:
  - method: manual
  - coverage: 100%
---

# Ultra-Dex Phase 6 - Archived Tasks Prompts

> **Source:** docs/completed/, docs/FUTURE-TASKS.md, docs/ROADMAP.md
> **Total:** 20 Prompts extracted from archives
> **Date:** Feb 5, 2026

---

## 🔴 FROM ARCHIVE-PROMPTS.md (Not in Phase 5)

---

### PROMPT 16: Enhanced Check Command - P0 Section Validation

```
## Task: Enhanced Check Command with Section Validation

**Files to modify:**
- cli/lib/commands/check.js

**Requirements:**

1. Add P0 section verification:
   - Check if all P0 sections (1-12) are filled
   - Verify CONTEXT.md is up to date
   - Validate tech stack choices against package.json

2. Add content validation:
   - Check for missing acceptance criteria
   - Verify atomic task breakdown in Section 16
   - Detect placeholder text ("TO-DO", "TBD", "[Fill in]")

3. Add completeness reporting:
   - Report completeness percentage by section
   - Show which sections need attention
   - Color-coded output (green=complete, yellow=partial, red=missing)

4. Add flags:
   - `--p0-only` - Check only P0 sections
   - `--strict` - Fail on any missing content
   - `--fix` - Auto-fill with AI suggestions

**Usage:**
npx ultra-dex check --p0-only
npx ultra-dex check --strict --fix

**Commit:** "feat: Enhanced check command with section validation"
```

---

### PROMPT 17: Scaffold from Implementation Plan

```
## Task: Generate Project Structure from Plan

**Files to create:**
- cli/lib/commands/scaffold-plan.js (NEW)

**Requirements:**

1. Parse implementation plan:
   - Extract folder structure from Section 8 (Architecture)
   - Extract data models from Section 9 (Database)
   - Extract API endpoints from Section 10 (API Design)

2. Generate folder structure:
   - Create all directories from plan
   - Create empty files with TO-DO comments
   - Add JSDoc headers with section references

3. Generate config files:
   - .env.example from environment section
   - tsconfig.json / jsconfig.json
   - package.json with dependencies from tech stack

4. Generate Prisma schema:
   - Parse data model section
   - Create schema.prisma file
   - Include relations and indexes

5. Generate API placeholders:
   - Create route files for each endpoint
   - Add request/response type definitions
   - Include validation schemas (Zod)

**Usage:**
npx ultra-dex scaffold --from-plan
npx ultra-dex scaffold --from-plan --prisma-only
npx ultra-dex scaffold --from-plan --api-only

**Commit:** "feat: Add plan-based project scaffolding"
```

---

### PROMPT 18: Enhanced Export with Multiple Formats

```
## Task: Multi-Format Export Command

**Files to modify:**
- cli/lib/commands/export.js

**Requirements:**

1. Add section filtering:
   - `--sections 1,2,3` - Export specific sections only
   - `--exclude 15,16` - Exclude sections
   - `--p0` - Export only P0 sections

2. Add format options:
   - `--format yaml` - YAML for CI/CD configs
   - `--format json` - JSON for programmatic use
   - `--format pdf` - PDF using puppeteer
   - `--format html` - Standalone HTML file
   - `--format notion` - Notion-compatible markdown

3. Add enhancements:
   - Auto-generated TOC for markdown
   - Syntax highlighting for code blocks
   - Mermaid diagram rendering for PDF

4. Add templates:
   - `--template executive` - Executive summary view
   - `--template technical` - Full technical detail
   - `--template handoff` - Developer handoff format

**Usage:**
npx ultra-dex export --format pdf --template executive
npx ultra-dex export --sections 1,2,3 --format yaml
npx ultra-dex export --format notion > notion-import.md

**Commit:** "feat: Enhanced export with multiple formats and templates"
```

---

### PROMPT 19: Smart Diff with Drift Analysis

```
## Task: Implementation Drift Detection

**Files to modify:**
- cli/lib/commands/diff.js

**Requirements:**

1. Compare plan vs actual:
   - Parse implementation plan sections
   - Scan codebase for actual implementation
   - Calculate drift percentage per section

2. Show drift analysis:
   - What's in plan but not in code
   - What's in code but not in plan
   - Mismatched implementations

3. Compare with examples:
   - `--with-example ecommerce-store`
   - Show differences from reference implementation
   - Suggest improvements based on example

4. Generate delta reports:
   - List all deviations
   - Severity levels (critical, warning, info)
   - Suggested actions to align

5. Add visualization:
   - Terminal diff view with colors
   - Export to HTML for sharing
   - Mermaid diagram of architecture differences

**Usage:**
npx ultra-dex diff --analyze-drift
npx ultra-dex diff --with-example saas-analytics
npx ultra-dex diff --sections 8,9,10 --output drift-report.html

**Commit:** "feat: Smart diff with implementation drift analysis"
```

---

## 🟡 FROM FUTURE-TASKS.md

---

### PROMPT 20: Deep Graph RAG with FalkorDB

````
## Task: Implement Full Graph Database for Code Analysis

**Files to create:**
- cli/lib/graph/deep-rag.js (NEW)
- cli/lib/graph/falkordb-client.js (NEW)
- cli/lib/graph/schema.cypher (NEW)

**Requirements:**

1. Create FalkorDB integration:
   - Connect to FalkorDB (or Neo4j as fallback)
   - Import codebase into graph database
   - Create nodes: File, Function, Class, Import, Variable

2. Create relationships:
   - IMPORTS: File -> File
   - CALLS: Function -> Function
   - EXTENDS: Class -> Class
   - USES: Function -> Variable
   - DEFINES: File -> Function/Class

3. Add impact analysis:
   - `ultra-dex graph impact "User.login"` - What breaks if this changes?
   - Traverse graph to find all dependents
   - Show impact score (low/medium/high/critical)

4. Add visualization:
   - `ultra-dex graph visualize --format svg`
   - Interactive HTML graph view
   - Highlight affected nodes

5. Add semantic search:
   - `ultra-dex graph search "auth middleware"`
   - Vector embeddings for code chunks
   - Similarity search with thresholds

**Database Schema (Cypher):**
```cypher
CREATE (f:File {path: '/src/auth/login.js', lines: 150})
CREATE (fn:Function {name: 'login', file: '/src/auth/login.js', line: 25})
CREATE (c:Class {name: 'User', file: '/src/models/user.js'})
CREATE (f)-[:DEFINES]->(fn)
CREATE (fn)-[:USES]->(c)
````

**Commit:** "feat: Add deep graph RAG with FalkorDB"

```

---

### PROMPT 21: GraphRAG Impact Visualizer

```

## Task: Visual Impact Analysis Dashboard

**Files to create:**

- cli/lib/graph/impact-visualizer.js (NEW)
- dashboard/src/components/ImpactGraph.tsx (NEW)

**Requirements:**

1. Create CLI command:
   - `ultra-dex impact "path/to/file.js"`
   - `ultra-dex impact "FunctionName" --depth 3`
   - `ultra-dex impact --watch` (real-time on file changes)

2. Create impact report:
   - Direct dependencies (depth 1)
   - Indirect dependencies (depth 2-N)
   - Risk score calculation
   - Suggested test coverage

3. Create dashboard component:
   - D3.js or vis.js graph visualization
   - Clickable nodes (show file/function details)
   - Color-coded by risk level
   - Filter by file type/directory

4. Add CI integration:
   - Run impact analysis on PR
   - Comment affected areas
   - Block merge if high-risk without tests

**Usage:**
npx ultra-dex impact "src/api/payments.js"
npx ultra-dex impact "processPayment" --depth 5 --output impact.html

**Commit:** "feat: Add GraphRAG impact visualizer"

```

---

### PROMPT 22: Agent2Agent Protocol

```

## Task: Implement Agent Communication Protocol

**Files to create:**

- cli/lib/agents/protocol.js (NEW)
- cli/lib/agents/handshake.js (NEW)
- cli/lib/agents/negotiation.js (NEW)

**Requirements:**

1. Define A2A protocol:
   - Message format (JSON-RPC 2.0 based)
   - Agent identity and capabilities
   - Request/Response patterns
   - Event broadcasting

2. Create handshake mechanism:
   - Agent registration with orchestrator
   - Capability advertisement
   - Availability status

3. Create negotiation system:
   - Task assignment negotiation
   - Resource allocation
   - Conflict resolution
   - Priority handling

4. Create communication channels:
   - Direct agent-to-agent messaging
   - Broadcast to all agents
   - Topic-based subscriptions

5. Add logging and debugging:
   - Message history
   - Protocol timeline
   - Error tracking

**Message Format:**

```json
{
  "jsonrpc": "2.0",
  "method": "agent.request",
  "params": {
    "from": "@Architect",
    "to": "@Backend",
    "type": "task_assignment",
    "payload": {
      "task": "Implement authentication",
      "priority": "high",
      "deadline": "2026-02-10"
    }
  },
  "id": "msg-123"
}
```

**Commit:** "feat: Add Agent2Agent communication protocol"

```

---

### PROMPT 23: Template Marketplace

```

## Task: Create Template Marketplace System

**Files to create:**

- cli/lib/marketplace/templates.js (NEW)
- cli/lib/marketplace/template-registry.js (NEW)

**Requirements:**

1. Create template structure:
   - manifest.json for template metadata
   - Pre-filled IMPLEMENTATION-PLAN.md
   - Starter code and configurations
   - Setup scripts

2. Create registry operations:
   - `ultra-dex templates search <query>`
   - `ultra-dex templates install <name>`
   - `ultra-dex templates publish`
   - `ultra-dex templates list`

3. Template categories:
   - SaaS (multi-tenant, billing, auth)
   - E-commerce (products, cart, checkout)
   - API (REST, GraphQL, tRPC)
   - Dashboard (admin, analytics)
   - Mobile (React Native, Expo)

4. Template versioning:
   - Semver support
   - Update notifications
   - Rollback capability

5. Community features:
   - Ratings and reviews
   - Download counts
   - Featured templates

**Template Manifest:**

```json
{
  "name": "@ultra-dex/saas-starter",
  "version": "1.0.0",
  "description": "Complete SaaS starter with auth, billing, and dashboard",
  "author": "Ultra-Dex Team",
  "category": "saas",
  "stack": ["next15", "prisma", "stripe", "tailwind"],
  "files": {
    "plan": "IMPLEMENTATION-PLAN.md",
    "context": "CONTEXT.md",
    "starter": "./starter-code/"
  }
}
```

**Commit:** "feat: Add template marketplace"

```

---

### PROMPT 24: Persistent Project Memory (Vector Store)

```

## Task: Long-Term Project Memory with Vector Search

**Files to create:**

- cli/lib/memory/vector-store.js (NEW)
- cli/lib/memory/embeddings.js (NEW)
- cli/lib/memory/retriever.js (NEW)

**Requirements:**

1. Create embedding pipeline:
   - Chunk project files intelligently
   - Generate embeddings (OpenAI/local models)
   - Store in SQLite with vector extension (or Chroma)

2. Store project artifacts:
   - Implementation plan sections
   - Code files and functions
   - Agent decisions and outputs
   - Commit messages and PRs
   - Error logs and fixes

3. Create retrieval system:
   - Semantic search across all artifacts
   - Query: "What did we decide about auth?"
   - Return relevant context with sources
   - Rank by recency and relevance

4. Add memory commands:
   - `ultra-dex memory query "auth decisions"`
   - `ultra-dex memory add "We chose JWT for stateless auth"`
   - `ultra-dex memory list --recent`
   - `ultra-dex memory clear --older-than 30d`

5. Integrate with agents:
   - Auto-inject relevant memory into prompts
   - Reduce repeated explanations
   - Maintain consistency across sessions

**Commit:** "feat: Add persistent project memory with vector search"

```

---

### PROMPT 25: Model Router & Cost Optimizer

```

## Task: Intelligent Model Selection and Cost Optimization

**Files to create:**

- cli/lib/router/model-router.js (NEW)
- cli/lib/router/cost-optimizer.js (NEW)
- cli/lib/router/benchmarks.js (NEW)

**Requirements:**

1. Create model router:
   - Select best model per task type
   - Consider: speed, cost, quality, context length
   - Support fallback chains

2. Define task categories:
   - Simple: Formatting, small edits → GPT-4o-mini
   - Medium: Code generation → Claude Sonnet
   - Complex: Architecture, debugging → Claude Opus / GPT-4

3. Create cost optimizer:
   - Track spending per model
   - Set budget limits
   - Auto-downgrade when near limit
   - Report cost/quality tradeoffs

4. Create benchmarks:
   - Test tasks on different models
   - Record latency, quality, cost
   - Build task→model mapping

5. Add configuration:
   - `router.json` for custom rules
   - Per-project overrides
   - Team-wide defaults

**Router Config:**

```json
{
  "routes": [
    { "task": "code-review", "model": "claude-sonnet-5", "fallback": "gpt-4o" },
    { "task": "quick-fix", "model": "gpt-4o-mini" },
    { "task": "architecture", "model": "claude-opus", "minTokens": 8000 }
  ],
  "budget": { "daily": 10, "monthly": 200 },
  "optimization": "cost" // or "quality" or "speed"
}
```

**Commit:** "feat: Add intelligent model router and cost optimizer"

```

---

### PROMPT 26: Quality Gate System

```

## Task: Automated Quality Gates for CI/CD

**Files to create:**

- cli/lib/quality/gate.js (NEW)
- cli/lib/quality/rules.js (NEW)
- cli/lib/quality/report.js (NEW)

**Requirements:**

1. Create gate checks:
   - P0 section completeness (block if <100%)
   - Alignment score (block if <80%)
   - Test coverage (block if <70%)
   - Lint errors (block if any)
   - Security vulnerabilities (block if critical)

2. Create rule engine:
   - Define rules in `quality-gate.json`
   - Severity levels: error, warning, info
   - Custom thresholds per rule
   - Ignore patterns

3. Create reports:
   - CLI table output
   - JSON for automation
   - HTML for sharing
   - GitHub PR comment format

4. Add CI integration:
   - GitHub Action step
   - GitLab CI job
   - Exit codes for pass/fail
   - Badge generation

5. Create commands:
   - `ultra-dex gate check` - Run all gates
   - `ultra-dex gate status` - Show current state
   - `ultra-dex gate report` - Generate report

**Quality Gate Config:**

```json
{
  "gates": {
    "p0-complete": { "threshold": 100, "severity": "error" },
    "alignment": { "threshold": 80, "severity": "error" },
    "test-coverage": { "threshold": 70, "severity": "warning" },
    "lint-clean": { "threshold": 0, "severity": "error" }
  },
  "ignore": ["docs/**", "*.test.js"]
}
```

**Commit:** "feat: Add quality gate system for CI/CD"

```

---

### PROMPT 27: Decision Ledger (Audit Trail)

```

## Task: Immutable Audit Trail for AI Decisions

**Files to create:**

- cli/lib/ledger/index.js (NEW)
- cli/lib/ledger/storage.js (NEW)
- cli/lib/ledger/query.js (NEW)

**Requirements:**

1. Create ledger storage:
   - Append-only log file (.ultra-dex/ledger.jsonl)
   - Each entry timestamped and signed
   - Include: agent, action, input, output, rationale

2. Capture decision points:
   - Architecture decisions
   - Tech stack choices
   - Security configurations
   - Major code changes
   - Deployment decisions

3. Create query interface:
   - `ultra-dex ledger search "auth"`
   - `ultra-dex ledger range --from 2026-02-01 --to 2026-02-05`
   - `ultra-dex ledger agent @Architect`
   - `ultra-dex ledger export --format csv`

4. Add compliance features:
   - Tamper detection (checksums)
   - Export for auditors
   - Retention policies
   - GDPR-compliant deletion

5. Integrate with agents:
   - Auto-log all agent decisions
   - Required rationale field
   - Link to affected files

**Ledger Entry:**

```json
{
  "id": "led-12345",
  "timestamp": "2026-02-05T10:30:00Z",
  "agent": "@Architect",
  "action": "tech_stack_decision",
  "input": "user requested database choice",
  "output": "PostgreSQL with Prisma ORM",
  "rationale": "PostgreSQL for reliability, Prisma for type safety",
  "affected_files": ["prisma/schema.prisma", "src/db.ts"],
  "checksum": "sha256:abc123"
}
```

**Commit:** "feat: Add decision ledger for audit trail"

```

---

## 🟢 FROM ROADMAP.md / VISION-V2.md

---

### PROMPT 28: JetBrains Plugin Foundation

```

## Task: Create JetBrains IDE Plugin

**Files to create:**

- jetbrains-plugin/ (NEW directory)
- jetbrains-plugin/src/main/kotlin/UltraDexPlugin.kt
- jetbrains-plugin/build.gradle.kts

**Requirements:**

1. Create plugin structure:
   - Kotlin-based IntelliJ plugin
   - Compatible with WebStorm, PhpStorm, PyCharm
   - Tool window for Ultra-Dex panel

2. Create UI components:
   - Project status panel
   - Agent selector
   - Alignment score display
   - Quick action buttons

3. Create integrations:
   - Connect to `ultra-dex serve` via HTTP/WebSocket
   - File change detection
   - Code navigation from plan

4. Create actions:
   - Run agent from context menu
   - Generate implementation from selection
   - Quick check alignment

**Plugin.xml:**

```xml
<idea-plugin>
  <id>com.ultradex.plugin</id>
  <name>Ultra-Dex</name>
  <version>1.0.0</version>
  <vendor>Ultra-Dex Team</vendor>
  <description>AI Orchestration Layer for SaaS Development</description>
</idea-plugin>
```

**Commit:** "feat: Add JetBrains IDE plugin foundation"

```

---

### PROMPT 29: Neovim Plugin

```

## Task: Create Neovim Plugin

**Files to create:**

- nvim-plugin/ (NEW directory)
- nvim-plugin/lua/ultra-dex/init.lua
- nvim-plugin/lua/ultra-dex/commands.lua
- nvim-plugin/lua/ultra-dex/ui.lua

**Requirements:**

1. Create Lua plugin:
   - Native Neovim plugin
   - Lazy.nvim / Packer compatible
   - Telescope integration

2. Create commands:
   - `:UltraDexStatus` - Show project status
   - `:UltraDexAgents` - List agents
   - `:UltraDexRun <agent>` - Run agent
   - `:UltraDexCheck` - Run alignment check

3. Create UI:
   - Floating window for status
   - Telescope picker for agents
   - LSP-style diagnostics

4. Create integrations:
   - Connect to `ultra-dex serve`
   - Sync on buffer save
   - Virtual text for inline hints

**Lazy.nvim Config:**

```lua
{
  "ultra-dex/nvim-plugin",
  config = function()
    require("ultra-dex").setup({
      server = "http://localhost:3001",
      auto_connect = true,
    })
  end,
}
```

**Commit:** "feat: Add Neovim plugin"

```

---

### PROMPT 30: Auto-Implement Full Automation

```

## Task: Fully Autonomous Feature Implementation

**Files to create:**

- cli/lib/commands/auto-implement.js (enhance)
- cli/lib/automation/pipeline.js (NEW)
- cli/lib/automation/checkpoints.js (NEW)

**Requirements:**

1. Create full automation pipeline:
   - Input: Feature description
   - Output: Implemented, tested, deployed code

2. Pipeline stages:
   - Stage 1: Generate implementation plan section
   - Stage 2: Break into atomic tasks
   - Stage 3: Run swarm for implementation
   - Stage 4: Run tests
   - Stage 5: Fix failures (self-healing)
   - Stage 6: Create PR
   - Stage 7: Request review

3. Create checkpoints:
   - Human approval gates at configurable points
   - `--no-stop` for fully autonomous
   - `--approve <checkpoint>` to continue

4. Create rollback:
   - Git branch per automation run
   - Easy rollback on failure
   - Cleanup old branches

5. Add monitoring:
   - Real-time progress in dashboard
   - Slack/Discord notifications
   - Time and cost estimates

**Usage:**
npx ultra-dex auto-implement "Add user profile page" --full
npx ultra-dex auto-implement "Fix auth bug" --no-stop

**Commit:** "feat: Add fully autonomous auto-implement pipeline"

```

---

### PROMPT 31: Self-Healing CI/CD Monitor

```

## Task: CI/CD Auto-Fix System

**Files to modify:**

- cli/lib/commands/ci-monitor.js (enhance)

**Files to create:**

- cli/lib/ci/healer.js (NEW)
- cli/lib/ci/strategies.js (NEW)

**Requirements:**

1. Monitor CI failures:
   - GitHub Actions webhook listener
   - Parse failure logs
   - Categorize failure type

2. Auto-fix strategies:
   - Lint errors → Run auto-fix, commit
   - Test failures → Analyze, generate fix, commit
   - Build errors → Check dependencies, update
   - Type errors → Generate type fixes

3. Create healing loop:
   - Detect failure → Analyze → Fix → Re-run → Verify
   - Max 3 attempts per failure
   - Escalate to human if unfixable

4. Add notifications:
   - Slack: "CI fixed automatically: [details]"
   - Discord: Same
   - Email: Summary of fixes

5. Add reporting:
   - Fix success rate
   - Common failure patterns
   - Time saved metrics

**Usage:**
npx ultra-dex ci-monitor --watch
npx ultra-dex ci-monitor --heal --max-attempts 3

**Commit:** "feat: Add self-healing CI/CD monitor"

```

---

### PROMPT 32: Team Workspace Collaboration

```

## Task: Multi-User Team Workspaces

**Files to create:**

- cli/lib/team/workspace.js (NEW)
- cli/lib/team/sync.js (NEW)
- cli/lib/team/permissions.js (NEW)

**Requirements:**

1. Create workspace management:
   - Create team workspace
   - Invite members
   - Role assignment (admin, developer, viewer)

2. Create sync system:
   - CONTEXT.md sync across team
   - Implementation plan locking
   - Conflict resolution

3. Create permissions:
   - Section-level edit permissions
   - Agent execution permissions
   - Deployment approvals

4. Create activity:
   - Activity feed
   - Change notifications
   - @mentions

5. Add commands:
   - `ultra-dex team create <name>`
   - `ultra-dex team invite <email>`
   - `ultra-dex team sync`
   - `ultra-dex team activity`

**Commit:** "feat: Add team workspace collaboration"

```

---

### PROMPT 33: Jira Integration

```

## Task: Jira Epic/Story Generator

**Files to create:**

- cli/lib/integrations/jira.js (NEW)

**Requirements:**

1. Create Jira client:
   - REST API integration
   - OAuth2 authentication
   - Project selection

2. Sync capabilities:
   - Create epics from implementation plan sections
   - Create stories from atomic tasks
   - Link stories to epics
   - Sync status bidirectionally

3. Add mapping:
   - Section → Epic
   - Task → Story
   - Subtask → Subtask
   - Agent assignment → Assignee

4. Add commands:
   - `ultra-dex sync --jira --project PROJ`
   - `ultra-dex jira status`
   - `ultra-dex jira link PROJ-123`

**Commit:** "feat: Add Jira epic/story integration"

```

---

### PROMPT 34: Notion Integration

```

## Task: Notion Template Sync

**Files to create:**

- cli/lib/integrations/notion.js (NEW)

**Requirements:**

1. Create Notion client:
   - REST API integration
   - OAuth2 authentication
   - Database selection

2. Sync capabilities:
   - Export plan to Notion page
   - Sync section changes
   - Import from Notion template

3. Add formatting:
   - Preserve markdown formatting
   - Convert mermaid to images
   - Handle code blocks

4. Add commands:
   - `ultra-dex sync --notion --page-id xxx`
   - `ultra-dex notion export`
   - `ultra-dex notion import <url>`

**Commit:** "feat: Add Notion template sync"

```

---

### PROMPT 35: Trello Board Generator

```

## Task: Trello Board Auto-Generator

**Files to create:**

- cli/lib/integrations/trello.js (NEW)

**Requirements:**

1. Create Trello client:
   - REST API integration
   - API key + token auth
   - Board selection

2. Generate structure:
   - Lists: Backlog, In Progress, Review, Done
   - Cards from atomic tasks
   - Labels from priority/section

3. Add features:
   - Checklists from task breakdowns
   - Due dates from estimates
   - Member assignments

4. Add commands:
   - `ultra-dex sync --trello --board-id xxx`
   - `ultra-dex trello create-board <name>`
   - `ultra-dex trello status`

**Commit:** "feat: Add Trello board generator"

```

---

## 📊 SUMMARY TABLE

| # | Feature | Source | Effort | Priority |
|---|---------|--------|--------|----------|
| 16 | Enhanced Check | ARCHIVE | 4h | 🔴 High |
| 17 | Scaffold from Plan | ARCHIVE | 6h | 🔴 High |
| 18 | Export Formats | ARCHIVE | 3h | 🟡 Medium |
| 19 | Smart Diff | ARCHIVE | 2h | 🟡 Medium |
| 20 | Deep Graph RAG | FUTURE | 3 weeks | 🟡 Medium |
| 21 | Impact Visualizer | FUTURE | 1 week | 🟡 Medium |
| 22 | Agent2Agent | FUTURE | 2 weeks | 🟢 Low |
| 23 | Template Marketplace | FUTURE | 2 weeks | 🟢 Low |
| 24 | Vector Memory | FUTURE | 2 weeks | 🟡 Medium |
| 25 | Model Router | FUTURE | 1 week | 🟡 Medium |
| 26 | Quality Gates | FUTURE | 1 week | 🔴 High |
| 27 | Decision Ledger | FUTURE | 1 week | 🟢 Low |
| 28 | JetBrains Plugin | ROADMAP | 3 weeks | 🟢 Low |
| 29 | Neovim Plugin | ROADMAP | 1 week | 🟢 Low |
| 30 | Auto-Implement Full | VISION | 2 weeks | 🟡 Medium |
| 31 | Self-Healing CI | VISION | 2 weeks | 🟡 Medium |
| 32 | Team Workspaces | VISION | 2 weeks | 🟢 Low |
| 33 | Jira Integration | FUTURE | 1 week | 🟢 Low |
| 34 | Notion Integration | FUTURE | 3 days | 🟢 Low |
| 35 | Trello Generator | FUTURE | 3 days | 🟢 Low |

---

**Total Phase 6: ~15 weeks of work**

**Recommended Order:**
1. Prompts 16-19 (ARCHIVE - quick wins, 15h total)
2. Prompts 24-26 (Core improvements)
3. Prompts 20-21 (Graph features)
4. Prompts 28-31 (Platform expansion)
5. Prompts 32-35 (Integrations)

---

*All prompts extracted from docs/completed/, docs/FUTURE-TASKS.md, docs/ROADMAP.md*
*Copy any prompt and paste to Codex/Claude/Gemini!*
```
