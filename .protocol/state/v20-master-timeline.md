# V2.0 MASTER TIMELINE — DexGraph Hard Reset
> Source: NOTION/v2.0.MD + COWRK-V20-HARD-RESET-PROMPT.txt
> Covers: 52 windows across 13 phases (8 weeks)
> Architecture: DexGraph control plane — "Build the brain. Delegate the hands."
> Generated: 2026-04-12

---

## IDENTITY (LOCKED)

```
Ultra-Dex = Deterministic, stateful orchestration control plane
Ultra-Dex NEVER executes. Ultra-Dex SUPERVISES execution.
DexGraph = Semantic DAG engine for non-deterministic AI systems
Category: Kubernetes for AI workflows
```

---

## PHASE MAP

```
Phase 0:  HARD RESET         (Day 0-2)   → 4 windows  → v2.0.0-alpha.0
Phase 1:  DSL Parser          (Week 1)    → 4 windows  → dexgraph/parser.ts
Phase 2:  Graph Builder       (Week 1)    → 4 windows  → dexgraph/graph.ts
Phase 3:  State Machine       (Week 1-2)  → 4 windows  → dexgraph/stateMachine.ts
Phase 4:  Scheduler Engine    (Week 2)    → 4 windows  → dexgraph/scheduler.ts
Phase 5:  Execution Adapter   (Week 3)    → 4 windows  → adapters/executionAdapter.ts
Phase 6:  Dispatcher          (Week 3)    → 4 windows  → dexgraph/dispatcher.ts
Phase 7:  Memory Store        (Week 4)    → 4 windows  → memory/workflowStore.ts
Phase 8:  Context Injection   (Week 4)    → 4 windows  → context propagation
Phase 9:  Governance Engine   (Week 5)    → 4 windows  → governance/rules.ts
Phase 10: Verification        (Week 6)    → 4 windows  → dexgraph/verifier.ts
Phase 11: CLI Control Plane   (Week 7)    → 4 windows  → cli/
Phase 12: Event System        (Week 8)    → 4 windows  → core/events.ts
                                            ─────────
                                            52 windows total
```

---

## DEPENDENCY GRAPH

```
PHASE 0: Hard Reset
├── W1 Folder structure ──┐
├── W2 Audit & archive ───┤── W3 Consolidate → W4 Validate clean slate
└────────────────────────────────────────────────────────────────── GATE 0: Clean structure

PHASE 1: Parser (depends: Phase 0)
├── W1 Types + YAML loader ──┐
│                             ├── W2 Dependency extraction ──┐
│                             └── W3 Schema validation ──────┤── W4 Parser tests
└────────────────────────────────────────────────────────────── parse() works

PHASE 2: Graph (depends: Phase 1 types)
├── W1 Node registry → W2 Edge creation → W3 Cycle detection → W4 Topo sort + tests
└────────────────────────────────────────────────────────────── DexGraph class works

PHASE 3: State Machine (depends: Phase 1 types)
├── W1 State types → W2 Transitions → W3 Retry logic → W4 Rollback + tests
└────────────────────────────────────────────────────────────── State transitions work

PHASE 4: Scheduler (depends: Phase 2 + Phase 3)
├── W1 Loop structure → W2 Dep unlock → W3 Failure handling → W4 Integration tests
└────────────────────────────────────────────────────────────── GATE 1: Graph runs

PHASE 5: Adapter (depends: Phase 1 types only)
├── W1 Interface def → W2 Mock adapter → W3 Result types → W4 Tests
└────────────────────────────────────────────────────────────── Execution abstracted

PHASE 6: Dispatcher (depends: Phase 4 + Phase 5)
├── W1 Queue → W2 Node→adapter bridge → W3 Result handling → W4 Verifier integration
└────────────────────────────────────────────────────────────── GATE 2: Execution delegated

PHASE 7: Memory (depends: Phase 1 types)
├── W1 Schema → W2 JSON store → W3 Context persistence → W4 Crash recovery
└────────────────────────────────────────────────────────────── State persists

PHASE 8: Context Injection (depends: Phase 6 + Phase 7)
├── W1 Output collector → W2 Context injection → W3 Propagation engine → W4 No-reprompt test
└────────────────────────────────────────────────────────────── GATE 3: Context flows

PHASE 9: Governance (depends: Phase 3 + Phase 4)
├── W1 Rule engine → W2 Block/pause → W3 Policy evaluation → W4 Tests
└────────────────────────────────────────────────────────────── Policies enforced

PHASE 10: Verification (depends: Phase 6)
├── W1 Verifier types → W2 Success checks → W3 Output validation → W4 Tests
└────────────────────────────────────────────────────────────── Outputs verified

PHASE 11: CLI (depends: Phase 4 + Phase 7 + Phase 8)
├── W1 CLI structure + init → W2 run command → W3 status/resume → W4 inspect + tests
└────────────────────────────────────────────────────────────── GATE 4: Usable system

PHASE 12: Events (depends: Phase 4 + Phase 6)
├── W1 Event types → W2 EventEmitter → W3 Wire into modules → W4 Tests
└────────────────────────────────────────────────────────────── Observability foundation
```

