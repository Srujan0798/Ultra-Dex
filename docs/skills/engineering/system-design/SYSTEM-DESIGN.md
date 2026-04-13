# Ultra-Dex System Design

> Deterministic scheduler design for AI workflows

---

## 1. Goal

Design a scalable, deterministic scheduling architecture for DexGraph-based AI workflows with clear boundaries across:

- graph construction
- lifecycle/state management
- scheduling and concurrency
- dispatch and execution adapters
- governance checks
- workflow persistence and context propagation

This document is grounded in the current code under `dexgraph/`, `memory/`, and `governance/`.

---

## 2. Problem Statement

Ultra-Dex orchestrates non-deterministic AI execution providers, but the orchestration layer itself must remain deterministic.

The scheduler must:

- execute only dependency-satisfied nodes
- preserve legal node state transitions
- enforce concurrency limits
- apply governance before execution
- support retries, rollback, and halt policies
- persist enough workflow state for recovery and downstream context

The design must keep execution-provider behavior outside the orchestration core.

---

## 3. Design Principles

1. **Deterministic orchestration, non-deterministic execution**
   Provider output may vary; scheduling decisions must not.

2. **Graph is source of truth**
   Dependency resolution comes from DexGraph, not from runtime heuristics.

3. **State transitions are explicit**
   The state machine is the only authority on legal lifecycle changes.

4. **Execution is adapter-driven**
   Scheduler does not embed provider logic.

5. **Governance is a hard gate**
   Policy evaluation happens before dispatch.

6. **Context propagation is infrastructure**
   Dependency outputs are injected through dedicated workflow memory and context layers.

---

## 4. Scope

### In scope

- `dexgraph/graph.ts`
- `dexgraph/stateMachine.ts`
- `dexgraph/scheduler.ts`
- `dexgraph/dispatcher.ts`
- `dexgraph/contextInjector.ts`
- `memory/workflowStore.ts`
- governance integration points
- execution adapter interface boundary

### Out of scope

- frontend/API gateway design
- vendor-specific model routing
- long-term memory product strategy
- multi-region infra topology

---

## 5. High-Level Architecture

```text
Workflow DSL
    ↓
Parser / Types
    ↓
DexGraph
    ↓
Scheduler
    ↓
Governance Evaluation
    ↓
Dispatcher
    ↓
Execution Adapter
    ↓
Verification
    ↓
Workflow Store
    ↓
Context Injector
    ↓
Next Runnable Nodes
```

### Responsibility split

| Component | Responsibility |
| --- | --- |
| Parser + Types | Build typed workflow definition |
| DexGraph | Store nodes/edges, validate DAG, answer dependency queries |
| StateMachine | Enforce legal lifecycle transitions |
| Scheduler | Select runnable work, apply concurrency and failure policy |
| Dispatcher | Build execution context and call adapter |
| Execution Adapter | Run work against external execution system |
| WorkflowStore | Persist node state, outputs, execution history, metrics |
| ContextInjector | Resolve dependency outputs for downstream execution |
| GovernanceManager | Block or pause unsafe/invalid work |

---

## 6. Current Module Design

### 6.1 DexGraph

Current implementation in `dexgraph/graph.ts` provides:

- node registry
- edge registry
- dependency and dependent lookup
- DAG validation
- topological sort
- executable node discovery from dependency state

This is the deterministic topology layer. It must remain free of:

- provider-specific code
- persistence logic
- governance policy

### 6.2 State Machine

Current implementation in `dexgraph/stateMachine.ts` models:

- `CREATED`
- `READY`
- `RUNNING`
- `VERIFYING`
- `SUCCESS`
- `FAILED`
- `RETRY`
- `BLOCKED`
- `ROLLBACK`

It owns:

- legal transitions
- transition history
- retry counting
- retry backoff
- rollback propagation

This is correct and should remain the only owner of node lifecycle rules.

### 6.3 Scheduler

Current implementation in `dexgraph/scheduler.ts` owns:

- root-node activation
- main scheduling loop
- active task tracking
- dependency satisfaction checks
- concurrency enforcement
- timeout wrapping
- governance pre-checks
- retry / halt / rollback handling
- downstream unlock on success

This is the core orchestration loop.

### 6.4 Dispatcher

Current implementation in `dexgraph/dispatcher.ts` already exposes the correct architectural direction:

