# Phase 3: Task State Machine (Week 1-2)

### OBJECTIVE
Implement dexgraph/stateMachine.ts — deterministic state transitions for every node. States: CREATED → READY → RUNNING → VERIFYING → SUCCESS, with FAILED → RETRY → RUNNING, BLOCKED, and ROLLBACK paths. Every state change is auditable.

### SKILLS REFERENCED
- /engineering:system-design → State machine patterns
- /engineering:architecture → State transition ADR

### WINDOWS

#### W1: State Enum + Types
- Task ID: V20-P3-W1-STATE-TYPES
- Objective: Define state enum, transition rules matrix, and state machine interface
- Target Files: dexgraph/stateMachine.ts (START)
- Why this lane: State machine contract must be airtight. Opus for precision.
- Power Tier: HIGH
- Command:
```bash
claude --model opus --effort max -p \
  "Define DexGraph state machine types.

   CREATE dexgraph/stateMachine.ts:
   import { NodeState, GraphNode } from './types';
   import { StateError } from './errors';

   // Valid transitions matrix
   const TRANSITIONS: Record<NodeState, NodeState[]> = {
     CREATED:   ['READY'],
     READY:     ['RUNNING', 'BLOCKED'],
     RUNNING:   ['VERIFYING', 'FAILED'],
     VERIFYING: ['SUCCESS', 'FAILED'],
     SUCCESS:   [],  // terminal
     FAILED:    ['RETRY', 'ROLLBACK'],
     RETRY:     ['RUNNING'],
     BLOCKED:   ['READY'],  // unblocked by governance
     ROLLBACK:  [],  // terminal
   };

   interface StateTransition {
     nodeId: string;
     from: NodeState;
     to: NodeState;
     timestamp: number;
     reason?: string;
   }

   export class StateMachine {
     private history: StateTransition[];
     constructor()
     canTransition(from: NodeState, to: NodeState): boolean
     // Throws StateError if invalid transition
   }"
```
- Expected Output: State enum, transition matrix, StateMachine class shell
- Validation: `npx tsc --noEmit dexgraph/stateMachine.ts`
- Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Define state machine types..."`
- Fallback #2: `gemini -y -p "Create state machine type definitions..."`
- Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Define state machine types..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: Phase 1 W1 (types)

#### W2: Transition Logic
- Task ID: V20-P3-W2-TRANSITIONS
- Objective: Implement transition(), getState(), getHistory() — the core state mutation API
- Target Files: dexgraph/stateMachine.ts (CONTINUE)
- Why this lane: State mutation logic. Sonnet for balanced implementation.
- Power Tier: BALANCED
- Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Implement state machine transitions.

   ADD to StateMachine class:
   transition(node: GraphNode, to: NodeState, reason?: string): void
   - Validate transition is legal (check TRANSITIONS matrix)
   - If illegal: throw StateError('Invalid transition: {from} → {to} for node {id}')
   - Update node.state
   - Record StateTransition in history
   - Return void (mutation)

   getState(node: GraphNode): NodeState
   - Return current state

   getHistory(nodeId?: string): StateTransition[]
   - If nodeId: return transitions for that node
   - If no nodeId: return all transitions

   getRetryCount(nodeId: string): number
   - Count FAILED→RETRY transitions for this node

   isTerminal(state: NodeState): boolean
   - SUCCESS or ROLLBACK = terminal"
```
- Expected Output: Complete transition API with history tracking
- Validation: `npx tsc --noEmit dexgraph/stateMachine.ts`
- Fallback #1: `gemini -y -p "Implement state transitions..."`
- Fallback #2: `codex --full-auto -m gpt-4o exec "Build state machine transitions..."`
- Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Implement state transition logic..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1

#### W3: Failure + Retry Handling
- Task ID: V20-P3-W3-RETRY
- Objective: Implement retry logic — max retries, backoff, escalation to ROLLBACK after max
- Target Files: dexgraph/stateMachine.ts (ADD)
- Why this lane: Retry logic has edge cases. Codex o1 for reasoning.
- Power Tier: HIGH
- Command:
```bash
codex --full-auto -m o1 exec \
  "Implement retry and failure handling in DexGraph state machine.

   ADD to StateMachine:
   handleFailure(node: GraphNode, maxRetries: number): NodeState
   - Get retry count for this node
   - If retryCount < maxRetries: transition FAILED → RETRY → RUNNING, return 'RUNNING'
   - If retryCount >= maxRetries: transition FAILED → ROLLBACK, return 'ROLLBACK'

   shouldRetry(node: GraphNode, maxRetries: number): boolean
   - Return getRetryCount(nodeId) < maxRetries

   getBackoffMs(retryCount: number): number
   - Exponential: 1000 * 2^retryCount (1s, 2s, 4s, 8s...)
   - Cap at 30000ms (30s max)"
