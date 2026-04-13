# Phase 3: DexGraph Core — Task State Machine (Week 1-2)

### OBJECTIVE

Build the deterministic state transition system that governs every node's lifecycle. Ensure all state changes are valid, auditable, and recoverable. This is the control core of workflow execution.

### SUCCESS CRITERIA (Define "Done")

- [ ] All valid state transitions execute correctly (CREATED → READY → RUNNING → VERIFYING → SUCCESS)
- [ ] Invalid transitions are rejected with clear error context
- [ ] Failed tasks support configurable retry with exponential backoff
- [ ] Rollback propagates to all affected dependent tasks
- [ ] Complete audit trail of every state change
- [ ] 95%+ test coverage on state machine logic
- [ ] Supports 10,000+ concurrent node state tracking

### INVARIANTS (Non-Negotiable Constraints)

1. **Deterministic transitions**: Same state + same input always produces same result
2. **Invalid transitions rejected**: No silent failures, all illegal transitions throw
3. **Complete audit trail**: Every state change is recorded with timestamp and reason
4. **Terminal states are final**: SUCCESS and ROLLBACK cannot transition further
5. **Retry limits enforced**: Maximum retry count prevents infinite loops
6. **Thread-safe operations**: Concurrent state queries must be consistent

### INTEGRATION CONTRACT

**Input** (from Phase 2 - Graph Builder):

```typescript
// Validated DAG with nodes in initial CREATED state
// - Node IDs with initial states
// - Graph structure for dependency lookups
// - Configuration: max retries, backoff policy
```

**Input** (from Scheduler during execution):

```typescript
// State transition requests:
// - Node ID
// - Target state
// - Reason/context for transition
// - Retry configuration
```

**Output** (to Scheduler):

```typescript
// State transition result:
// - New state (if successful)
// - Error (if transition invalid)
// - Retry recommendation (if FAILED)
// - Rollback scope (if entering ROLLBACK)
```

**Output** (Audit/Logging):

```typescript
// Complete history:
// - Timestamped transition log
// - Per-node state timelines
// - Retry counts per node
// - Rollback propagation chains
```

### State Model

**Core States:**

- `CREATED` - Initial state for all nodes
- `READY` - Dependencies satisfied, awaiting execution
- `RUNNING` - Currently executing
- `VERIFYING` - Execution complete, verifying output
- `SUCCESS` - Terminal: completed successfully
- `FAILED` - Execution or verification failed
- `RETRY` - Preparing to retry after failure
- `BLOCKED` - Paused by governance/policy
- `ROLLBACK` - Terminal: failed and unable to recover

**Key Transition Paths:**

- **Happy Path**: CREATED → READY → RUNNING → VERIFYING → SUCCESS
- **Retry Path**: FAILED → RETRY → RUNNING → ...
- **Rollback Path**: FAILED → ROLLBACK (after max retries exceeded)
- **Block Path**: READY → BLOCKED → READY (governance pause/resume)

### SCOPE BOUNDARIES

**IN Scope:**

- State transition validation
- Transition execution with audit logging
- Retry logic with exponential backoff
- Rollback propagation to dependents
- State history tracking
- Terminal state detection
- Retry count tracking per node

**OUT of Scope (handled by other phases):**

- Scheduler orchestration (Phase 4)
- Task actual execution (Phase 4)
- Governance policy enforcement (Phase 5)
- Persistence of state history (Phase 7)
- Distributed state coordination (Phase 9)

### WINDOWS (High-Level Work Units)

#### W1: State Model Definition

**Task ID:** V20-P3-W1-MODEL  
**Objective:** Define the state types, transition rules, and state machine interface.  
**Agent Power Tier:** HIGH (Claude Opus for precision)  
**Success Signal:** State types compile, transition rules are comprehensive and correct.

**Requirements:**

- Define state enumeration for all 9 states
- Define transition rules matrix (valid from → to mappings)
- Define state transition record structure (timestamp, reason, metadata)
- Define state machine interface with core methods
- Support state querying by node ID
- Support transition validation (canTransition checks)

**Constraints:**

- Must support all valid workflow state transitions
- Must reject invalid transitions at compile and runtime
- Must integrate with Phase 1 types
- Must support history tracking
- Must distinguish terminal states (SUCCESS, ROLLBACK)

---

#### W2: Transition Engine

**Task ID:** V20-P3-W2-ENGINE  
**Objective:** Implement state mutation API with validation and audit logging.  
**Agent Power Tier:** BALANCED (Claude Sonnet for balanced implementation)  
**Success Signal:** All transitions execute correctly, invalid ones throw, history is complete.