---

## CRITICAL PATH

```
Phase 0 → Phase 1 → Phase 2 → Phase 4 → Phase 6 → Phase 8 → Phase 11
(Reset)   (Parser)  (Graph)   (Scheduler) (Dispatch) (Context) (CLI)

Length: 7 phases on critical path = ~6 weeks minimum
```

Phases that can run in parallel:
- Phase 2 ║ Phase 3 (both depend on Phase 1, independent of each other)
- Phase 5 ║ Phase 7 (both depend on Phase 1 types, independent)
- Phase 9 ║ Phase 10 ║ Phase 12 (all depend on earlier phases, independent of each other)

---

## PARALLEL EXECUTION MAP

```
Day 0-2 ─── Phase 0: W1║W2 → W3 → W4                          ← GATE 0
Week 1  ─── Phase 1: W1→W2║W3→W4 | Phase 2: W1→W2→W3→W4      ← Parser+Graph
            Phase 3: W1→W2→W3→W4 (parallel with Phase 2)
Week 2  ─── Phase 4: W1→W2→W3→W4                               ← GATE 1: Graph runs
            Phase 5: W1→W2→W3→W4 (can start after Phase 1)
Week 3  ─── Phase 6: W1→W2→W3→W4                               ← GATE 2: Execution delegated
            Phase 7: W1→W2→W3→W4 (parallel with Phase 6)
Week 4  ─── Phase 8: W1→W2→W3→W4                               ← GATE 3: Context flows
Week 5  ─── Phase 9: W1→W2→W3→W4 ║ Phase 10: W1→W2→W3→W4
Week 6-7 ── Phase 11: W1→W2→W3→W4                              ← GATE 4: Usable system
Week 8  ─── Phase 12: W1→W2→W3→W4                              ← MVO COMPLETE
```

---

## MILESTONE GATES

### Gate 0: Clean Slate (Day 2)
```
□ 10 new top-level dirs exist (core/, runtime/, memory/, dexgraph/, adapters/, governance/, tools/, observability/, cli/, sdk/)
□ Existing code archived to archive/v1/ (NOT deleted)
□ TypeScript compiles on new dirs
□ Version: 2.0.0-alpha.0
□ MIGRATION.md documents all changes
```

### Gate 1: Graph Runs (End of Week 2)
```
□ YAML workflow parses → DexGraph → topological sort → scheduler runs
□ Linear, parallel, and diamond workflows execute correctly
□ Retry with backoff works
□ Rollback propagates to dependents
□ 30+ tests passing (parser + graph + state machine + scheduler)
□ VALIDATION: parse examples/simple.dex → build graph → run scheduler → all nodes SUCCESS
```

### Gate 2: Execution Delegated (End of Week 3)
```
□ ExecutionAdapter interface defined
□ Mock adapter works (returns fake results)
□ Dispatcher bridges scheduler → adapter → verifier
□ Scheduler never touches adapter directly
□ Result flows: adapter → dispatcher → state machine
```

### Gate 3: Context Flows (End of Week 4)
```
□ Node outputs persisted to JSON filesystem
□ Dependency outputs collected and injected into context
□ Multi-step workflow runs without re-prompting
□ Crash recovery: kill process, resume from persisted state
□ VALIDATION: workflow A→B→C where B uses A's output, C uses A+B's output
```

### Gate 4: Minimum Viable Orchestrator (End of Week 7)
```
□ ultradex init → creates project scaffold
□ ultradex run workflow.dex → parses, builds graph, executes
□ ultradex status → shows current node states
□ ultradex resume → continues from crash
□ ultradex inspect → shows graph structure
□ Governance blocks invalid transitions
□ Verification validates outputs
□ All tests passing
```

### Final: MVO Release (End of Week 8)
```
□ Event system emits workflow/task lifecycle events
□ All 13 phases complete
□ 52 windows validated
□ Version: 2.0.0
□ THIS = Ultra-Dex v2.0. Stop here and release.
```

---

## AGENT ALLOCATION

| Agent | Windows | % | Primary Use |
|-------|---------|---|-------------|
| Claude Opus | 13 | 25% | Core architecture, types, scheduler, governance |
| Claude Sonnet | 13 | 25% | Implementation, CLI, integration |
| Codex o1/o3 | 10 | 19% | Algorithm correctness, tests, validation |
| Gemini Pro | 10 | 19% | Test generation, bulk implementation |
| Qwen Max | 4 | 8% | Documentation, templates |
| Copilot | 2 | 4% | Code review, PR coordination |
| OpenCode/NVIDIA | 0 primary | 0% | Fallback #3 across all 52 windows |

