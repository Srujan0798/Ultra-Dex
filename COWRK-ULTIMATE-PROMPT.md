# 🚀 ULTRA-DEX PRE-V2.0 — ULTIMATE ORCHESTRATION PROMPT

## For Claude Code Cowrk (Maya Lane) — Complete System Integration

---

## 🎯 MISSION OBJECTIVE

**Complete Ultra-Dex Pre-v2.0 to a REAL, WORKING, PRODUCTION-READY system.**

This is the **FINAL WRAP-UP** before v2.0. All integrations, all engineering protocols, all state from 5 cycles + 2 diamonds must be unified. No fake implementations. No shortcuts. No process theater. Just outcomes.

**Success Criteria:**

```bash
npx ultra-dex run planner -t "build a REST API" --provider nvidia
→ returns real, usable model output
```

---

## 📚 CRITICAL CONTEXT — READ FIRST

### 1. Pre-v2.0 Protocol (NOTION/pre v2.0.md)

**Location:** `/Users/srujansai/Desktop/Ultra-Dex/NOTION/pre v2.0.md`

**19 Phases to Execute (In Order):**

1. **Dependency Repair** — Clean broken state, reinstall modules
2. **NVIDIA Provider Registration** — Add to providers/index.js
3. **NVIDIA Provider Implementation** — Create providers/nvidia.js
4. **Connect Provider to run.js** — Verify execution path
5. **Direct Provider Test** — Test NVIDIA.generate() works
6. **Agent Loop Control** — Add MAX_STEPS limit
7. **Output Fix** — Always print results
8. **Logging Migration** — Replace console.\* in 4 target files
9. **Remove Fake Features** — Disable SEARCH_CODE, --stream, --cache if not implemented
10. **Execution Trace (Minimal)** — Add run_id and trace
11. **Final Execution Test** — Prove it works
12. **Fake Module Detection + Detox** — Remove hardcoded stubs
13. **Wave6 Unification Validation** — Verify architecture integrity
14. **False Completion Override** — Ignore "all tests passing" claims
15. **Test Integrity Rules** — Never modify assertions to pass
16. **Architecture Enforcement** — core must NOT import from apps/cli
17. **Mock Execution** — Test with MOCK_AI=true first
18. **401 / Auth Failure Fix** — Real API keys, real calls
19. **Full System Flow Test** — All commands must pass

### 2. Current State (5 Cycles + 2 Diamonds)

**Location:** `.protocol/state/`

**COMPLETED ✅:**

- Cycle 1-4: Foundation, Core, CLI, Integrations
- Cycle 5: Production (Better Stack, Clerk, Stripe, Sentry)
- Diamond 1: TypeScript migration (306 files, 0 errors)
- Diamond 2: Deployment (Render, monitoring, auto-heal)

**FILES TO VERIFY:**

- `src/core/monitoring/better-stack-logger.ts` — Better Stack integration
- `src/core/auth/auth-service.ts` — Clerk authentication
- `src/core/billing/billing-service.ts` — Stripe billing
- `src/core/server/production-server.ts` — Production server with integrations
- `apps/cli/lib/providers/nvidia.js` — NVIDIA provider
- `apps/cli/lib/commands/run.js` — Execution entry point

### 3. Architecture Rules (NON-NEGOTIABLE)

```
CORRECT FLOW:
CLI (apps/cli/bin/ultra-dex.js)
  └─ Command (apps/cli/lib/commands/*.js)
       └─ AgentOrchestrator.executeNexus()
            ├─ Governance check
            ├─ Memory search
            ├─ Agent selection
            └─ AIMetaLayer.call() → Provider
```

**FORBIDDEN:**

- core → imports from apps/cli ❌
- Fake implementations (returns hardcoded values) ❌
- Unbounded loops ❌
- UI/theme work before execution works ❌
- git commit before execution works ❌

### 4. Provider Architecture (ONE ENTRY POINT)