**Requirements:**

- Execute state transitions with validation
- Throw descriptive errors for invalid transitions
- Update node state atomically
- Record every transition in history
- Support querying current state by node
- Support querying transition history (all or per-node)
- Support retry count tracking per node
- Detect terminal states

**Constraints:**

- Transitions must be atomic (no partial updates)
- History must be append-only (immutable log)
- Error messages must include context (node ID, from, to states)
- Must support concurrent state queries

---

#### W3: Retry & Failure Handling

**Task ID:** V20-P3-W3-RETRY  
**Objective:** Build retry logic with exponential backoff and max retry enforcement.  
**Agent Power Tier:** HIGH (Codex o1 for edge case reasoning)  
**Success Signal:** Failed tasks retry correctly, max retries enforced, backoff follows policy.

**Requirements:**

- Calculate retry eligibility (current count vs max)
- Compute backoff delay (exponential with configurable cap)
- Transition FAILED → RETRY → RUNNING when retrying
- Transition FAILED → ROLLBACK when max retries exceeded
- Track retry count per node accurately
- Support configurable max retry count per workflow
- Support configurable backoff policy

**Constraints:**

- Backoff must have maximum cap (prevent infinite wait)
- Retry counts must survive across state machine instances
- Must handle retry storms (backoff prevents thundering herd)
- Must support zero retries (fail immediately to ROLLBACK)

---

#### W4: Rollback & Test Coverage

**Task ID:** V20-P3-W4-ROLLBACK  
**Objective:** Implement rollback propagation and comprehensive state machine tests.  
**Agent Power Tier:** BALANCED (Gemini for comprehensive test generation)  
**Success Signal:** Rollback propagates correctly, 95%+ coverage, all edge cases tested.

**Requirements:**

- Execute ROLLBACK transition
- Query graph dependents for rollback scope
- Propagate rollback to all non-terminal dependents
- Return list of affected nodes
- Prevent re-rollback (terminal check)
- Comprehensive test coverage:
  - Valid transitions for all paths
  - Invalid transition rejection
  - Happy path execution
  - Retry path with multiple retries
  - Max retry enforcement
  - Rollback propagation
  - Terminal state enforcement
  - History accuracy
  - Retry count accuracy
  - Backoff calculation
  - Block/unblock flow

**Constraints:**

- Rollback must be deterministic (same graph = same scope)
- Must not rollback already-terminal nodes
- Tests must cover all transition combinations
- Tests must verify error messages are actionable

---

### SEQUENCE

```
W1 (Model) → W2 (Engine) → W3 (Retry) → W4 (Rollback + Tests)
```

- Strictly sequential - each window builds on previous
- W4 integrates all components and validates

### OUTPUT ARTIFACTS

| Artifact      | Location                              | Purpose                      |
| ------------- | ------------------------------------- | ---------------------------- |
| State Machine | `dexgraph/stateMachine.ts`            | Core state management        |
| State Types   | `dexgraph/types.ts`                   | State enumerations           |
| State Errors  | `dexgraph/errors.ts`                  | State-specific error classes |
| State Tests   | `tests/dexgraph/stateMachine.test.ts` | Comprehensive coverage       |

### VALIDATION GATES

- [ ] All valid state paths execute correctly
- [ ] Invalid transitions throw with context
- [ ] Retry logic respects max retry count
- [ ] Rollback propagates to dependents
- [ ] History captures complete audit trail
- [ ] 95%+ test coverage
- [ ] Handles 10,000+ node state tracking

### RISK MITIGATION

| Risk                           | Impact | Mitigation                                        |
| ------------------------------ | ------ | ------------------------------------------------- |
| Concurrent state mutations     | High   | Synchronous state machine, external serialization |
| Rollback cascade infinite loop | Medium | Terminal state check prevents re-rollback         |
| Retry storm                    | Medium | Exponential backoff with configurable cap         |
| History memory explosion       | Medium | Configurable retention, external persistence      |
| State machine inconsistency    | High   | Immutable history, atomic transitions             |

### COST TRACKING

| Window | Tier     | Agent         | Est. Tokens |
| ------ | -------- | ------------- | ----------- |
| W1     | HIGH     | Claude Opus   | ~6K         |
| W2     | BALANCED | Claude Sonnet | ~6K         |
| W3     | HIGH     | Codex o1      | ~6K         |
| W4     | BALANCED | Gemini Pro    | ~10K        |

---

_Phase 3 dispatches | High-Level Orchestrator | v2.1_