### Cost Estimate
| Category | Count | Cost |
|----------|-------|------|
| SUBSCRIPTION (Claude, Codex) | 36 | ~$20/mo |
| FREE (Gemini, Qwen) | 14 | $0 |
| Copilot | 2 | $0 (included) |
| **Total** | **52** | **~$20/mo** |

---

## WHAT GETS BUILT (File Tree)

```
ultra-dex/                        (existing repo root)
├── dexgraph/                     ← THE CORE IP
│   ├── types.ts                  (Phase 1) — All type definitions
│   ├── errors.ts                 (Phase 1) — Error classes
│   ├── schema.ts                 (Phase 1) — YAML validation
│   ├── parser.ts                 (Phase 1) — YAML → GraphNode[]
│   ├── graph.ts                  (Phase 2) — DAG builder
│   ├── stateMachine.ts           (Phase 3) — State transitions
│   ├── scheduler.ts              (Phase 4) — Execution loop
│   ├── dispatcher.ts             (Phase 6) — Scheduler → adapter bridge
│   └── verifier.ts               (Phase 10) — Output validation
│
├── adapters/
│   ├── executionAdapter.ts       (Phase 5) — Interface
│   └── mockAdapter.ts            (Phase 5) — Test adapter
│
├── memory/
│   ├── workflowStore.ts          (Phase 7) — JSON persistence
│   ├── contextStore.ts           (Phase 8) — Output persistence
│   ├── episodic/                 (Phase 0) — Session memory
│   ├── semantic/                 (Phase 0) — Search memory
│   └── state/                    (Phase 0) — State memory
│
├── governance/
│   └── rules.ts                  (Phase 9) — Policy engine
│
├── core/
│   ├── events.ts                 (Phase 12) — EventEmitter
│   ├── planner/                  (Phase 0) — Goal → task graph
│   ├── scheduler/                (Phase 0) — Orchestration
│   └── task_graph/               (Phase 0) — DAG interface
│
├── cli/
│   └── index.ts                  (Phase 11) — ultradex commands
│
├── observability/
│   └── index.ts                  (Phase 12) — Logging hooks
│
├── runtime/
│   ├── worker/                   (Phase 0) — Agent workers
│   ├── executor/                 (Phase 0) — Execution dispatch
│   └── execution_engine/         (Phase 0) — System heart
│
├── tools/
│   └── registry/                 (Phase 0) — Tool protocol
│
├── sdk/
│   └── index.ts                  (Phase 0) — Developer API
│
├── examples/
│   └── simple.dex                (Phase 1) — Sample workflow
│
├── tests/dexgraph/
│   ├── parser.test.ts            (Phase 1)
│   ├── graph.test.ts             (Phase 2)
│   ├── stateMachine.test.ts      (Phase 3)
│   ├── scheduler.test.ts         (Phase 4)
│   ├── dispatcher.test.ts        (Phase 6)
│   └── verifier.test.ts          (Phase 10)
│
├── tests/adapters/               (Phase 5)
├── tests/memory/                 (Phase 7, 8)
├── tests/governance/             (Phase 9)
├── tests/cli/                    (Phase 11)
├── tests/events/                 (Phase 12)
│
├── archive/v1/                   (Phase 0) — Old codebase preserved
│   ├── AUDIT.md
│   └── src/core/...
│
└── MIGRATION.md                  (Phase 0) — Migration guide
```

**Total new files: ~30 | Total estimated LOC: ~3,000-4,000**

---

## CONSTRAINTS (NON-NEGOTIABLE)

1. Ultra-Dex NEVER executes — only supervises
2. Execution adapter interface MUST be clean
3. Mock adapter before real integrations
4. No UI/dashboard until Phase 12 complete
5. No agent personalities — stateless workers only
6. Four agents only: planner, coder, tester, reviewer
7. Graph is truth — DexGraph is source of reality
8. Follow strict Phase 0→12 order — NO deviation

---

## EXECUTION RECOVERY PROMPT

```
Read .protocol/state/v20-master-timeline.md
Identify current phase (check which gate last passed)
Read the corresponding v20-phaseX-dispatches.md
Find the next uncompleted window
Execute its command
Validate per window criteria
If blocked → check fallbacks → escalate
Continue to next window
```

---

## WHAT THIS IS NOT

This is NOT the old v2.0 plan (Phase 1-4: Redis/Postgres/npm/VSCode/Marketplace).
That plan treated Ultra-Dex as a feature aggregation tool.

This IS the DexGraph hard reset per NOTION/v2.0.MD.
Ultra-Dex = control plane infrastructure = Kubernetes for AI workflows.

Old dispatches (v20-phase1 through v20-phase4 from previous sessions) are SUPERSEDED by these files.

---

*Master timeline generated 2026-04-12 | DexGraph Hard Reset | 52 windows | 13 phases | 8 weeks | MVO*
