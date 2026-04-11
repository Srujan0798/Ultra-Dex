# V2.0 PHASE 3 DISPATCHES — SCALE (Months 5-6)
> Source: V2.0 Strategic Plan + /engineering:system-design + /engineering:testing-strategy
> Depends: Phase 2 COMPLETE (Bandit router, RAG pipeline, Marketplace v1, LiteLLM)
> Skills Used: /engineering:system-design, /engineering:testing-strategy, /engineering:architecture

---

## PHASE OVERVIEW

**Thesis:** Extend Ultra-Dex beyond CLI into IDE, plugins, and enterprise. VSCode extension puts Ultra-Dex where developers live. Plugin system creates composable agent packages. Enterprise features unlock paid tiers. Performance optimization ensures production readiness at scale.

**Success Gate:**
```bash
# VSCode extension installs and runs tasks
code --install-extension ultra-dex → extension active, sidebar shows agent panel
# Plugin system works
ultra-dex plugin install @ultra-dex/github → GitHub-aware agent loaded
ultra-dex plugin list → shows installed plugins with capabilities
# Enterprise features
ultra-dex team create "acme-corp" → team workspace created
ultra-dex rbac assign --user alice --role admin → RBAC enforced
# Performance
ultra-dex run planner -t "task" → <2s cold start, <500ms warm
npm run test:perf → all benchmarks green
```

**Total Windows:** 16 (4 per week × 4 weeks)
**Parallel Safe:** All windows within same week

---

## ═══════════════════════════════════════════════
## WEEK 9: VSCODE EXTENSION — CORE
## ═══════════════════════════════════════════════

### Week 9 Parallel: W33, W34, W35, W36
### Gate: VSCode extension loads, shows sidebar, can execute `ultra-dex run` from editor

---

### [WINDOW 33] CLAUDE — claude-opus-4
Task ID: V20-W33-VSCODE-CORE
Objective: Scaffold VSCode extension with sidebar panel, command palette, and Ultra-Dex CLI bridge
Target Files: packages/vscode-extension/src/extension.ts (NEW), packages/vscode-extension/src/sidebar.ts (NEW), packages/vscode-extension/package.json (NEW)
Why this lane: Extension architecture requires precise API knowledge and correct activation patterns. Opus for structural correctness.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Create a VSCode extension for Ultra-Dex.

   SCAFFOLD packages/vscode-extension/ with:
   1) package.json:
      - name: ultra-dex-vscode
      - activationEvents: onStartupFinished
      - contributes.viewsContainers.activitybar: Ultra-Dex icon
      - contributes.views.ultra-dex-sidebar: [agents, tasks, memory]
      - contributes.commands: ultra-dex.run, ultra-dex.swarm, ultra-dex.config

   2) src/extension.ts:
      - activate(): register commands, create sidebar provider, init CLI bridge
      - deactivate(): cleanup child processes
      - CLIBridge class: spawn ultra-dex CLI as child_process
        - executeTask(prompt): Promise<TaskResult>
        - streamOutput(callback): real-time output streaming
        - getAgents(): list available agents

   3) src/sidebar.ts:
      - UltraDexSidebarProvider implements WebviewViewProvider
      - Three panels: Agents (list + status), Tasks (history + active), Memory (search)
      - Message passing between webview and extension host

   4) src/commands.ts:
      - registerRunCommand(): input box → CLI bridge → output panel
      - registerSwarmCommand(): multi-agent task with progress
      - registerConfigCommand(): settings UI for providers/keys

   Use @types/vscode, esbuild for bundling.
   Include .vscodeignore, tsconfig.json, README.md."
