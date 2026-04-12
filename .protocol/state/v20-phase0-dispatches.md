# Phase 0: HARD RESET (Day 0-2)

### OBJECTIVE
Restructure Ultra-Dex from feature-aggregation codebase to DexGraph control plane. Create canonical folder structure per NOTION/v2.0.MD. Delete scattered experimental logic. Consolidate Ultra-Dex + MUNI + An'tB into single platform. Validate clean slate.

### SKILLS REFERENCED
- /engineering:architecture → ADR for new structure
- /engineering:system-design → DexGraph component boundaries
- /engineering:tech-debt → Identify what to delete vs archive

### GROUND TRUTH
```
Current: src/ has 80+ subdirs (agents, ai, analytics, auth, billing, cache, certification,
         chaos, cicd, connectors, coordination, database, enterprise, finance, governance,
         marketing, marketplace, mcp, memory, mesh, monitoring, multimodal, optimization,
         orchestration, performance, plugins, queue, reliability, routing, sandbox, security,
         server, skills, streaming, system, team, telemetry, templates, tenant, testing, etc.)
Target:  7 top-level dirs (core/, runtime/, memory/, dexgraph/, adapters/, governance/, tools/)
         + 3 interface dirs (observability/, cli/, sdk/)
Tests:   134 pass / 80 fail / 58 cancelled (49% pass rate)
Version: package.json says 6.0.0 but stability doesn't match
```

### WINDOWS

#### W1: Create Target Folder Structure
- Task ID: V20-P0-W1-FOLDER-STRUCTURE
- Objective: Create the canonical DexGraph folder structure per NOTION/v2.0.MD
- Target Files: core/, runtime/, memory/, dexgraph/, adapters/, governance/, tools/, observability/, cli/, sdk/ (all NEW top-level dirs)
- Why this lane: Structural scaffolding — needs to be exactly right. Opus for precision.
- Power Tier: HIGH
- Command:
```bash
claude --model opus --effort max -p \
  "Create Ultra-Dex v2.0 DexGraph folder structure.

   DO NOT delete anything yet. Create NEW directories alongside existing src/.

   CREATE (all relative to repo root):
   core/
   ├── planner/          # goal → task graph compiler
   │   └── index.ts      # placeholder: export {}
   ├── scheduler/        # task ordering + dependency resolution
   │   └── index.ts
   └── task_graph/       # DAG engine interface
       └── index.ts

   runtime/
   ├── worker/           # agent workers (stateless)
   │   └── index.ts
   ├── executor/         # execution dispatch
   │   └── index.ts
   └── execution_engine/ # heart of the system
       └── index.ts

   memory/               # MUNI lives here
   ├── episodic/
   │   └── index.ts
   ├── semantic/
   │   └── index.ts
   └── state/
       └── index.ts

   dexgraph/
   ├── parser.ts         # YAML workflow DSL → GraphNode[]
   ├── graph.ts          # DAG builder, cycle detection, topo sort
   ├── stateMachine.ts   # CREATED→READY→RUNNING→VERIFYING→SUCCESS
   ├── scheduler.ts      # while !complete: find READY, dispatch, wait, update
   ├── dispatcher.ts     # node → adapter bridge
   └── verifier.ts       # output validation

   adapters/
   └── executionAdapter.ts  # interface ExecutionAdapter { run(task, context): Result }

   governance/
   └── rules.ts          # policy engine: block, pause, require review

   tools/
   └── registry/
       └── index.ts      # tool protocol registry

   observability/
   └── index.ts          # event emitter, logging hooks

   cli/
   └── index.ts          # ultradex init|run|status|resume|inspect

   sdk/
   └── index.ts          # developer API surface

   Each index.ts: just 'export {}' placeholder.
   Each .ts file in dexgraph/: interface stubs only (no implementation).
   Create a root tsconfig.json that includes all new dirs."
```
- Expected Output: 10 top-level directories with placeholder files
- Validation:
```bash
ls -d core/ runtime/ memory/ dexgraph/ adapters/ governance/ tools/ observability/ cli/ sdk/
find dexgraph/ -name '*.ts' | wc -l  # should be 6
```
- Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Create folder structure..."`
- Fallback #2: `gemini -y -p "Create DexGraph folder structure with placeholder files..."`
- Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Scaffold folder structure..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: None

