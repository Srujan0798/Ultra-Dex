# Dispatch Sheet — Cycle 3: ETERNAL STATE
> Source: Cycle 2 post-mortem + forensic archive analysis (2026-04-06)
> Gate: `npm install && npm run build && npm test && npx tsc --noEmit` — ALL exit 0. Zero NoopSubsystems. Archive resolved.
> Thesis: This is the FINAL cycle. Fix platform breaks. Integrate archive gold. Replace no-ops. Clean with surgical precision. Seal.

---

## P0 — PLATFORM FIXES (Make Everything Green)

The 3 remaining breaks are all native module issues. Fix the foundation.

---

[WINDOW 1] CODEX — o1
Task ID: P0-W1
Objective: Rebuild all native modules for current platform — fix sqlite3, better-sqlite3, rollup binaries
Target Files: node_modules/ (rebuild), package.json (potential overrides)
Why this lane: Native module debugging requires reasoning about platform architecture
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o1 exec \
  "Three native module failures block the project:
   1) sqlite3 — ERR_DLOPEN_FAILED invalid ELF header (compiled for macOS, running on Linux ARM64)
   2) better-sqlite3 — same issue
   3) @rollup/rollup-linux-arm64-gnu — MODULE_NOT_FOUND

   Fix sequence:
   1) npm rebuild sqlite3 --build-from-source 2>&1
   2) npm rebuild better-sqlite3 --build-from-source 2>&1
   3) npm rebuild rollup 2>&1
   4) If any rebuild fails with missing build tools:
      - Try: npm install --force @rollup/rollup-linux-arm64-gnu
      - For sqlite3: add override in package.json: 'better-sqlite3': 'latest'
   5) If rebuilds still fail: Add graceful fallback in src/core/governance/audit-db.js:
      try { db = require('better-sqlite3')(...) } catch { db = require('sqlite3')(...) }
      OR use pure-JS fallback: sql.js (WebAssembly SQLite, no native deps)
   6) After fixes:
      - npm run build 2>&1 | tail -10 (must exit 0)
      - npm run test:unit 2>&1 | grep '# fail' (must be 0)
      - Show full output"
```
Expected Output: All native modules load, build passes, governance tests pass
Validation: `npm run build && npm run test:unit 2>&1 | grep "# fail 0"`
Fallback #1: codex -m gpt-4 exec "Install sql.js as pure-JS SQLite fallback, replace better-sqlite3 in audit-db.js"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "Add try/catch around all native module imports with graceful fallback"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 2] CODEX — o1
Task ID: P0-W2
Objective: Fix ESLint crash — resolve esbuild platform mismatch and @typescript-eslint compatibility
Target Files: scripts/run-lint.js, eslint.config.js, package.json
Why this lane: Plugin compatibility requires version reasoning
Power Tier: BALANCED
Command:
```bash
codex --full-auto -m o1 exec \
  "ESLint crashes with two issues:
   1) 'Unknown system error -35: read' during ESLint initialization
   2) esbuild platform mismatch: '@esbuild/aix-ppc64' present but needs '@esbuild/linux-arm64'

   Fix:
   1) npm rebuild esbuild 2>&1 (fix platform binary)
   2) If rebuild fails: npm install --force @esbuild/linux-arm64
   3) Test ESLint directly: npx eslint --version 2>&1
   4) If ESLint still crashes: check if eslint.config.js imports crash during load:
      node -e \"import('./eslint.config.js').then(c => console.log('OK')).catch(e => console.error(e))\"
   5) Ensure @typescript-eslint/parser v8+ is installed (required for ESLint 9):
      npm ls @typescript-eslint/parser
   6) After fixing: npm run lint 2>&1 | tail -20 (must not crash; warnings OK)
   7) Remove the orphan file: rm 'apps/cli/test/nlp-router.test 2.js'"
