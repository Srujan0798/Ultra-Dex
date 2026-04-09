# 🚀 ULTRA-DEX CYCLE 6 ETERNAL — MASTER ORCHESTRATION PROMPT
## Complete Pre-v2.0, Ship v3.1.0, Plan v2.0+

---

## 🎯 MISSION OBJECTIVE

**Execute Cycle 6 ETERNAL in its entirety.**

This is the **NUCLEAR BOMB** prompt. Everything. All 22 phases. All 35 windows. Complete orchestration. No gaps. No missing pieces. Just pure execution.

**Success Gate:**
```
MOCK_AI=true npx ultra-dex run planner -t "hello" → works
npx ultra-dex run planner -t "hello" --provider nvidia → works
npm test → 0 failures
npm run build → exits 0
Version 3.1.0 tagged
```

---

## 📚 CONTEXT FILES (READ THESE FIRST)

Before executing, ensure you have read:

1. **NOTION/pre v2.0.md** — Original 19-phase protocol
2. **.protocol/state/current-cycle.json** — Cycle 6 plan (22 phases, 35 windows)
3. **.protocol/state/dispatches.md** — All 35 windows with exact commands
4. **.protocol/state/COMPLETE-ALL-WORK.md** — Master execution document
5. **CLAUDE.md** — Project guide

---

## 🏗️ ORCHESTRATION STRUCTURE

### 4-WINDOW PARALLEL SYSTEM

| Window | Role | Responsibility |
|--------|------|----------------|
| **W-CTRL** | Controller (CTO) | Plans, assigns, reviews, decides |
| **W-EXEC** | Executor (Engineer) | Implements, writes code, fixes |
| **W-VAL** | Validator (QA) | Detects fakes, verifies architecture |
| **W-EV** | Execution Validator (DevOps) | Runs commands, reports raw output |

### Your Job as Controller

1. **Read all context files** (listed above)
2. **Execute phases in dependency order** (see current-cycle.json)
3. **Open parallel windows** where safe (marked "parallel-safe")
4. **Validate after each phase** before proceeding
5. **Report blockers immediately** — do NOT proceed with blocked dependencies

---

## 🔧 PHASE-BY-PHASE EXECUTION

### ═══════════════════════════════════════════════
### PHASE 0: PLATFORM FIX (Unblocks Everything)
### ═══════════════════════════════════════════════

**Status:** 🔴 CRITICAL BLOCKER  
**Window:** W0-OWNER (Manual)  
**Time:** 5 minutes  
**Action Required:**

```bash
npm rebuild esbuild && npm rebuild
```

**Validation:**
```bash
npx esbuild --version  # Should output version
npm run test:unit 2>&1 | tail -5  # Should show passes, not TransformError
```

**STOP:** Do NOT proceed until P0 validates. This unblocks 55 tests.

---

### ═══════════════════════════════════════════════
### PHASE 1: CLI FIX (Pre-v2.0 Phase 1 Redo)
### ═══════════════════════════════════════════════

**Status:** 🟡 Waiting P0  
**Window:** W1-CLI-HELP  
**Depends:** P0 complete  
**Tool:** Claude Sonnet  

**Objective:** Fix CLI --help crash (registry.js import resolution)

**Root Cause:**
- `apps/cli/lib/commands/mcp.js` line 2 imports `'src/core/mcp/registry.js'`
- But file is `src/core/mcp/registry.ts`
- Node can't resolve .js → .ts without tsx loader

**Fix Options (Pick Cleanest):**

**Option A (Recommended):** Add .js re-export shim
```javascript
// Create: src/core/mcp/registry.js
export * from './registry.ts';
```

**Option B:** Fix import path in mcp.js
```javascript
// Change in apps/cli/lib/commands/mcp.js
import { registry } from '../../../src/core/mcp/registry.ts';
```

**Option C:** Register tsx loader in CLI entry
```javascript
// In apps/cli/bin/ultra-dex.js
import 'tsx';
```

**Validation:**
```bash
node apps/cli/bin/ultra-dex.js --help  # Should show help, not crash
```

**Command to Run:**
```bash
claude --model sonnet --effort high -p \
"Fix CLI --help crash in Ultra-Dex. 

Root cause: apps/cli/lib/commands/mcp.js imports 'src/core/mcp/registry.js' but file is .ts

Fix: Create src/core/mcp/registry.js that re-exports from registry.ts
OR fix the import path
OR register tsx loader

After fix, validate:
node apps/cli/bin/ultra-dex.js --help  # Must show help menu

Report: files changed, exact diff, validation result"
```