#### W2: Audit & Archive Existing Code
- Task ID: V20-P0-W2-AUDIT-ARCHIVE
- Objective: Audit existing src/ for anything salvageable, archive the rest. Do NOT delete — move to archive/v1/
- Target Files: archive/v1/ (NEW), src/ (audit only)
- Why this lane: Audit requires reading every module and deciding keep/archive. Opus for judgment.
- Power Tier: HIGH
- Command:
```bash
claude --model opus --effort max -p \
  "Audit Ultra-Dex src/ and classify every subdirectory.

   For each dir in src/core/, decide:
   KEEP: Code that maps to DexGraph architecture (governance, memory, orchestration logic)
   ARCHIVE: Code that doesn't fit DexGraph model (marketing, billing, certification, chaos, etc.)
   MIGRATE: Code that has useful logic but needs restructuring (routing → adapters, agents → workers)

   OUTPUT a file: archive/v1/AUDIT.md with:
   | Directory | Decision | Reason | New Location |
   For every single subdirectory in src/core/

   Then:
   mkdir -p archive/v1/
   Move all ARCHIVE dirs to archive/v1/src/core/{dir}
   Leave KEEP and MIGRATE dirs in src/ for now

   CRITICAL: Use git mv (not mv) so history is preserved.
   DO NOT delete any code. Archive only."
```
- Expected Output: AUDIT.md classifying every src/ subdir, archived dirs moved
- Validation:
```bash
cat archive/v1/AUDIT.md | wc -l  # should list all 80+ dirs
ls archive/v1/src/core/ | wc -l   # archived dirs
ls src/core/ | wc -l               # remaining dirs (should be < 20)
```
- Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Audit src/ and archive non-DexGraph code..."`
- Fallback #2: `codex --full-auto -m o1 exec "Classify src/ subdirectories for DexGraph migration..."`
- Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Audit codebase and archive non-essential modules..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: None (parallel with W1)

#### W3: Consolidate Ultra-Dex + MUNI + An'tB
- Task ID: V20-P0-W3-CONSOLIDATE
- Objective: Ensure MUNI memory system maps to memory/, An'tB becomes docs-only, no separate project references
- Target Files: memory/ (populate from existing memory code), docs/architecture/antb.md (NEW)
- Why this lane: Consolidation requires understanding three codebases. Sonnet for balanced speed.
- Power Tier: BALANCED
- Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Consolidate Ultra-Dex platform modules.

   1) MUNI → memory/:
      - Find all memory-related code in src/core/memory/
      - Map to new structure:
        src/core/memory/unified-api.js → memory/state/store.ts (state management)
        src/core/memory/ vector search → memory/semantic/search.ts (semantic search)
        src/core/memory/ session management → memory/episodic/session.ts (episodic memory)
      - Copy salvageable logic, rewrite interfaces to match DexGraph types
      - memory/ should NOT import from src/ — it's standalone

   2) An'tB → docs only:
      - If any An'tB code exists, move to docs/architecture/antb.md
      - An'tB = future architecture documentation, not active build
      - Reference in docs but don't build

   3) Remove cross-references:
      - Grep for 'MUNI', 'An'tB', 'antb' across codebase
      - Update references to point to new locations
      - README references: 'MUNI memory system' → 'memory module'"