```
Expected Output: `npm run lint` runs without crashes, orphan file removed
Validation: `npm run lint 2>&1 | grep -i "system error" | wc -l` → 0
Fallback #1: codex -m gpt-4 exec "Update scripts/run-lint.js to catch esbuild load errors gracefully"
Fallback #2: gemini -y -p "same task"
Fallback #3: claude --model haiku -p "same task"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 3] QWEN — qwen-turbo
Task ID: P0-W3
Objective: Clean up remaining platform artifacts — remove orphan files, verify clean state
Target Files: Various
Why this lane: Mechanical cleanup — Qwen labor
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Final platform cleanup:
   1) find . -name '* 2.*' -not -path '*/node_modules/*' -not -path '*/.archive/*' — list all orphan files in LIVE tree
   2) Delete any found (they're macOS copy artifacts)
   3) find . -name '.DS_Store' -not -path '*/node_modules/*' -delete
   4) Verify: git status — show what changed
   5) Run full test suite: npm test 2>&1 | grep -E '# (tests|pass|fail)'
   Do NOT touch anything in .archive/ directory"
```
Expected Output: Zero orphan files in live tree, all .DS_Store removed
Validation: `find . -name "* 2.*" -not -path "*/node_modules/*" -not -path "*/.archive/*" | wc -l` → 0
Fallback #1: Manual find and delete
Fallback #2: gemini -p "same task"
Fallback #3: claude --model haiku -p "same task"
Cost Class: FREE

---

## P1 — ARCHIVE GOLD INTEGRATION (WIP Modules → Live Source)

The archive/wip-core-modules/ contains 1.1MB of production-grade code built over many days.
Integrate the highest-value modules into the live source tree.

---

[WINDOW 4] CLAUDE — claude-opus-4
Task ID: P1-W4
Objective: Integrate archive AI Router system — SmartAIRouter, model-router, MCTS engine into src/core/ai/
Target Files: .archive/**/wip-core-modules/ai/ → src/core/ai/
Why this lane: Architecture-critical integration — merging two router implementations requires Opus-level judgment
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max \
  "Two AI routing systems exist:
   A) LIVE: src/core/ai/router.js, ai-meta-layer.js — current provider abstraction
   B) ARCHIVE: .archive/**/wip-core-modules/ai/ — SmartAIRouter with cost tables, model-router with task-type routing, 9 provider implementations, MCTS reasoning engine

   Merge B into A without breaking A:
   1) Read both implementations thoroughly first
   2) From archive ai/model-router.js: extract the task-type → model routing table (code-generation → gpt-4/claude-3-opus, quick-query → haiku/flash, etc.)
      Integrate this into src/core/ai/router.js as a new routing strategy: 'task-aware'
   3) From archive ai/router.js: extract the cost-table and latency metrics system
      Merge into existing router if it doesn't already have this
   4) From archive ai/mcts/: copy the MCTS engine to src/core/ai/mcts/
      Keep it self-contained — don't wire it into the main flow yet, but make it importable
   5) From archive ai/PROVIDER-SPEC.md: copy to docs/specs/PROVIDER-SPEC.md as reference
   6) From the 9 provider implementations: check if any provide capabilities NOT in the live provider layer
      If yes: integrate. If they're duplicates of what's in src/services/ai-providers/: skip.
   7) After integration: run npm test — zero regressions
   8) Write a brief summary of what was integrated vs skipped in docs/INTEGRATION-LOG.md"
