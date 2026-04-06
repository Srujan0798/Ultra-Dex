# Dispatch Sheet — Cycle 2: Ship-Grade Stabilization
> Source: Cycle 1 post-mortem + deep publishable-surface audit (2026-04-06)
> Gate: "Can a dev clone, build, test — all green?"
> Thesis: No new features. Fix what's broken. Prune what's dead. Make it publishable.

---

## P0 — UNBLOCK BUILD PIPELINE (Parallel-Safe, Run First)

The build, lint, and TS errors are all rooted in one cluster: the **dashboard app**.
Fix the foundation first — everything else depends on these three passing.

---

[WINDOW 1] CODEX — o1
Task ID: P0-W1
Objective: Fix dashboard build — resolve Rollup native module failure and Vite build crash
Target Files: apps/dashboard/package.json, apps/dashboard/vite.config.ts, root package-lock.json
Why this lane: Requires diagnosing native module architecture mismatch — needs reasoning
Power Tier: BALANCED
Command:
```bash
codex --full-auto -m o1 exec \
  "The dashboard build fails with: 'Cannot find module @rollup/rollup-linux-arm64-gnu'.
   The module exists in node_modules but fails to load (native binary mismatch).

   Fix steps:
   1) cd apps/dashboard && cat package.json — check if rollup/vite versions are compatible
   2) Run: npm rebuild rollup --build-from-source 2>&1
   3) If that fails: pin rollup to a version with pre-built binaries for this arch
      - In apps/dashboard/package.json, add: 'overrides': { 'rollup': '4.28.0' }
      - Or in root package.json overrides
   4) Also run: npm rebuild better-sqlite3 --build-from-source 2>&1
      (This fixes the 11 governance test failures — same native module issue)
   5) After rebuilds: run 'npm run build' from root — must exit 0
   6) Run 'npm run test:unit 2>&1 | tail -30' — governance tests must pass now

   If npm rebuild doesn't work, try: rm -rf node_modules/.cache && npm ci
   Show ALL output at each step."
```
Expected Output: `npm run build` exits 0, governance tests pass
Validation: `npm run build 2>&1 | grep -i error | wc -l` → 0
Fallback #1: codex -m gpt-4 exec "same — try npm ci --force instead of rebuild"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "Delete node_modules and package-lock.json. Run npm install. Then npm run build."
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 2] CODEX — o1
Task ID: P0-W2
Objective: Fix all 64 TypeScript errors — install missing dashboard type packages and fix Hologram.tsx
Target Files: apps/dashboard/package.json, apps/dashboard/tsconfig.json, apps/dashboard/src/pages/Hologram.tsx, apps/dashboard/src/components/__tests__/*.tsx
Why this lane: Multi-file type resolution requires judgment on correct type packages
Power Tier: BALANCED
Command:
```bash
codex --full-auto -m o1 exec \
  "Run 'npx tsc --noEmit 2>&1' and categorize all errors. There are ~64, mostly in apps/dashboard/.

   Fix in this order:
   1) Install missing type packages in apps/dashboard/:
      npm install --save-dev @types/three @react-three/fiber @react-three/drei
      (Hologram.tsx needs these for JSX intrinsic elements: mesh, group, boxGeometry, etc.)

   2) If @react-three/fiber ships its own types, add to apps/dashboard/tsconfig.json compilerOptions.types:
      ['vite/client', 'vitest/globals', '@react-three/fiber']

   3) For dashboard test errors (describe/it/expect not found):
      Ensure apps/dashboard/tsconfig.json includes vitest/globals in types array
      OR add /// <reference types='vitest/globals' /> at top of each test file

   4) For missing react-router-dom types:
      npm install --save-dev @types/react-router-dom (if not already typed)
      OR check if react-router-dom v6+ ships its own types

   5) For recharts types (TS7016 in Chart.tsx):
      recharts ships its own types — ensure version >= 2.12.0

   6) After all fixes: run 'npx tsc --noEmit 2>&1 | grep error | wc -l' → must be 0

   Do NOT use 'as any' or @ts-ignore as workarounds."
```
Expected Output: `npx tsc --noEmit` exits 0 with 0 errors
Validation: `npx tsc --noEmit 2>&1 | grep "error TS" | wc -l` → 0
Fallback #1: codex -m gpt-4 exec "same — focus on Hologram.tsx first (23 of 64 errors)"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "Install @types/three @react-three/fiber @react-three/drei in apps/dashboard"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 3] GEMINI — gemini-2.5-flash
Task ID: P0-W3
Objective: Fix ESLint crash and make lint pass (or at least run without system errors)
Target Files: eslint.config.js, package.json (lint script)
Why this lane: Config debugging — Gemini can iterate quickly at $0
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "ESLint crashes with 'Unknown system error -35: read' when running 'npm run lint'.

   Debug steps:
   1) Read eslint.config.js carefully. Identify all glob patterns in 'files' and 'ignores'.
   2) The crash is likely during config loading — a glob matches an unreadable file or broken symlink.
   3) Test incrementally:
      npx eslint --no-eslintrc --config eslint.config.js src/core/index.js 2>&1
      If that works, expand scope gradually until the crash reproduces.
   4) Common culprit: node_modules symlinks, .git directory, or binary files matched by globs.
   5) Add to ignores section: '**/node_modules/**', '**/.git/**', '**/*.node', '**/dist/**', '**/.ultra-dex/**'
   6) If the crash is from the @typescript-eslint parser loading:
      Check if @typescript-eslint/parser and @typescript-eslint/eslint-plugin versions are compatible with eslint@9.
      eslint@9 needs @typescript-eslint v8+. If v7 is installed, upgrade:
      npm install --save-dev @typescript-eslint/eslint-plugin@^8.0.0 @typescript-eslint/parser@^8.0.0
   7) After fixing: run 'npm run lint 2>&1 | tail -20' — must not crash (warnings/errors are ok, crashes are not)"
```
Expected Output: `npm run lint` runs without crashing (may report violations — that's ok)
Validation: `npm run lint 2>&1 | grep -i "system error" | wc -l` → 0
Fallback #1: gemini -p "Just add massive ignores to eslint.config.js to eliminate filesystem traversal issues"
Fallback #2: codex exec "same task"
Fallback #3: claude --model haiku -p "Downgrade eslint to 8.x if 9.x is causing plugin compat issues"
Cost Class: FREE

---

## P1 — PUBLISH SURFACE READINESS (After P0 Green)

These make Ultra-Dex installable as a real npm package and SDK.

---

[WINDOW 4] CODEX — o1
Task ID: P1-W4
Objective: Fix SDK package for independent npm publish — package.json, version alignment, exports
Target Files: packages/sdk/package.json, packages/sdk/src/, packages/sdk/types/
Why this lane: Requires understanding of npm publish requirements and monorepo workspace links
Power Tier: BALANCED
Command:
```bash
codex --full-auto -m o1 exec \
  "Read packages/sdk/package.json. The SDK must be independently installable via npm.

   Fix:
   1) Verify packages/sdk/package.json exists and has correct:
      - name: '@ultra-dex/sdk'
      - version: match root package.json (2.0.0), NOT 6.0.0
      - type: 'module'
      - main: './src/client.js'
      - types: './types/index.d.ts'
      - exports field with './client', './agent', './provider', './plugin' subpaths
      - files: ['src/', 'types/', 'README.md']
      - NO dependency on 'file:../../src/core' — SDK must be standalone

   2) Verify all imports in packages/sdk/src/*.js resolve to files that exist within packages/sdk/ (not cross-package imports)

   3) Run: cd packages/sdk && npm pack --dry-run 2>&1
      This lists what would be published. Verify it includes src/ and types/.

   4) Create packages/sdk/README.md if missing — 20-line quickstart showing:
      npm install @ultra-dex/sdk
      import { UltraDex } from '@ultra-dex/sdk'

   5) Run the SDK tests: node --test packages/sdk/test/sdk.test.js"
```
Expected Output: SDK package passes npm pack dry-run, tests pass, version aligned
Validation: `cd packages/sdk && npm pack --dry-run 2>&1 | grep -c '.js'` → shows JS files listed
Fallback #1: codex -m gpt-4 exec "same task"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "same task"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 5] CODEX — o1
Task ID: P1-W5
Objective: Fix all 15 failing unit tests — native module rebuilds + test environment issues
Target Files: tests/core/governance-*.test.js, tests/cli/run-*.test.js, tests related to TeamManager
Why this lane: Multiple failure categories requiring different fixes
Power Tier: BALANCED
Command:
```bash
codex --full-auto -m o1 exec \
  "15 unit tests fail. Three categories:

   Category A — 11 governance tests crash with ERR_DLOPEN_FAILED on better-sqlite3:
   Fix: npm rebuild better-sqlite3 --build-from-source
   If that fails: the governance tests import audit-db.js which uses better-sqlite3.
   Add graceful fallback: if better-sqlite3 fails to load, fall back to sqlite3 (already in deps).
   OR: mock better-sqlite3 in test setup for CI environments where native builds fail.

   Category B — 3 CLI tests expect AI provider output but no API key is set:
   Fix: These tests should work in MOCK_AI=true mode. Update the tests to set MOCK_AI=true
   in their test setup, OR skip with a clear message when no provider is configured:
   test('...', { skip: !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY }, () => {...})

   Category C — 3 TeamManager persistence tests fail with EPERM on file unlink:
   Fix: In test teardown (after/afterEach), use fs.rmSync(path, { recursive: true, force: true })
   instead of fs.unlinkSync(). The 'force' flag suppresses EPERM/ENOENT.

   After all fixes: run 'npm run test:unit 2>&1 | tail -10' — must show 0 failures."
```
Expected Output: All 230+ tests pass with 0 failures
Validation: `npm run test:unit 2>&1 | grep "# fail"` → `# fail 0`
Fallback #1: codex -m gpt-4 exec "same — focus on Category A (governance) first"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "Add try/catch around better-sqlite3 import in audit-db.js with fallback to in-memory"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 6] GEMINI — gemini-2.5-pro
Task ID: P1-W6
Objective: Fix all example files — correct import paths so they run from repo clone
Target Files: examples/*.js, examples/sdk.js
Why this lane: Mechanical path fixes — Gemini parallel worker at $0
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Read every .js file in examples/ directory (not subdirectories).

   All imports use WRONG relative paths. They import from './src/core/...' but should import from '../src/core/...' (one directory up, since examples/ is a subdirectory of the repo root).

   For each file:
   1) Find all import statements
   2) Fix relative paths:
      './src/'  → '../src/'
      './apps/' → '../apps/'
      './packages/' → '../packages/'
   3) Verify the target file exists at the corrected path

   Also fix examples/sdk.js specifically — it has 11 broken imports.

   After fixing: run 'node examples/sdk.js 2>&1 | head -20' to verify it at least starts (may fail on missing API key, but should NOT fail on import errors).

   Do NOT change any logic — only fix import paths."
```
Expected Output: All example .js files have correct import paths
Validation: `node -e "import('../examples/sdk.js')" 2>&1 | grep "Cannot find" | wc -l` → 0
Fallback #1: gemini -p "same — just fix examples/sdk.js first"
Fallback #2: qwen --approval-mode yolo "same task"
Fallback #3: codex exec "same task"
Cost Class: FREE

---

[WINDOW 7] QWEN — qwen-turbo
Task ID: P1-W7
Objective: Fix version string mismatch — doctor.js hardcodes v2.4.0 while package.json says 2.0.0
Target Files: apps/cli/lib/commands/doctor.js, any other files with hardcoded version strings
Why this lane: Simple grep-and-replace — Qwen labor
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "1) grep -r '2\.4\.0' apps/cli/ src/ --include='*.js' --include='*.ts' -l
     Find all files with hardcoded version '2.4.0'
   2) In each file: replace the hardcoded version with a dynamic import from package.json:
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
      const { version } = require('../../package.json');
      OR if the file already imports a config, pull version from there.
   3) Also search for other stale versions: grep -rn '\"version\".*\"[0-9]' apps/cli/lib/ --include='*.js' | grep -v node_modules
   4) Ensure 'npm start -- doctor' shows the correct version (2.0.0)"
```
Expected Output: No hardcoded version strings, doctor command shows 2.0.0
Validation: `grep -r '2\.4\.0' apps/cli/ --include='*.js' | wc -l` → 0
Fallback #1: gemini -p "same task"
Fallback #2: claude --model haiku -p "same task"
Fallback #3: Manual sed
Cost Class: FREE

---

## P2 — CLI HYGIENE & DEAD CODE PURGE

The CLI has ~150 commands. Only ~20 are active. The rest are abandoned with broken imports.
Prune ruthlessly.

---

[WINDOW 8] GEMINI — gemini-2.5-pro
Task ID: P2-W8
Objective: Audit all CLI commands — identify which are active (imported and working) vs abandoned
Target Files: apps/cli/lib/commands/*.js, apps/cli/bin/ultra-dex.js, apps/cli/bin/ultra-dex-full.js
Why this lane: Full-repo scan + classification — Gemini excels at volume analysis at $0
Power Tier: HIGH
Command:
```bash
gemini -y -p \
  "Comprehensive CLI command audit:

   1) List ALL .js files in apps/cli/lib/commands/ with their file sizes and last-modified dates
   2) Read apps/cli/bin/ultra-dex.js and apps/cli/bin/ultra-dex-full.js — identify which commands are actually registered with Commander.js
   3) For each command file:
      a) Is it imported/registered in the CLI entry point? (YES/NO)
      b) Does it import modules that exist? (run a quick check on import paths)
      c) Last modified date (anything older than Apr 3 is likely pre-refactor)
   4) Create a classification table in docs/cli-command-audit.md:
      | Command File | Registered | Imports Valid | Last Modified | Status |
      With status = ACTIVE / STALE / BROKEN / DEPRECATED
   5) List the commands recommended for deletion (STALE + BROKEN + not registered)

   Do NOT delete anything yet — just produce the audit report."
```
Expected Output: docs/cli-command-audit.md with full classification
Validation: File exists and contains table with all commands classified
Fallback #1: gemini -p "same — just list registered vs unregistered commands"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: codex exec "same task"
Cost Class: FREE

---

[WINDOW 9] CLAUDE — claude-sonnet-4
Task ID: P2-W9
Objective: Archive abandoned CLI commands and clean up the command surface (AFTER W8 audit completes)
Target Files: apps/cli/lib/commands/*.js → archive/cli-deprecated/
Why this lane: Architectural judgment on what to keep — Premium lane
Power Tier: HIGH
Depends on: W8 (audit must complete first)
Command:
```bash
claude --model sonnet --effort high \
  "Read docs/cli-command-audit.md (produced by W8).

   For every command marked STALE or BROKEN:
   1) Move it to archive/cli-deprecated/ (preserve history, don't delete)
   2) Remove its registration from ultra-dex.js / ultra-dex-full.js if present

   For commands marked DEPRECATED:
   1) Keep in place but add a deprecation notice at the top:
      console.warn('[DEPRECATED] This command will be removed in v3.0. Use X instead.');

   After pruning:
   1) Run 'npm start -- --help 2>&1' — verify help shows only active commands
   2) Run 'npm test 2>&1 | tail -10' — verify no tests broke
   3) Update docs/cli-command-audit.md with final counts:
      - Active commands: N
      - Archived commands: M
      - Deprecated commands: K

   Target: < 40 active commands in the CLI."
```
Expected Output: Dead commands archived, CLI help shows only active commands, tests pass
Validation: `ls apps/cli/lib/commands/*.js | wc -l` → < 40
Fallback #1: claude --model opus --effort max -p "same task but be very conservative — only archive commands with broken imports"
Fallback #2: codex --full-auto exec "same task"
Fallback #3: gemini -y -p "same — just move files older than Apr 1 with no registration"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 10] QWEN — qwen-plus
Task ID: P2-W10
Objective: Remove archive/ bloat — compress old archive to .tar.gz and delete the directory
Target Files: archive/ (3.6MB, 85 files)
Why this lane: Mechanical file operations — Qwen labor
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "1) Measure: du -sh archive/
   2) Create a compressed archive: tar -czf archive-backup-2026-04-06.tar.gz archive/
   3) Verify the tarball: tar -tzf archive-backup-2026-04-06.tar.gz | head -20
   4) Remove the directory: rm -rf archive/
   5) Move the tarball to a safe location: mkdir -p .archive && mv archive-backup-2026-04-06.tar.gz .archive/
   6) Add '.archive/' to .gitignore if not already there
   7) Run npm test to confirm nothing depended on archive/"
```
Expected Output: archive/ removed, .archive/archive-backup.tar.gz exists, tests pass
Validation: `ls -la archive/ 2>&1` → "No such file or directory"
Fallback #1: gemini -y -p "same task"
Fallback #2: Just rm -rf archive/ directly
Fallback #3: Keep archive/ but add to .gitignore
Cost Class: FREE

---

## P3 — DOCUMENTATION & EXAMPLES (After P0-P2 Green)

---

[WINDOW 11] CLAUDE — claude-sonnet-4
Task ID: P3-W11
Objective: Create docs/ARCHITECTURE.md — the missing canonical architecture document
Target Files: docs/ARCHITECTURE.md (new)
Why this lane: Architecture documentation requires deep understanding — Premium lane
Power Tier: HIGH
Command:
```bash
claude --model sonnet --effort high \
  "Create docs/ARCHITECTURE.md for Ultra-Dex v2.0.

   This is the CANONICAL architecture reference. It's listed in package.json 'files' but doesn't exist.

   Source material: Read src/core/index.js, src/core/orchestration/index.js, src/core/ai/ai-meta-layer.js, src/core/memory/unified-api.js, src/core/agents/ralph-loop.js, src/core/governance/governance-manager.js, src/core/mcp/server-manager.js, packages/sdk/src/client.js.

   Structure:
   1) System overview (Mermaid diagram — use the one from README.md as base)
   2) Core execution flow: CLI → Command → Orchestrator → Governance → Agent → Provider
   3) Module reference table: path, responsibility, key exports, dependencies
   4) Data flow: how a task moves from CLI input to AI response to memory storage
   5) Agent system: Ralph Loop lifecycle, Swarm pattern, agent registry
   6) Memory architecture: tiered storage (hot/warm/cold), vector search, graph queries
   7) Provider routing: strategy selection, fallback chains, cost tracking
   8) Governance: policy enforcement points, audit trail, DeniedException flow
   9) MCP integration: server lifecycle, tool registry, bidirectional mode
   10) Extension points: how to add a provider, agent, or plugin

   Keep it under 500 lines. Dense, technical, no marketing language."
```
Expected Output: docs/ARCHITECTURE.md — comprehensive, current, under 500 lines
Validation: File exists, contains Mermaid diagram, references current file paths
Fallback #1: claude --model opus --effort max -p "same — prioritize accuracy over completeness"
Fallback #2: codex -m o3 exec "same task"
Fallback #3: gemini -y -p "same — shorter version, 200 lines"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 12] GEMINI — gemini-2.5-flash
Task ID: P3-W12
Objective: Create documentation index — single entry point for all docs
Target Files: docs/INDEX.md (new)
Why this lane: Scanning + organizing — Gemini parallel worker
Power Tier: LOW
Command:
```bash
gemini -y -p \
  "The docs/ directory has 50+ subdirectories and 100+ files but no index.

   Create docs/INDEX.md that:
   1) Lists every directory in docs/ with a 1-line description
   2) Groups into sections: Architecture, Guides, API Reference, Enterprise, Testing, Planning, Reports
   3) Links to the most important doc in each section
   4) Marks docs as CURRENT (modified in last 7 days), RECENT (last 30 days), or STALE (older)
   5) Adds a 'Start Here' section at top pointing to:
      - docs/ARCHITECTURE.md (system design)
      - README.md (quickstart)
      - docs/API.md (API reference)
      - CONTRIBUTING.md (contributor guide)

   Keep it under 100 lines. Use markdown tables."
```
Expected Output: docs/INDEX.md with organized links to all documentation
Validation: `wc -l docs/INDEX.md` → < 100
Fallback #1: gemini -p "same — just list directories with descriptions"
Fallback #2: qwen --approval-mode yolo "same task"
Fallback #3: claude --model haiku -p "same task"
Cost Class: FREE

---

[WINDOW 13] GEMINI — gemini-2.5-flash
Task ID: P3-W13
Objective: Populate MCP tool registry with real tool definitions — expand from 4 stub files
Target Files: src/core/mcp/ (new tool files), src/core/mcp/server-manager.js (register tools)
Why this lane: Boilerplate generation — Gemini high-volume at $0
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Read src/core/mcp/server-manager.js and the existing tool files (graph.js, memory.js).

   The MCP tool ecosystem is minimal — only 4 files with stubs. Add real tool implementations:

   1) src/core/mcp/tools/agent-status.js — tool that returns current agent states, active tasks, health
      Input: { agentId?: string }
      Output: { agents: [{ id, status, currentTask, healthScore }] }

   2) src/core/mcp/tools/task-submit.js — tool that submits a task to the orchestrator
      Input: { task: string, priority?: 'low'|'medium'|'high', agentPreference?: string }
      Output: { taskId, status: 'queued', estimatedStart }

   3) src/core/mcp/tools/memory-search.js — tool that queries the memory system
      Input: { query: string, limit?: number, tier?: 'hot'|'warm'|'cold' }
      Output: { results: [{ content, score, tier, timestamp }] }

   4) src/core/mcp/tools/provider-info.js — tool that lists available AI providers and their status
      Input: {}
      Output: { providers: [{ name, status, latencyP50, costPer1kTokens, model }] }

   Each tool should follow the MCP tool schema pattern from @modelcontextprotocol/sdk.
   Register all tools in server-manager.js.
   Write tests/core/mcp-tools.test.js with at least 2 tests per tool."
```
Expected Output: 4 new MCP tool files, registered in server-manager, 8+ tests passing
Validation: `ls src/core/mcp/tools/*.js | wc -l` → 4+. Tests pass.
Fallback #1: gemini -p "same — just create agent-status.js and task-submit.js first"
Fallback #2: codex --full-auto exec "same task"
Fallback #3: claude --model sonnet --effort high -p "same task"
Cost Class: FREE

---

## Cycle 2 Completion Checklist

Before closing Cycle 2, verify ALL:

- [ ] `npm run build` → exits 0 (dashboard included)
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run lint` → runs without crashes
- [ ] `npm run test:unit` → 0 failures
- [ ] `npm run test:integration` → 0 failures
- [ ] `cd packages/sdk && npm pack --dry-run` → lists src/ and types/
- [ ] `node examples/sdk.js 2>&1 | grep "Cannot find module"` → 0 matches
- [ ] `grep -r '2\.4\.0' apps/cli/ --include='*.js' | wc -l` → 0
- [ ] `ls apps/cli/lib/commands/*.js | wc -l` → < 40
- [ ] `ls archive/ 2>&1` → "No such file or directory"
- [ ] `ls docs/ARCHITECTURE.md` → exists
- [ ] `ls docs/INDEX.md` → exists
- [ ] `ls src/core/mcp/tools/*.js | wc -l` → 4+

---

*Dispatches generated from Cycle 1 post-mortem — 2026-04-06*
*Protocol: .protocol/orchestration.md + execution.md*