**Current (WRONG):**

```
nemotron.js → separate wrapper
providers/index.js → separate factory
```

**Required (CORRECT):**

```
providers/
  index.js   ← SINGLE ENTRY POINT
  nvidia.js  ← adapter (uses nemotron.js internally)
  openai.js  ← adapter
```

**nvidia.js must import FROM nemotron.js:**

```js
import {
  initNVIDIAKeys,
  createRotatingClient,
} from '../../../src/services/ai-providers/nemotron.js';
```

---

## 🔧 PHASE-BY-PHASE EXECUTION PLAN

### PHASE 1: FOUNDATION REPAIR

**Priority: P0 — STOP if this fails**

**Window 1: Dependency & Structure Validation**

```bash
claude --model sonnet --effort high -p \\
"ULTRA-DEX PRE-V2.0 PHASE 1: FOUNDATION REPAIR

CRITICAL RULE: If any step fails, STOP and report. Do NOT proceed.

STEP 1: Clean broken state
```

cd /Users/srujansai/Desktop/Ultra-Dex
rm -rf node_modules apps/cli/node_modules
rm -f package-lock.json apps/cli/package-lock.json

```

STEP 2: Root install
```

npm install --legacy-peer-deps

```

STEP 3: CLI install
```

cd apps/cli
npm install --legacy-peer-deps
npm install chalk

```

STEP 4: Verify chalk resolves
```

node -e \"import('chalk').then(() => console.log('✓ chalk OK'))\"

```

STEP 5: TypeScript check
```

npm run typecheck

```
Expected: 0 errors

STEP 6: Lint check
```

npm run lint

```
Expected: 0 errors, 0 warnings

STEP 7: Test check
```

npm test

```
Expected: 389+ tests passing

OUTPUT FORMAT:
1. Each step result (PASS/FAIL with details)
2. If any FAIL → list blockers
3. If all PASS → \"PHASE 1 COMPLETE, proceeding to Phase 2\"
"
```

---

### PHASE 2: NVIDIA PROVIDER FIX

**Priority: P0 — Execution core**

**Window 2: Provider Architecture Fix**

````bash
claude --model sonnet --effort high -p \\
"ULTRA-DEX PRE-V2.0 PHASE 2: NVIDIA PROVIDER

GOAL: Fix provider architecture so NVIDIA works through unified interface.

CURRENT STATE:
- nemotron.js exists in src/services/ai-providers/
- providers/index.js exists but may not have nvidia entry
- providers/nvidia.js may not exist or may not import from nemotron.js

REQUIRED CHANGES:

1. Update apps/cli/lib/providers/index.js:
   Add to PROVIDERS object:
   ```js
   nvidia: {
     class: NVIDIAProvider,
     envKey: 'NVIDIA_API_KEY',
     name: 'NVIDIA (Nemotron)'
   }
````

2. Create apps/cli/lib/providers/nvidia.js:

   ```js
   import {
     initNVIDIAKeys,
     createRotatingClient,
   } from '../../../src/services/ai-providers/nemotron.js';

   export class NVIDIAProvider {
     constructor(apiKey, options = {}) {
       this.model = options.model || 'nvidia/nemotron-3-super-120b-a12b';
       initNVIDIAKeys();
     }

     async generate(systemPrompt, userPrompt) {
       const { client } = createRotatingClient(this.model);
       const res = await client.chat.completions.create({
         model: this.model,
         messages: [
           { role: 'system', content: systemPrompt },
           { role: 'user', content: userPrompt },
         ],
       });
       return {
         content: res.choices[0].message.content,
         model: this.model,
       };
     }

     getName() {
       return 'nvidia';
     }
   }
   ```

3. Add MOCK mode support:
   In nvidia.js generate() method, add:
   ```js
   if (process.env.MOCK_AI === 'true') {
     return { content: 'MOCK RESPONSE: ' + userPrompt };
   }
   ```

VALIDATION:

```bash
# Test mock mode
MOCK_AI=true node -e \\"
import('./apps/cli/lib/providers/nvidia.js').then(async ({NVIDIAProvider}) => {
  const p = new NVIDIAProvider();
  const res = await p.generate('You are helpful', 'Say hello');
  console.log('Mock result:', res);
});
\\"
```

Expected: { content: 'MOCK RESPONSE: Say hello', model: 'nvidia/...' }

OUTPUT FORMAT:

1. Files modified/created
2. Code diff for each file
3. Validation result (PASS/FAIL)
4. If FAIL → exact error message
   "

````

---

### PHASE 3: EXECUTION PATH VERIFICATION
**Priority: P0 — Must flow correctly**

**Window 3: Execution Flow Fix**

```bash
claude --model sonnet --effort high -p \\
"ULTRA-DEX PRE-V2.0 PHASE 3: EXECUTION PATH