```
Expected Output: Enhanced router with task-aware strategy, MCTS engine available, provider spec documented
Validation: `npm test` passes. `grep 'task-aware' src/core/ai/router.js` → match
Fallback #1: claude --model sonnet --effort high -p "same — start with model-router integration only"
Fallback #2: codex -m o3 exec "same task"
Fallback #3: gemini -y -p "same — just copy MCTS engine and provider spec without merge"
Cost Class: API-KEY-USAGE

---

[WINDOW 5] CODEX — o1
Task ID: P1-W5
Objective: Integrate archive Performance system — token optimizer, db optimizer, caching into src/core/
Target Files: .archive/**/wip-core-modules/performance/ → src/core/performance/ or src/core/optimization/
Why this lane: Performance module needs understanding of existing optimization layer
Power Tier: BALANCED
Command:
```bash
codex --full-auto -m o1 exec \
  "Archive has a complete performance stack in .archive/**/wip-core-modules/performance/:
   - performance-optimizer.js (546 lines) — execution pipeline optimization
   - token-optimizer.js (439 lines) — token compression, batching, efficient encoding
   - db-optimizer.js (230 lines) — query optimization with caching
   - cache.js (50 lines) — LRU cache implementation
   - monitor.js (151 lines) — real-time performance monitoring

   Integration:
   1) Check if src/core/performance/ exists. If yes, merge archive into it. If no, create it.
   2) Copy token-optimizer.js → src/core/performance/token-optimizer.js
      (skip the ' 2.js' duplicate — only take the main file)
   3) Copy db-optimizer.js → src/core/performance/db-optimizer.js
   4) Copy cache.js → src/core/performance/cache.js
   5) From performance-optimizer.js: extract the execution pipeline hooks and integrate into
      src/core/orchestration/index.js — add optional performance tracking before/after executeTask()
   6) Update imports in copied files to use the live project's module paths
   7) Write tests/core/performance-integration.test.js — test token optimizer compression and cache hit/miss
   8) npm test — zero regressions"
```
Expected Output: Performance modules in src/core/performance/, integrated into orchestration
Validation: `ls src/core/performance/*.js | wc -l` → 3+. Tests pass.
Fallback #1: codex -m gpt-4 exec "same — just copy files without orchestration hook"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "same — copy files and fix imports only"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 6] CODEX — o1
Task ID: P1-W6
Objective: Integrate archive Reliability system — agent-autopsy, self-healing into agent lifecycle
Target Files: .archive/**/wip-core-modules/reliability/ → src/core/reliability/
Why this lane: Needs understanding of agent lifecycle to wire correctly
Power Tier: BALANCED
Command:
```bash
codex --full-auto -m o1 exec \
  "Archive has reliability modules in .archive/**/wip-core-modules/reliability/:
   - agent-autopsy.js — agent failure analysis with diagnostic reports
   - self-healing.js — automatic recovery strategies (restart, retry, fallback)

   Check if src/core/reliability/ already exists and has these files (Cycle 1 may have partially done this).
   If files exist: compare archive vs live versions. Keep the more complete one.
   If files don't exist: copy from archive.

   Integration:
   1) Wire self-healing into src/core/agents/ralph-loop.js:
      - On iteration failure: call self-healing recovery strategy before throwing
      - Emit 'agent.recovery' event with diagnostic info
   2) Wire agent-autopsy into src/core/orchestration/index.js:
      - When a task fails: generate autopsy report with failure context
      - Store autopsy in governance audit trail (sqlite)
   3) Write tests/core/reliability-integration.test.js
   4) npm test — zero regressions"
```
Expected Output: Self-healing wired into agent loop, autopsy integrated into orchestration
Validation: `grep 'self-healing\|autopsy' src/core/agents/ralph-loop.js` → matches. Tests pass.
Fallback #1: codex -m gpt-4 exec "same — just copy files, skip wiring"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "same task"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 7] GEMINI — gemini-2.5-pro
Task ID: P1-W7
Objective: Integrate archive Analytics + Webhooks modules
Target Files: .archive/**/wip-core-modules/analytics/ → src/core/analytics/, .archive/**/wip-core-modules/webhooks/ → src/core/webhooks/
Why this lane: Two modules, parallel integration — Gemini excels at volume
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Two archive modules need integration:

   A) ANALYTICS (.archive/**/wip-core-modules/analytics/):
   - Copy to src/core/analytics/ if it doesn't already exist
   - Update imports to use live project paths
   - Hook into orchestration layer: emit analytics events on task start/complete/fail
   - This replaces/supplements the EngagementTracker from Cycle 1

   B) WEBHOOKS (.archive/**/wip-core-modules/webhooks/):
   - Copy to src/core/webhooks/ if it doesn't already exist
   - Update imports
   - This will replace the NoopSubsystem WebhookManager in src/core/index.js

   For both:
   1) Read the archive files first to understand their API
   2) Copy, fix imports
   3) Write 3 tests each in tests/core/
   4) npm test — zero regressions"
