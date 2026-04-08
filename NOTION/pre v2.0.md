
# ULTRA-DEX PRE-V2.0 AGENT PROTOCOL
> Single source of truth. No repetition. Execute in order.

---

## GLOBAL RULES (NON-NEGOTIABLE)

```
PRIORITY ORDER: Execution > Stability > Observability > Cleanup > UI/DX

IF task does NOT affect: CLI → run.js → provider → model → output
THEN: REJECT THE TASK

FORBIDDEN UNTIL EXECUTION WORKS:
  - UI / banner / spinner / theme work
  - DX improvements
  - Template systems
  - Agent command enhancements
  - Documentation generation
  - Performance dashboards
  - Architecture consolidation / refactors
  - git commit / git push

SUCCESS CONDITION:
  npx ultra-dex run planner -t "hello" --provider nvidia
  → returns real model output
```

---

## PHASE 1 — DEPENDENCY REPAIR

```bash
cd /path/to/Ultra-Dex

# Clean broken state
rm -rf node_modules apps/cli/node_modules
rm -f package-lock.json apps/cli/package-lock.json

# Root install
npm install --legacy-peer-deps

# CLI install
cd apps/cli
npm install --legacy-peer-deps
npm install chalk

# Verify
node -e "import('chalk').then(() => console.log('chalk OK'))"
ls node_modules | head
```

**STOP CONDITION:** If install fails → fix install first. Do NOT continue.

---

## PHASE 2 — NVIDIA PROVIDER REGISTRATION

**File:** `apps/cli/lib/providers/index.js`

Add to the PROVIDERS object:
```js
import { NVIDIAProvider } from './nvidia.js';

// Inside PROVIDERS:
nvidia: {
  class: NVIDIAProvider,
  envKey: 'NVIDIA_API_KEY',
  name: 'NVIDIA (Nemotron)'
}
```

---

## PHASE 3 — NVIDIA PROVIDER IMPLEMENTATION

**Create file:** `apps/cli/lib/providers/nvidia.js`

```js
import { initNVIDIAKeys, createRotatingClient } from '../../../src/services/ai-providers/nemotron.js';

export class NVIDIAProvider {
  constructor(apiKey, options = {}) {
    this.model = options.model || "nvidia/nemotron-3-super-120b-a12b";
    initNVIDIAKeys();
  }

  async generate(systemPrompt, userPrompt) {
    const { client } = createRotatingClient(this.model);
    const res = await client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });
    return {
      content: res.choices[0].message.content,
      model: this.model
    };
  }

  getName() { return "nvidia"; }
}
```

**Do NOT add:** streaming, caching, logging complexity, extra abstraction.

---

## PHASE 4 — CONNECT PROVIDER TO RUN.JS

**File:** `apps/cli/lib/commands/run.js`

Verify and ensure:
1. `providerId` flows from CLI args into `createAgentProviderFactory`
2. `providerInstance.generate(systemPrompt, userPrompt)` is actually called
3. Response flows back into the agent loop

**Do NOT change architecture.** Only verify the connection exists.

---

## PHASE 5 — DIRECT PROVIDER TEST

```bash
node -e "
import('./apps/cli/lib/providers/nvidia.js').then(async ({NVIDIAProvider}) => {
  const p = new NVIDIAProvider();
  const res = await p.generate('You are helpful', 'Say hello');
  console.log(res);
});
"
```

**Expected:** `{ content: "...hello...", model: "nvidia/..." }`

---

## PHASE 6 — AGENT LOOP CONTROL

**File:** `apps/cli/lib/commands/run.js` or agent loop file

```js
const MAX_STEPS = 10; // hard limit
let stepCount = 0;

// Inside loop:
if (stepCount >= MAX_STEPS) break;
stepCount++;
```

**Remove:** unbounded recursion. Loop must terminate.

---

## PHASE 7 — OUTPUT FIX

Every run must print output regardless of flags:

```js
console.log("\n=== RESULT ===");
console.log(finalOutput);
console.log("\n=== TRACE SUMMARY ===");
console.log(`steps: ${stepCount} | status: ${status}`);
```