```
Expected Output: Complete VSCode extension scaffold with sidebar, commands, CLI bridge
Validation:
```bash
cd packages/vscode-extension && npm install && npm run compile
# Verify: extension.ts compiles, package.json valid, no type errors
```
Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Create VSCode extension scaffold..."`
Fallback #2: `codex --full-auto -m o1 exec "Create VSCode extension for Ultra-Dex CLI..."`
Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Create VSCode extension scaffold..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 34] CLAUDE — claude-sonnet-4-20250514
Task ID: V20-W34-VSCODE-WEBVIEW
Objective: Build the webview UI for VSCode sidebar panels with React
Target Files: packages/vscode-extension/src/webview/App.tsx (NEW), packages/vscode-extension/src/webview/AgentPanel.tsx (NEW), packages/vscode-extension/src/webview/TaskPanel.tsx (NEW)
Why this lane: UI component work — Sonnet balances speed and quality for React webview code.
Power Tier: BALANCED
Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Build React webview UI for Ultra-Dex VSCode extension sidebar.

   CREATE packages/vscode-extension/src/webview/:

   1) App.tsx — Root component:
      - Tab navigation: Agents | Tasks | Memory
      - VSCode theme integration (use vscode.css variables)
      - Message bridge: window.acquireVsCodeApi() for host communication

   2) AgentPanel.tsx:
      - List all agents with role icons (Planner, Backend, Frontend, etc.)
      - Status badges: idle, running, error
      - Click agent → show capabilities, model, cost tier
      - 'Run with Agent' button → opens task input

   3) TaskPanel.tsx:
      - Active tasks with real-time progress bars
      - Task history with search/filter
      - Click task → expand to show output, cost, duration
      - Cancel button for running tasks

   4) MemoryPanel.tsx:
      - Semantic search input
      - Results as cards with relevance score
      - Memory tier indicators (L1/L2/L3)
      - Click result → copy to clipboard or inject into prompt

   Style: Use VSCode's native CSS variables (--vscode-editor-background, etc.)
   Bundle: esbuild, single output file for webview."
```
Expected Output: 4 React components for VSCode sidebar webview
Validation:
```bash
cd packages/vscode-extension && npm run build:webview
# Verify: webview bundle compiles, no React errors
```
Fallback #1: `gemini -y -p "Build React webview UI for VSCode extension sidebar..."`
Fallback #2: `codex --full-auto -m gpt-4o exec "Build VSCode webview panels..."`
Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Build React webview sidebar panels..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 35] GEMINI — gemini-2.5-pro
Task ID: V20-W35-VSCODE-TESTS
Objective: Write comprehensive test suite for VSCode extension
Target Files: packages/vscode-extension/src/test/extension.test.ts (NEW), packages/vscode-extension/src/test/cli-bridge.test.ts (NEW)
Why this lane: Test writing at volume — Gemini's free tier and 1M context handles test generation well.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Write tests for the Ultra-Dex VSCode extension.

   CREATE packages/vscode-extension/src/test/:

   1) extension.test.ts:
      - Test activate() registers all commands
      - Test deactivate() cleans up processes
      - Test sidebar provider resolves webview
      - Mock vscode module (use @vscode/test-electron or manual mocks)

   2) cli-bridge.test.ts:
      - Test executeTask() spawns CLI with correct args
      - Test streamOutput() receives chunked data
      - Test getAgents() parses CLI agent list output
      - Test timeout handling (CLI hangs → kill after 30s)
      - Test error propagation (CLI exit code != 0)

   3) commands.test.ts:
      - Test run command shows input box and executes
      - Test swarm command creates multi-agent task
      - Test config command opens settings

   Use @vscode/test-electron for integration, vitest for unit.
   Mock child_process.spawn for CLI bridge tests."
```
Expected Output: 3 test files covering extension lifecycle, CLI bridge, commands
Validation:
```bash
cd packages/vscode-extension && npm test
# Verify: all tests pass, >80% coverage on extension.ts and cli-bridge.ts
```
Fallback #1: `gemini -y --model gemini-2.5-flash -p "Write VSCode extension tests..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Write VSCode extension tests..."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Write VSCode extension tests..."`
Cost Class: FREE

---

### [WINDOW 36] QWEN — qwen-max
Task ID: V20-W36-VSCODE-DOCS
Objective: Write VSCode extension documentation, marketplace listing, and keybinding config
Target Files: packages/vscode-extension/README.md (NEW), packages/vscode-extension/CHANGELOG.md (NEW), packages/vscode-extension/.vscode/keybindings.json (NEW)
Why this lane: Documentation volume — Qwen's free tier handles repetitive doc generation.
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Write documentation for the Ultra-Dex VSCode extension.

   1) README.md — Marketplace listing:
      - Features section with screenshots placeholders
      - Installation from VSIX and marketplace
      - Configuration: provider keys, default model, memory tier
      - Commands reference table
      - Keyboard shortcuts table
      - Troubleshooting FAQ

   2) CHANGELOG.md:
      - v1.0.0: Initial release with sidebar, run/swarm/config commands, memory search

   3) .vscode/keybindings.json:
      - Ctrl+Shift+U: ultra-dex.run
      - Ctrl+Shift+S: ultra-dex.swarm
      - Ctrl+Shift+M: ultra-dex.memorySearch"