---

### ═══════════════════════════════════════════════
### PHASE 2: RBAC FIX
### ═══════════════════════════════════════════════

**Status:** 🟡 Waiting P0  
**Window:** W2-RBAC  
**Depends:** P0 complete  
**Parallel-safe:** Yes (with P1, P3)  
**Tool:** Claude Sonnet  

**Objective:** Fix default role from viewer → admin for local

**Location:** `src/core/auth/`  

**Validation:**
```bash
grep -r "default.*role" src/core/auth/  # Should show admin, not viewer
```

---

### ═══════════════════════════════════════════════
### PHASE 3: ARCHITECTURE FIX
### ═══════════════════════════════════════════════

**Status:** 🟡 Waiting P0  
**Window:** W3-ARCH  
**Depends:** P0 complete  
**Parallel-safe:** Yes (with P1, P2)  
**Tool:** Claude Opus  

**Objective:** Fix architecture violation (core imports from apps/cli)

**Violation:**
```bash
grep -r "from.*apps/cli" src/core/  # This should return NOTHING
```

**Fix:** Move GovernanceEngine from apps/cli to src/core/governance/

**Validation:**
```bash
grep -r "from.*apps/cli" src/core/  # Must return empty
```

---

### ═══════════════════════════════════════════════
### PHASE 4: MOCK EXECUTION PROOF
### ═══════════════════════════════════════════════

**Status:** 🟡 Waiting P1-P3  
**Window:** W4-MOCK-PROOF  
**Depends:** P1, P2, P3 complete  
**Tool:** Claude Sonnet  

**Objective:** Prove MOCK_AI=true runs end-to-end

**Required:**
1. Add MOCK mode to nvidia provider
2. Ensure output ALWAYS prints
3. Add MAX_STEPS limit
4. Add execution trace (run_id, steps[])

**Validation:**
```bash
MOCK_AI=true npx ultra-dex run planner -t "Write hello world in JS"
```
**Expected:** Full flow executes, output prints, no crash

---

### ═══════════════════════════════════════════════
### PHASE 5: AUTH MIDDLEWARE
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Window:** W5-AUTH-MIDDLEWARE  
**Depends:** P4 complete  
**Tool:** Claude Sonnet  

**Objective:** Create requireAuth + requireAdmin + enforceUsageLimit

**Files to Create:**
- `src/core/auth/middleware.ts`

---

### ═══════════════════════════════════════════════
### PHASE 6: USAGE METERING + WEBHOOKS
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Windows:** W6-USAGE, W7-WEBHOOK  
**Depends:** P4 complete  
**Parallel-safe:** Yes  
**Tool:** Claude Sonnet  

**Objective:** Create usage limits and Stripe webhook handler

**Files to Create:**
- `src/core/billing/usage-meter.ts`
- `src/core/billing/webhook-handler.ts`

---

### ═══════════════════════════════════════════════
### PHASE 7: ANALYTICS (PostHog + Sentry)
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Windows:** W8-POSTHOG, W9-SENTRY  
**Depends:** P4 complete  
**Parallel-safe:** Yes  
**Tool:** Claude Sonnet  

**Objective:** Integrate PostHog and Sentry

**Files to Create:**
- `src/core/analytics/posthog-client.ts`
- `src/core/analytics/sentry-client.ts`

---

### ═══════════════════════════════════════════════
### PHASE 8: MONITORING
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Window:** W10-MONITORING  
**Depends:** P4 complete  
**Tool:** Claude Sonnet  

**Objective:** Create /metrics endpoint with Prometheus format

**File to Create:**
- `src/core/system/monitoring.ts`

---

### ═══════════════════════════════════════════════
### PHASE 9: STUB CLEANUP (24 Files)
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Windows:** W11-W14  
**Depends:** P4 complete  
**Parallel-safe:** Yes (4 windows parallel)  
**Tool:** Codex o1 / Claude Sonnet  

**Objective:** Clean 24 stub files - implement, fix, or remove each

**Scan Command:**
```bash
find src/core -name "*.ts" -o -name "*.js" | xargs wc -l | grep -E "^\s*[0-4] "
```

