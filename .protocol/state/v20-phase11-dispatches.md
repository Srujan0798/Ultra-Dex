# Phase 11: CLI Control Plane (Week 7)

### OBJECTIVE
Implement locked CLI commands for Ultra-Dex v2.0: `ultradex init`, `ultradex run workflow.dex`, `ultradex status`, `ultradex resume`, `ultradex inspect`. CLI is thin wrapper around orchestrator; all logic lives in core. Commands parse .dex files, build graphs, manage scheduler, query state.

### SKILLS REFERENCED
- /engineering:system-design (CLI architecture)
- /engineering:deploy-checklist (pre-run gates)
- /engineering:testing-strategy (CLI testing)

### WINDOWS (4 per phase)

#### W1: CLI Structure & Init Command
**Task ID:** phase11-w1-cli-structure  
**Objective:** Scaffold CLI entry point; implement `ultradex init` to create .dex template + project structure  
**Target Files:** `cli/bin/ultradex.js`, `cli/commands/init.js`, `templates/.dex.template`  
**Why this lane:** Foundation; users need to initialize projects before running anything  
**Power Tier:** 1 (user interaction, file I/O)  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "Create cli/bin/ultradex.js as CLI entry point using Commander.js. Import lazy-load pattern for commands. Create cli/commands/init.js: ultradex init [projectName] → creates project dir, .dex template, workflow/ folder, .gitignore. Template must include minimal workflow graph with 2 tasks. Use Commander.description() and .action() for command. Return exit code 0 on success, 1 on error."`  
**Expected Output:** `cli/bin/ultradex.js` (80 LOC), `cli/commands/init.js` (120 LOC), `.dex.template` (30 LOC)  
**Validation:** `ultradex init test-proj` creates directory with all files; `cat test-proj/.dex` shows valid template  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m gpt-4o exec "scaffold CLI structure with init command"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $3–4 (CLI structure + file templating)  
**Dependencies:** Commander.js available; .dex file format finalized

#### W2: Run Command (Parse Graph & Start Scheduler)
**Task ID:** phase11-w2-run-command  
**Objective:** Implement `ultradex run workflow.dex` → parse file → build DexGraph → instantiate scheduler → start execution  
**Target Files:** `cli/commands/run.js`, `cli/loaders/dex-loader.ts`, `core/graph-builder.ts`  
**Why this lane:** Core execution command; orchestrates full pipeline  
**Power Tier:** 2 (async, long-running)  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "Create cli/commands/run.js: ultradex run [workflow] [--dry-run] [--timeout 3600]. Parse .dex file (YAML/JSON). Build DexGraph using AgentOrchestrator.buildGraph(). Instantiate Scheduler(graph). Call scheduler.start(). Emit events for task progress. Exit with non-zero code if any node fails. Create cli/loaders/dex-loader.ts with parseWorkflow(filePath): DexGraph. Add --dry-run to show graph without executing."`  
**Expected Output:** `cli/commands/run.js` (140 LOC), `cli/loaders/dex-loader.ts` (80 LOC)  
**Validation:** `ultradex run test-proj/workflow.dex --dry-run` shows graph; `ultradex run test-proj/workflow.dex` executes and logs progress  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m o1 exec "implement run command with graph parsing and scheduler start"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $4–5 (graph parsing + orchestrator integration)  
**Dependencies:** AgentOrchestrator stable; DexGraph schema locked; Scheduler ready

#### W3: Status & Resume Commands
**Task ID:** phase11-w3-status-resume  
**Objective:** Implement `ultradex status` (show workflow state) and `ultradex resume` (restart from crash)  
**Target Files:** `cli/commands/status.js`, `cli/commands/resume.js`, `core/orchestration/scheduler.ts`  
**Why this lane:** Resilience; users need visibility + ability to recover from failures  
**Power Tier:** 1 (state queries + transitions)  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "Create cli/commands/status.js: ultradex status [workflowId] → read workflow state from memory/persistence. Show: graph, node states (PENDING/RUNNING/SUCCESS/FAILED/PAUSED), progress %, time elapsed, cost estimate. Format as table + summary. Create cli/commands/resume.js: ultradex resume [workflowId] → load previous workflow state, resume from first FAILED/PAUSED node. Call scheduler.resume(nodeId). Show log of resumed nodes."`  
**Expected Output:** `cli/commands/status.js` (100 LOC), `cli/commands/resume.js` (90 LOC); formatted output for humans  
**Validation:** `ultradex status` shows current state; `ultradex resume` restarts from pause point; state persists across crashes  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m gpt-4o exec "implement status and resume commands with state management"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $3–4  
**Dependencies:** Memory system stable; Scheduler has resume() method; state persistence working

#### W4: Inspect Command & CLI Tests
**Task ID:** phase11-w4-inspect-tests  
**Objective:** Implement `ultradex inspect` (show graph + history); comprehensive CLI test suite  
**Target Files:** `cli/commands/inspect.js`, `tests/cli/*.test.js`  
**Why this lane:** Observability + validation; users debug via inspect; tests ensure all commands work  
**Power Tier:** 1  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "Create cli/commands/inspect.js: ultradex inspect [workflowId] → read graph, show node details (task, deps, state, logs). Show execution history (timestamps, agent, cost, output). Format as tree + JSON export option. Write tests/cli/init.test.js, run.test.js, status.test.js, resume.test.js, inspect.test.js (10 LOC each). Test happy path + error cases. Ensure all exit codes correct."`  
**Expected Output:** `cli/commands/inspect.js` (120 LOC), `tests/cli/` (50 LOC total)  
**Validation:** `npm run test:cli` passes; `ultradex inspect test-proj` shows full graph + history; all commands have --help  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m gpt-4o exec "implement inspect command and comprehensive CLI test suite"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $2–3  
**Dependencies:** All CLI commands ready; graph introspection API available

### SEQUENCE
1. W1 → W2 (init creates template for run to consume)
2. W2 → W3 (run must complete before status/resume tested)
3. W3 → W4 (all commands implemented before comprehensive tests)
4. All windows complete before Phase 12 starts

### VALIDATION CRITERIA
- [ ] `ultradex init [proj]` creates .dex template + workflow/ structure
- [ ] `ultradex run [file]` parses .dex → builds graph → starts scheduler
- [ ] `ultradex run --dry-run` shows graph without execution
- [ ] `ultradex status` shows current workflow state + progress
- [ ] `ultradex resume` restarts from last FAILED/PAUSED node
- [ ] `ultradex inspect` shows full graph + execution history
- [ ] All commands have --help and proper error messages
- [ ] CLI tests pass; all exit codes correct (0 = success, 1 = error)
- [ ] CLI is thin wrapper; all logic in core (no duplication)

### COST TRACKING
| Item | Est. Cost | Actual | Notes |
|------|-----------|--------|-------|
| W1: CLI Structure & Init | $3 | — | Templating + file I/O |
| W2: Run Command | $4 | — | Graph parsing + orchestrator integration |
| W3: Status & Resume | $3 | — | State queries + transitions |
| W4: Inspect & Tests | $2 | — | Introspection + CLI test scaffolding |
| **PHASE TOTAL** | **$12** | — | — |

### RISKS
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| CLI hangs waiting for scheduler | Medium | High | Add timeouts; async event streams |
| .dex parsing fails silently | Medium | Medium | Strict validation; helpful error messages |
| Status stale after crashes | Low | Medium | Poll memory system; force refresh flag |
| Resume picks wrong node | Low | High | Log resume decision; allow manual override |