---

## PHASE 8 — LOGGING MIGRATION (LIMITED SCOPE)

**Only these 4 files. Touch nothing else.**

```
apps/cli/lib/commands/commit.js
apps/cli/lib/commands/learn.js
src/wasm/index.js
src/wasm/runtime.js
```

**Replacements:**
```
console.log(...)   →  logger.info(...)  or  logger.success(...)
console.warn(...)  →  logger.warn(...)
console.error(...) →  logger.error(...)
```

**Validate:** CLI output remains unchanged after migration.

---

## PHASE 9 — REMOVE FAKE FEATURES

Audit and disable/remove any of the following if NOT implemented:
- `SEARCH_CODE` command
- `--stream` flag
- `--cache` flag

**Rule:** Interface must match capability. No advertised features that don't work.

---

## PHASE 10 — EXECUTION TRACE (MINIMAL)

Add to `run.js` at execution start:
```js
const run_id = `run-${Date.now()}`;
const trace = { run_id, steps: [] };
```

After each model call or tool execution:
```js
trace.steps.push({
  step: stepCount,
  agent: agentId,
  action: actionType,
  status: "success" | "error"
});
```

Log with: `logger.info("step complete", { run_id, step: stepCount, agent: agentId })`

---

## PHASE 11 — FINAL EXECUTION TEST

```bash
npx ultra-dex run planner -t "Write a hello world function in JS" --provider nvidia
```

**OR if CLI not on PATH:**
```bash
node apps/cli/bin/ultra-dex.js run planner -t "Write hello world" --provider nvidia
```

---

## DEBUG TREE (IF TEST FAILS)

| Error | Fix |
|---|---|
| `Unknown provider` | PROVIDERS missing `nvidia` entry |
| `API key error` | Set `export NVIDIA_API_KEY=your_key` |
| `No output printed` | Check `provider.generate()` returns `{ content: "..." }` |
| `Infinite loop` | Add `MAX_STEPS` cap to agent loop |
| `chalk not found` | Run Phase 1 dependency repair |
| `Module not found` | Run full `npm install --legacy-peer-deps` |

---

## FINAL VALIDATION CHECKLIST

```
[ ] node_modules installed (root + apps/cli)
[ ] chalk resolves
[ ] createProvider("nvidia") works without error
[ ] NVIDIAProvider.generate() returns { content, model }
[ ] run.js calls provider
[ ] agent loop is bounded (MAX_STEPS)
[ ] output always prints (no flag required)
[ ] no console.* in 4 target files
[ ] execution trace exists with run_id
[ ] no fake features exposed in CLI
```

---

## HARD STOP CONDITIONS

```
IF any of the following:
  - provider not called during run
  - execution produces no output
  - agent loop is unbounded
  - node_modules missing

THEN:
  System is NOT ready for v2.0
  Do NOT proceed further
  Do NOT git commit
```

---

## AFTER SUCCESS → V2.0 PREP

Only once execution is confirmed working:

1. Logging standardization (remaining files)
2. Execution trace refinement
3. Dead code removal (only files provably unused in execution path)
4. Then: introduce v2.0 components

**V2.0 Core Components (build in order):**
```
ExecutionEngine   → deterministic step runner
Scheduler         → task-to-agent assignment
CapabilityRouter  → match task requirements to agent skills
Provider Layer    → unified interface (nvidia + existing)
ExecutionTrace    → full run observability
```

---

---

# PRE-V2.0 VISION + FEATURE BACKLOG
> Everything below is confirmed direction for v2.0. Not yet built. Not to be touched during stabilization phase.

---

## CORE POSITIONING (LOCKED)

```
Ultra-Dex is NOT competing with Claude, Cursor, Copilot, Gemini, Devin.
Ultra-Dex is the orchestration layer ABOVE all of them.

Current problem with all AI tools:
→ They forget. Every session starts fresh. No persistent project memory.

Ultra-Dex fills this gap:
→ Persistent context in version-controlled files
→ Routes tasks to the right model/agent
→ Enforces quality gates
→ Keeps all AI agents aligned to one plan

Principle: "Orchestrator, not executor"
Ultra-Dex prepares the plan and provides agent instructions.
User's own AI tools do the actual work.
```