```
Expected Output: Analytics and webhooks modules integrated, tests passing
Validation: `ls src/core/analytics/*.js src/core/webhooks/*.js 2>/dev/null | wc -l` → 2+
Fallback #1: gemini -p "same — just analytics first"
Fallback #2: codex --full-auto exec "same task"
Fallback #3: claude --model sonnet --effort high -p "same task"
Cost Class: FREE

---

[WINDOW 8] GEMINI — gemini-2.5-flash
Task ID: P1-W8
Objective: Copy archive reference docs to proper locations — templates, protocols, planning, provider spec
Target Files: .archive/**/wip-core-modules/templates/ → docs/templates/, .archive/**/protocols/ → docs/protocols/, .archive/**/planning/ → docs/planning/
Why this lane: Mechanical file movement — Gemini at $0
Power Tier: LOW
Command:
```bash
gemini -y -p \
  "Move archive reference documentation to proper doc locations:

   1) .archive/**/wip-core-modules/templates/ → docs/templates/
      (CI/CD templates, Docker templates, monitoring templates, SaaS project templates)
   2) .archive/**/protocols/ → docs/protocols/
      (Maya protocol, Vigilante protocol — agent coordination docs)
   3) .archive/**/planning/ → docs/archive-planning/
      (Historical planning docs — launch plans, implementation plans)
   4) .archive/**/gap-planning/ → docs/archive-planning/gap-analysis/
   5) If docs/specs/ doesn't exist, create it for PROVIDER-SPEC.md (from W4)

   Use cp -r (copy, don't move — archive stays intact until P3 cleanup).
   Verify: ls docs/templates/ docs/protocols/ docs/archive-planning/"
```
Expected Output: Reference docs properly organized under docs/
Validation: `ls docs/templates/ docs/protocols/ docs/archive-planning/` → all exist with files
Fallback #1: qwen --approval-mode yolo "same task"
Fallback #2: Manual cp -r commands
Fallback #3: claude --model haiku -p "same task"
Cost Class: FREE

---

## P2 — NOOPSUBSYSTEM REPLACEMENT (Real Implementations)

Replace the 6 NoopSubsystem shims in src/core/index.js with real or archive-sourced implementations.

---

