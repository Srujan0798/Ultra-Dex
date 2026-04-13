# Phase 4: DexGraph Core — Scheduler Engine (Week 2)

### OBJECTIVE

Build the execution orchestration layer that drives workflow completion. The scheduler coordinates task dispatch, monitors execution, handles failures with configurable policies, and manages the flow from READY to terminal states.

### SUCCESS CRITERIA (Define "Done")

- [ ] Scheduler correctly executes linear, parallel, and diamond workflow patterns
- [ ] Dependency unlock triggers READY transitions when dependencies are satisfied
- [ ] Retry logic respects maxRetries with exponential backoff
- [ ] Failure policies (halt/continue/rollback) execute correctly
- [ ] Deadlock detection identifies impossible workflow states
- [ ] Timeout handling prevents stuck tasks
- [ ] 95%+ test coverage with integration tests
- [ ] Handles 100+ concurrent tasks without performance degradation

### INVARIANTS (Non-Negotiable Constraints)

1. **Scheduler is the sole state mutator**: Only scheduler initiates state transitions
2. **Concurrency limits enforced**: Never exceed maxConcurrent configured tasks
3. **Deterministic ordering**: Same workflow always produces same execution sequence
4. **Graceful degradation**: Partial failures don't crash entire workflow
5. **Resource cleanup**: Stop() must cleanly terminate all in-progress tasks
6. **Observable execution**: Status queries reflect current execution state accurately

### INTEGRATION CONTRACT

**Input** (from Phase 2 - Graph Builder):

```typescript
// Validated DAG with:
// - Nodes in CREATED state
// - Complete dependency graph
// - Root nodes identified
```

**Input** (Configuration):

```typescript
// SchedulerConfig:
// - maxRetries: number (default: 2)
// - maxConcurrent: number (default: 4)
// - timeoutMs: number (default: 300000)
// - onFailure: 'halt' | 'continue' | 'rollback'
```

**Output** (to Caller):

```typescript
// SchedulerResult:
// - success: boolean (all nodes SUCCESS)
// - completedNodes: string[]
// - failedNodes: string[]
// - rolledBackNodes: string[]
// - duration: number (ms)
```

**Output** (Status Queries):

```typescript
// SchedulerStatus:
// - running: boolean
// - completed: number
// - failed: number
// - pending: number
// - total: number
```

**Integration with Phase 3 (State Machine)**:

```typescript
// Scheduler calls StateMachine for all transitions
// - transition(node, 'READY', reason)
// - transition(node, 'RUNNING')
// - transition(node, 'VERIFYING')
// - transition(node, 'SUCCESS')
// - transition(node, 'FAILED', error)
// - handleFailure(node, maxRetries)
// - rollback(node, graph)
```

### SCOPE BOUNDARIES

**IN Scope:**

- Main scheduler loop: while !complete → dispatch → wait → update
- Root node initialization (CREATED → READY)
- Executable node discovery (READY + deps satisfied)
- Concurrent task dispatch up to maxConcurrent
- Task timeout handling
- Dependency unlock on task success
- Failure handling with policy selection
- Deadlock detection
- Status reporting
- Graceful stop()

**OUT of Scope (handled by other phases):**

- Actual task execution (Phase 6 - Dispatcher)
- State persistence (Phase 7)
- Distributed scheduling (Phase 9)
- Governance pausing (Phase 5)
- Verification logic (Phase 6)

### WINDOWS (High-Level Work Units)

#### W1: Core Scheduler Loop

**Task ID:** V20-P4-W1-LOOP  
**Objective:** Build the main execution loop that drives workflow completion.  
**Agent Power Tier:** HIGH (Claude Opus for correctness of loop invariants)  
**Success Signal:** Scheduler runs from root nodes to completion without errors.

**Requirements:**

- Initialize root nodes: transition CREATED → READY
- Main loop: continue while running and not complete
- Find executable nodes: READY state + all dependencies SUCCESS
- Handle capacity constraints: respect maxConcurrent limit
- Dispatch tasks to execution adapter
- Wait for task completion
- Update state based on results
- Check termination: all nodes terminal?

**Constraints:**

- Must use StateMachine for all transitions
- Must integrate with Phase 2 Graph for dependency queries
- Must support configurable concurrency limits
- Must be async for non-blocking execution

---

#### W2: Dependency Unlock System

**Task ID:** V20-P4-W2-UNLOCK  
**Objective:** Build the system that transitions dependents to READY when dependencies complete.  
**Agent Power Tier:** BALANCED (Claude Sonnet for balanced speed)  
**Success Signal:** Dependents transition to READY only when ALL dependencies succeed.

