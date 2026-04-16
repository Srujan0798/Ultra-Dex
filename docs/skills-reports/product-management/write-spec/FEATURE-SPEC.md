# Feature Spec: DexGraph Execution Adapter Interface

**Generated:** 2026-04-14  
**Spec Type:** Feature Spec / API Contract  
**Feature:** DexGraph execution adapter, scheduler API, and parser input/output contracts

---

## 1. Problem Statement

Ultra-Dex V2.0 defines DexGraph as the deterministic orchestration core, but the contract between parsing, scheduling, dispatch, and execution still needs one clear product-facing specification.

Current code already includes:

- parser and workflow types in `dexgraph/parser.ts` and `dexgraph/types.ts`
- scheduler runtime behavior in `dexgraph/scheduler.ts`
- execution adapter contract in `adapters/executionAdapter.ts`
- richer dispatch behavior in `dexgraph/dispatcher.ts`

The problem is contract drift:

- scheduler depends on a minimal dispatcher interface
- dispatcher already knows more about context injection and verification
- parser output is usable, but its API expectations are not documented as a formal product contract

This spec defines the expected interface boundary for V2.0.

---

## 2. Goals & Non-Goals

### Goals

- define a stable execution adapter contract for external execution systems
- define the scheduler API that orchestration layers and CLI can rely on
- define parser input/output contracts for workflow compilation
- document current behavior vs target behavior
- reduce ambiguity before broader Phase 4-6 implementation

### Non-Goals

- redesign DexGraph architecture from scratch
- define provider-specific adapter implementations
- specify CLI UX in detail
- replace ADR-007 or system-design documentation

---

## 3. User Stories

| ID | Story | Priority |
| --- | --- | --- |
| US-1 | As a platform engineer, I want a stable execution adapter interface so providers can plug into DexGraph without changing scheduler logic. | P0 |
| US-2 | As a runtime engineer, I want a scheduler API that exposes predictable lifecycle and result behavior. | P0 |
| US-3 | As a workflow author, I want parser output to be deterministic and validated before execution begins. | P0 |
| US-4 | As a verifier/governance engineer, I want clear seams between orchestration, execution, and validation. | P1 |
| US-5 | As a CLI/SDK consumer, I want typed workflow and execution results that can be surfaced consistently. | P1 |

---

## 4. Feature Scope

This spec covers three interfaces:

1. Parser contract
2. Scheduler contract
3. Execution adapter contract

It also documents the dispatch boundary because scheduler and adapter do not interact directly in the preferred architecture.

---

## 5. Parser Contract

### 5.1 Input

The parser accepts a file path to a workflow definition in YAML.

```ts
parse(filepath: string): DexGraphResult
```

### 5.2 Workflow input schema

Current expected shape:

```ts
interface WorkflowDefinition {
  version: 'dexgraph/v1';
  name: string;
  description: string;
  context: Record<string, unknown>;
  tasks: TaskDefinition[];
  on_failure: {
    retry: number;
    rollback: boolean;
  };
}
```

```ts
interface TaskDefinition {
  id: string;
  role: 'architect' | 'engineer' | 'tester' | 'reviewer';
  instruction: string;
  depends_on?: string[];
  context?: Record<string, unknown>;
  output?: string;
  verify?: VerificationRule;
  parallel?: boolean;
}
```

### 5.3 Parser responsibilities

- load YAML from disk
- validate root document shape
- validate schema via `validateWorkflow`
- detect invalid dependency references
- detect self-dependencies
- resolve template placeholders into normalized markers
- emit graph-ready nodes and edges

### 5.4 Parser output

```ts
interface DexGraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    name: string;
    description: string;
    context: Record<string, unknown>;
  };
}
```

### 5.5 Acceptance criteria