[WINDOW 9] CODEX — o3
Task ID: P2-W9
Objective: Replace RateLimiter, ProviderFallback, and QueueProcessor NoopSubsystems with real implementations
Target Files: src/core/index.js, new files in src/core/infrastructure/
Why this lane: Three interrelated subsystems requiring careful design — needs strong reasoning
Power Tier: HIGH
Command:
```bash
codex -m o3 --full-auto exec \
  "src/core/index.js has 6 NoopSubsystem classes. Replace 3 of them:

   1) RateLimiter (line 51):
      Check .archive/**/wip-core-modules/ for existing rate-limiter implementation.
      If found: integrate. If not: create src/core/infrastructure/rate-limiter.js:
      - TokenBucket algorithm per provider (configurable tokens/sec)
      - SlidingWindow for burst protection
      - Hook into AIMetaLayer.call() — check rate limit before provider call
      - Methods: acquire(providerName), release(), getStats()

   2) ProviderFallback (line 60):
      Create src/core/infrastructure/provider-fallback.js:
      - CircuitBreaker pattern per provider (threshold: 3 failures, resetTimeout: 30s)
      - On provider failure: try next provider in fallback chain
      - Wire into SmartAIRouter

   3) QueueProcessor (line 61):
      Check .archive/**/wip-core-modules/ for existing queue implementation.
      Create src/core/infrastructure/queue-processor.js:
      - In-memory priority queue (no Redis dependency for now)
      - Methods: enqueue(task, priority), dequeue(), process(), getStats()
      - Hook into orchestration: tasks queue when all agents are busy

   4) Update src/core/index.js: replace NoopSubsystem classes with real imports
   5) Write tests for each: tests/core/rate-limiter.test.js, provider-fallback.test.js, queue-processor.test.js
   6) npm test — zero regressions"
```
Expected Output: 3 NoopSubsystems replaced with real implementations, tests pass
Validation: `grep 'NoopSubsystem' src/core/index.js | wc -l` → decreased by 3 (or replaced inline)
Fallback #1: codex -m o1 exec "same — implement RateLimiter only first"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "same — simple implementations, no circuit breaker"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 10] CODEX — o1
Task ID: P2-W10
Objective: Replace StreamPipeline and WebhookManager NoopSubsystems (WebhookManager from archive W7, StreamPipeline new)
Target Files: src/core/index.js, src/core/infrastructure/
Why this lane: StreamPipeline requires understanding of SSE/streaming patterns
Power Tier: BALANCED
Depends on: W7 (WebhookManager from archive should be integrated by then)
Command:
```bash
codex --full-auto -m o1 exec \
  "Two more NoopSubsystems to replace:

   1) WebhookManager:
      If W7 integrated src/core/webhooks/ successfully, wire it into src/core/index.js
      replacing the NoopSubsystem WebhookManager.
      If not: create minimal src/core/infrastructure/webhook-manager.js:
      - Register webhook URLs for events (task.complete, agent.error, etc.)
      - HTTP POST delivery with retry (3 attempts, exponential backoff)
      - Methods: register(event, url), unregister(id), deliver(event, payload), getStats()

   2) StreamPipeline:
      Create src/core/infrastructure/stream-pipeline.js:
      - Transform pipeline for streaming AI responses
      - Supports: tokenization, filtering, buffering, aggregation stages
      - ReadableStream-based (Web Streams API)
      - Methods: addStage(transform), pipe(input), getStats()
      - Wire into AIMetaLayer for streaming provider responses

   3) Update src/core/index.js: import real implementations
   4) Write tests: tests/core/stream-pipeline.test.js, tests/core/webhook-manager.test.js
   5) npm test — zero regressions"
```
Expected Output: StreamPipeline and WebhookManager replaced, tests pass
Validation: `grep 'class StreamPipeline extends NoopSubsystem' src/core/index.js` → NO match
Fallback #1: codex -m gpt-4 exec "same — StreamPipeline only"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "same task — minimal implementations"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 11] CLAUDE — claude-sonnet-4
Task ID: P2-W11
Objective: Replace PluginManager NoopSubsystem with real plugin lifecycle management
Target Files: src/core/index.js, src/core/infrastructure/plugin-manager.js (new), packages/plugins/
Why this lane: Plugin architecture requires careful API design — Premium lane
Power Tier: HIGH
Command:
```bash
claude --model sonnet --effort high \
  "The last NoopSubsystem: PluginManager.

   packages/plugins/ has 11 real plugin implementations. But src/core/index.js still uses a Noop.

   Create src/core/infrastructure/plugin-manager.js:
   1) Plugin lifecycle: install(pluginId) → activate() → deactivate() → uninstall()
   2) Plugin registry: Map of pluginId → { module, status, config, activatedAt }
   3) Auto-discovery: scan packages/plugins/ for valid plugins (check for index.js + package.json)
   4) Plugin hooks: beforeTask, afterTask, onError — plugins can register callbacks
   5) Methods: install(id), activate(id), deactivate(id), uninstall(id), list(), getStats()
   6) Validation: verify plugin exports match expected interface before activation

   Wire into src/core/index.js replacing the NoopSubsystem.

   Write tests/core/plugin-manager.test.js:
   - Test lifecycle (install → activate → deactivate)
   - Test hook invocation (beforeTask fires on task execution)
   - Test invalid plugin rejection

   npm test — zero regressions. ALL NoopSubsystems should now be replaced."
```
Expected Output: PluginManager with real lifecycle, tests pass, ZERO NoopSubsystems remain
Validation: `grep 'NoopSubsystem' src/core/index.js | wc -l` → 0 (or only the base class definition)
Fallback #1: claude --model opus --effort max -p "same — just registry + lifecycle, skip hooks"
Fallback #2: codex -m o3 exec "same task"
Fallback #3: gemini -y -p "same — minimal implementation"
Cost Class: SUBSCRIPTION-INCLUDED