GOAL: Verify and fix CLI → run.js → agent loop → provider → output flow.

ANALYSIS TASK:
1. Read apps/cli/bin/ultra-dex.js — verify CLI entry
2. Read apps/cli/lib/commands/run.js — verify:
   - providerId flows from CLI args
   - createAgentProviderFactory is called
   - providerInstance.generate() is called
   - Response flows back to agent loop
3. Find agent loop file — verify:
   - MAX_STEPS is defined (hard limit)
   - stepCount increments
   - Loop terminates when MAX_STEPS reached

REQUIRED FIXES:

1. In run.js or agent loop, add MAX_STEPS:
   ```js
   const MAX_STEPS = 10; // hard limit
   let stepCount = 0;

   // In loop:
   if (stepCount >= MAX_STEPS) break;
   stepCount++;
````

2. Ensure output ALWAYS prints:

   ```js
   console.log('\\n=== RESULT ===');
   console.log(finalOutput);
   console.log('\\n=== TRACE SUMMARY ===');
   console.log(`steps: ${stepCount} | status: ${status}`);
   ```

3. Add minimal execution trace:

   ```js
   const run_id = `run-${Date.now()}`;
   const trace = { run_id, steps: [] };

   // After each step:
   trace.steps.push({
     step: stepCount,
     agent: agentId,
     action: actionType,
     status: 'success' | 'error',
   });
   ```

VALIDATION:

```bash
MOCK_AI=true npx ultra-dex run planner -t \"hello\"
```

Expected: Full flow executes, output prints, no crash

OUTPUT FORMAT:

1. Execution path files identified
2. Changes made to each file
3. MAX_STEPS location
4. Output printing location
5. Trace implementation location
6. Validation result
   "

````

---

### PHASE 4: FAKE MODULE DETOX
**Priority: P1 — Remove all stubs**

**Window 4: Fake Detection & Removal**

```bash
claude --model opus --effort max -p \\
"ULTRA-DEX PRE-V2.0 PHASE 4: FAKE MODULE DETOX

GOAL: Find and eliminate all fake implementations.