**For each stub:**
- Option A: Implement real logic
- Option B: Remove file completely

---

### ═══════════════════════════════════════════════
### PHASE 10: FAKE FEATURE REMOVAL
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Window:** W15-FAKE-FEATURES  
**Depends:** P4 complete  
**Tool:** Claude Sonnet  

**Objective:** Audit and remove fake features

**Check for:**
- `--stream` flag (if not implemented)
- `--cache` flag (if not implemented)
- `SEARCH_CODE` command (if not implemented)

**Rule:** Interface must match capability

---

### ═══════════════════════════════════════════════
### PHASE 11: LOGGING MIGRATION
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Window:** W16-LOGGING  
**Depends:** P4 complete  
**Tool:** Claude Sonnet  

**Objective:** Replace console.* with Better Stack logger

**Target Files:**
1. `apps/cli/lib/commands/commit.js`
2. `apps/cli/lib/commands/learn.js`
3. `src/wasm/index.js`
4. `src/wasm/runtime.js`

---

### ═══════════════════════════════════════════════
### PHASE 12: DASHBOARD PAGES
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Windows:** W17-BILLING, W18-LANDING, W19-ONBOARDING  
**Depends:** P9 complete  
**Parallel-safe:** Yes  
**Tool:** Claude Sonnet / Gemini  

**Objective:** Create dashboard pages

**Files to Create:**
- `apps/dashboard/src/pages/Billing.tsx`
- `apps/dashboard/src/pages/Landing.tsx`
- `apps/dashboard/src/pages/Onboarding.tsx`

---

### ═══════════════════════════════════════════════
### PHASE 13: CLI + DOCS
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Windows:** W20-LOGIN, W21-BILLING-DOCS, W22-SETUP-STRIPE, W23-FUNDING  
**Depends:** P9 complete  
**Parallel-safe:** Yes  
**Tool:** Various  

**Objective:** Create CLI commands and documentation

**Files to Create:**
- `apps/cli/lib/commands/login.ts`
- `docs/BILLING.md`
- `scripts/setup-stripe.sh`
- `.github/FUNDING.yml`

---

### ═══════════════════════════════════════════════
### PHASE 14: EXECUTION TRACE
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Window:** W24-TRACE  
**Depends:** P4 complete  
**Tool:** Claude Sonnet  

**Objective:** Add execution trace with run_id, steps[], timing

**Add to run.js:**
```javascript
const run_id = `run-${Date.now()}`;
const trace = { run_id, steps: [], timing: {} };
```

---

### ═══════════════════════════════════════════════
### PHASE 15: FULL TEST SUITE GREEN
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Windows:** W25-UNIT, W26-INTEGRATION  
**Depends:** P5-P14 complete  
**Parallel-safe:** Yes  
**Tool:** Codex o1  

**Objective:** 0 test failures

**Commands:**
```bash
npm run test:unit
npm run test:integration
npm run test:cli
```

**Expected:** All pass

---

### ═══════════════════════════════════════════════
### PHASE 16: REAL PROVIDER TEST
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Window:** W27-REAL-PROVIDER  
**Depends:** P15 complete  
**Tool:** OWNER (requires NVIDIA_API_KEY)

**Objective:** Test real NVIDIA provider

**Owner Action:**
```bash
export NVIDIA_API_KEY=nvapi-xxx
npx ultra-dex run planner -t "hello" --provider nvidia
```

---

### ═══════════════════════════════════════════════
### PHASE 17: DASHBOARD BUILD FIX
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Window:** W28-DASHBOARD-BUILD  
**Depends:** P12 complete  
**Tool:** Claude Sonnet  

**Objective:** Fix rolldown binding + build with new pages

---

### ═══════════════════════════════════════════════
### PHASE 18: FULL BUILD VERIFICATION
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Window:** W29-FULL-BUILD  
**Depends:** P15, P17 complete  
**Tool:** Codex o1  

**Objective:** Complete build verification

**Commands:**
```bash
npx tsc --noEmit
npm run lint
npm run build
npm test
npm audit
```

---

### ═══════════════════════════════════════════════
### PHASE 19: ARCHITECTURE ENFORCEMENT
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Window:** W30-ARCH-SCAN  
**Depends:** P18 complete  
**Tool:** Claude Sonnet  

**Objective:** Final architecture scan, zero violations