---

## P3 — ARCHIVE CLEANUP (Surgical Classification & Disposal)

CRITICAL: The user spent many days building these files. Only delete what is 100% confirmed waste.

---

[WINDOW 12] CLAUDE — claude-sonnet-4
Task ID: P3-W12
Objective: Execute surgical archive cleanup — delete ONLY confirmed waste, preserve everything else
Target Files: .archive/
Why this lane: Requires judgment on what's safe to delete — Premium lane, conservative approach
Power Tier: HIGH
Command:
```bash
claude --model sonnet --effort high \
  "The .archive/ directory has been forensically classified. Execute cleanup:

   STEP 1 — DELETE (100% confirmed waste, duplicates, or empty artifacts):
   - .archive/dataless-quarantine/ (corrupted partial JSONL files, unrecoverable)
   - .archive/**/debug-scripts/ (one-off debugging scripts, no reuse value)
   - .archive/**/kimi-sessions/ (session logs from CLI runs, no code value)
   - .archive/**/legacy-hidden/.qwen/ (Qwen session artifacts)
   - .archive/**/wip-core-modules/performance/token-optimizer 2.js (macOS copy duplicate — the main file was already integrated in W5)
   - .archive/**/cli-deprecated/dashboard 2.js (macOS copy duplicate)

   STEP 2 — COMPRESS and keep (historical reference, audit value):
   - .archive/**/upgrade/reports/ → compress to .archive/history/upgrade-reports.tar.gz
   - .archive/**/session-docs/ → compress to .archive/history/session-docs.tar.gz
   - .archive/**/git-incidents/ → compress to .archive/history/git-incidents.tar.gz
   - .archive/**/legacy-hidden/.ultra-dex/audit/ → compress to .archive/history/audit-logs.tar.gz

   STEP 3 — KEEP as-is (already copied to docs/ in W8, but keep archive originals):
   - .archive/**/wip-core-modules/ (source of integrated modules — keep until Cycle 3 verified)
   - .archive/**/upgrade/tasks/ (task definitions, reference value)

   STEP 4 — After all operations:
   - du -sh .archive/ (report new size)
   - ls -la .archive/ (show final structure)
   - npm test — verify nothing broke

   DO NOT delete anything not in the STEP 1 list. When in doubt, keep."
```
Expected Output: Waste deleted, reference compressed, gold preserved. Archive smaller but intact.
Validation: `du -sh .archive/` → significantly smaller than before. `npm test` passes.
Fallback #1: claude --model opus --effort max -p "same — even more conservative, only delete dataless-quarantine"
Fallback #2: Just compress everything: `tar -czf .archive-frozen.tar.gz .archive/ && rm -rf .archive/ && mkdir .archive && mv .archive-frozen.tar.gz .archive/`
Fallback #3: Do nothing — keep archive as-is
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 13] QWEN — qwen-turbo
Task ID: P3-W13
Objective: Delete the cli-deprecated/ directory from archive (these are confirmed old CLI commands replaced by current 40-command surface)
Target Files: .archive/**/cli-deprecated/
Why this lane: Simple directory deletion — Qwen labor
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "The .archive/**/cli-deprecated/ directory contains 36 old CLI command files that were explicitly
   moved there during Cycle 2 cleanup. The current CLI in apps/cli/lib/commands/ has 40 active commands
   that replace all of these.

   1) List files: ls .archive/**/cli-deprecated/
   2) Verify none are imported by live code: grep -r 'cli-deprecated' src/ apps/ tests/ --include='*.js'
   3) If zero imports: rm -rf .archive/**/cli-deprecated/
   4) Also remove .archive/**/legacy-hidden/ EXCEPT the .ultra-dex/audit/ subdirectory (keep audit logs)
   5) Show final archive structure: find .archive/ -maxdepth 3 -type d"
