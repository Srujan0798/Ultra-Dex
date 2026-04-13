# ADR-007: DexGraph Component Boundaries for V2.0

**Status:** ✅ Accepted
**Date:** 2026-04-13
**Decision Owner:** @CTO Agent
**Stakeholders:** Core Team, Runtime Team, Governance Team

---

## Context

Ultra-Dex V2.0 positions DexGraph as the deterministic orchestration core. The current codebase already contains the core graph, parser, scheduler, state machine, and context injection primitives, but the architectural boundary between decision-making, execution, governance, and memory needs to be explicit.

Without a clear boundary model, the system risks:

- mixing orchestration logic with execution-provider concerns
- coupling graph state to memory implementation details
- making governance checks optional or inconsistent
- duplicating context propagation logic across scheduler and dispatcher layers

This ADR defines the component boundaries for DexGraph V2.0 and validates them against ADR-004 (3-tier memory).

---

## Decision

DexGraph V2.0 will be organized as six explicit components with strict responsibilities:

1. **Workflow Definition Layer**
   Parses workflow DSL and produces typed graph metadata.
2. **Graph Core**
   Owns DAG structure, dependency queries, and execution eligibility.
3. **Lifecycle Engine**
   Owns legal state transitions, retries, and rollback semantics.
4. **Orchestration Engine**
   Owns scheduling, concurrency, dispatch coordination, and workflow progress.
5. **Governance + Verification Boundary**
   Applies policy before and after execution and determines whether a node may proceed.
6. **Context + Memory Integration**
   Resolves runtime context from prior outputs and persists workflow state using ADR-004 tiers.

DexGraph remains the decision authority. Execution providers stay outside the core and are accessed through a dispatcher/adapter interface.

---

## Boundary Model

```text
Workflow DSL / Intent
        ↓
Parser + Types
        ↓
DexGraph Core
        ↓
State Machine
        ↓
Scheduler
        ↓
Governance Gate
        ↓
Dispatcher / Execution Adapter
        ↓
Verification
        ↓
Workflow Store + 3-Tier Memory
        ↓
Next Scheduling Decision
```

---

## Component Responsibilities

### 1. Workflow Definition Layer

**Primary files:**

- `dexgraph/parser.ts`
- `dexgraph/types.ts`

**Responsibilities:**

- validate DSL structure
- normalize workflow metadata and task definitions
- emit `DexGraphResult` with nodes, edges, and workflow metadata

**Must not:**

- execute tasks
- mutate runtime state
- query memory tiers directly

### 2. Graph Core

**Primary file:**

- `dexgraph/graph.ts`

**Responsibilities:**

- maintain node and edge registry
- answer dependency and dependent queries
- validate DAG correctness
- determine root, leaf, and executable nodes

**Must not:**

- apply retries or rollback policy
- run governance checks
- dispatch execution providers

### 3. Lifecycle Engine

**Primary file:**

- `dexgraph/stateMachine.ts`

**Responsibilities:**

- enforce legal node-state transitions
- track transition history
- apply retry and rollback semantics

**Must not:**

- decide execution ordering across the graph
- load dependency outputs from memory

### 4. Orchestration Engine

**Primary file:**

- `dexgraph/scheduler.ts`

**Responsibilities:**

- determine when nodes become runnable
- enforce concurrency limits and failure policy
- coordinate node execution through the dispatcher interface
- unlock downstream nodes after successful completion

**Must not:**

- encode provider-specific execution details
- own graph topology or node transition rules

### 5. Governance + Verification Boundary

**Primary integration points:**

- `governance/governance-manager.js`
- scheduler pre-dispatch evaluation
- node verification rules from `dexgraph/types.ts`

**Responsibilities:**

- block, pause, or allow execution before dispatch
- enforce hard rules such as policy, cost, reviewer, and test gates
- own post-execution verification policy

**Must not:**

- mutate graph structure
- bypass state transitions

### 6. Context + Memory Integration

**Primary files:**

- `dexgraph/contextInjector.ts`
- `memory/workflowStore.js`
- `memory/contextCollector.js`

**Responsibilities:**

- resolve dependency outputs into execution context
- persist workflow state and outputs
- support fast reads for active workflows and durable reads for long-term knowledge

**Must not:**

