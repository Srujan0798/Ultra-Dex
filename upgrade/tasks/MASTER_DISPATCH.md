# Ultra-Dex — MASTER DISPATCH GUIDE

**Cycle:** 1 — Core Integrity Hardening  
**Orchestrator:** Claude Opus (Antigravity)  
**Date:** 2026-03-27

---

## Quick Reference

```
upgrade/tasks/
├── WAVE1_QWEN_memory-audit.md          → Qwen CLI Window 1
├── WAVE1_QWEN_agents-audit.md          → Qwen CLI Window 2
├── WAVE1_QWEN_dependency-scan.md       → Qwen CLI Windows 3-4
├── WAVE1_GEMINI_test-assessment.md     → Gemini CLI Windows 1-3
├── WAVE2_CODEX_session-isolation.md    → Codex (after Wave 1)
├── WAVE2_CODEX_atomic-writes.md        → Codex (after Wave 1)
├── WAVE2_CODEX_schema-versioning.md    → Codex (after Wave 1)
├── WAVE2_CLAUDE-CODE_governance-wiring.md   → Claude Code (after Wave 1)
├── WAVE2_CLAUDE-CODE_symlink-fix.md         → Claude Code (after Wave 1)
├── WAVE2_CLAUDE-CODE_memory-bounds.md       → Claude Code (after Wave 1)
├── WAVE2_CLAUDE-CODE_remove-scheduler.md    → Claude Code (after Wave 1)
└── WAVE3_CODEX_cjs-to-esm.md          → Codex (after Wave 2 validated)
```

---

## 🟢 WAVE 1 — Dispatch NOW (Parallel Audits)

### Qwen CLI — 4 Windows

Open 4 terminal windows running Qwen. Paste these prompts:

---

**Qwen Window 1:**
```
Read the task file at upgrade/tasks/WAVE1_QWEN_memory-audit.md and execute it completely. 
Scan every file in src/core/memory/ (31 files). For each file determine if it is ACTIVE, STUB, DUPLICATE, or DEAD by checking imports across the codebase. 
Write the full report to upgrade/reports/memory-audit.md
```

**Qwen Window 2:**
```
Read the task file at upgrade/tasks/WAVE1_QWEN_agents-audit.md and execute it completely.
Scan every file in src/core/agents/ (31 files). For each file determine if it is ACTIVE, STUB, DUPLICATE, or DEAD by checking imports across the codebase.
Write the full report to upgrade/reports/agents-audit.md
```

**Qwen Windows 3-4:**
```
Read the task file at upgrade/tasks/WAVE1_QWEN_dependency-scan.md and execute it completely.
Part A: Find all source files never imported by anything (dead files).
Part B: Find all npm packages in package.json never imported (dead dependencies).
Part C: Map high-level module dependency graph.
Write the full report to upgrade/reports/dependency-scan.md
```

---

### Gemini CLI — 3 Windows

**Gemini Window 1:**
```
Run core tests and capture output:
cd /Users/srujansai/Desktop/Ultra-Dex
NODE_ENV=test node --test --test-force-exit --test-timeout=30000 tests/core/*.test.js 2>&1 | tee upgrade/reports/test-core-output.txt
```

**Gemini Window 2:**
```
Run integration and CLI tests:
cd /Users/srujansai/Desktop/Ultra-Dex
NODE_ENV=test node --test --test-force-exit --test-timeout=30000 tests/integration/*.test.js 2>&1 | tee upgrade/reports/test-integration-output.txt
NODE_ENV=test node --test --test-force-exit --test-timeout=30000 tests/cli/*.test.js 2>&1 | tee upgrade/reports/test-cli-output.txt
```

**Gemini Window 3:**
```
Read the task file at upgrade/tasks/WAVE1_GEMINI_test-assessment.md.
Run node test-validation.cjs and capture output.
Then compile all test results from the other windows into upgrade/reports/test-status.md with:
1. Pass/fail table for every test
2. Coverage gap analysis for Milestone 1 critical subsystems
3. Recommendations for new tests needed
```

---

## 🟡 WAVE 2 — Dispatch After Wave 1 Complete

### Codex (1 window — heavy implementation)

```
You have 3 tasks to complete in sequence. Read the task files in upgrade/tasks/ and implement them:

1. WAVE2_CODEX_session-isolation.md — Create ExecutionContext with session-scoped TaskGraphs
2. WAVE2_CODEX_atomic-writes.md — Implement atomic file writes with corruption recovery
3. WAVE2_CODEX_schema-versioning.md — Add version fields to all persistence stores

Work through each task sequentially. Create all new files and modify existing ones as specified. Write tests for each change.
```

### Claude Code (1 window — precision edits)

```
You have 4 tasks to complete. Read the task files in upgrade/tasks/ and implement them:

1. WAVE2_CLAUDE-CODE_governance-wiring.md — Wire GovernanceManager into executeTool/executeTask
2. WAVE2_CLAUDE-CODE_symlink-fix.md — Fix symlink bypass and improve destructive command regex
3. WAVE2_CLAUDE-CODE_memory-bounds.md — Add TaskGraph pruning and bounded state history
4. WAVE2_CLAUDE-CODE_remove-scheduler.md — Remove dead AgentScheduler from orchestrator

These are precision edits to critical files. Be exact. Do not refactor beyond what each task specifies.
```

---

## 🔵 WAVE 3 — Dispatch After Wave 2 Validated

### Codex
```
Read upgrade/tasks/WAVE3_CODEX_cjs-to-esm.md and execute it.
Convert all 8 .cjs files to ESM .js format. Keep sdk.cjs as backward compat wrapper.
Update all imports throughout the codebase.
```

### Gemini CLI (3 windows)
```
Write comprehensive tests for all Wave 2 changes:
- tests/core/session-isolation.test.js
- tests/core/governance-enforcement.test.js
- tests/core/atomic-writes.test.js
- tests/core/schema-migration.test.js
- tests/core/memory-bounds.test.js
- tests/core/symlink-protection.test.js

Run all tests and produce updated test-status.md
```

### Claude Code (review)
```
Review all Wave 2 outputs from Codex and Gemini. Check for:
- Correctness of session isolation implementation
- Governance wiring completeness
- Atomic write safety
- Schema versioning correctness
- Any introduced regressions

Report findings to upgrade/reports/wave2-review.md
```

---

## 🟣 WAVE 4 — Final Integration

### Claude Code
```
Final integration review. Run full test suite. Verify all 10 success criteria from the implementation plan are met. Generate cycle report to upgrade/reports/cycle_1.md
```

---

## Status Tracking

Come back to Claude Opus (Antigravity) after each wave completes to:
1. Report results
2. Get decisions on any blockers
3. Receive next wave adjustments
4. Get the cycle report

---

*Orchestrator: Claude Opus — Dispatch Guide v1.0*
