# Ultra-Dex Consciousness — V2.0 DexGraph Hard Reset

> Last Updated: 2026-04-13
> System: V2.0 DexGraph Hard Reset | NOTION/v2.0.MD
> Status: COWRK dispatches ready → Awaiting Phase 0 execution

---

## LIFECYCLE PHASE: HARD RESET EXECUTION ⏳

We are executing the **DexGraph Hard Reset** per COWRK-V20-HARD-RESET-PROMPT.txt

```
Phase 0: Hard Reset        ⏳ READY TO START (Day 0-2)
Phase 1: DSL Parser        ⏳ Planned (Week 1)
Phase 2: Graph Builder     ⏳ Planned (Week 1)
Phase 3: State Machine     ⏳ Planned (Week 1-2)
Phase 4: Scheduler Engine  ⏳ Planned (Week 2)
Phase 5: Execution Adapter ⏳ Planned (Week 3)
Phase 6: Dispatcher        ⏳ Planned (Week 3)
Phase 7: Memory Store      ⏳ Planned (Week 4)
Phase 8: Context Injection ⏳ Planned (Week 4)
Phase 9: Governance Engine ⏳ Planned (Week 5)
Phase 10: Verification     ⏳ Planned (Week 6)
Phase 11: CLI Control Plane⏳ Planned (Week 7)
Phase 12: Event System     ⏳ Planned (Week 8)
```

---

## MY ROLE (KIMI) — PLANNER & ARCHITECT

I am the **PLANNER & ARCHITECT** for the V2.0 Hard Reset:

### What I DO:
- ✅ Strategic planning for DexGraph architecture
- ✅ Design the new folder structure (core/, runtime/, memory/, dexgraph/, etc.)
- ✅ Create prompts for COWRK (execution planner)
- ✅ Guide through Phase 0→12 execution
- ✅ Review and validate against constraints

