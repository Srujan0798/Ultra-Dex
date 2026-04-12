# Phase 4: Scheduler Engine (Week 2)

### OBJECTIVE
Implement dexgraph/scheduler.ts — the execution loop that drives workflows. Finds READY nodes, dispatches execution, waits for results, updates state. This is where the graph actually runs.

### SKILLS REFERENCED
- /engineering:architecture → Scheduler design ADR
- /engineering:deploy-checklist → Validation criteria
- /engineering:system-design → Event loop patterns

### WINDOWS

#### W1: Scheduler Loop Structure
- Task ID: V20-P4-W1-SCHEDULER-LOOP
- Objective: Build the core scheduler loop — while !complete: find ready → dispatch → wait → update
- Target Files: dexgraph/scheduler.ts (START)
- Why this lane: Scheduler is the heart of execution. Opus for correctness of the loop invariants.
- Power Tier: HIGH
- Command:
```bash
claude --model opus --effort max -p \
  "Build DexGraph scheduler engine.

   CREATE dexgraph/scheduler.ts:
   import { DexGraph } from './graph';
   import { StateMachine } from './stateMachine';
   import { Dispatcher } from './dispatcher';  // Phase 6, use interface for now

   interface SchedulerConfig {
     maxRetries: number;        // default: 2
     maxConcurrent: number;     // default: 4
     timeoutMs: number;         // default: 300000 (5 min per task)
     onFailure: 'halt' | 'continue' | 'rollback';
   }

   export class Scheduler {
     private graph: DexGraph;
     private stateMachine: StateMachine;
     private config: SchedulerConfig;
     private running: boolean;

     constructor(graph: DexGraph, config?: Partial<SchedulerConfig>)

     async run(): Promise<SchedulerResult> {
       this.running = true;
       // 1. Transition all root nodes CREATED → READY
       // 2. LOOP:
       //    a. getExecutableNodes() — READY + all deps SUCCESS
       //    b. If none and !allComplete → deadlock or waiting
       //    c. Dispatch up to maxConcurrent
       //    d. Await results
       //    e. Update state: SUCCESS or FAILED
       //    f. If FAILED: handleFailure (retry or rollback)
       //    g. Unlock dependents: if all deps SUCCESS → READY
       //    h. Check termination: all nodes terminal?
       // 3. Return result
     }

     stop(): void { this.running = false; }

     getStatus(): SchedulerStatus {
       // { running, completed, failed, pending, total }
     }
   }

   interface SchedulerResult {
     success: boolean;
     completedNodes: string[];
     failedNodes: string[];
     rolledBackNodes: string[];
     duration: number;
   }

   IMPORTANT: dispatcher is passed as interface, not concrete class.
   Use a stub dispatcher that resolves immediately for now."
```
- Expected Output: Scheduler class with core loop, config, status
- Validation: `npx tsc --noEmit dexgraph/scheduler.ts`
- Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Build scheduler loop..."`
- Fallback #2: `codex --full-auto -m o1 exec "Create DexGraph scheduler engine..."`
- Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Build DAG scheduler loop..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: Phase 2 (graph), Phase 3 (state machine)

#### W2: Dependency Unlock Logic
- Task ID: V20-P4-W2-DEPENDENCY-UNLOCK
- Objective: When a node succeeds, check if its dependents can now transition to READY
- Target Files: dexgraph/scheduler.ts (ADD)
- Why this lane: Dependency unlocking has subtle correctness requirements. Sonnet for balanced speed.
- Power Tier: BALANCED
- Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Implement dependency unlock logic in DexGraph scheduler.

   ADD to Scheduler:
   private unlockDependents(completedNodeId: string): string[] {
     const dependents = this.graph.getDependents(completedNodeId);
     const unlocked: string[] = [];
     for (const depId of dependents) {
       const dep = this.graph.getNode(depId);
       if (dep.state !== 'CREATED') continue;  // already processed
       const allDepsSatisfied = this.graph.getDependencies(depId)
         .every(d => this.graph.getNode(d).state === 'SUCCESS');
       if (allDepsSatisfied) {
         this.stateMachine.transition(dep, 'READY', 'Dependencies satisfied');
         unlocked.push(depId);
       }
     }
     return unlocked;
   }

   private isComplete(): boolean {
     return this.graph.getAllNodes().every(n =>
       this.stateMachine.isTerminal(n.state)
     );
   }

   private isDeadlocked(): boolean {
     // No terminal, no RUNNING, no READY = deadlock
     const nodes = this.graph.getAllNodes();
     const hasRunning = nodes.some(n => n.state === 'RUNNING' || n.state === 'VERIFYING');
     const hasReady = nodes.some(n => n.state === 'READY');
     const allTerminal = nodes.every(n => this.stateMachine.isTerminal(n.state));
     return !allTerminal && !hasRunning && !hasReady;
   }"