```
Expected Output: cli-deprecated and most of legacy-hidden removed
Validation: `find .archive/ -name "cli-deprecated" | wc -l` → 0
Fallback #1: Manual rm -rf
Fallback #2: Keep everything
Fallback #3: gemini -p "same task"
Cost Class: FREE

---

## P4 — FINAL SEAL (Verification + Version + Changelog)

---

[WINDOW 14] CLAUDE — claude-sonnet-4
Task ID: P4-W14
Objective: Update CHANGELOG.md with full Cycle 1-3 history and bump version to 2.1.0
Target Files: CHANGELOG.md, package.json (version), packages/sdk/package.json (version)
Why this lane: Changelog writing requires architectural understanding
Power Tier: BALANCED
Command:
```bash
claude --model sonnet --effort high \
  "Create a comprehensive CHANGELOG.md documenting Cycles 1-3:

   ## [2.1.0] - 2026-04-06

   ### Cycle 3: Eternal State
   #### Added
   - AI Router: task-aware routing strategy with model-router cost tables
   - MCTS reasoning engine for complex multi-step decision making
   - Performance: token optimizer, db optimizer, LRU caching
   - Reliability: agent autopsy, self-healing recovery strategies
   - Real PluginManager with lifecycle management (install/activate/deactivate)
   - Real RateLimiter with TokenBucket and SlidingWindow algorithms
   - Real StreamPipeline with Web Streams API transform pipeline
   - Real QueueProcessor with in-memory priority queue
   - Real WebhookManager with retry delivery
   - Real ProviderFallback with CircuitBreaker pattern
   - Integrated analytics and webhooks from archive
   - Reference documentation (templates, protocols, planning) organized under docs/

   #### Removed
   - All 6 NoopSubsystem shims replaced with real implementations
   - Archive waste: debug scripts, session logs, corrupted data quarantine
   - Orphaned ' 2.*' duplicate files

   ### Cycle 2: Ship-Grade Stabilization
   #### Fixed
   - TypeScript strict mode: 0 errors (from 64)
   - SDK version aligned to 2.0.0
   - Example import paths corrected
   - CLI pruned to 40 active commands
   - docs/ARCHITECTURE.md created
   - ESLint wrapper with syntax fallback

   ### Cycle 1: Enterprise Hardening
   #### Security
   - Removed exposed API keys from repository
   - Pre-commit hooks for secret scanning
   - tar vulnerability patched (>=7.5.11)
   - CodeQL security analysis workflow
   - Default credentials removed from docker-compose.prod.yml

   #### Architecture
   - noImplicitAny: true with all strict flags
   - SystemMonitor refactored (1,480 LOC → 197 LOC facade + 4 classes)
   - Ralph Loop wall-clock timeout (5min default)
   - MCP server graceful degradation
   - Governance audit persisted to SQLite
   - Semantic task routing (TF-IDF + cosine similarity)
   - Kubernetes RBAC and NetworkPolicies

   ---

   Then bump version:
   - package.json: version → '2.1.0'
   - packages/sdk/package.json: version → '2.1.0'
   - Do NOT use npm version (it creates a git tag — just edit the files)"