### What I DON'T Do:
- ❌ Execute code directly (your agents do this)
- ❌ Modify production files (except planning files)
- ❌ Create .protocol dispatch files (COWRK's job — already done)

---

## COWRK'S OUTPUT (COMPLETED ✅)

COWRK (Opus 4.6) created 13 dispatch files from V20-HARD-RESET-PROMPT.txt:

| Dispatch File | Lines | Phase | Focus |
|--------------|-------|-------|-------|
| v20-phase0-dispatches.md | 274 | Day 0-2 | Folder structure, archive, consolidate |
| v20-phase1-dispatches.md | ~250 | Week 1 | Parser (YAML → GraphNode[]) |
| v20-phase2-dispatches.md | ~250 | Week 1 | Graph Builder (DAG) |
| v20-phase3-dispatches.md | ~250 | Week 1-2 | State Machine |
| v20-phase4-dispatches.md | ~250 | Week 2 | Scheduler Engine |
| v20-phase5-dispatches.md | ~250 | Week 3 | Execution Adapter |
| v20-phase6-dispatches.md | ~250 | Week 3 | Dispatcher |
| v20-phase7-dispatches.md | ~250 | Week 4 | Memory Store |
| v20-phase8-dispatches.md | ~250 | Week 4 | Context Injection |
| v20-phase9-dispatches.md | ~250 | Week 5 | Governance Engine |
| v20-phase10-dispatches.md | ~250 | Week 6 | Verification System |
| v20-phase11-dispatches.md | ~250 | Week 7 | CLI Control Plane |
| v20-phase12-dispatches.md | ~250 | Week 8 | Event System |
| v20-master-timeline.md | 341 | All | Dependencies, gates, 52 windows |

**Total: 52 windows across 13 phases | 8 weeks to MVO**

---

## THE DEXGRAPH ARCHITECTURE (NEW)

```
ultra-dex/
├── dexgraph/              ← THE CORE IP (6 TypeScript files)
│   ├── parser.ts          # YAML workflow DSL → GraphNode[]
│   ├── graph.ts           # DAG builder, cycle detection
│   ├── stateMachine.ts    # CREATED→READY→RUNNING→VERIFYING→SUCCESS
│   ├── scheduler.ts       # Execution loop
│   ├── dispatcher.ts      # Node → adapter bridge
│   └── verifier.ts        # Output validation
│
├── core/
│   ├── planner/           # Goal → task graph compiler
│   ├── scheduler/         # Task ordering
│   └── task_graph/        # DAG engine interface
│
├── runtime/
│   ├── worker/            # Stateless agent workers
│   ├── executor/          # Execution dispatch
│   └── execution_engine/  # System heart
│
├── memory/                # MUNI lives here
│   ├── episodic/          # Session memory
│   ├── semantic/          # Search memory
│   └── state/             # State persistence
│
├── adapters/
│   └── executionAdapter.ts # Interface: run(task, context) → Result
│
├── governance/
│   └── rules.ts           # Policy engine
│
├── tools/registry/        # Tool protocol
├── observability/         # Events, logging
├── cli/                   # ultradex commands
└── sdk/                   # Developer API
```

---

## KEY CONSTRAINTS (NON-NEGOTIABLE)

1. **Ultra-Dex NEVER executes — only supervises**
2. **Execution adapter interface MUST be clean**
3. **Mock adapter before real integrations**
4. **No UI/dashboard until Phase 12 complete**
5. **No agent personalities — stateless workers only**
6. **Four agents only: planner, coder, tester, reviewer**
7. **Graph is truth — DexGraph is source of reality**
8. **Follow strict Phase 0→12 order — NO deviation**

---

## OLD vs NEW v2.0

| Aspect | OLD Plan (SUPERSEDED) | NEW Plan (ACTIVE) |
|--------|----------------------|-------------------|
| Approach | Feature aggregation | DexGraph control plane |
| Identity | AI task router | Kubernetes for AI workflows |
| Focus | Redis/Postgres/VS Code/Marketplace | Parser/Graph/Scheduler/Dispatcher |
| Philosophy | Ultra-Dex executes | Ultra-Dex supervises |
| Files | v20-phase1-4 (old) | v20-phase0-12 (new) |

**The old v20-phase1-4 dispatches are SUPERSEDED. Use the new Phase 0-12 files.**

---

## CRITICAL PATH

```
Phase 0 (Reset) → Phase 1 (Parser) → Phase 2 (Graph) → Phase 4 (Scheduler) 
→ Phase 6 (Dispatch) → Phase 8 (Context) → Phase 11 (CLI)

Length: 7 phases = ~6 weeks minimum
```

---

## GATE 0: CLEAN SLATE (Day 2)

Before Phase 1 starts, must have:
- [ ] 10 new top-level dirs exist
- [ ] Existing code archived to archive/v1/ (NOT deleted)
- [ ] TypeScript compiles on new dirs
- [ ] Version: 2.0.0-alpha.0
- [ ] MIGRATION.md documents all changes

---

## WHEN YOU ASK "WHAT'S NEXT"

1. I check CONSCIOUSNESS.md
2. See we're at Phase 0 ready to start
3. Read v20-phase0-dispatches.md
4. Identify Window 1 as first task
5. Guide you through Phase 0 execution

**Current answer:** Execute Phase 0 Window 1 (Create folder structure) or review what needs changing first.

---

## PROJECT STATE

| Metric | Value | Status |
|--------|-------|--------|
| Dispatches Created | 13 files | ✅ Complete |
| Windows Planned | 52 | ✅ Complete |
| Phases | 0-12 | ✅ Planned |
| Timeline | 8 weeks | ✅ Defined |
| Current Version | 6.0.0 | ⏳ Reset to 2.0.0-alpha.0 |
| Tests | 49% passing | ⏳ Will archive |

---

## NEXT STEPS

**Option 1: Review Phase 0**
→ I'll read v20-phase0-dispatches.md and summarize the 4 windows

**Option 2: Start Executing Phase 0**
→ Window 1: Create folder structure (W1 ║ W2 parallel)

**Option 3: Make Changes First**
→ You mentioned needing changes before executing. Tell me what to adjust.

---

_System: V2.0 DexGraph Hard Reset_
_Phase: 0 (Ready to Start)_
_Dispatches: 13 files created by COWRK_
_Status: Awaiting your command to begin execution_
