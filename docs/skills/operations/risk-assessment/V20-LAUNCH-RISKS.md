# Risk Assessment: Ultra-Dex V2.0 Hard Reset

**Generated:** 2026-04-13  
**Project:** Ultra-Dex v2.0 Hard Reset  
**Scope:** Phase 0 foundation work, 52-window execution plan, MVO release path

---

## Executive Summary

Ultra-Dex v2.0 is in a hard-reset state with the 52-window execution plan defined and Phase 0 still pending execution. The main risk is not market timing; it is structural integrity. If Phase 0 is incomplete or sloppy, every downstream phase inherits compounding rework.

The highest-risk categories are:

- Phase 0 structure and archive mistakes that contaminate the new architecture
- critical-path slippage across Parser → Graph → Scheduler → Dispatcher → Context → CLI
- mismatch between documented V2.0 architecture and actual executable code
- incomplete verification/governance wiring causing false confidence at release gates

Current recommendation: treat Gate 0 and Gate 1 as hard stop/go checkpoints. Do not optimize for speed at the expense of architectural isolation.

---

## Risk Register

| ID | Risk | Probability | Impact | Score | Mitigation |
| --- | --- | --- | --- | --- | --- |
| R1 | Phase 0 archive/migration decisions are incomplete or wrong | HIGH | CRITICAL | 🔴 12 | Complete audit with explicit KEEP/MIGRATE/ARCHIVE rationale before further build |
| R2 | New V2.0 modules import legacy `src/` code and break hard-reset isolation | HIGH | HIGH | 🔴 9 | Enforce import boundary checks and fail builds on cross-contamination |
| R3 | Critical path slips and compresses downstream quality work | HIGH | HIGH | 🔴 9 | Track phase gates weekly and protect critical-path windows from side work |
| R4 | Scheduler, dispatcher, verification, and governance boundaries drift | MEDIUM | HIGH | 🟠 6 | Lock interfaces with ADR/spec artifacts before broad implementation |
| R5 | Phase gates pass on partial implementation and create false readiness | MEDIUM | HIGH | 🟠 6 | Convert each gate into executable validation, not narrative checklist only |
| R6 | Workflow persistence and crash recovery lag behind orchestration buildout | MEDIUM | HIGH | 🟠 6 | Wire `WorkflowStore` and resume scenarios before CLI claims reliability |
| R7 | TypeScript/build health regresses and blocks compounding execution | MEDIUM | HIGH | 🟠 6 | Keep `npx tsc --noEmit` and targeted tests green at every gate |
| R8 | Team/tool capacity across 52 windows is overestimated | MEDIUM | MEDIUM | 🟡 4 | Tighten scope to MVO and cut non-critical polish until Gate 4 |
| R9 | Version/reset messaging is inconsistent across docs, package, and release state | LOW | MEDIUM | 🟡 2 | Treat `2.0.0-alpha.0` and migration docs as single-source release metadata |
| R10 | YC/demo timeline pressure pushes launch before governance and verification are real | MEDIUM | CRITICAL | 🟠 8 | Do not ship public claims beyond what Gate 4 and final validation prove |

---

## Risk Heat Map

```text
                   Impact
Probability   Medium        High          Critical
High          R8            R2,R3         R1
Medium        R9            R4,R5,R6,R7   R10
Low           -             -             -
```

---

## Top Risks

### R1: Phase 0 archive/migration errors

**Status:** 🔴 Critical

Phase 0 is the foundation for all later phases. If the archive decisions are incomplete, history is lost, modules are misplaced, or legacy assumptions survive into new directories, the system will spend the remaining 48 windows building on a compromised base.

**Why this is high risk**

- Phase 0 defines the canonical top-level structure
- all later phases assume clean directory and import boundaries
- the dispatch explicitly requires zero deletion and preserved history

**Mitigation**

- classify every relevant legacy module with explicit rationale
- preserve moves via `git mv`
- validate no new module imports from old `src/`
- treat Gate 0 as mandatory before continuing

**Contingency**

- pause Phase 1+ work
- finish audit and migration guide first
- re-run structural validation before resuming

### R3: Critical-path slippage across 52 windows

**Status:** 🔴 High

The timeline has a clear critical path:

`Phase 0 -> Phase 1 -> Phase 2 -> Phase 4 -> Phase 6 -> Phase 8 -> Phase 11`

This leaves limited slack. Any delay in parser, graph, scheduler, dispatcher, or context flow directly compresses validation time later.

**Why this is high risk**

- 7 critical phases span roughly 6 weeks minimum
- later gates depend on working integration, not isolated modules
- pressure to show progress can lead to parallelizing work that is not actually independent

**Mitigation**

- protect critical-path windows from opportunistic side work
- run parallel work only on genuinely independent phases
- review timeline variance at each weekly gate

**Contingency**

- cut non-critical CLI polish and event-system scope before cutting core orchestration quality

### R10: Shipping before governance and verification are real

**Status:** 🟠 Severe

The architecture claims deterministic, governed orchestration. If governance and verification exist only as placeholders while release messaging implies production readiness, trust breaks immediately.

**Why this is high risk**

- the product promise is control, not just execution
- governance and verification are late-phase features in the 52-window plan
- release pressure often arrives before the safety systems are complete

**Mitigation**

- treat Gate 4 as the minimum operational claim boundary
- require proof that governance blocks invalid execution paths
- require verification to validate outputs before success is claimed