---

## V2.0 ARCHITECTURE TARGET

```
┌─────────────────────────────────────────┐
│              YOUR PROJECT               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       ULTRA-DEX ORCHESTRATION LAYER     │
│  Context Manager │ Task Router          │
│  Quality Gates   │ Memory Store         │
└─────────────────────────────────────────┘
        ↓           ↓           ↓
   Claude      GPT-4o      Local LLM
  (Planning)  (Coding)    (Fast tasks)
```

---

## V2.0 FEATURE BACKLOG (PRIORITY ORDER)

### P0 — MCP Server (Highest Priority)
```
PURPOSE:
Make Ultra-Dex callable by Claude and any MCP-compatible tool.

FILES TO CREATE:
- cli/lib/mcp/server.js    ← MCP server core (StdioServerTransport)
- cli/lib/mcp/resources.js ← Resource handlers
- cli/lib/mcp/tools.js     ← Tool handlers

EXPOSE THESE RESOURCES:
- ultradex://context → CONTEXT.md
- ultradex://plan    → IMPLEMENTATION-PLAN.md
- ultradex://agents  → agents/00-AGENT_INDEX.md

EXPOSE THESE TOOLS:
- verify_task(taskName) → run 21-step verification
- get_agent(agentName)  → return agent prompt

CLAUDE DESKTOP CONFIG:
{
  "mcpServers": {
    "ultra-dex": {
      "command": "npx",
      "args": ["ultra-dex", "serve"],
      "cwd": "<project_path>"
    }
  }
}
```

### P1 — `.agents/` Folder (Role-Based Prompt System)
```
PURPOSE:
Each file = complete prompt for a specialized AI role.
User copies file content → pastes into their AI tool.
Instructions go INSIDE the file (not about the file).

STRUCTURE:
agents/
  00-AGENT_INDEX.md    ← index of all agents
  planner.md
  cto.md
  backend.md
  frontend.md
  database.md
  auth.md
  devops.md
  reviewer.md
  debugger.md
  testing.md
  security.md

EACH FILE CONTAINS:
- Role definition
- What files to read (CONTEXT.md, IMPLEMENTATION-PLAN.md)
- What to produce
- What NOT to do

AGENT PIPELINE ORDER (for swarm):
planner → cto → database → backend → frontend → testing → reviewer
```

### P2 — Persistent Memory / RAG
```
PURPOSE:
Never re-explain architecture to AI. Context persists across sessions.

APPROACH:
- Context stored in version-controlled .md files (already exists ✔)
- Embed codebase for semantic search
- Auto-inject relevant context per task

TECH:
- SQLite for structured data
- Vector embeddings for semantic search
- Git-based snapshots for rollback
```

### P3 — LLM Router
```
PURPOSE:
Route each task to the best model automatically.

ROUTING LOGIC:
- Planning / architecture → Claude (best reasoning)
- Code generation        → GPT-4o / Gemini (fast, good code)
- Quick fixes            → Local model (speed)
- Security review        → Claude Opus (careful)

SAVES: cost + improves quality
```

### P4 — Swarm Command (Agent Pipeline)
```
COMMAND: ultra-dex swarm "Build user authentication"
         ultra-dex swarm "Add payments" --dry-run

BEHAVIOR:
Runs agents in sequence, each receiving output from previous agent.
Stops pipeline on failure.

FILE: cli/lib/commands/swarm.js
```

### P5 — Additional CLI Commands
```
ultra-dex watch        → Auto-update state when files change
ultra-dex diff         → Compare IMPLEMENTATION-PLAN.md vs actual code
ultra-dex export       → Export context to JSON/HTML/Markdown
ultra-dex upgrade      → Check for CLI updates
ultra-dex config --mcp → Generate Claude Desktop MCP config
ultra-dex generate     → AI fills all sections from one-sentence idea
ultra-dex review       → Audit any codebase against quality standards
ultra-dex align        → Quick alignment score (plan vs code)
```