SCAN TARGETS:
- src/core/integrations/git.js
- src/core/mcp/*
- src/core/memory/*
- src/core/performance/*
- Any file with 'prune()' returning false

FAKE PATTERNS (Mark for removal/fix):
- Returns hardcoded/constant values
- Returns empty arrays always
- Has no external interaction
- Is a placeholder stub
- Returns false (like prune())

FOR EACH FAKE MODULE:
Option A: Implement real logic
Option B: Remove the module completely

ARCHITECTURE VALIDATION:
```bash
# 1. Registry called only once
grep -r 'registry.initialize' apps/ src/ | wc -l
# Must be 1

# 2. No duplicate memory managers
find . -name 'manager.js' | grep -i memory

# 3. core → MUST NOT import from apps/cli
grep -r 'from.*apps/cli' src/core/
# Must return nothing

# 4. prune() is real
# If it returns false → implement or disable
````

OUTPUT FORMAT:

1. List of files scanned
2. Fake modules identified with pattern found
3. Decision for each (implement/remove)
4. Files modified/removed
5. Architecture validation results
   "

````

---

### PHASE 5: INTEGRATION VALIDATION
**Priority: P0 — PROOF OF WORK**

**Window 5: Final System Test**

```bash
claude --model sonnet --effort high -p \\
"ULTRA-DEX PRE-V2.0 PHASE 5: FINAL VALIDATION

GOAL: Run ALL test commands and report EXACT results.

TEST SEQUENCE (run in order):

TEST 1: Help check
````

node apps/cli/bin/ultra-dex.js --help

```

TEST 2: Mock execution (CRITICAL)
```

MOCK_AI=true npx ultra-dex run planner -t \"Write a hello world function in JS\"

```

TEST 3: Real execution (CRITICAL)
```

npx ultra-dex run planner -t \"Write a hello world function in JS\" --provider nvidia

```

TEST 4: Full workflow
```

npx ultra-dex init
npx ultra-dex agents list
npx ultra-dex run planner -t \"build simple api\"
npx ultra-dex brain

```

TEST 5: Unit tests
```

npm test

```

REPORT FORMAT per command:
- command: <exact command>
- exit_code: <0 or error>
- stdout: <actual output (first 500 chars)>
- stderr: <actual errors>
- verdict: PASS / FAIL

FINAL OUTPUT:
```

═══════════════════════════════════════════════════════════════
SYSTEM READY: YES / NO

BLOCKERS (if any):

- [ ] Test X failed: <reason>

PHASE 5 STATUS: COMPLETE / INCOMPLETE
═══════════════════════════════════════════════════════════════

```

IMPORTANT:
- Do NOT fix anything
- Do NOT interpret
- Do NOT conclude
- ONLY run and report raw output
"
```

---

## 🏗️ ARCHITECTURE ENFORCEMENT (All Phases)

### Multi-Window Orchestration

**Window 1: CONTROLLER (CTO Role)**

- Plans and coordinates
- Assigns tasks to other windows
- Reviews outputs
- Makes go/no-go decisions

**Window 2: EXECUTOR (Engineer Role)**

- Implements fixes
- Writes code
- Runs tests
- Reports results

**Window 3: VALIDATOR (QA Role)**

- Detects fake fixes
- Verifies architecture rules
- Rejects bad outputs
- Reports violations

**Window 4: EXECUTION VALIDATOR (DevOps Role)**

- Runs commands
- Reports raw output
- No opinions, just facts
- System ready: YES/NO

### Engineering Protocols (Use Throughout)

Apply these protocols at each phase:

| Protocol                         | Use When          | Source                |
| -------------------------------- | ----------------- | --------------------- |
| `/engineering:architecture`      | Design decisions  | Architecture patterns |
| `/engineering:code-review`       | Reviewing code    | Quality gates         |
| `/engineering:debug`             | Fixing issues     | Root cause analysis   |
| `/engineering:deploy-checklist`  | Pre-deployment    | Production readiness  |
| `/engineering:documentation`     | Writing docs      | Knowledge transfer    |
| `/engineering:incident-response` | Handling failures | Recovery procedures   |
| `/engineering:standup`           | Daily sync        | Progress tracking     |
| `/engineering:system-design`     | New features      | Design docs           |
| `/engineering:tech-debt`         | Refactoring       | Cleanup decisions     |
| `/engineering:testing-strategy`  | Test planning     | Coverage analysis     |

---

## 📋 VALIDATION CHECKLIST (Per Phase)

### Phase 1 Checklist

- [ ] node_modules installed (root + apps/cli)
- [ ] chalk resolves
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors, 0 warnings
- [ ] Tests: 389+ passing

### Phase 2 Checklist

- [ ] providers/index.js has nvidia entry
- [ ] providers/nvidia.js exists and imports from nemotron.js
- [ ] NVIDIAProvider class implements generate()
- [ ] Mock mode works (MOCK_AI=true)

### Phase 3 Checklist

- [ ] MAX_STEPS defined and enforced
- [ ] Output always prints
- [ ] Execution trace exists with run_id
- [ ] No unbounded loops

### Phase 4 Checklist

- [ ] All fake modules identified
- [ ] Fake modules removed or implemented
- [ ] Architecture rules verified
- [ ] core does NOT import from apps/cli

### Phase 5 Checklist

- [ ] Help command works
- [ ] Mock execution produces output
- [ ] Real execution produces output
- [ ] Full workflow passes
- [ ] Unit tests pass

---

## 🚫 FORBIDDEN ACTIONS

**NEVER DO:**

- Refactor memory systems before execution works
- Consolidate agent files before execution works
- Redesign architecture before execution works
- UI / banner / theme work before execution works
- Write templates or DX polish before execution works
- Run `npm start` / `npm run dev` (Ultra-Dex is CLI, not server)
- Mark project complete before execution is proven
- `git push` before run command works
- Treat "syntactically correct" as "working"
- Treat "environment issue" as acceptable

---

## ✅ SUCCESS CRITERIA (SESSION CLOSE CONDITIONS)

**SESSION CLOSES ONLY WHEN:**

```bash
# 1. Mock execution works
MOCK_AI=true npx ultra-dex run planner -t "hello"
→ returns: { content: "MOCK RESPONSE: hello", ... }

# 2. Real execution works
npx ultra-dex run planner -t "hello" --provider nvidia
→ returns: { content: "...real model output...", ... }

# 3. All tests pass
npm test
→ 389+ tests passing

# 4. No fake implementations
→ All stubs removed or implemented

# 5. Architecture clean
→ core does NOT import from apps/cli
→ No duplicate memory systems
→ Single provider entry point
```

**ONLY THEN → Close session → Move to v2.0 planning**

---

## 📁 REFERENCE FILES

**Must Read Before Starting:**

1. `NOTION/pre v2.0.md` — Complete protocol
2. `.protocol/orchestration.md` — How to orchestrate
3. `.protocol/execution.md` — Execution rules
4. `.protocol/state/dispatches.md` — Current state
5. `CLAUDE.md` — Project guide

**Key Directories:**

- `apps/cli/` — CLI implementation
- `src/core/` — Core modules
- `src/services/ai-providers/` — Provider implementations
- `agents/` — Agent definitions
- `.protocol/` — All protocols

---

## 🎬 EXECUTION ORDER

```
PHASE 1: Foundation Repair (Window 1)
  ↓ [If PASS]
PHASE 2: NVIDIA Provider (Window 2)
  ↓ [If PASS]
PHASE 3: Execution Path (Window 3)
  ↓ [If PASS]
PHASE 4: Fake Detox (Window 4)
  ↓ [If PASS]
PHASE 5: Final Validation (Window 5)
  ↓ [If ALL PASS]
🎉 SYSTEM READY → CLOSE SESSION
```

---

## 💬 REPORTING FORMAT

**After Each Phase, Report:**

```
═══════════════════════════════════════════════════════════════
PHASE X: [NAME] — [STATUS]
═══════════════════════════════════════════════════════════════

COMPLETED:
- [Item 1]
- [Item 2]

BLOCKERS (if any):
- [Blocker 1 with details]

NEXT:
- Proceed to Phase X+1 / Fix blockers

═══════════════════════════════════════════════════════════════
```

---

**THIS PROMPT IS SELF-CONTAINED.**
**ALL CONTEXT PROVIDED.**
**EXECUTE IN ORDER.**
**STOP ON FAILURE.**
**DELIVER OUTCOMES.**

---

_Created: 2026-04-08_
_Version: Pre-v2.0 Ultimate_
_Scope: Complete System Integration_