```
Expected Output: CHANGELOG.md with full history, version 2.1.0
Validation: `grep '2.1.0' package.json packages/sdk/package.json` → matches in both
Fallback #1: claude --model sonnet --effort high -p "shorter changelog, just Cycle 3"
Fallback #2: codex exec "same task"
Fallback #3: gemini -y -p "same task"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 15] GEMINI — gemini-2.5-pro
Task ID: P4-W15
Objective: FINAL VERIFICATION — run every check, produce the eternal state report
Target Files: None (read-only verification)
Why this lane: Comprehensive validation — Gemini can run all checks at $0
Power Tier: HIGH
Command:
```bash
gemini -p \
  "Run the COMPLETE verification suite for Ultra-Dex v2.1.0 eternal state.
   Report each check as PASS or FAIL:

   1) npm run build 2>&1 | tail -5
   2) npx tsc --noEmit 2>&1 | grep 'error' | wc -l
   3) npm run test:unit 2>&1 | grep '# fail'
   4) npm run test:integration 2>&1 | grep '# fail'
   5) npm run lint 2>&1 | tail -5
   6) npm audit --audit-level high 2>&1 | tail -5
   7) grep 'NoopSubsystem' src/core/index.js | wc -l
   8) find . -name '* 2.*' -not -path '*/node_modules/*' -not -path '*/.archive/*' | wc -l
   9) cat package.json | grep version
   10) ls docs/ARCHITECTURE.md docs/CHANGELOG.md 2>&1
   11) ls src/core/performance/ src/core/analytics/ src/core/webhooks/ src/core/infrastructure/ 2>&1
   12) du -sh .archive/

   Produce a summary table:
   | Check | Result | Details |

   If ALL pass: output 'ETERNAL STATE ACHIEVED ✓'
   If any fail: output 'REMAINING ISSUES:' with details"
```
Expected Output: Full verification report
Validation: All 12 checks pass
Fallback #1: gemini -p "Run only checks 1-6 first"
Fallback #2: Manual execution of each check
Fallback #3: claude --model haiku -p "same verification"
Cost Class: FREE

---

## Cycle 3 Completion Checklist (THE FINAL GATE)

Before closing Cycle 3 — the Eternal State — verify ALL:

- [ ] `npm run build` → exits 0 (dashboard included)
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run test:unit` → 0 failures
- [ ] `npm run test:integration` → 0 failures
- [ ] `npm run lint` → no crashes
- [ ] `npm audit --audit-level high` → 0 high/critical
- [ ] `grep 'extends NoopSubsystem' src/core/index.js | wc -l` → 0
- [ ] `ls src/core/performance/token-optimizer.js` → exists (from archive)
- [ ] `ls src/core/ai/mcts/` → exists (from archive)
- [ ] `ls src/core/infrastructure/rate-limiter.js` → exists (new)
- [ ] `ls src/core/infrastructure/queue-processor.js` → exists (new)
- [ ] `ls src/core/infrastructure/stream-pipeline.js` → exists (new)
- [ ] `ls src/core/infrastructure/plugin-manager.js` → exists (new)
- [ ] `grep '2.1.0' package.json` → match
- [ ] `find .archive/ -name "dataless-quarantine" | wc -l` → 0 (waste deleted)
- [ ] `find . -name "* 2.*" -not -path "*/node_modules/*" -not -path "*/.archive/*" | wc -l` → 0
- [ ] `ls docs/ARCHITECTURE.md docs/templates/ docs/protocols/` → all exist
- [ ] CHANGELOG.md documents Cycles 1-3

When ALL checks pass: **Ultra-Dex has reached its Eternal State.**

---

*Cycle 3 dispatches generated from forensic archive analysis + post-Cycle 2 audit — 2026-04-06*
*Protocol: .protocol/orchestration.md + execution.md*
*"Skeleton, not a cage — but now the skeleton has real bones."*