**Requirements:**

- On task SUCCESS, query graph for dependents
- For each dependent, check if all dependencies are SUCCESS
- Transition eligible dependents from CREATED → READY
- Track unlocked nodes for logging/debugging
- Prevent premature unlock (partial dependencies)
- Support completion detection
- Support deadlock detection

**Constraints:**

- Must handle complex dependency patterns (diamonds, etc.)
- Must not unlock if any dependency failed
- Must be efficient for large graphs (O(edges) per completion)
- Must work with StateMachine transitions

---

#### W3: Failure Handling & Policies

**Task ID:** V20-P4-W3-FAILURE  
**Objective:** Implement failure handling with configurable policies and retry logic.  
**Agent Power Tier:** HIGH (Codex o1 for reasoning about failure paths)  
**Success Signal:** Failed tasks retry correctly, policies execute as configured.

**Requirements:**

- Handle task failure: transition to FAILED
- Calculate retry eligibility (current count vs maxRetries)
- Compute backoff delay with exponential algorithm
- Implement halt policy: stop scheduler on failure
- Implement rollback policy: trigger rollback propagation
- Implement continue policy: mark ROLLBACK, continue other branches
- Support configurable timeout with Promise.race

**Constraints:**

- Must respect maxRetries limit strictly
- Backoff must have configurable cap (default 30s)
- Must handle both sync and async failures
- Must clean up resources on halt

---

#### W4: Integration Tests & Validation

**Task ID:** V20-P4-W4-TESTS  
**Objective:** Build comprehensive integration tests covering all workflow patterns and edge cases.  
**Agent Power Tier:** BALANCED (Gemini for comprehensive test generation)  
**Success Signal:** 95%+ coverage, all patterns tested, edge cases covered.

**Requirements:**

- Create mock dispatcher for testing
- Test linear execution (A → B → C)
- Test parallel execution (A, B concurrent)
- Test diamond pattern (A → B, C → D)
- Test failure with retry
- Test max retries exceeded → ROLLBACK
- Test halt policy
- Test rollback propagation
- Test timeout handling
- Test status reporting
- Test continue policy
- Test stop() halts execution
- Test deadlock detection

**Constraints:**

- Tests must use Node.js built-in test runner
- Tests must be deterministic (no flakiness)
- Mock dispatcher must support success/failure scenarios
- Tests must complete in < 5 seconds total

---

### SEQUENCE

```
W1 (Loop) → W2 (Unlock) → W3 (Failure) → W4 (Tests)
```

- Strictly sequential - each builds on previous
- W4 integrates and validates all components

### OUTPUT ARTIFACTS

| Artifact        | Location                           | Purpose                      |
| --------------- | ---------------------------------- | ---------------------------- |
| Scheduler       | `dexgraph/scheduler.ts`            | Core execution orchestration |
| Scheduler Tests | `tests/dexgraph/scheduler.test.ts` | Integration test coverage    |

### VALIDATION GATES

- [ ] Scheduler runs linear, parallel, and diamond workflows
- [ ] Dependency unlock works correctly (all deps satisfied)
- [ ] Retry respects maxRetries and exponential backoff
- [ ] Failure policies (halt/continue/rollback) execute correctly
- [ ] Deadlock detection identifies impossible states
- [ ] Timeout terminates stuck tasks
- [ ] 95%+ test coverage
- [ ] Handles 100+ concurrent tasks

### RISK MITIGATION

| Risk                                  | Impact | Mitigation                                             |
| ------------------------------------- | ------ | ------------------------------------------------------ |
| Race condition in concurrent dispatch | High   | maxConcurrent limit + serialized state updates         |
| Deadlock false positive               | Medium | Triple-check: no running + no ready + not all terminal |
| Timeout kills mid-execution           | Medium | Mark FAILED, let retry/retry logic handle              |
| Stop() leaves zombie tasks            | Medium | Wait for active task cleanup                           |
| Memory leak with large graphs         | Medium | Limit concurrent, stream results                       |

### COST TRACKING

| Window | Tier     | Agent         | Est. Tokens |
| ------ | -------- | ------------- | ----------- |
| W1     | HIGH     | Claude Opus   | ~12K        |
| W2     | BALANCED | Claude Sonnet | ~6K         |
| W3     | HIGH     | Codex o1      | ~8K         |
| W4     | BALANCED | Gemini Pro    | ~10K        |

---

_Phase 4 dispatches | High-Level Orchestrator | v2.1_