**Validation:**
```bash
grep -r "from.*apps/cli" src/core/  # Must return empty
find src/core -name "*.ts" -size -100c | wc -l  # Should be 0
```

---

### ═══════════════════════════════════════════════
### PHASE 20: VERSION 3.1.0
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Window:** W31-VERSION  
**Depends:** P19 complete  
**Tool:** Claude Sonnet  

**Objective:** Bump version, update CHANGELOG, create tag

**Actions:**
1. Update package.json version to 3.1.0
2. Update CHANGELOG.md with v3.1.0 section
3. `git tag v3.1.0`

---

### ═══════════════════════════════════════════════
### PHASE 21: FINAL VALIDATION
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Window:** W32-FINAL-VAL  
**Depends:** P20 complete  
**Tool:** Codex o1  

**Objective:** Check all 35 completion criteria

**Run:**
```bash
# All 35 criteria from current-cycle.json
echo "Checking completion criteria..."
```

---

### ═══════════════════════════════════════════════
### PHASE 22: V2.0+ PLANNING
### ═══════════════════════════════════════════════

**Status:** 🟢 Queued  
**Windows:** W33-SPEC, W34-ROADMAP, W35-COMPETITIVE  
**Depends:** P21 complete  
**Parallel-safe:** Yes  
**Tool:** Claude Opus / Gemini  

**Objective:** Create v2.0 planning documents

**Files to Create:**
- `docs/V2.0-SPEC.md`
- `docs/V2.0-ROADMAP.md`
- `docs/V2.0-COMPETITIVE.md`

---

## 📋 REPORTING FORMAT

**After EACH phase, report:**

```
═══════════════════════════════════════════════════════════════
PHASE X: [NAME] — [STATUS]
═══════════════════════════════════════════════════════════════

COMPLETED:
✓ [Item 1]
✓ [Item 2]

VALIDATION:
[Command run] → [Result]

BLOCKERS (if any):
⛔ [Blocker with details]

NEXT PHASE: [Name] / Fix blockers
═══════════════════════════════════════════════════════════════
```

---

## 🚫 FORBIDDEN ACTIONS

**NEVER:**
- Proceed with blocked phases
- Skip validation steps
- Mark complete without proof
- Refactor before execution works
- UI work before CLI works
- git push before all tests pass

---

## ✅ SESSION CLOSE CONDITIONS

**Close session ONLY when:**

1. ✅ P0-P22 all complete
2. ✅ All 35 completion criteria pass
3. ✅ Version 3.1.0 tagged
4. ✅ docs/V2.0-*.md exist

**Then:**
```bash
git push origin main
git push origin v3.1.0
echo "🎉 Cycle 6 ETERNAL COMPLETE"
```

---

## 🎬 EXECUTION ORDER

```
START
  ↓
P0 (OWNER: npm rebuild esbuild) — 5 min
  ↓
P1 + P2 + P3 (parallel) — CLI + RBAC + Arch
  ↓
P4 (MOCK proof) — Validates execution path
  ↓
P5 + P6 + P7 + P8 + P9 + P10 + P11 + P14 (parallel)
  ↓
P12 + P13 (parallel) — Dashboard + CLI
  ↓
P15 (Test suite green)
  ↓
P16 (Real provider — OWNER with NVIDIA_API_KEY)
  ↓
P17 (Dashboard build)
  ↓
P18 (Full build verification)
  ↓
P19 (Architecture scan)
  ↓
P20 (Version 3.1.0)
  ↓
P21 (Final validation)
  ↓
P22 (V2.0+ planning)
  ↓
🎉 SHIP v3.1.0
```

---

## 💰 COST ESTIMATE

| Tier | Windows | Cost |
|------|---------|------|
| FREE | 17 (Gemini/Qwen/OpenCode) | $0 |
| SUBSCRIPTION | 16 (Claude/Codex) | Included |
| API-KEY | 2 (NVIDIA test) | ~$0.10 |

**Total Time:** 4-8 hours continuous parallel execution

---

**THIS PROMPT IS COMPLETE.**
**ALL 22 PHASES INCLUDED.**
**ALL 35 WINDOWS DEFINED.**
**EXECUTE IN ORDER.**
**STOP ON BLOCKERS.**
**DELIVER v3.1.0.**

---

*Cycle 6 ETERNAL*
*Complete Pre-v2.0, Ship v3.1.0, Plan v2.0+*