```
- Expected Output: memory/ populated with migrated code, An'tB archived to docs
- Validation:
```bash
ls memory/episodic/ memory/semantic/ memory/state/
grep -r "MUNI" core/ runtime/ dexgraph/ | wc -l  # should be 0
```
- Fallback #1: `gemini -y -p "Migrate memory system to new folder structure..."`
- Fallback #2: `codex --full-auto -m gpt-4o exec "Consolidate memory modules..."`
- Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Migrate memory code to new structure..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1 (folder structure must exist)

#### W4: Validate Clean Slate
- Task ID: V20-P0-W4-VALIDATE-CLEAN
- Objective: Verify new structure is correct, no old logic leaks, all placeholders compile, version reset
- Target Files: package.json (MODIFY), tsconfig.json (MODIFY)
- Why this lane: Validation requires comprehensive scanning. Codex o1 for thorough checking.
- Power Tier: HIGH
- Command:
```bash
codex --full-auto -m o1 exec \
  "Validate Ultra-Dex v2.0 clean slate.

   1) Verify folder structure matches NOTION/v2.0.MD exactly:
      core/planner/, core/scheduler/, core/task_graph/
      runtime/worker/, runtime/executor/, runtime/execution_engine/
      memory/episodic/, memory/semantic/, memory/state/
      dexgraph/ (6 .ts files)
      adapters/executionAdapter.ts
      governance/rules.ts
      tools/registry/
      observability/, cli/, sdk/

   2) Verify no old logic in new dirs:
      - New dirs should only have placeholder or migrated code
      - No imports from src/core/ in new dirs
      - No references to old agent system (Planner, Backend, Frontend, CTO, Reviewer roles)

   3) TypeScript compilation:
      - Create/update root tsconfig.json with paths to new dirs
      - npx tsc --noEmit on new dirs only
      - Fix any type errors

   4) Reset version:
      - Update package.json version to 2.0.0-alpha.0
      - This is a HARD RESET — version must reflect that

   5) Create MIGRATION.md:
      - Document what was archived
      - Map old locations → new locations
      - Breaking changes list
      - How to run old code (point to archive/v1/)"
```
- Expected Output: Clean, compiling v2.0 structure with migration docs
- Validation:
```bash
npx tsc --noEmit --project tsconfig.json  # should compile
node -e "console.log(require('./package.json').version)"  # 2.0.0-alpha.0
cat MIGRATION.md | head -20
```
- Fallback #1: `codex --full-auto -m gpt-4o exec "Validate clean slate..."`
- Fallback #2: `claude --model opus --effort max -p "Verify DexGraph structure and fix type errors..."`
- Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Validate folder structure and fix compilation..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1, W2, W3 (all must complete)

### SEQUENCE
W1 ║ W2 → W3 → W4
(W1 and W2 parallel, W3 needs W1, W4 needs all)

### VALIDATION CRITERIA
- [ ] 10 new top-level dirs exist with correct subdirs
- [ ] archive/v1/AUDIT.md classifies all src/ subdirs
- [ ] memory/ has migrated episodic/semantic/state modules
- [ ] No MUNI/An'tB references in new dirs
- [ ] TypeScript compiles with zero errors
- [ ] package.json version = 2.0.0-alpha.0
- [ ] MIGRATION.md documents all changes

### COST TRACKING
| Window | Tier | Agent | Est. Tokens |
|--------|------|-------|-------------|
| W1 | HIGH | Claude Opus | ~8K |
| W2 | HIGH | Claude Opus | ~15K |
| W3 | BALANCED | Claude Sonnet | ~10K |
| W4 | HIGH | Codex o1 | ~12K |

### RISKS
| Risk | Mitigation |
|------|------------|
| Archive breaks existing tests | Tests already 49% failing; archive is net improvement |
| Memory migration loses functionality | Copy, don't move — original stays in src/ until verified |
| tsconfig conflicts | Separate tsconfig for new dirs, don't touch existing |

---

*Phase 0 dispatches generated 2026-04-12 | Hard Reset | 4 windows | Day 0-2*
