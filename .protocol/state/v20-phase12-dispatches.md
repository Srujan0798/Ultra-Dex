# Phase 12: Event System (Week 8)

### OBJECTIVE
Implement typed event system using Node EventEmitter as hook point for observability, logging, metrics, webhooks. Events fire at all critical state transitions: workflow.started, task.started, task.completed, task.failed, workflow.completed. This layer integrates with scheduler, state machine, and dispatcher without coupling.

### SKILLS REFERENCED
- /engineering:system-design (event-driven architecture)
- /engineering:testing-strategy (event coverage)
- /engineering:architecture (observability patterns)

### WINDOWS (4 per phase)

#### W1: Event Types Definition
**Task ID:** phase12-w1-event-types  
**Objective:** Define typed event schema; 5 core events + payload types  
**Target Files:** `core/events.ts`, `core/types/events.ts`  
**Why this lane:** Foundation; all downstream listeners depend on type safety  
**Power Tier:** 1 (type definitions)  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "Create core/events.ts with typed events. Define WorkflowEvent, TaskEvent types. Export: WorkflowStartedEvent { workflowId, timestamp, graph }, TaskStartedEvent { taskId, workflowId, timestamp, agentType }, TaskCompletedEvent { taskId, workflowId, timestamp, output, cost }, TaskFailedEvent { taskId, workflowId, timestamp, error, reason }, WorkflowCompletedEvent { workflowId, timestamp, totalCost, status }. Create discriminated union: UltraDexEvent. Add JSDoc with examples."`  
**Expected Output:** `core/events.ts` (140 LOC), `core/types/events.ts` (80 LOC); types properly exported  
**Validation:** `npm run typecheck` passes; all event types are instantiable  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m o1 exec "define typed event schema for workflow and task events"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $2–3 (type-heavy)  
**Dependencies:** Workflow/task schemas finalized; state machine states locked

#### W2: EventEmitter Setup (Typed Event Bus)
**Task ID:** phase12-w2-event-emitter  
**Objective:** Create typed EventEmitter wrapper; on(event, listener), emit(event), once(event)  
**Target Files:** `core/events/event-bus.ts`, `core/events/event-emitter.ts`  
**Why this lane:** Core abstraction; listeners attach to this bus  
**Power Tier:** 1  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "Create core/events/event-bus.ts with EventBus class extending Node EventEmitter. Add typed methods: on<T extends UltraDexEvent>(event: T['type'], listener: (e: T) => void): void. Add emit<T extends UltraDexEvent>(event: T): void. Create core/events/event-emitter.ts with createEventEmitter(): EventBus singleton. Add debug logging via winston (emit name + payload). Export both."`  
**Expected Output:** `core/events/event-bus.ts` (100 LOC), `core/events/event-emitter.ts` (40 LOC); no typecheck errors  
**Validation:** `npm run typecheck` passes; listeners are type-safe; events emit without error  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m gpt-4o exec "implement typed EventEmitter wrapper"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $2–3  
**Dependencies:** Event types stable; winston logger available

#### W3: Wiring into Scheduler, State Machine, Dispatcher
**Task ID:** phase12-w3-event-wiring  
**Objective:** Emit events at all critical points: scheduler state transitions, dispatcher execution start/end, verification pass/fail  
**Target Files:** `core/orchestration/scheduler.ts`, `core/state-machine.ts`, `core/dispatcher.ts`  
**Why this lane:** Closes the loop; events inform all listeners of execution progress  
**Power Tier:** 1  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "In scheduler.ts, emit WorkflowStartedEvent on start, TaskStartedEvent before dispatch, TaskCompletedEvent on SUCCESS, TaskFailedEvent on FAILED, WorkflowCompletedEvent on finish. In dispatcher.ts, emit TaskStartedEvent before agent call, capture output + cost. In state-machine.ts, emit events on state transitions. Add eventBus.on() listeners in tests to verify. Maintain sequence: emit → transition state (not vice versa)."`  
**Expected Output:** `scheduler.ts` updated (40 LOC), `dispatcher.ts` updated (30 LOC), `state-machine.ts` updated (20 LOC)  
**Validation:** `npm run test:integration -- tests/integration/event-flow.test.js` passes; events fire in correct order with correct payloads  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m o1 exec "wire event emissions into scheduler, dispatcher, state machine"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $3–4 (cross-module integration)  
**Dependencies:** Scheduler, dispatcher, state machine all stable

#### W4: Observability Foundation & Tests
**Task ID:** phase12-w4-observability-tests  
**Objective:** Wire events to logging + metrics stubs; comprehensive event test suite; 100% event coverage  
**Target Files:** `core/observability/event-logger.ts`, `tests/core/events/*.test.js`, `tests/integration/event-*.test.js`  
**Why this lane:** Validates event system; establishes hooks for future logging/metrics/webhooks  
**Power Tier:** 1  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "Create core/observability/event-logger.ts: subscribe to all events, log via winston (name + payload + timestamp). Write tests/core/events/event-bus.test.js (40 LOC): test on/emit/once, test type safety. Write tests/integration/event-workflow.test.js (100 LOC): run full workflow, capture all events, verify sequence and payloads. Test happy path, failure path, pause/resume events. Ensure 100% coverage for events/."`  
**Expected Output:** `core/observability/event-logger.ts` (60 LOC), tests (140 LOC); 100% coverage for events/  
**Validation:** `npm test -- tests/core/events/ tests/integration/event-*` passes with 100% coverage; all 5 event types fire correctly  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m gpt-4o exec "write comprehensive event system tests and observability foundation"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $2–3  
**Dependencies:** Event wiring complete; integration tests can run

### SEQUENCE
1. W1 → W2 (event types needed before EventBus types)
2. W2 → W3 (EventBus ready before wiring into core modules)
3. W3 → W4 (all emissions in place before comprehensive tests)
4. All windows complete; Phase 12 closes v2.0 core loop

### VALIDATION CRITERIA
- [ ] UltraDexEvent is discriminated union of all 5 event types
- [ ] EventBus.on/emit/once are type-safe (typed listener signature)
- [ ] WorkflowStartedEvent fired at graph start
- [ ] TaskStartedEvent fired before dispatcher calls agent
- [ ] TaskCompletedEvent fired with output + cost on SUCCESS
- [ ] TaskFailedEvent fired with error + reason on FAILED
- [ ] WorkflowCompletedEvent fired at workflow finish
- [ ] Events fire in correct sequence (verified by tests)
- [ ] Event-logger subscribes to all events and logs
- [ ] 100% line coverage for core/events/ + observability/
- [ ] All tests pass in under 15s

### COST TRACKING
| Item | Est. Cost | Actual | Notes |
|------|-----------|--------|-------|
| W1: Event Types | $2 | — | Type definitions only |
| W2: EventEmitter Setup | $2 | — | Node EventEmitter wrapper |
| W3: Event Wiring | $3 | — | Integration across 3 modules |
| W4: Observability & Tests | $2 | — | Logging + comprehensive test suite |
| **PHASE TOTAL** | **$9** | — | — |

### RISKS
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Events fire out of order | Low | High | Document expected sequence; test ordering |
| Event listeners block execution | Medium | Medium | Listeners must not throw; wrap in try/catch |
| Memory leak from lingering listeners | Low | Medium | Provide .off() method; test cleanup |
| Event payloads expose secrets | Medium | High | Sanitize output in payloads; redact tokens |
| Too many events (performance) | Low | Medium | Add event filtering; batch emits if needed |