**Contingency**

- keep release status at alpha/internal preview until those gates are objectively satisfied

---

## Phase 0 Risk Matrix

| Window | Risk | Failure Mode | Mitigation |
| --- | --- | --- | --- |
| W1 Structure | Wrong folder model or inconsistent naming | downstream modules built in wrong places | validate against `NOTION/v2.0.MD` and `v20-phase0-dispatches.md` before merge |
| W2 Audit | Legacy code misclassified | useful code archived or contamination retained | require complete audit log with rationale |
| W3 Memory | Memory migration drags legacy assumptions into v2.0 | persistence layer not standalone | keep new memory interfaces isolated from `src/` |
| W4 Validation | Gate passes with partial checks | false “clean slate” confidence | require compile, version, migration guide, and import-boundary verification |

---

## 52-Window Program Risks

### Dependency risk

The 52-window plan has good decomposition, but success depends on respecting actual dependencies rather than nominal phase labels.

Highest dependency sensitivity:

- Phase 1 Parser -> Phase 2 Graph
- Phase 2 Graph + Phase 3 State -> Phase 4 Scheduler
- Phase 4 Scheduler + Phase 5 Adapter -> Phase 6 Dispatcher
- Phase 6 Dispatcher + Phase 7 Memory -> Phase 8 Context
- Phase 4 + 7 + 8 -> Phase 11 CLI

Mitigation:

- block dependent work on failing gates
- keep integration demos small and repeatable
- track dependency failures as schedule risk, not only technical debt

### Quality risk

There is a specific risk that modules appear “done” in isolation but fail at integration points:

- scheduler uses a minimal dispatcher interface
- dispatcher has richer context and verification behavior
- workflow persistence is not yet fully wired into scheduler transitions
- verification can be represented in state without fully enforced runtime checks

Mitigation:

- convert interface boundaries into explicit specs and tests
- validate Gate 1 to Gate 4 with end-to-end scenarios, not unit tests alone

### Capacity risk

The timeline assumes 52 windows across multiple tools and agent types. That is feasible only if:

- window scope stays narrow
- rework stays controlled
- documentation and architecture decisions reduce churn

Mitigation:

- hold scope at MVO
- defer non-core enhancements
- avoid reopening architecture questions after ADR/spec acceptance unless new evidence appears

---

## Gate-Based Go/No-Go Criteria

### Gate 0: Clean Slate

Must be true:

- 10 new top-level directories exist
- archive is preserved, not deleted
- `package.json` version remains `2.0.0-alpha.0`
- `MIGRATION.md` is complete
- no forbidden imports from legacy `src/` into new V2.0 modules

No-go if:

- audit is partial
- compile is broken
- boundary leakage exists

### Gate 1: Graph Runs

Must be true:

- parser, graph, state machine, and scheduler work together
- retry/rollback behavior is validated
- representative workflows complete successfully

No-go if:

- scheduler works only on happy-path flows
- rollback behavior is untested

### Gate 2: Execution Delegated

Must be true:

- execution adapter boundary is real
- scheduler does not own provider logic
- result flow returns through dispatcher correctly

No-go if:

- scheduler touches provider-specific logic
- verification remains bypassed

### Gate 3: Context Flows

Must be true:

- outputs persist
- downstream nodes consume prior outputs
- crash recovery works

No-go if:

- persistence exists only nominally
- resumed workflows lose state or context

### Gate 4: Minimum Viable Orchestrator

Must be true:

- CLI can run, inspect, resume, and report state
- governance blocks invalid actions
- verification validates outputs

No-go if:

- CLI demos work only in-memory without recovery
- governance/verification are still placeholders

---

## Monitoring and Early Warning Signals

| Risk | Indicator | Threshold |
| --- | --- | --- |
| R1 | audit coverage | any legacy area unclassified |
| R2 | forbidden imports | any import from new v2.0 modules into legacy `src/` |
| R3 | phase slip | any critical-path phase exceeds plan by more than 20% |
| R5 | gate quality | gate marked complete without executable validation evidence |
| R6 | recovery gap | workflow cannot resume from persisted state |
| R7 | build health | `npx tsc --noEmit` fails or core integration tests regress |
| R10 | release pressure mismatch | external launch commitments made before Gate 4 proof |

---

## Mitigation Plan

### Immediate

1. Treat Phase 0 completion evidence as mandatory, not optional documentation.
2. Keep architecture/spec/ADR artifacts current before large implementation jumps.
3. Add explicit import-boundary checks between new v2.0 code and legacy `src/`.

### Near-term

1. Define executable gate tests for Gate 0 through Gate 4.
2. Wire workflow persistence into scheduler lifecycle transitions.
3. Align scheduler, dispatcher, and verification contracts before broad feature work.

### Release discipline

1. Keep status as `alpha` until Gate 4 and final validation are proven.
2. Cut optional scope before cutting control-plane quality.
3. Use weekly risk review against the critical path, not generic progress summaries.

---

## Overall Assessment

**Current overall risk:** HIGH

That is expected for a hard-reset architecture program. The risk is manageable if the team maintains strict discipline around Phase 0 integrity, interface boundaries, and gate-based validation.

The wrong move is pretending this is a normal feature launch. It is an architecture re-foundation. Success depends on preserving structural correctness first and only then accelerating toward the MVO release.

---

**Recommended review cadence:** twice weekly during Phase 0-4, then weekly through Gate 4.