```
Expected Output: README.md, CHANGELOG.md, keybindings config
Validation:
```bash
# Verify: README renders correctly, all commands documented
cat packages/vscode-extension/README.md | head -50
```
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Rewrite VSCode extension docs..."`
Fallback #2: `gemini -y --model gemini-2.5-flash -p "Write VSCode extension docs..."`
Fallback #3: `opencode run -m opencode/llama-3.1-70b-instruct -p "Write VSCode extension documentation..."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## WEEK 10: PLUGIN SYSTEM — COMPOSABLE AGENTS
## ═══════════════════════════════════════════════

### Week 10 Parallel: W37, W38, W39, W40
### Gate: `ultra-dex plugin install @ultra-dex/github` installs a plugin, `ultra-dex plugin list` shows it

---

### [WINDOW 37] CLAUDE — claude-opus-4
Task ID: V20-W37-PLUGIN-ARCHITECTURE
Objective: Design and implement the plugin system architecture — loader, registry, lifecycle hooks
Target Files: src/core/plugins/plugin-loader.ts (NEW), src/core/plugins/plugin-registry.ts (NEW), src/core/plugins/types.ts (NEW)
Why this lane: Plugin architecture is a long-term API surface. Opus for interface correctness and extensibility design.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Design and implement Ultra-Dex plugin system.

   ARCHITECTURE:
   Plugin = agent.json (manifest) + prompt.md (system prompt) + tools/ (optional MCP tools)

   CREATE src/core/plugins/types.ts:
   - PluginManifest interface:
     { name, version, description, author, agents: AgentDef[], tools: ToolDef[],
       hooks: { onInstall?, onUninstall?, beforeTask?, afterTask? },
       dependencies: string[], minUltraDexVersion: string }
   - AgentDef: { role, model, systemPrompt, capabilities, costTier }
   - ToolDef: { name, description, schema, handler: string (path to handler) }

   CREATE src/core/plugins/plugin-loader.ts:
   - PluginLoader class:
     - loadFromPath(dir): Parse agent.json, validate manifest, register
     - loadFromNpm(packageName): npm install → loadFromPath
     - loadFromGit(repoUrl): git clone → loadFromPath
     - validateManifest(manifest): JSON Schema validation
     - resolveDepedencies(manifest): Check plugin deps are installed

   CREATE src/core/plugins/plugin-registry.ts:
   - PluginRegistry (singleton):
     - install(source): Load + validate + register agents/tools
     - uninstall(name): Remove agents/tools + cleanup
     - list(): All installed plugins with status
     - get(name): Single plugin info
     - getAgents(): All agents from all plugins
     - getTools(): All tools from all plugins
     - Storage: ~/.ultra-dex/plugins/ directory
     - Lock file: ~/.ultra-dex/plugins/lock.json

   CREATE src/core/plugins/lifecycle.ts:
   - executeHook(plugin, hookName, context): Run plugin lifecycle hooks
   - Hooks run in sandbox (vm2 or isolated-vm) for security"
```
Expected Output: Complete plugin system with loader, registry, lifecycle, types
Validation:
```bash
npm run typecheck
npm test -- tests/core/plugins/
# Verify: types compile, loader parses manifest, registry CRUD works
```
Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Implement plugin system architecture..."`
Fallback #2: `codex --full-auto -m o1 exec "Design Ultra-Dex plugin loader and registry..."`
Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Build plugin system with loader, registry, lifecycle..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 38] CLAUDE — claude-sonnet-4-20250514
Task ID: V20-W38-PLUGIN-CLI
Objective: Build CLI commands for plugin management — install, uninstall, list, create, publish
Target Files: apps/cli/lib/commands/plugin.js (NEW), apps/cli/lib/commands/plugin-create.js (NEW)
Why this lane: CLI integration — Sonnet for balanced speed on Commander.js command wiring.
Power Tier: BALANCED
Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Add plugin CLI commands to Ultra-Dex.

   CREATE apps/cli/lib/commands/plugin.js:
   - ultra-dex plugin install <source>
     source: npm package name, git URL, or local path
     --global: install to ~/.ultra-dex/plugins/
     --dev: install to ./.ultra-dex/plugins/ (project-local)
   - ultra-dex plugin uninstall <name>
   - ultra-dex plugin list [--json]
   - ultra-dex plugin info <name>
   - ultra-dex plugin update [name|--all]

   CREATE apps/cli/lib/commands/plugin-create.js:
   - ultra-dex plugin create <name>
     Interactive wizard:
     1) Name, description, author
     2) Agent roles (select from predefined or custom)
     3) Model preferences per agent
     4) Tool definitions (optional)
     5) Generate scaffold: agent.json, prompt.md, tools/, tests/
   - ultra-dex plugin publish <dir>
     Validate manifest → npm publish (or GitHub release)

   Wire into apps/cli/bin/ultra-dex.js via lazy command loading.
   Follow existing pattern from apps/cli/lib/commands/run.js."