```
- Expected Output: Retry logic with exponential backoff and max retry cap
- Validation: `npx tsc --noEmit dexgraph/stateMachine.ts`
- Fallback #1: `codex --full-auto -m gpt-4o exec "Implement retry logic..."`
- Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Build retry handling..."`
- Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Implement retry with backoff..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W2

#### W4: Rollback Mechanism + Tests
- Task ID: V20-P3-W4-ROLLBACK-TESTS
- Objective: Implement rollback propagation (when node rolls back, dependents also roll back) + tests
- Target Files: dexgraph/stateMachine.ts (COMPLETE), tests/dexgraph/stateMachine.test.ts (NEW)
- Why this lane: Rollback + comprehensive tests. Gemini for test volume.
- Power Tier: BALANCED
- Command:
```bash
gemini -y -p \
  "Complete DexGraph state machine with rollback and tests.

   ADD to StateMachine:
   rollback(node: GraphNode, graph: DexGraph): string[]
   - Transition node to ROLLBACK
   - Find all dependents of this node (via graph.getDependents)
   - Transition all non-terminal dependents to ROLLBACK
   - Return array of rolled-back node IDs

   CREATE tests/dexgraph/stateMachine.test.ts:
   - Test: CREATED → READY is valid
   - Test: CREATED → RUNNING is invalid (must go through READY)
   - Test: RUNNING → VERIFYING → SUCCESS is valid
   - Test: FAILED → RETRY → RUNNING is valid
   - Test: RETRY respects max retries
   - Test: exceeding max retries → ROLLBACK
   - Test: rollback propagates to dependents
   - Test: terminal states (SUCCESS, ROLLBACK) reject all transitions
   - Test: history tracks all transitions
   - Test: getRetryCount is accurate
   - Test: backoff is exponential with 30s cap
   - Test: BLOCKED → READY unblock works

   Use Node's built-in test runner."
```
- Expected Output: Rollback propagation + 12 state machine tests
- Validation:
```bash
node --test tests/dexgraph/stateMachine.test.ts
```
- Fallback #1: `gemini -y --model gemini-2.5-flash -p "Complete state machine with tests..."`
- Fallback #2: `codex --full-auto -m o1 exec "Write state machine tests..."`
- Fallback #3: `opencode run -m opencode/llama-3.1-70b-instruct -p "Complete state machine and write tests..."`
- Cost Class: FREE
- Dependencies: W1, W2, W3

### SEQUENCE
W1 → W2 → W3 → W4

### VALIDATION CRITERIA
- [ ] All 9 state transitions work correctly
- [ ] Invalid transitions throw StateError
- [ ] Retry count tracks per node
- [ ] Rollback propagates to dependents
- [ ] 12+ state machine tests pass
- [ ] History captures every transition with timestamp

### COST TRACKING
| Window | Tier | Agent | Est. Tokens |
|--------|------|-------|-------------|
| W1 | HIGH | Claude Opus | ~6K |
| W2 | BALANCED | Claude Sonnet | ~6K |
| W3 | HIGH | Codex o1 | ~6K |
| W4 | BALANCED | Gemini Pro | ~10K |

### RISKS
| Risk | Mitigation |
|------|------------|
| Concurrent state mutations | State machine is sync, scheduler serializes calls |
| Rollback cascade infinite loop | Terminal check prevents re-rollback |
| Retry storm | Exponential backoff + max cap |

---

*Phase 3 dispatches generated 2026-04-12 | DexGraph State Machine | 4 windows | Week 1-2*