### P6 — VSCode Extension
```
STRUCTURE:
vscode-extension/
  src/
    extension.ts
    sidebar/
      AgentsView.ts    ← clickable agent list
      ContextView.ts   ← CONTEXT.md summary
      VerifyView.ts    ← 21-step checklist with checkboxes
    commands/
      askAgent.ts      ← right-click "Ask @Backend" on any file
      verify.ts        ← run verification

PRIORITY: After MCP + agents folder complete
```

---

## WHAT NOT TO BUILD (V2.0 TRAPS)

```
❌ Do NOT build AI API integrations that lock to one provider
❌ Do NOT try to "run" agents FROM Ultra-Dex (orchestrate, not execute)
❌ Do NOT compete with Claude Code, Cursor, Devin
❌ Do NOT build complex orchestration before basic swarm works
❌ Do NOT add web dashboard before CLI is stable
❌ Do NOT build team features before solo developer workflow is proven
```

---

## V2.0 BUILD ORDER

```
PHASE 1 (Foundation):
1. MCP Server (serve command — full implementation)
2. .agents/ folder with all role files
3. Context Manager (persistent project memory)

PHASE 2 (Intelligence):
4. swarm command (agent pipeline)
5. LLM Router (pick best model per task)
6. diff command (plan vs code)

PHASE 3 (Ecosystem):
7. VSCode extension
8. Plugin system (@ultra-dex/github, @ultra-dex/jira)
9. Web dashboard
```

---

## PROVIDER ARCHITECTURE RULE (ONE ENTRY POINT)

You have two separate provider systems that are NOT unified. This is the root cause of provider failures.

**Current (wrong):**
```
nemotron.js     → separate NVIDIA wrapper
providers/index.js → separate factory
```

**Required (correct):**
```
providers/
  index.js   ← SINGLE ENTRY POINT for all providers
  nvidia.js  ← adapter (uses nemotron.js internally)
  openai.js  ← adapter
```

**Keep these — do NOT delete:**
```
nvidia-key-manager.js  ✔ (key rotation infra)
nemotron.js            ✔ (API wrapper)
.env.local multi-key   ✔ (key storage)
```

**nvidia.js adapter must import FROM nemotron.js**, not duplicate it:
```js
// providers/nvidia.js
import { initNVIDIAKeys, createRotatingClient } from '../../../src/services/ai-providers/nemotron.js';
// then wrap it into the standard provider interface
```

**index.js must be the only file run.js imports from:**
```js
// run.js — only this import, nothing else
import { createProvider } from './providers/index.js';
const provider = createProvider(providerId);
```

---

## PHASE 12 — FAKE MODULE DETECTION + DETOX

Scan these files for fake implementations:
```
src/core/integrations/git.js
src/core/mcp/*
src/core/memory/*
src/core/performance/*
```

**Mark as FAKE if function:**
- returns hardcoded/constant values
- returns empty arrays always
- has no external interaction
- is a placeholder stub

**For each fake module, choose ONE:**
- A. Implement real logic
- B. Remove the module completely

**Do NOT keep fake implementations.**

---

## PHASE 13 — WAVE6 UNIFICATION VALIDATION

After any registry / swarm / memory unification, verify:

```bash
# 1. Registry called only once
grep -r "registry.initialize" apps/ src/ | wc -l
# Must be 1

# 2. No duplicate memory managers
find . -name "manager.js" | grep -i memory

# 3. Architecture direction correct
# core → MUST NOT import from apps/cli
grep -r "from.*apps/cli" src/core/
# Must return nothing

# 4. prune() is real
# If it returns false → EITHER implement OR disable
```

**prune() returning `false` = fake = NOT acceptable.**

**Async init must be explicit:**
```js
// WRONG
titansMemory.initialize().catch(console.error);

// RIGHT — call inside CLI startup, await it
await titansMemory.initialize();
```

---

## PHASE 14 — FALSE COMPLETION OVERRIDE

Agents will claim completion. These claims are INVALID unless proven by execution.