```
Expected Output: Plugin CLI commands with install/uninstall/list/create/publish
Validation:
```bash
npm start -- plugin list
npm start -- plugin create test-plugin --help
# Verify: commands register, help text shows, no runtime errors
```
Fallback #1: `gemini -y -p "Add plugin management CLI commands to Ultra-Dex..."`
Fallback #2: `codex --full-auto -m gpt-4o exec "Build plugin CLI commands..."`
Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Create plugin CLI commands for Ultra-Dex..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 39] GEMINI — gemini-2.5-pro
Task ID: V20-W39-BUILTIN-PLUGINS
Objective: Create 3 built-in plugins — @ultra-dex/github, @ultra-dex/docker, @ultra-dex/testing
Target Files: plugins/github/agent.json (NEW), plugins/docker/agent.json (NEW), plugins/testing/agent.json (NEW)
Why this lane: Plugin authoring is structured content generation — Gemini's context window handles multi-file generation.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Create 3 built-in Ultra-Dex plugins.

   PLUGIN FORMAT: Each plugin is a directory with:
   - agent.json (manifest)
   - prompt.md (system prompt for the agent)
   - tools/ (optional MCP tool handlers)

   1) plugins/github/:
      - agent.json: GitHub-aware agent, can create PRs, review code, manage issues
      - prompt.md: System prompt for GitHub operations
      - tools/create-pr.ts, tools/review-pr.ts, tools/manage-issues.ts

   2) plugins/docker/:
      - agent.json: Docker operations agent, Dockerfile optimization, compose management
      - prompt.md: System prompt for Docker workflows
      - tools/optimize-dockerfile.ts, tools/compose-validate.ts

   3) plugins/testing/:
      - agent.json: Testing specialist, generates tests, runs coverage, mutation testing
      - prompt.md: System prompt for test generation
      - tools/generate-tests.ts, tools/run-coverage.ts

   Each agent.json must follow PluginManifest interface:
   { name, version: '1.0.0', description, author: 'ultra-dex',
     agents: [...], tools: [...], hooks: {}, dependencies: [],
     minUltraDexVersion: '4.0.0' }"
```
Expected Output: 3 complete plugin packages with manifests, prompts, tool stubs
Validation:
```bash
# Verify each plugin has valid manifest
node -e "const m = require('./plugins/github/agent.json'); console.log(m.name, m.agents.length)"
node -e "const m = require('./plugins/docker/agent.json'); console.log(m.name, m.agents.length)"
node -e "const m = require('./plugins/testing/agent.json'); console.log(m.name, m.agents.length)"
```
Fallback #1: `gemini -y --model gemini-2.5-flash -p "Create 3 built-in Ultra-Dex plugins..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Create built-in plugins..."`
Fallback #3: `opencode run -m opencode/llama-3.1-70b-instruct -p "Create Ultra-Dex plugin packages..."`
Cost Class: FREE

---

### [WINDOW 40] QWEN — qwen-max
Task ID: V20-W40-PLUGIN-DOCS
Objective: Write plugin development guide, API reference, and example walkthrough
Target Files: docs/plugins/development-guide.md (NEW), docs/plugins/api-reference.md (NEW), docs/plugins/examples.md (NEW)
Why this lane: Documentation volume at free tier.
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Write Ultra-Dex plugin developer documentation.

   1) docs/plugins/development-guide.md:
      - Plugin structure (agent.json, prompt.md, tools/)
      - Creating your first plugin (step-by-step)
      - Manifest schema reference
      - Agent definition guide
      - Tool definition guide with MCP integration
      - Lifecycle hooks (onInstall, beforeTask, afterTask)
      - Testing plugins locally

   2) docs/plugins/api-reference.md:
      - PluginManifest interface (full schema)
      - AgentDef interface
      - ToolDef interface
      - PluginLoader API
      - PluginRegistry API
      - Lifecycle hook context object

   3) docs/plugins/examples.md:
      - Example: Simple agent plugin (code review bot)
      - Example: Tool plugin (Jira integration)
      - Example: Multi-agent plugin (full-stack dev team)"