| ID | Requirement | Acceptance Criteria |
| --- | --- | --- |
| FR-P1 | Valid YAML parses successfully | `parse()` returns `DexGraphResult` |
| FR-P2 | Invalid schema fails fast | throws `ParseError` with clear reason |
| FR-P3 | Unknown dependencies fail fast | throws `GraphError` |
| FR-P4 | Self-dependencies fail fast | throws `GraphError` |
| FR-P5 | Template refs normalize deterministically | `{{task.output}}` becomes normalized marker form |
| FR-P6 | Output is graph-ready | `DexGraph.fromParseResult()` can consume result |

### 5.6 Open gap

Current parser builds `edges` from explicit dependencies and template refs, but `GraphNode.dependencies` currently captures direct `depends_on` only. If template refs are intended to create execution dependencies, node dependency semantics should be aligned explicitly.

---

## 6. Scheduler Contract

### 6.1 Constructor boundary

Current shape:

```ts
new Scheduler(
  graph: DexGraph,
  dispatcher: Dispatcher,
  config?: Partial<SchedulerConfig>,
  governanceManager?: GovernanceManager,
  eventEmitter?: EventEmitter,
  workflowId?: string,
)
```

### 6.2 Scheduler configuration

```ts
interface SchedulerConfig {
  maxRetries: number;
  maxConcurrent: number;
  timeoutMs: number;
  onFailure: 'halt' | 'continue' | 'rollback';
}
```

### 6.3 Scheduler runtime behavior

The scheduler must:

- activate root nodes
- compute runnable nodes deterministically
- enforce concurrency limits
- call governance before execution
- dispatch work through a dispatcher boundary
- handle timeout, retry, rollback, and halt policies
- unlock dependents after successful execution
- emit lifecycle events when an emitter is provided

### 6.4 Scheduler result contract

```ts
interface SchedulerResult {
  success: boolean;
  completedNodes: string[];
  failedNodes: string[];
  rolledBackNodes: string[];
  duration: number;
}

interface SchedulerStatus {
  running: boolean;
  completed: number;
  failed: number;
  pending: number;
  total: number;
}
```

### 6.5 Scheduler-facing dispatcher interface

Current minimal contract:

```ts
interface Dispatcher {
  dispatch(node: GraphNode): Promise<any>;
}
```

Target product contract:

```ts
interface SchedulerDispatcher {
  dispatch(node: GraphNode): Promise<ExecutionResult>;
}
```

The scheduler should not know about provider logic, context injection internals, or verifier implementation details.

### 6.6 Acceptance criteria

| ID | Requirement | Acceptance Criteria |
| --- | --- | --- |
| FR-S1 | Scheduler only dispatches dependency-satisfied nodes | nodes run only when all dependencies are `SUCCESS` |
| FR-S2 | Scheduler respects concurrency limit | active tasks never exceed `maxConcurrent` |
| FR-S3 | Scheduler applies governance gate | blocked nodes do not dispatch |
| FR-S4 | Scheduler enforces timeout policy | overlong task becomes failure path |
| FR-S5 | Scheduler handles retry semantics | retry follows configured backoff and retry count |
| FR-S6 | Scheduler exposes final result summary | `run()` returns `SchedulerResult` |
| FR-S7 | Scheduler exposes live status | `getStatus()` returns `SchedulerStatus` |

### 6.7 Open gaps

- Current scheduler transitions `VERIFYING -> SUCCESS` immediately instead of delegating a first-class verification step.
- Runnable-node ordering is deterministic in practice only if graph iteration order remains stable; the ordering rule should be explicitly documented and tested.
- The scheduler currently does not own workflow-store persistence even though the product path requires resumability.

---

## 7. Execution Adapter Contract

### 7.1 Purpose

Execution adapters provide the boundary between DexGraph orchestration and external execution systems such as mock executors, provider runtimes, MCP-backed tools, or future worker systems.

### 7.2 Execution context input

```ts
interface ExecutionContext {
  nodeId: string;
  taskType: string;
  input: Record<string, unknown>;
  timeout: number;
  environment?: Record<string, string>;
  retryCount?: number;
}
```

### 7.3 Execution result output

```ts
interface Cost {
  tokens: number;
  estimatedUSD: number;
  provider: string;
}

interface ExecutionResult {
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
  output?: unknown;
  logs: string[];
  error?: string;
  cost: Cost;
  confidence: number;
  duration: number;
  timestamp: string;
}
```

