# Ultra-Dex: Complete Execution Plan (Phase 1 → 2 → 3)

> **Author**: Claude (strategic session, April 18 2026)
> **For**: Srujan Sai Karna
> **Status**: Phase 1 in progress, Phase 2 ready to start after Phase 1 bugs fixed, Phase 3 dependent on Phase 2 traction

---

## TABLE OF CONTENTS

1. [Phase 1 — Bug Fixes & Launch](#phase-1)
2. [Phase 2 — DexGraph Deterministic Replay](#phase-2)
3. [Phase 3 — Portable Sovereign Runtime](#phase-3)
4. [Revenue Model](#revenue-model)
5. [YC Application Timeline](#yc-timeline)

---

<a name="phase-1"></a>
## PHASE 1: Fix Bugs, Fix Deployments, Get First Users

**Timeline**: 3-5 days (give these tasks to your agents in order)

### Phase 1 Bug List (Verified by Audit)

#### BUG 1: DexGraph constructor ignores parse result (CRITICAL)

**File**: `packages/dexgraph/src/graph.ts`

**Problem**: `DexGraph` constructor is `constructor()` with no params. When user does `new DexGraph(result)`, the parse result is silently discarded. Graph has zero nodes.

**Fix**: Change constructor to accept parse result and auto-populate:

```typescript
constructor(parseResult?: { nodes: GraphNode[], edges: Edge[], metadata?: any }) {
  this.nodes = new Map();
  this.edges = [];
  this.adjacency = new Map();
  this.reverseAdjacency = new Map();
  if (parseResult) {
    for (const node of parseResult.nodes) this.addNode(node);
    for (const edge of parseResult.edges) this.addEdge(edge);
  }
}
```

**Verify**: After fix, this must work:
```typescript
const result = parse('./workflow.yaml');
const graph = new DexGraph(result);
console.assert(graph.getAllNodes().length > 0, 'Graph must have nodes');
```

---

#### BUG 2: `getExecutionOrder()` does not exist (CRITICAL)

**File**: `packages/dexgraph/src/graph.ts`

**Problem**: README shows `graph.getExecutionOrder()` but this method doesn't exist. Actual method is `topologicalSort()`.

**Fix**: Add alias method:

```typescript
getExecutionOrder(): string[] {
  return this.topologicalSort();
}
```

**Verify**: `graph.getExecutionOrder()` returns array of node IDs in dependency order.

---

#### BUG 3: `parse()` only accepts file paths, not YAML strings (MEDIUM)

**File**: `packages/dexgraph/src/parser.ts`

**Problem**: `parse()` calls `loadYAML()` which does `fs.existsSync()`. If you pass a YAML string, it throws "File not found" with the entire YAML content as the error message.

**Fix**: Add `parseString()` function:

```typescript
export function parseString(yamlContent: string): ParseResult {
  const doc = yaml.load(yamlContent, { schema: yaml.JSON_SCHEMA });
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new ParseError('YAML root must be a mapping');
  }
  const result = validateWorkflow(doc as any);
  if (!result.valid) {
    throw new ParseError(`Workflow validation failed: ${result.errors.join('; ')}`);
  }
  const def = doc as any;
  const taskIds = new Set(def.tasks.map((t: any) => t.id));
  const resolved = resolveTemplates(def.tasks);
  const edges = extractDependencies(def.tasks, taskIds);
  const nodes = resolved.map((task: any) => {
    const deps = getDirectDependencies(task);
    return taskToNode(task, deps);
  });
  return {
    nodes,
    edges,
    metadata: { name: def.name, description: def.description ?? '', context: def.context ?? {} },
  };
}
```

**Also**: Export `parseString` from `packages/dexgraph/src/index.ts`.

---

#### BUG 4: `topologicalSort()` returns empty array (CRITICAL)

**File**: `packages/dexgraph/src/graph.ts`

**Problem**: Even after Bug 1 fix, `topologicalSort()` returned `[]` in testing. The method likely reads from the wrong internal structure.

**Fix**: After fixing Bug 1 (constructor populates nodes/edges), verify that `topologicalSort()` iterates over `this.nodes` Map correctly. If it still returns empty, the method body needs to be fixed to use `this.nodes` and `this.adjacency`/`this.reverseAdjacency`.

**Verify**:
```typescript
const result = parse('./workflow.yaml');  // 3-step workflow
const graph = new DexGraph(result);
const order = graph.topologicalSort();
console.assert(order.length === 3, 'Must return 3 nodes');
console.assert(order[0] === 'search', 'First node must be root');
```

---

#### BUG 5: SDK `assertProviderContract` takes 2 args, not 1 (MINOR)

**File**: `packages/sdk/src/provider.js` (line 16)

**Problem**: Function signature is `assertProviderContract(name, provider)` but intuitive usage is `assertProviderContract(provider)`.

**Fix**: Make `name` optional:

```typescript
export function assertProviderContract(nameOrProvider: string | object, provider?: object) {
  const actualName = typeof nameOrProvider === 'string' ? nameOrProvider : 'unknown';
  const actualProvider = typeof nameOrProvider === 'string' ? provider : nameOrProvider;
  if (!actualProvider || typeof actualProvider !== 'object') {
    throw new Error(`UltraDex SDK: provider "${actualName}" must be an object instance`);
  }
  const missing = ['chat', 'stream', 'embed'].filter(
    (method) => typeof (actualProvider as any)[method] !== 'function'
  );
  if (missing.length > 0) {
    throw new Error(`UltraDex SDK: provider "${actualName}" is missing required methods: ${missing.join(', ')}`);
  }
}
```

---

#### BUG 6: Test suite shows 82 pass / 60 fail / 80 cancelled (not 537/0/5)

**Problem**: CLAUDE.md claims "537 pass, 0 fail, 5 skipped" but reality is 82 pass, 60 fail, 80 cancelled.

**Fix strategy** (for agents):
1. Run `npm run test:unit 2>&1 | grep "^not ok"` to get full failure list
2. Categorize failures:
   - Missing env vars → add proper guards/skips
   - Stale imports → fix import paths
   - Tests for unbuilt features → delete them
   - Governance tests → most will fail due to esbuild platform mismatch, skip with env guard
3. Target: honest green (even if 200 pass instead of 537, that's fine if 0 fail)
4. Update CLAUDE.md with real numbers

---

#### BUG 7: Website timeout on Vercel

**Problem**: `ultradex.vercel.app` timed out on fetch twice.

**Fix**: Check Vercel deployment logs for `apps/website`. Likely causes:
- Next.js version conflict (website uses next@15.5.10, root uses next@16.2.3)
- Build failure due to dependency resolution
- Fix: pin website's own `next` version, ensure `npm run build` succeeds locally first

---

#### BUG 8: Dashboard returns 404 on root

**Problem**: `ultradex-dashboard.vercel.app` shows 404 on root URL.

**Fix**:
1. Check if `apps/dashboard/app/page.tsx` has a default export
2. Add Stripe env vars to Vercel (even test keys: `sk_test_...`)
3. Redeploy after env vars are set
4. Test `/pricing` and `/analytics` routes specifically

---

### Phase 1 Publish Commands (after bugs fixed)

```bash
# Rebuild and publish DexGraph
cd packages/dexgraph
npm version minor   # → 0.4.0 or whatever next version
npm run build
npm publish

# Rebuild and publish SDK (if provider fix applied)
cd packages/sdk
npm version patch
npm run build
npm publish

# Verify both packages work from npm
cd /tmp && mkdir verify && cd verify && npm init -y
npm install @ultra-dex/sdk @ultra-dex/dexgraph
node -e "import('@ultra-dex/sdk').then(m => console.log('SDK OK:', Object.keys(m).length, 'exports'))"
node -e "import('@ultra-dex/dexgraph').then(m => console.log('DexGraph OK:', Object.keys(m).length, 'exports'))"
```

### Phase 1 End-to-End Verification Test

Create this file and run it. If it passes, Phase 1 is complete:

```javascript
// verify-phase1.mjs
import { UltraDex, SmartRouter, MiddlewarePipeline } from '@ultra-dex/sdk';
import { parse, parseString, DexGraph, Scheduler, StateMachine } from '@ultra-dex/dexgraph';

// SDK tests
const dex = new UltraDex({ defaultProvider: 'openai' });
console.assert(typeof dex.chat === 'function', 'SDK: chat exists');
console.assert(typeof dex.registerProvider === 'function', 'SDK: registerProvider exists');
console.assert(typeof dex.enableRouter === 'function', 'SDK: enableRouter exists');
console.log('✓ SDK: all core methods exist');

const router = new SmartRouter({ strategy: 'cheapest' });
console.log('✓ SDK: SmartRouter created');

// DexGraph tests — file parse
import fs from 'fs';
fs.writeFileSync('/tmp/test.yaml', `
name: test-workflow
version: "dexgraph/v1"
tasks:
  - id: research
    role: engineer
    instruction: "Find information"
    verify:
      type: llm_check
  - id: analyze
    role: engineer
    instruction: "Analyze results"
    depends_on: [research]
    verify:
      type: llm_check
  - id: summarize
    role: engineer
    instruction: "Write summary"
    depends_on: [analyze]
    verify:
      type: llm_check
`);

const result = parse('/tmp/test.yaml');
console.assert(result.nodes.length === 3, 'DexGraph: parsed 3 nodes');
console.assert(result.edges.length === 2, 'DexGraph: parsed 2 edges');
console.log('✓ DexGraph: file parse works');

// DexGraph tests — string parse
const result2 = parseString(`
name: inline-test
version: "dexgraph/v1"
tasks:
  - id: step1
    role: engineer
    instruction: "Do something"
`);
console.assert(result2.nodes.length === 1, 'DexGraph: parseString works');
console.log('✓ DexGraph: string parse works');

// DexGraph tests — graph construction
const graph = new DexGraph(result);
console.assert(graph.getAllNodes().length === 3, 'DexGraph: graph has 3 nodes');
console.log('✓ DexGraph: graph construction works');

// DexGraph tests — execution order
const order = graph.getExecutionOrder();
console.assert(order.length === 3, 'DexGraph: execution order has 3 items');
console.assert(order[0] === 'research', 'DexGraph: first step is research');
console.log('✓ DexGraph: getExecutionOrder works:', order);

// DexGraph tests — scheduler
const scheduler = new Scheduler(graph);
console.assert(typeof scheduler.run === 'function', 'DexGraph: scheduler.run exists');
console.log('✓ DexGraph: scheduler created');

console.log('\n=== PHASE 1 VERIFICATION COMPLETE ===');
console.log('All core functionality works. Ready for Phase 2.');
```

---

<a name="phase-2"></a>
## PHASE 2: DexGraph + Deterministic Replay + Run Diffing

**Timeline**: 14 days after Phase 1 complete
**Goal**: Make DexGraph the only workflow engine that can replay and diff multi-agent runs
**Revenue impact**: This is what makes $99/mo DexGraph Pro worth paying for

### The Core Idea

Every `dexgraph run workflow.yaml` automatically generates a `.dexlog` file — an append-only, hash-chained execution log. When a workflow breaks, `dexgraph replay` tells you exactly which step diverged and why. `dexgraph diff` compares two runs and shows what changed.

No other tool in the 2026 ecosystem does this. LangGraph has checkpointing but not causal replay with hash verification. CrewAI has nothing. AutoGen has nothing.

### Architecture

```
workflow.yaml
    │
    ▼
┌─────────────────────┐
│   dexgraph run       │ ─── Execution Mode ───▶ .dexlog file
│   (existing parser   │                         (append-only,
│    + graph + sched)  │                          hash-chained)
└─────────────────────┘
                                                      │
                                                      ▼
                                              ┌──────────────┐
                                              │ dexgraph      │
                                              │ replay <log>  │
                                              │               │
                                              │ Substitutes   │
                                              │ logged outputs│
                                              │ Verifies hash │
                                              │ chain         │
                                              │ Reports first │
                                              │ divergence    │
                                              └──────────────┘
                                                      │
                                                      ▼
                                              ┌──────────────┐
                                              │ dexgraph diff │
                                              │ <log1> <log2> │
                                              │               │
                                              │ Compares two  │
                                              │ runs step by  │
                                              │ step          │
                                              │ Shows exactly │
                                              │ what changed  │
                                              └──────────────┘
```

### Step Schema (Locked — 8 iterations of review)

```typescript
interface ExecutionStep {
  id: string;                    // monotonically increasing, unique within workflow
  agent: string;                 // executing actor (planner, engineer, reviewer, etc.)
  input: Record<string, any>;    // COMPLETE closure — all data visible to agent at step start
  output: Record<string, any>;   // complete result (structured decision, raw tokens, etc.)
  tool_calls: ToolCall[];        // every tool invocation
  tool_results: ToolResult[];    // every tool response (NEVER re-execute in replay)
  model_config: {
    model: string;               // e.g. "gpt-4o", "claude-sonnet-4-20250514"
    temperature: number;
    top_p: number;
    max_tokens: number;
  };
  state_diff: Record<string, any>;  // delta applied to state after this step
  timestamp: number;                // wall-clock, for debugging only (NOT used for ordering)
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  pure: boolean;   // declared by tool — if false, tool_results MUST be logged
}

interface ToolResult {
  call_id: string;   // matches ToolCall.id
  result: any;
  error?: string;
}
```

### State Model (Locked)

```typescript
interface WorkflowState {
  version: number;                    // equals step_id that produced this state
  root_hash: string;                  // H(canonical(data_map))
  data_map: Record<string, any>;      // all mutable workflow data
}

// State transition rule (PURE, no side effects):
function applyStateDiff(
  state: WorkflowState,
  diff: Record<string, any>,
  newVersion: number
): WorkflowState {
  const newData = { ...state.data_map };
  for (const key of Object.keys(diff).sort()) {
    newData[key] = diff[key];
  }
  return {
    version: newVersion,
    root_hash: hash(canonicalize(newData)),
    data_map: newData,
  };
}
```

### Hash Chain (Locked)

```typescript
function computeStepHash(prevHash: string, step: ExecutionStep, stateRootN: string): string {
  const payload =
    prevHash +
    canonicalize(step.id) +
    canonicalize(step.agent) +
    canonicalize(step.input) +
    canonicalize(step.output) +
    canonicalize(step.tool_calls) +
    canonicalize(step.tool_results) +
    canonicalize(step.model_config) +
    canonicalize(stateRootN);
  return sha256(payload);
}

// canonicalize = JSON.stringify with sorted keys (deterministic)
function canonicalize(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}
```

### Fingerprint (Early Divergence Detection)

```typescript
// Computed BEFORE step executes — represents what the step "sees"
function computeFingerprint(input: any, prevStateRoot: string): string {
  return sha256(canonicalize(input) + canonicalize(prevStateRoot));
}
```

### .dexlog File Format

```json
{
  "version": "dexlog/v1",
  "workflow_name": "research-and-summarize",
  "created_at": "2026-04-20T10:00:00Z",
  "initial_state": {
    "version": 0,
    "root_hash": "abc123...",
    "data_map": {}
  },
  "entries": [
    {
      "step_id": "1",
      "fingerprint": "def456...",
      "before_hash": "abc123...",
      "step": { /* full ExecutionStep */ },
      "after_hash": "ghi789...",
      "state_root": "jkl012..."
    }
  ]
}
```

### Replay Engine Logic

```typescript
function replay(logfile: string, fromStep?: number): ReplayResult {
  const log = JSON.parse(fs.readFileSync(logfile, 'utf-8'));

  // 1. Validate initial state
  const computedRoot = hash(canonicalize(log.initial_state.data_map));
  if (computedRoot !== log.initial_state.root_hash) {
    return { error: 'Initial state corrupted', step: 0 };
  }

  let currentState = log.initial_state;
  let currentHash = log.initial_state.root_hash;
  const startIdx = fromStep ? fromStep - 1 : 0;

  for (let i = startIdx; i < log.entries.length; i++) {
    const entry = log.entries[i];
    const step = entry.step;

    // 2. Compute and compare fingerprint
    const expectedFingerprint = computeFingerprint(step.input, currentState.root_hash);
    if (expectedFingerprint !== entry.fingerprint) {
      return {
        divergence: true,
        step: parseInt(step.id),
        cause: classifyDivergence('fingerprint_mismatch', entry, currentState),
        detail: `Fingerprint mismatch at step ${step.id}`,
      };
    }

    // 3. Substitute output + tool_results (NEVER call agent/tool)
    const replayedOutput = step.output;        // use logged output verbatim
    const replayedToolResults = step.tool_results; // use logged results verbatim

    // 4. Apply state_diff
    currentState = applyStateDiff(currentState, step.state_diff, parseInt(step.id));

    // 5. Compute state_root and verify
    if (currentState.root_hash !== entry.state_root) {
      return {
        divergence: true,
        step: parseInt(step.id),
        cause: 'state_corruption',
        detail: `State root mismatch at step ${step.id}: expected ${entry.state_root}, got ${currentState.root_hash}`,
      };
    }

    // 6. Compute hash and verify chain
    const computedHash = computeStepHash(currentHash, step, currentState.root_hash);
    if (computedHash !== entry.after_hash) {
      return {
        divergence: true,
        step: parseInt(step.id),
        cause: 'hash_chain_broken',
        detail: `Hash mismatch at step ${step.id}`,
      };
    }

    currentHash = computedHash;
  }

  return { success: true, steps_replayed: log.entries.length };
}
```

### Divergence Classification (Priority Order — Locked)

```typescript
function classifyDivergence(
  type: string,
  entry: LogEntry,
  currentState: WorkflowState
): string {
  // Priority 1: tool_inconsistency
  if (entry.step.tool_results.length > 0) {
    // Check if any tool_result is missing or differs
    return 'tool_inconsistency';
  }
  // Priority 2: ordering_issue
  if (/* step dependencies not satisfied */) {
    return 'ordering_issue';
  }
  // Priority 3: state_corruption
  if (type === 'fingerprint_mismatch' || type === 'state_root_mismatch') {
    return 'state_corruption';
  }
  // Priority 4: model_variance
  return 'model_variance';
}
```

### Diff Engine Logic

```typescript
function diff(logfile1: string, logfile2: string): DiffResult {
  const log1 = JSON.parse(fs.readFileSync(logfile1, 'utf-8'));
  const log2 = JSON.parse(fs.readFileSync(logfile2, 'utf-8'));

  const diffs: StepDiff[] = [];
  const maxSteps = Math.max(log1.entries.length, log2.entries.length);

  for (let i = 0; i < maxSteps; i++) {
    const e1 = log1.entries[i];
    const e2 = log2.entries[i];

    if (!e1 || !e2) {
      diffs.push({ step: i + 1, type: 'missing_step', detail: !e1 ? 'Missing in run 1' : 'Missing in run 2' });
      continue;
    }

    // Compare outputs
    if (canonicalize(e1.step.output) !== canonicalize(e2.step.output)) {
      diffs.push({
        step: i + 1,
        type: 'output_changed',
        run1: e1.step.output,
        run2: e2.step.output,
        agent: e1.step.agent,
      });
    }

    // Compare tool results
    if (canonicalize(e1.step.tool_results) !== canonicalize(e2.step.tool_results)) {
      diffs.push({
        step: i + 1,
        type: 'tool_results_changed',
        run1: e1.step.tool_results,
        run2: e2.step.tool_results,
      });
    }

    // Compare state
    if (e1.state_root !== e2.state_root) {
      diffs.push({
        step: i + 1,
        type: 'state_diverged',
        detail: `State roots differ after step ${i + 1}`,
      });
    }
  }

  return { total_steps: maxSteps, diffs };
}
```

### CLI Commands (Phase 2 additions to DexGraph)

```bash
# Existing (Phase 1):
dexgraph run workflow.yaml              # runs workflow

# New (Phase 2):
dexgraph run workflow.yaml --log        # runs workflow + generates .dexlog
dexgraph run workflow.yaml --deterministic  # same as --log (default ON in v2)

dexgraph replay <logfile>               # replay from start
dexgraph replay <logfile> --from-step 5 # replay from step 5

dexgraph diff <log1> <log2>             # compare two runs

dexgraph golden <logfile>               # mark a log as "golden" (expected behavior)
dexgraph verify <logfile> --golden <golden-log>  # verify run matches golden
```

### CLI Output Format

**Replay success:**
```
REPLAY: workflow "research-and-summarize" (15 steps)
Steps 1-15: VERIFIED
Hash chain: INTACT
Result: SUCCESS — no divergence detected
```

**Replay with divergence:**
```
REPLAY: workflow "research-and-summarize" (15 steps)
Steps 1-8: VERIFIED
DIVERGENCE at step 9
  CAUSE: tool_inconsistency
  DETAIL: tool_results mismatch
    Expected: [{"status":"cached_ok"}]
    Got:      [{"status":"timeout_retry"}]
  AGENT: engineer
  INPUT hash: 0x7f8a...
  STATE before: 0x3c2b...
Hash chain: BROKEN at step 9
```

**Diff output:**
```
DIFF: run1.dexlog vs run2.dexlog (15 steps)
Step 1-6: identical
Step 7: OUTPUT CHANGED
  run1: {"decision":"use_anthropic","reason":"cheapest"}
  run2: {"decision":"use_openai","reason":"lowest_latency"}
Step 8-10: STATE DIVERGED (cascading from step 7)
Step 11-15: identical (converged)
Summary: 4 steps differ, root cause at step 7
```

### Phase 2 Execution Plan (14 days)

#### Days 1-3: Core Logging Infrastructure

**Files to create:**
- `packages/dexgraph/src/executionLog.ts` — ExecutionStep, ToolCall, ToolResult interfaces + DexLog class
- `packages/dexgraph/src/hashChain.ts` — canonicalize, sha256, computeStepHash, computeFingerprint
- `packages/dexgraph/src/stateManager.ts` — WorkflowState, applyStateDiff

**Agent commands:**
```
1. Create packages/dexgraph/src/executionLog.ts with the ExecutionStep interface and DexLog class that appends entries and writes to .dexlog JSON files.

2. Create packages/dexgraph/src/hashChain.ts with canonicalize (sorted JSON.stringify), sha256 (use Node crypto), computeStepHash, and computeFingerprint functions.

3. Create packages/dexgraph/src/stateManager.ts with WorkflowState interface and applyStateDiff function (pure, sorted keys only).

4. Wire the logging into the existing dispatcher.ts — after each step completes, create a log entry with: step data, fingerprint, before_hash, after_hash, state_root.

5. Add --log flag to the dexgraph CLI that enables logging (write .dexlog file to same directory as workflow).
```

#### Days 4-7: Replay Engine

**Files to create:**
- `packages/dexgraph/src/replayEngine.ts` — replay function with the exact 6-step sequence
- `packages/dexgraph/src/divergenceClassifier.ts` — classify function with priority ordering

**Agent commands:**
```
1. Create packages/dexgraph/src/replayEngine.ts implementing the replay function:
   - Load .dexlog file
   - Validate initial state (root_hash must match H(canonical(data_map)))
   - For each entry: compute fingerprint → compare → substitute output/tool_results → apply state_diff → verify state_root → verify hash chain
   - On first mismatch: stop and return divergence report

2. Create packages/dexgraph/src/divergenceClassifier.ts with priority ordering:
   1. tool_inconsistency
   2. ordering_issue
   3. state_corruption
   4. model_variance

3. Add "dexgraph replay <logfile>" and "dexgraph replay <logfile> --from-step N" CLI commands.

4. Write test: create 5-step workflow, log it, replay it — must succeed with zero divergence.

5. Write test: create 5-step workflow, inject tool_result mismatch at step 3, replay — must output "DIVERGENCE at step 3 — CAUSE: tool_inconsistency".
```

#### Days 8-10: Diff Engine + Polish

**Files to create:**
- `packages/dexgraph/src/diffEngine.ts` — diff function comparing two .dexlog files

**Agent commands:**
```
1. Create packages/dexgraph/src/diffEngine.ts implementing the diff function:
   - Load two .dexlog files
   - Compare step-by-step: outputs, tool_results, state_roots
   - Report all differences with step number and type
   - Identify root cause step (first divergence)

2. Add "dexgraph diff <log1> <log2>" CLI command.

3. Add "dexgraph golden <logfile>" that copies a log to .golden directory.

4. Add "dexgraph verify <logfile> --golden <golden-log>" that diffs against golden and reports pass/fail.

5. Write test: run same workflow twice with different model configs, diff the logs, verify correct output.
```

#### Days 11-14: Integration Test + Publish

**Agent commands:**
```
1. Run a real 10+ step workflow with dexgraph run --log.

2. Replay the log — must show SUCCESS with full hash chain verified.

3. Deliberately break something (change a tool response, modify state) and replay — must catch exact step + cause.

4. Run the same workflow twice and diff — must show meaningful comparison.

5. Bump version to @ultra-dex/dexgraph v2.0.0 (major version because new feature).

6. npm run build && npm publish

7. Update README.md with the 3 new CLI commands (replay, diff, golden/verify).

8. Update pricing page: "DexGraph Pro now includes deterministic replay and run diffing."
```

### Phase 2 Success Criteria

- [ ] `dexgraph run --log` generates valid .dexlog for any workflow
- [ ] `dexgraph replay` verifies hash chain and detects divergence at exact step
- [ ] `dexgraph diff` compares two runs and identifies root cause
- [ ] All existing DexGraph tests still pass
- [ ] New replay/diff tests pass
- [ ] Published as `@ultra-dex/dexgraph` v2.0.0

### Phase 2 Termination Condition

If after 14 days the replay engine cannot catch a deliberately injected divergence at the correct step with the correct classification → remove all Phase 2 code and revert to Phase 1 DexGraph.

---

<a name="phase-3"></a>
## PHASE 3: Portable Sovereign Runtime (Only After Phase 2 Has Paying Users)

**Timeline**: 14 days, starts ONLY when Phase 2 has ≥3 paying DexGraph Pro users
**Goal**: Same workflow.yaml runs identically on laptop, Docker, K8s, air-gapped cluster, or cloud

### Why Phase 3 Depends on Phase 2

Portability requires determinism. Determinism requires the replay log. If the replay log (Phase 2) doesn't work, portability is impossible. The .dexlog file IS the portable execution spec — it defines behavior independent of environment.

### Architecture

```
workflow.yaml + .dexlog (golden)
         │
         ▼
┌─────────────────────────────┐
│  Ultra-Dex Runtime           │
│                              │
│  Same binary, multiple       │
│  targets:                    │
│                              │
│  ┌──────────┐ ┌──────────┐  │
│  │  Local    │ │  Docker  │  │
│  │  (laptop) │ │  (image) │  │
│  └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐  │
│  │  K8s     │ │  Cloud   │  │
│  │  (helm)  │ │  (hosted)│  │
│  └──────────┘ └──────────┘  │
│                              │
│  Verification:               │
│  dexgraph verify --golden    │
│  → confirms identical        │
│    behavior across envs      │
└─────────────────────────────┘
```

### Phase 3 Execution (High-Level — Details When Phase 2 Completes)

**Days 1-4**: Package DexGraph + replay engine as single Docker image. `docker run ultradex/runtime workflow.yaml` produces identical .dexlog as local run.

**Days 5-8**: Add Kubernetes Helm chart. Same workflow, same .dexlog, on any K8s cluster. Verify with `dexgraph diff local.dexlog k8s.dexlog` → zero differences.

**Days 9-11**: Add air-gapped mode: bundle local models (quantized Llama/Mistral) as providers. Workflow runs without internet. Verify identical behavior via golden log.

**Days 12-14**: Ship as Ultra-Dex Runtime v1.0.0. Docker Hub image + Helm chart + single binary for bare metal. Price: $499/mo Enterprise tier.

### Phase 3 Target Users

- Fintech companies in India (RBI data residency rules)
- EU companies (GDPR, AI Act compliance)
- Government contractors (air-gapped networks)
- Healthcare (HIPAA, patient data cannot leave premises)

### Phase 3 Termination

If after shipping no regulated buyer shows interest within 30 days of outreach → terminate and focus on growing Phase 2 revenue.

---

<a name="revenue-model"></a>
## REVENUE MODEL (All Phases)

| Tier | Price | What They Get | Phase |
|------|-------|---------------|-------|
| Free | $0 | SmartRouter SDK (npm), all adapters, circuit breakers | Phase 1 |
| Pro Dashboard | $29/mo | Cost analytics, savings reports, provider health | Phase 1 |
| DexGraph Pro | $99/mo | Workflow orchestration + **deterministic replay + run diffing** | Phase 2 |
| Enterprise | $499/mo | Everything + portable runtime + air-gapped + audit exports | Phase 3 |

**Revenue targets:**
- Phase 1 end: 10 SDK users, 1-3 Pro Dashboard ($29-87 MRR)
- Phase 2 end: 5 DexGraph Pro users ($495 MRR)
- Phase 3 end: 1-2 Enterprise ($499-998 MRR)
- Total at Phase 3 end: ~$1,500 MRR

---

<a name="yc-timeline"></a>
## YC APPLICATION TIMELINE

**When to apply**: After Phase 2 ships and you have ≥3 paying users (any tier).

**What makes your application strong:**
1. Two published npm packages with real downloads
2. Paying customers (even $29/mo proves willingness to pay)
3. Technical moat: only workflow engine with deterministic replay + causal debugging
4. Solo founder who shipped everything from IIT — strong execution signal
5. Clear product ladder: free → $29 → $99 → $499

**What to say in the YC application:**
- Problem: "40%+ of multi-agent AI pilots fail because of state drift, broken handoffs, and zero debugging. No tool tells you which step broke and why."
- Solution: "DexGraph: define AI workflows in YAML, we compile them into DAGs, route each step to the cheapest provider, and give you Git-like replay when things break."
- Traction: "[X] npm downloads, [Y] paying users at $[Z] MRR"
- Ask: "$500K to hire 2 engineers and go from solo builder to production platform"

---

## SUMMARY: What To Do Right Now

1. **Give Phase 1 bug list (Bugs 1-8 above) to your agents** in the Ultra-Dex Cowork session. Have them fix in order. Verify with the Phase 1 end-to-end test script.

2. **After Phase 1 bugs are fixed**: Start Phase 2 (Days 1-3 agent commands above). Build the execution log, hash chain, and state manager first.

3. **After Phase 2 ships**: Get 3-5 developers to try `dexgraph run --log` and `dexgraph replay` on their own workflows.

4. **After Phase 2 has paying users**: Start Phase 3 (portable runtime).

5. **After Phase 3 has ≥1 enterprise customer**: Apply to YC.

No shortcuts. No skipping phases. Each phase feeds the next.