```
- Expected Output: Dependency unlock + completion check + deadlock detection
- Validation: `npx tsc --noEmit dexgraph/scheduler.ts`
- Fallback #1: `gemini -y -p "Implement dependency unlock for DAG scheduler..."`
- Fallback #2: `codex --full-auto -m gpt-4o exec "Build dependency unlock logic..."`
- Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Implement dependency resolution..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1

#### W3: Retry + Failure Handling
- Task ID: V20-P4-W3-SCHEDULER-RETRY
- Objective: Integrate retry logic into scheduler loop — respect maxRetries, backoff, halt/continue/rollback policy
- Target Files: dexgraph/scheduler.ts (ADD)
- Why this lane: Failure handling policy. Codex o1 for reasoning about all failure paths.
- Power Tier: HIGH
- Command:
```bash
codex --full-auto -m o1 exec \
  "Implement failure handling in DexGraph scheduler.

   ADD to Scheduler:
   private async handleNodeFailure(node: GraphNode, error: Error): Promise<void> {
     this.stateMachine.transition(node, 'FAILED', error.message);

     if (this.stateMachine.shouldRetry(node, this.config.maxRetries)) {
       const backoff = this.stateMachine.getBackoffMs(
         this.stateMachine.getRetryCount(node.id)
       );
       await sleep(backoff);
       const newState = this.stateMachine.handleFailure(node, this.config.maxRetries);
       // newState is 'RUNNING' (retry) — re-dispatch
     } else {
       // Max retries exceeded
       switch (this.config.onFailure) {
         case 'halt':
           this.stop();
           break;
         case 'rollback':
           this.stateMachine.rollback(node, this.graph);
           break;
         case 'continue':
           // Mark as ROLLBACK, but continue other branches
           this.stateMachine.transition(node, 'ROLLBACK', 'Max retries exceeded');
           break;
       }
     }
   }

   private sleep(ms: number): Promise<void> {
     return new Promise(r => setTimeout(r, ms));
   }"
```
- Expected Output: Failure handling with halt/continue/rollback policies
- Validation: `npx tsc --noEmit dexgraph/scheduler.ts`
- Fallback #1: `codex --full-auto -m gpt-4o exec "Implement scheduler failure handling..."`
- Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Build failure handling..."`
- Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Implement retry and failure handling..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1, W2

#### W4: Full Scheduler Integration Tests
- Task ID: V20-P4-W4-SCHEDULER-TESTS
- Objective: End-to-end tests — parse workflow, build graph, run scheduler with mock dispatcher
- Target Files: tests/dexgraph/scheduler.test.ts (NEW)
- Why this lane: Integration test coverage. Gemini for test volume at free tier.
- Power Tier: BALANCED
- Command:
```bash
gemini -y -p \
  "Write integration tests for DexGraph scheduler.

   CREATE tests/dexgraph/scheduler.test.ts:
   - Test: linear A→B→C runs in order, all SUCCESS
   - Test: parallel A,B (no deps) run concurrently
   - Test: diamond A→B,A→C,B→D,C→D — D only after B+C
   - Test: failure with retry — node fails, retries, succeeds
   - Test: failure with max retries exceeded — ROLLBACK
   - Test: halt policy stops all execution
   - Test: continue policy skips failed branch
   - Test: rollback propagates to dependents
   - Test: deadlock detection (impossible graph state)
   - Test: timeout (mock slow task, verify timeout error)
   - Test: stop() halts in-progress execution
   - Test: getStatus() returns correct counts

   Use mock dispatcher: resolve with SUCCESS after 10ms.
   Use mock failing dispatcher: reject on first call, succeed on retry.
   Use Node's built-in test runner."
```
- Expected Output: 12 scheduler integration tests
- Validation:
```bash
node --test tests/dexgraph/scheduler.test.ts
```
- Fallback #1: `gemini -y --model gemini-2.5-flash -p "Write scheduler tests..."`
- Fallback #2: `codex --full-auto -m o1 exec "Write DexGraph scheduler tests..."`
- Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Write scheduler integration tests..."`
- Cost Class: FREE
- Dependencies: W1, W2, W3

### SEQUENCE
W1 → W2 → W3 → W4

### VALIDATION CRITERIA
- [ ] Scheduler runs linear, parallel, and diamond workflows
- [ ] Dependency unlock works correctly
- [ ] Retry respects maxRetries and backoff
- [ ] Failure policies (halt/continue/rollback) work
- [ ] Deadlock detection catches impossible states
- [ ] 12+ scheduler tests pass

### COST TRACKING
| Window | Tier | Agent | Est. Tokens |
|--------|------|-------|-------------|
| W1 | HIGH | Claude Opus | ~12K |
| W2 | BALANCED | Claude Sonnet | ~6K |
| W3 | HIGH | Codex o1 | ~8K |
| W4 | BALANCED | Gemini Pro | ~10K |

### RISKS
| Risk | Mitigation |
|------|------------|
| Race condition in concurrent dispatch | maxConcurrent limit + serialized state updates |
| Deadlock false positive | Triple-check: no running + no ready + not all terminal |
| Timeout kills mid-execution | Graceful: mark FAILED, let retry handle it |

---

*Phase 4 dispatches generated 2026-04-12 | DexGraph Scheduler | 4 windows | Week 2*