### 7.4 Adapter interface

```ts
interface ExecutionAdapter {
  run(context: ExecutionContext): Promise<ExecutionResult>;
  cancel(nodeId: string): Promise<void>;
  status(nodeId: string): Promise<{ running: boolean; progress?: number }>;
  name(): string;
}
```

### 7.5 Adapter requirements

| ID | Requirement | Acceptance Criteria |
| --- | --- | --- |
| FR-A1 | Adapter runs node execution from normalized context | `run()` accepts `ExecutionContext` only |
| FR-A2 | Adapter returns typed result envelope | output includes status, logs, cost, confidence, duration, timestamp |
| FR-A3 | Adapter supports cancellation | `cancel(nodeId)` is implemented |
| FR-A4 | Adapter supports execution status polling | `status(nodeId)` returns running/progress |
| FR-A5 | Adapter identifies itself | `name()` returns provider/adapter name |

### 7.6 Adapter invariants

- adapters do not mutate graph topology
- adapters do not own scheduling decisions
- adapters do not bypass governance
- adapters do not declare workflow success directly; they return execution results

---

## 8. Dispatcher Boundary

Although the playbook prompt is “execution adapter interface,” the real runtime contract includes a dispatcher layer.

### Dispatcher responsibilities

- convert `GraphNode` to `ExecutionContext`
- inject dependency-derived context when configured
- call the adapter
- normalize thrown errors into `ExecutionResult`
- optionally invoke verifier flow
- cache in-flight and completed results

### Why this matters

Without this boundary, scheduler would accumulate:

- provider details
- context-injection logic
- result normalization
- verification flow

That would violate the V2.0 orchestration boundary.

---

## 9. Non-Functional Requirements

| Requirement | Target |
| --- | --- |
| Determinism | same graph + state should produce same scheduling decisions |
| Contract clarity | adapter, parser, and scheduler contracts are typed and documented |
| Replaceability | new adapters can be introduced without scheduler changes |
| Observability | scheduler lifecycle can emit runtime events |
| Resumability | future workflow-store integration must persist enough state to resume |
| Testability | parser, scheduler, dispatcher, and adapter can be tested independently |

---

## 10. Success Metrics

| Metric | Target |
| --- | --- |
| Parser failure clarity | 100% of schema/dependency failures return explicit typed errors |
| Adapter compatibility | new adapter integrates without scheduler code changes |
| Scheduler determinism | same workflow produces same runnable ordering in tests |
| Verification integration | success is not marked before verification passes |
| Resume readiness | workflow state can be persisted/reloaded without contract redesign |

---

## 11. Risks & Mitigation

| Risk | Mitigation |
| --- | --- |
| Scheduler and dispatcher contracts diverge | define shared `ExecutionResult`-based interface and test it |
| Parser output semantics drift from graph expectations | add contract tests from `parse()` to `DexGraph.fromParseResult()` |
| Verification remains implicit | make verifier a first-class runtime dependency before Gate 4 |
| Adapter implementations leak provider concerns upward | keep provider-specific behavior behind dispatcher/adapter boundary |
| Context injection overloads adapter contract | keep injected context assembled by dispatcher, not adapters |

---

## 12. Release Recommendation

**Status:** Ready for implementation and interface hardening

Recommended next steps:

1. Align scheduler dispatcher typing to `Promise<ExecutionResult>`.
2. Add contract tests for parser output, scheduler execution, and adapter result semantics.
3. Promote verification from implicit state transition to explicit runtime step.
4. Add a workflow-store contract to support resume/recovery without interface churn.

---

## 13. Summary

The V2.0 interface model should be:

- parser compiles workflow definitions into graph-ready output
- scheduler decides what runs and when
- dispatcher prepares execution context and mediates verification
- adapter executes work against external systems

That keeps DexGraph deterministic, adapter-driven, and extensible without allowing execution concerns to contaminate the orchestration core.