**Invalid completion signals (ignore these):**
```
- "All tasks completed"
- "100% passing tests"
- Build ✅ / Lint ✅ / Typecheck ✅
- Health check 5/5
- "Ready for production"
```

**Valid completion signal (only this):**
```bash
npx ultra-dex run planner -t "build a REST API" --provider nvidia
→ returns real, usable model output
```

**Tests passing ≠ system working.**
**Green CI ≠ real execution.**

---

## PHASE 15 — TEST INTEGRITY RULES

```
DO NOT:
- modify assertions to make tests pass
- relax regex patterns
- remove strict checks
- simplify test cases to avoid failure

DO:
- fix the system so existing tests pass
- if a feature is not implemented, remove its tests
- never manufacture a green result
```

If tests were modified to pass → revert and fix the real bug.

---

## PHASE 16 — ARCHITECTURE ENFORCEMENT

```
CORRECT:
  core → independent (no imports from apps/cli)
  cli → imports from core

WRONG:
  core → imports from apps/cli ❌

WRONG:
  Copy files as a fix ❌
  (cp src/platform/cli/memory/manager.js → src/core/memory/)
  This is NOT a fix. This is duplication.
```

**One module = one location. No copies.**

---

## PHASE 17 — MOCK EXECUTION (USE FOR INITIAL VALIDATION)

Before testing real NVIDIA calls, validate the full flow using mock:

```js
// Inside provider layer, add:
if (process.env.MOCK_AI === "true") {
  return { content: "MOCK RESPONSE: hello" };
}
```

Then test:
```bash
MOCK_AI=true npx ultra-dex run planner -t "hello"
```

**Expected:** full flow executes, output prints, no crash.

Only after mock passes → test real provider.

---

## PHASE 18 — 401 / AUTH FAILURE FIX

If you see `401 Unauthorized` from NVIDIA:

```
CHECK:
1. NVIDIA_API_KEY is real (not placeholder "your_key_here")
2. Authorization header format: "Bearer <key>"
3. Base URL: https://integrate.api.nvidia.com/v1
4. Model string is correct
5. Request payload matches API spec

DO NOT treat 401 as "infrastructure working" — it is execution FAILURE
```

**401 = model not called = system not working.**

---

## PHASE 19 — FULL SYSTEM FLOW TEST (MANDATORY BEFORE CLOSE)

Run all of these in sequence. All must pass:

```bash
# 1. Help check
node apps/cli/bin/ultra-dex.js --help

# 2. Mock execution
MOCK_AI=true npx ultra-dex run planner -t "hello"

# 3. Real execution
npx ultra-dex run planner -t "hello" --provider nvidia

# 4. Full workflow
npx ultra-dex init
npx ultra-dex agents list
npx ultra-dex run planner -t "build simple api"
npx ultra-dex brain
```

**Session closes ONLY when #2 and #3 both produce real output.**

---

## MULTI-WINDOW AGENT ORCHESTRATION

Use 4 windows running in parallel. Each has a single role. Do not mix.

---

### WINDOW 1 — CONTROLLER
**Paste this prompt:**
```
ROLE: ULTRA-DEX CONTROLLER (CTO)

OBJECTIVE:
Complete Ultra-Dex to a REAL working system before v2.0.
No fake implementations. No test manipulation. No copying files.

PHASE ORDER (do not change):
1. Execution validation
2. Provider fix
3. Memory fix
4. Logger fix
5. Fake module removal
6. Final validation

TASK:
1. Analyze repo
2. Extract execution path: CLI → run.js → agent loop → provider → output
3. Identify blockers
4. Break into tasks and assign: Executor, Architecture, Test windows
5. Do NOT implement — only plan and coordinate

CRITICAL RULES:
- DO NOT refactor entire repo
- DO NOT add features
- DO NOT modify tests to pass
- DO NOT use fake/stub implementations

SUCCESS CONDITION:
MOCK_AI=true npx ultra-dex run planner -t "hello"  →  works
npx ultra-dex run planner -t "hello" --provider nvidia  →  works

OUTPUT FORMAT:
1. execution_path (exact files)
2. blockers (what is broken)
3. task_list (what needs fixing)
4. agent_assignments (which window gets what)
```