- decide orchestration order
- embed business rules that belong in governance

---

## Mapping to Existing Code

| Concern | Current Implementation | Boundary Decision |
| --- | --- | --- |
| Graph topology | `dexgraph/graph.ts` | Keep isolated as pure orchestration data model |
| Node lifecycle | `dexgraph/stateMachine.ts` | Keep isolated; scheduler calls into it |
| Scheduling | `dexgraph/scheduler.ts` | Keep as orchestration coordinator only |
| Context propagation | `dexgraph/contextInjector.ts` | Treat as separate integration component, not scheduler logic |
| Memory persistence | `memory/workflowStore.js` | Keep outside graph core; accessed through context/memory layer |
| Governance policy | `governance/governance-manager.js` | Keep as gate before dispatch and before progression |
| Execution providers | dispatcher interface | Keep behind adapter boundary, outside DexGraph core |

---

## Validation Against ADR-004

ADR-004 defines a 3-tier memory architecture:

- Tier 1: in-process instant memory
- Tier 2: Redis-backed session memory
- Tier 3: persistent Postgres/vector memory

DexGraph component boundaries must align with that design.

### Required Alignment

| DexGraph concern | Memory tier usage | Rationale |
| --- | --- | --- |
| Active node state, scheduling loop, transition history cache | Tier 1 | Lowest-latency path for in-flight workflows |
| Workflow session state, dependency outputs, resumable execution | Tier 2 | Needed across worker/process boundaries |
| Audit trail, long-term context, semantic retrieval | Tier 3 | Durable system of record |

### Boundary Rule

DexGraph core components may depend on memory interfaces, but not on concrete tier implementations. Memory promotion and storage policy belong to the memory subsystem, not the graph, scheduler, or state machine.

This preserves ADR-004 while preventing Redis/Postgres concerns from leaking into core orchestration code.

---

## Consequences

### Positive

- keeps DexGraph deterministic even when execution providers are non-deterministic
- makes scheduler, state machine, and graph independently testable
- allows governance to remain a hard gate instead of an optional callback
- supports ADR-004 without coupling orchestration logic to storage choices
- creates a clean SDK boundary for future external execution adapters

### Negative

- introduces more explicit interfaces that must be maintained
- requires discipline to keep workflow persistence out of core graph code
- verification is currently under-modeled and needs a dedicated implementation boundary

---

## Alternatives Considered

### Option 1: Monolithic DexGraph Runtime

Combine parser, graph, scheduler, governance, memory, and execution in one runtime module.

**Verdict:** Rejected. Too much coupling and difficult to test or evolve.

### Option 2: Execution-Centric Architecture

Let dispatcher/adapters own retries, verification, and workflow progression.

**Verdict:** Rejected. This breaks the “Ultra-Dex supervises, never executes” principle.

### Option 3: Boundary-Driven Orchestration Core

Keep DexGraph responsible for graph, state, and scheduling while integrating with governance, memory, and external execution through explicit interfaces.

**Verdict:** Accepted.

---

## Implementation Guidance

### Required invariants

- `graph.ts` stays free of memory and provider imports
- `stateMachine.ts` remains the only owner of legal node transitions
- `scheduler.ts` coordinates execution but does not absorb context-injection or storage logic
- dispatcher implementations remain replaceable
- governance decisions always occur before provider dispatch
- persistent workflow state is written through memory/store interfaces

### Near-term follow-up

1. Add an explicit verifier boundary so `VERIFYING` is backed by concrete verification handlers.
2. Define a typed `WorkflowStore` interface shared by scheduler and context injection.
3. Introduce an execution adapter contract distinct from the scheduler’s internal dispatcher interface.
4. Add architecture tests that fail if graph core imports memory, governance, or provider code directly.

---

## Success Criteria

- DexGraph modules can be tested independently with mocks at boundary seams.
- A workflow can resume from Tier 2 or Tier 3 state without changing graph-core code.
- Governance can halt or pause execution without modifying provider adapters.
- New execution backends can be added without changing graph topology or lifecycle modules.

---

**Related ADRs:**

- [ADR-004: 3-Tier Memory Architecture](./ADR-004-three-tier-memory.md)
- [ADR-006: Critical Architectural Improvements](./ADR-006-architectural-improvements.md)