- `dispatch(node)`
- `dispatchWithContext(node, verifier?)`
- `dispatchWithVerification(node, verifier)`
- `waitForResult(nodeId)`
- adapter-driven execution via `ExecutionAdapter`

It also integrates with:

- `ContextInjector`
- result validation
- optional verification

This means the scheduler should coordinate dispatch, but detailed execution context construction belongs in the dispatcher layer.

### 6.5 Workflow Store

Current implementation in `memory/workflowStore.ts` provides:

- workflow creation
- node-state persistence
- execution history persistence
- downstream output retrieval
- metrics aggregation
- save/load to disk

This is the persistence seam for workflow recovery and context propagation.

---

## 7. Target Scheduler Design

### 7.1 Scheduler Inputs

The scheduler should operate on:

- a validated `DexGraph`
- a `Dispatcher`
- a `StateMachine`
- an optional `GovernanceManager`
- a workflow persistence interface
- runtime config

### 7.2 Scheduler Outputs

The scheduler returns:

- overall workflow success/failure
- completed nodes
- failed nodes
- rolled back nodes
- duration
- status snapshots for external observers

### 7.3 Deterministic Scheduling Rule

At any scheduling tick, runnable work is the set of nodes that satisfy all of:

- state is `READY`
- all dependencies are `SUCCESS`
- not already active
- governance did not block or pause execution
- concurrency capacity exists

The order should be stable and deterministic. If multiple nodes are runnable simultaneously, selection should be based on a stable order such as:

1. topological order
2. insertion order from graph creation
3. lexical node ID as tie-breaker

The current scheduler slices the executable set directly. The design should make the ordering guarantee explicit.

---

## 8. Detailed Runtime Flow

### 8.1 Workflow bootstrap

1. Parse DSL into `DexGraphResult`
2. Build graph with `DexGraph.fromParseResult`
3. Validate DAG
4. Create workflow record in `WorkflowStore`
5. Transition root nodes from `CREATED` to `READY`
6. Start scheduler loop

### 8.2 Main scheduling loop

For each iteration:

1. Collect runnable nodes from graph + state
2. Filter out active tasks
3. Apply stable ordering
4. Limit dispatch by `maxConcurrent`
5. Dispatch selected nodes
6. Await active progress or scheduling event
7. Repeat until terminal

### 8.3 Per-node execution

For each selected node:

1. Evaluate governance with runtime context
2. If blocked, fail or rollback per failure policy
3. If paused, transition to `BLOCKED`
4. Transition node `READY -> RUNNING`
5. Build execution context
6. Dispatch through adapter
7. Apply timeout protection
8. Transition `RUNNING -> VERIFYING`
9. Run verification
10. On success, transition to `SUCCESS`
11. Persist output and execution history
12. Unlock eligible dependents

### 8.4 Failure handling

On execution failure:

1. Transition to `FAILED`
2. Check retry budget
3. If retryable, back off and transition `FAILED -> RETRY -> RUNNING`
4. If not retryable:
   `halt` stops workflow
   `rollback` propagates rollback
   `continue` marks current branch rolled back and continues others

---

## 9. API Interfaces

### 9.1 Scheduler interface

```ts
interface SchedulerConfig {
  maxRetries: number;
  maxConcurrent: number;
  timeoutMs: number;
  onFailure: 'halt' | 'continue' | 'rollback';
}

interface SchedulerResult {
  success: boolean;
  completedNodes: string[];
  failedNodes: string[];
  rolledBackNodes: string[];
  duration: number;
}
```

### 9.2 Dispatcher boundary

Current code exposes two related concepts:

- lightweight scheduler-facing dispatcher interface in `scheduler.ts`
- richer dispatcher implementation in `dispatcher.ts`

Target boundary:

```ts
interface SchedulerDispatcher {
  dispatch(node: GraphNode): Promise<ExecutionResult>;
}

interface ExecutionAdapter {
  run(context: ExecutionContext): Promise<ExecutionResult>;
  name(): string;
}
```

Recommendation: keep the scheduler coupled only to `SchedulerDispatcher`, while the concrete dispatcher handles context injection, verification, and adapter invocation.

### 9.3 Workflow store interface

Recommended extraction:

```ts
interface WorkflowStateStore {
  createWorkflow(workflowId: string): void;
  updateNode(workflowId: string, nodeState: NodeState): void;
  addHistory(workflowId: string, nodeId: string, entry: ExecutionHistory): void;
  setNodeOutput(workflowId: string, nodeId: string, output: unknown): void;
  getDependencyOutputs(workflowId: string, nodeId: string, dependencyIds: string[]): Record<string, unknown>;
}
```

This decouples scheduler/context layers from file-backed storage details.

---

## 10. Sequence Diagram

```text
Scheduler -> DexGraph: get runnable nodes
Scheduler -> GovernanceManager: evaluate(node, context)
GovernanceManager -> Scheduler: allow | pause | block
Scheduler -> StateMachine: READY -> RUNNING
Scheduler -> Dispatcher: dispatch(node)
Dispatcher -> ContextInjector: inject/build context
Dispatcher -> ExecutionAdapter: run(context)
ExecutionAdapter -> Dispatcher: ExecutionResult
Dispatcher -> Verifier: verify(result)
Verifier -> Dispatcher: valid/invalid
Dispatcher -> WorkflowStore: persist output/history
Scheduler -> StateMachine: RUNNING -> VERIFYING -> SUCCESS | FAILED
Scheduler -> DexGraph: unlock dependents
```

---

## 11. Scalability Design

### 11.1 Concurrency model

Current scheduler uses an in-memory `activeTasks` set and a polling loop. This is acceptable for a single-process runtime but should be treated as Phase 1 architecture.

For scale, split the design into:

- **Control-plane scheduler**
  owns deterministic ordering and state transitions
- **Execution workers**
  run adapter calls and report results back

### 11.2 Horizontal scaling path

Phase 1:

- single scheduler process
- in-memory active task tracking
- local workflow store persistence

Phase 2:

- external workflow state store
- distributed work queue
- scheduler leader election
- idempotent dispatch contracts

Phase 3:

- resumable workflows across workers
- event-driven scheduling instead of polling
- sharded workflow ownership

---

## 12. Failure Modes and Mitigations

| Failure mode | Impact | Mitigation |
| --- | --- | --- |
| Illegal state transition | corrupt workflow lifecycle | state machine remains single authority |
| Scheduler crash | workflow stalls | persist node states and history to workflow store |
| Adapter timeout | hanging execution | scheduler timeout wrapper and failure escalation |
| Governance pause/block | partial execution stall | explicit `BLOCKED` state and operator-visible reason |
| Duplicate dispatch | duplicate side effects | stable active-task tracking and future idempotency keys |
| Lost node output | downstream context failure | persist outputs before unlocking dependents |
| Polling deadlock | scheduler ends with non-terminal work | deadlock detection plus persisted diagnostics |

---

## 13. Observed Gaps in Current Code

1. The scheduler currently transitions `VERIFYING -> SUCCESS` immediately and does not yet integrate the richer verifier flow from `dispatcher.ts`.
2. `scheduler.ts` uses a minimal dispatcher interface while `dispatcher.ts` has broader responsibilities; these contracts should be aligned.
3. Workflow persistence is not yet wired directly into scheduler state transitions.
4. Stable deterministic ordering for simultaneously runnable nodes is implied, not explicitly guaranteed.
5. The polling loop is simple but will not scale cleanly to a distributed scheduler without an event model.

These are design gaps, not reasons to change the architecture direction.

---

## 14. Recommended Next Steps

1. Wire `WorkflowStore` updates into every scheduler state transition.
2. Make verification a first-class step instead of immediate `VERIFYING -> SUCCESS`.
3. Formalize a stable runnable-node ordering contract.
4. Introduce a typed scheduler-facing dispatcher interface shared across modules.
5. Move from polling to event-driven wakeups once workflow persistence and distributed ownership are in place.

---

## 15. Summary

The right system design for DexGraph is a boundary-driven orchestration core:

- `DexGraph` owns topology
- `StateMachine` owns lifecycle legality
- `Scheduler` owns deterministic execution order and failure policy
- `Dispatcher` owns context assembly and adapter invocation
- `GovernanceManager` owns execution policy gates
- `WorkflowStore` owns persistence and recovery

This keeps Ultra-Dex aligned with its core principle: the platform supervises execution deterministically while external adapters perform the non-deterministic work.