---

### WINDOW 2 — EXECUTOR
**Paste this prompt:**
```
ROLE: ULTRA-DEX EXECUTOR

INPUT: tasks from Controller window

RULES:
- Fix EXACTLY what is broken — nothing more
- Do NOT redesign
- Do NOT add abstraction
- Do NOT copy files as a fix

TASK TYPES YOU HANDLE:
1. Fix broken imports
2. Fix provider registration (nvidia)
3. Fix CLI entry consistency
4. Fix module not found errors
5. Remove file duplication
6. Ensure single memory system

MOCK MODE (add to provider):
if (process.env.MOCK_AI === "true") {
  return { content: "MOCK RESPONSE" };
}

REAL MODE:
Return: { content: string }
No extra fields.

OUTPUT FORMAT:
1. files_changed (list)
2. exact code patch
3. test command to verify
4. expected output
```

---

### WINDOW 3 — VALIDATOR
**Paste this prompt:**
```
ROLE: ULTRA-DEX VALIDATOR

INPUT: output from Executor window

YOUR JOB:
Detect fake fixes before they corrupt the system.

VERIFY FOR EACH CHANGE:
1. Is logic real or hardcoded?
2. Does it interact with real external systems?
3. Were tests modified to pass rather than fixing code?
4. Was a file copied instead of architecturally resolved?
5. Does core still import from apps/cli? (WRONG if yes)

FAKE PATTERNS TO REJECT:
- return 'main'; // hardcoded
- return true; // always true
- return { files: [] }; // empty stub
- mcpServer.run = function() {}; // fake method

OUTPUT FORMAT:
1. approved_changes (list)
2. rejected_changes (with reason)
3. fake_modules_found (list)
4. architecture_violations (list)
5. verdict: APPROVE / REJECT / FIX REQUIRED
```

---

### WINDOW 4 — EXECUTION VALIDATOR
**Paste this prompt:**
```
ROLE: ULTRA-DEX EXECUTION VALIDATOR

YOUR ONLY JOB:
Run commands. Report real output. No opinions.

COMMANDS TO RUN (in order):
1. node apps/cli/bin/ultra-dex.js --help
2. MOCK_AI=true npx ultra-dex run planner -t "hello"
3. npx ultra-dex run planner -t "hello" --provider nvidia
4. npm test

REPORT FORMAT per command:
- command: <exact command>
- exit_code: <0 or error>
- stdout: <actual output>
- stderr: <actual errors>
- verdict: PASS / FAIL

RULES:
- Do NOT fix anything
- Do NOT interpret
- Do NOT conclude
- ONLY run and report raw output

Final output:
- SYSTEM READY: YES/NO
- BLOCKERS: (list any FAIL items)
```

---

## FLOW (HOW TO USE WINDOWS)

```
STEP 1: Open all 4 windows simultaneously

STEP 2: Start with WINDOW 1 (Controller)
→ Give it the codebase context
→ Get task list + assignments

STEP 3: Give tasks to WINDOW 2 (Executor)
→ Paste the specific task from Controller
→ Get code patches back

STEP 4: Give Executor output to WINDOW 3 (Validator)
→ Paste what Executor produced
→ Get APPROVE / REJECT verdict

STEP 5: Apply only APPROVED changes to codebase

STEP 6: Run WINDOW 4 (Execution Validator)
→ Paste commands, get raw output
→ If FAIL → go back to WINDOW 2 with exact error

STEP 7: Repeat until WINDOW 4 reports SYSTEM READY: YES

STEP 8: Only then → close session → move to v2.0
```

---

## WHAT AGENTS MUST NOT DO

```
❌ Refactor memory systems
❌ Consolidate agent files
❌ Redesign architecture
❌ UI / banner / theme work
❌ Write templates or DX polish
❌ Run npm start / npm run dev (Ultra-Dex is CLI, not a server)
❌ Mark project complete before execution is proven
❌ git push before run command works
❌ Treat "syntactically correct" as "working"
❌ Treat "environment issue" as acceptable — missing deps = broken system
```