```
Expected Output: 3 documentation files for plugin developers
Validation:
```bash
wc -l docs/plugins/*.md
# Verify: each file >100 lines, covers all topics
```
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Rewrite plugin docs with more examples..."`
Fallback #2: `gemini -y --model gemini-2.5-flash -p "Write Ultra-Dex plugin documentation..."`
Fallback #3: `opencode run -m opencode/llama-3.3-70b-instruct -p "Write plugin developer documentation..."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## WEEK 11: ENTERPRISE & TEAM FEATURES
## ═══════════════════════════════════════════════

### Week 11 Parallel: W41, W42, W43, W44
### Gate: `ultra-dex team create` works, RBAC enforced, audit log captures all actions

---

### [WINDOW 41] CLAUDE — claude-opus-4
Task ID: V20-W41-TEAM-WORKSPACE
Objective: Implement team workspace management — create, join, share configs, shared memory
Target Files: src/core/team/workspace.ts (NEW), src/core/team/membership.ts (NEW), src/core/team/shared-memory.ts (NEW)
Why this lane: Team architecture is security-critical. Opus for correct isolation and access patterns.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Implement Ultra-Dex team workspace system.

   CREATE src/core/team/workspace.ts:
   - TeamWorkspace class:
     - create(name, owner): Create workspace with UUID, store in ~/.ultra-dex/teams/
     - join(workspaceId, userId): Add member with default role
     - leave(workspaceId, userId): Remove member
     - getConfig(): Shared team config (providers, models, policies)
     - setConfig(key, value): Update shared config (admin only)
     - Storage: ~/.ultra-dex/teams/{id}/config.json, members.json

   CREATE src/core/team/membership.ts:
   - Role enum: owner, admin, member, viewer
   - Permissions matrix:
     - owner: all operations + delete workspace
     - admin: manage members, update config, run tasks
     - member: run tasks, read memory
     - viewer: read only
   - checkPermission(userId, action): boolean
   - assignRole(userId, role): Update membership

   CREATE src/core/team/shared-memory.ts:
   - SharedMemoryPool extends ppmManager:
     - Namespace isolation: team/{workspaceId}/memory/
     - Access control: respect role permissions on write
     - Merge strategy: last-write-wins with conflict log
     - Search across team memory pool

   Integrate with existing GovernanceManager for policy enforcement."
```
Expected Output: Team workspace, membership/RBAC, shared memory with isolation
Validation:
```bash
npm run typecheck
npm test -- tests/core/team/
# Verify: workspace CRUD works, RBAC enforced, memory isolated between teams
```
Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Implement team workspace system..."`
Fallback #2: `codex --full-auto -m o1 exec "Build team workspace with RBAC..."`
Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Implement team workspace with RBAC and shared memory..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 42] CLAUDE — claude-sonnet-4-20250514
Task ID: V20-W42-AUDIT-ENTERPRISE
Objective: Build enterprise audit trail — structured logs, compliance export, retention policies
Target Files: src/core/audit/audit-trail.ts (NEW), src/core/audit/compliance-export.ts (NEW), src/core/audit/retention.ts (NEW)
Why this lane: Audit logging is structured but must be correct. Sonnet for balanced implementation speed.
Power Tier: BALANCED
Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Build enterprise audit trail for Ultra-Dex.

   CREATE src/core/audit/audit-trail.ts:
   - AuditTrail class:
     - log(event: AuditEvent): Append to structured audit log
     - AuditEvent: { timestamp, userId, teamId, action, resource, details, result, cost }
     - Actions: task.run, task.complete, task.fail, agent.select, provider.call,
       memory.read, memory.write, plugin.install, plugin.uninstall,
       team.create, team.join, rbac.change, config.update
     - Storage: append-only JSONL to ~/.ultra-dex/audit/{date}.jsonl
     - Rotation: new file per day, compress after 7 days

   CREATE src/core/audit/compliance-export.ts:
   - exportCSV(dateRange, filters): Export audit logs as CSV
   - exportJSON(dateRange, filters): Export as JSON array
   - exportSOC2(dateRange): SOC2-formatted report (access controls + data handling)
   - Filters: by user, team, action, resource, date range

   CREATE src/core/audit/retention.ts:
   - RetentionPolicy: { retainDays: number, archiveAfterDays: number, deleteAfterDays: number }
   - enforceRetention(): Compress old logs, archive, delete expired
   - Default: retain 90 days, archive 365 days, delete after 730 days

   Wire into GovernanceManager: every governance check also writes audit event."
```
Expected Output: Audit trail with structured logging, compliance export, retention
Validation:
```bash
npm run typecheck
npm test -- tests/core/audit/
# Verify: events logged correctly, CSV export parseable, retention enforced
```
Fallback #1: `gemini -y -p "Build enterprise audit trail system..."`
Fallback #2: `codex --full-auto -m gpt-4o exec "Implement audit trail with compliance export..."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Build enterprise audit logging system..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 43] GEMINI — gemini-2.5-pro
Task ID: V20-W43-TEAM-CLI
Objective: Build CLI commands for team management — create, join, invite, rbac, audit
Target Files: apps/cli/lib/commands/team.js (NEW), apps/cli/lib/commands/audit.js (NEW)
Why this lane: CLI command wiring — Gemini for structured command generation at free tier.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Add team and audit CLI commands to Ultra-Dex.

   CREATE apps/cli/lib/commands/team.js:
   - ultra-dex team create <name> [--description]
   - ultra-dex team join <workspace-id>
   - ultra-dex team leave [--confirm]
   - ultra-dex team invite <email> [--role member|admin]
   - ultra-dex team members [--json]
   - ultra-dex team config get <key>
   - ultra-dex team config set <key> <value>
   - ultra-dex team rbac assign --user <id> --role <role>
   - ultra-dex team rbac check --user <id> --action <action>

   CREATE apps/cli/lib/commands/audit.js:
   - ultra-dex audit show [--days 7] [--user <id>] [--action <type>]
   - ultra-dex audit export --format csv|json|soc2 --from <date> --to <date>
   - ultra-dex audit retention --set <days>
   - ultra-dex audit stats [--days 30]

   Wire into apps/cli/bin/ultra-dex.js via lazy loading.
   Follow existing Commander.js patterns from run.js."
```
Expected Output: Team and audit CLI commands fully wired
Validation:
```bash
npm start -- team --help
npm start -- audit --help
# Verify: all subcommands register, help text complete
```
Fallback #1: `gemini -y --model gemini-2.5-flash -p "Add team CLI commands..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Build team management CLI..."`
Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Create team and audit CLI commands..."`
Cost Class: FREE

---

### [WINDOW 44] CODEX — o1
Task ID: V20-W44-TEAM-TESTS
Objective: Write comprehensive tests for team workspace, RBAC, audit, and shared memory
Target Files: tests/core/team/workspace.test.ts (NEW), tests/core/team/rbac.test.ts (NEW), tests/core/audit/audit-trail.test.ts (NEW)
Why this lane: Test correctness for security-critical features. Codex o1 for reasoning about edge cases.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o1 exec \
  "Write comprehensive tests for Ultra-Dex team and audit systems.

   CREATE tests/core/team/workspace.test.ts:
   - Test workspace CRUD (create, read, update, delete)
   - Test member join/leave lifecycle
   - Test workspace isolation (team A can't access team B data)
   - Test config sharing within team

   CREATE tests/core/team/rbac.test.ts:
   - Test each role's permissions (owner > admin > member > viewer)
   - Test permission escalation prevention
   - Test role assignment requires admin+
   - Test viewer can't write memory or run tasks

   CREATE tests/core/audit/audit-trail.test.ts:
   - Test all audit event types are captured
   - Test append-only invariant (can't modify past events)
   - Test date rotation (new file per day)
   - Test CSV export format correctness
   - Test SOC2 export includes required fields
   - Test retention policy enforcement (compress, archive, delete)

   Use Node's built-in test runner (node --test), not Jest.
   Mock file system operations for isolation."
```
Expected Output: Comprehensive test suite for team and audit features
Validation:
```bash
npm test -- tests/core/team/ tests/core/audit/
# Verify: all tests pass, RBAC edge cases covered
```
Fallback #1: `codex --full-auto -m gpt-4o exec "Write team and audit tests..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Write team/audit tests..."`
Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Write team workspace and audit tests..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## ═══════════════════════════════════════════════
## WEEK 12: PERFORMANCE OPTIMIZATION & PHASE GATE
## ═══════════════════════════════════════════════

### Week 12 Parallel: W45, W46, W47, W48
### Gate: Cold start <2s, warm <500ms, memory <200MB, all tests pass, version bump to 5.0.0

---

### [WINDOW 45] CLAUDE — claude-opus-4
Task ID: V20-W45-PERF-OPTIMIZATION
Objective: Profile and optimize Ultra-Dex startup, routing, and memory operations
Target Files: src/core/performance/profiler.ts (NEW), src/core/performance/lazy-loader.ts (NEW), src/core/ai/ai-meta-layer.js (MODIFY)
Why this lane: Performance optimization requires deep understanding of execution paths. Opus for architectural optimization.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Profile and optimize Ultra-Dex performance.

   TARGETS:
   - Cold start: currently ~4s → target <2s
   - Warm start (cached): currently ~1.5s → target <500ms
   - Memory: currently ~300MB peak → target <200MB
   - Routing decision: currently ~100ms → target <20ms

   CREATE src/core/performance/profiler.ts:
   - Profiler class: measure startup phases, routing decisions, memory operations
   - Output: flame graph JSON compatible with Chrome DevTools
   - CLI: ultra-dex perf profile → run profiler and output report

   CREATE src/core/performance/lazy-loader.ts:
   - LazyModule: delay-load heavy modules until first use
   - Targets: ai-meta-layer (defer provider init), memory (defer vector index),
     governance (defer policy load), plugins (defer registry scan)
   - Measure: require() time per module

   MODIFY src/core/ai/ai-meta-layer.js:
   - Lazy-init provider connections (don't connect on import)
   - Cache provider health checks (TTL: 60s)
   - Pool HTTP connections (keep-alive for provider APIs)

   MODIFY src/core/memory/unified-api.js:
   - Lazy-load vector index (only when semantic search called)
   - LRU cache for recent lookups (size: 1000)
   - Batch writes to disk (flush every 100 ops or 5s)

   MODIFY apps/cli/bin/ultra-dex.js:
   - Defer Commander.js command registration (lazy load command files)
   - Skip unused subsystem init based on command being run"
```
Expected Output: Profiler, lazy loader, optimized startup and runtime
Validation:
```bash
# Benchmark cold start
time npm start -- --version
# Benchmark task execution
time npm start -- run planner -t "hello" --mock
# Memory check
node --max-old-space-size=200 apps/cli/bin/ultra-dex.js --version
```
Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Optimize Ultra-Dex performance..."`
Fallback #2: `codex --full-auto -m o1 exec "Profile and optimize startup performance..."`
Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Profile and optimize Node.js CLI startup time..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 46] CLAUDE — claude-sonnet-4-20250514
Task ID: V20-W46-PERF-BENCHMARKS
Objective: Create automated performance benchmark suite with regression detection
Target Files: tests/perf/startup.bench.ts (NEW), tests/perf/routing.bench.ts (NEW), tests/perf/memory.bench.ts (NEW)
Why this lane: Benchmark authoring — Sonnet for balanced speed on structured test generation.
Power Tier: BALANCED
Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Create performance benchmark suite for Ultra-Dex.

   CREATE tests/perf/startup.bench.ts:
   - Benchmark cold start time (fork process, measure to first output)
   - Benchmark warm start (pre-cached modules)
   - Benchmark command parse time
   - Thresholds: cold <2000ms, warm <500ms, parse <100ms

   CREATE tests/perf/routing.bench.ts:
   - Benchmark provider selection (1000 iterations, measure p50/p95/p99)
   - Benchmark with/without constraints
   - Benchmark stat update after routing decision
   - Thresholds: selection <20ms p95, update <5ms p95

   CREATE tests/perf/memory.bench.ts:
   - Benchmark memory store (1000 entries)
   - Benchmark semantic search (100 queries against 10K entries)
   - Benchmark peak RSS after full startup
   - Thresholds: store <1ms/op, search <50ms/query, RSS <200MB

   Output format: TAP with custom perf annotations.
   CI integration: npm run test:perf → exit 1 if any threshold exceeded.
   Add test:perf script to package.json."
```
Expected Output: 3 benchmark files with regression detection
Validation:
```bash
npm run test:perf
# Verify: benchmarks run, thresholds checked, no regressions
```
Fallback #1: `gemini -y -p "Create performance benchmarks for Ultra-Dex..."`
Fallback #2: `codex --full-auto -m gpt-4o exec "Write performance benchmark suite..."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create perf benchmark suite..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 47] GEMINI — gemini-2.5-pro
Task ID: V20-W47-PHASE3-INTEGRATION
Objective: Integration test for all Phase 3 features — VSCode, plugins, team, performance
Target Files: tests/integration/phase3-e2e.test.ts (NEW)
Why this lane: Integration test generation — Gemini for comprehensive scenario coverage.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Write Phase 3 end-to-end integration test for Ultra-Dex.

   CREATE tests/integration/phase3-e2e.test.ts:

   SCENARIO 1: Plugin Lifecycle
   - Install @ultra-dex/github plugin from local path
   - Verify agent registered in orchestrator
   - Run task using plugin's agent
   - Verify plugin's beforeTask/afterTask hooks fired
   - Uninstall plugin, verify cleanup

   SCENARIO 2: Team Workspace
   - Create team workspace
   - Add member with 'member' role
   - Verify member can run tasks
   - Verify member can't change config (RBAC)
   - Verify audit log captures all actions
   - Export audit as CSV, verify format

   SCENARIO 3: Performance Regression
   - Run startup benchmark, assert <2s
   - Run routing benchmark, assert <20ms p95
   - Run memory benchmark, assert <200MB peak

   SCENARIO 4: Full Stack
   - Create team → install plugin → run task with plugin agent →
     verify memory stored → search memory → check audit trail →
     export audit → uninstall plugin → verify cleanup

   Use MOCK_AI=true for all scenarios.
   Use Node's built-in test runner."
```
Expected Output: Comprehensive Phase 3 integration test
Validation:
```bash
MOCK_AI=true npm test -- tests/integration/phase3-e2e.test.ts
# Verify: all 4 scenarios pass
```
Fallback #1: `gemini -y --model gemini-2.5-flash -p "Write Phase 3 integration test..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Write Phase 3 e2e integration test..."`
Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Write Phase 3 integration tests..."`
Cost Class: FREE

---

### [WINDOW 48] CODEX — o3
Task ID: V20-W48-PHASE3-GATE
Objective: Final Phase 3 validation — all tests, benchmarks, version bump to 5.0.0
Target Files: package.json (MODIFY), CHANGELOG.md (MODIFY)
Why this lane: Final gate validation requires highest reasoning for correctness. Codex o3 for comprehensive verification.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o3 exec \
  "Final Phase 3 gate validation for Ultra-Dex.

   STEP 1: Run all tests
   npm test
   # Must: all unit + integration tests pass

   STEP 2: Run performance benchmarks
   npm run test:perf
   # Must: all thresholds met (cold <2s, warm <500ms, routing <20ms, memory <200MB)

   STEP 3: Run typecheck
   npm run typecheck
   # Must: no type errors

   STEP 4: Run lint
   npm run lint
   # Must: no lint errors

   STEP 5: Verify new features
   npm start -- plugin list
   npm start -- team --help
   npm start -- audit --help
   npm start -- perf profile --help

   STEP 6: Version bump
   Update package.json version to 5.0.0
   Update CHANGELOG.md with Phase 3 features:
   - VSCode extension
   - Plugin system with 3 built-in plugins
   - Team workspaces with RBAC
   - Enterprise audit trail with compliance export
   - Performance optimization (2x startup improvement)

   STEP 7: Build
   npm run build
   # Must: clean build, no warnings

   STEP 8: Tag
   git add -A && git commit -m 'feat: v5.0.0 — Scale phase complete'
   git tag v5.0.0"
```
Expected Output: All gates pass, version bumped to 5.0.0, tagged
Validation:
```bash
node -e "console.log(require('./package.json').version)"
# Must output: 5.0.0
git log --oneline -1
# Must show: feat: v5.0.0 — Scale phase complete
```
Fallback #1: `codex --full-auto -m o1 exec "Run Phase 3 gate validation..."`
Fallback #2: `claude --model opus --effort max -p "Validate Phase 3 gate..."`
Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Run full test suite and version bump..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## WINDOW SUMMARY

| Window | Agent | Task | Week | Cost |
|--------|-------|------|------|------|
| W33 | Claude Opus | VSCode extension core | 9 | SUBSCRIPTION |
| W34 | Claude Sonnet | VSCode webview UI | 9 | SUBSCRIPTION |
| W35 | Gemini Pro | VSCode tests | 9 | FREE |
| W36 | Qwen Max | VSCode docs | 9 | FREE |
| W37 | Claude Opus | Plugin architecture | 10 | SUBSCRIPTION |
| W38 | Claude Sonnet | Plugin CLI | 10 | SUBSCRIPTION |
| W39 | Gemini Pro | Built-in plugins | 10 | FREE |
| W40 | Qwen Max | Plugin docs | 10 | FREE |
| W41 | Claude Opus | Team workspace + RBAC | 11 | SUBSCRIPTION |
| W42 | Claude Sonnet | Audit trail | 11 | SUBSCRIPTION |
| W43 | Gemini Pro | Team CLI | 11 | FREE |
| W44 | Codex o1 | Team/audit tests | 11 | SUBSCRIPTION |
| W45 | Claude Opus | Perf optimization | 12 | SUBSCRIPTION |
| W46 | Claude Sonnet | Perf benchmarks | 12 | SUBSCRIPTION |
| W47 | Gemini Pro | Phase 3 integration | 12 | FREE |
| W48 | Codex o3 | Phase 3 gate | 12 | SUBSCRIPTION |

**Total: 16 windows, 4 weeks | 10 SUBSCRIPTION, 6 FREE**

---

*Phase 3 dispatches generated 2026-04-11 | V2.0 Scale | 16 windows | Weeks 9-12*
