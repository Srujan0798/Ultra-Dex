# Phase 6: Dispatcher (Week 3)

### OBJECTIVE
Implement dexgraph/dispatcher.ts — the execution boundary between Scheduler and ExecutionAdapter. Dispatcher receives READY nodes from Scheduler, maps them to adapter calls, handles results, updates state machine, and integrates verifier before marking SUCCESS. Scheduler never talks to execution directly.

### SKILLS REFERENCED
- /engineering:architecture → Dispatcher pattern ADR
- /engineering:system-design → Queue and event handling
- /engineering:testing-strategy → Boundary testing

### WINDOWS

#### W1: Dispatcher Queue + Lifecycle
- Task ID: V20-P6-W1-DISPATCHER-QUEUE
- Objective: Build dispatcher queue structure that receives nodes from scheduler, manages in-flight tasks, tracks results
- Target Files: dexgraph/dispatcher.ts (START)
- Why this lane: Dispatcher is the execution boundary. Opus for correctness of the protocol.
- Power Tier: HIGH
- Command:
```bash
claude --model opus --effort max -p \
  "Build DexGraph dispatcher engine.

   CREATE dexgraph/dispatcher.ts:
   
   import { ExecutionAdapter, ExecutionContext, ExecutionResult } from 'src/adapters/executionAdapter';
   import { GraphNode } from './graph';
   import { StateMachine } from './stateMachine';

   export interface DispatcherConfig {
     maxConcurrent: number;
     adapter: ExecutionAdapter;
   }

   export interface DispatchedTask {
     nodeId: string;
     node: GraphNode;
     startTime: number;
     promise: Promise<ExecutionResult>;
   }

   export class Dispatcher {
     private config: DispatcherConfig;
     private queue: DispatchedTask[] = [];
     private inFlight: Map<string, DispatchedTask> = new Map();
     private results: Map<string, ExecutionResult> = new Map();

     constructor(config: DispatcherConfig) {
       this.config = config;
     }

     /**
      * Dispatch a READY node for execution
      * @param node - READY node from scheduler
      * @returns Promise that resolves when execution completes
      */
     dispatch(node: GraphNode): Promise<ExecutionResult> {
       // Create execution context from node
       const context: ExecutionContext = {
         nodeId: node.id,
         taskType: node.taskType,
         input: node.input || {},
         timeout: node.timeout || 300000
       };

       // Call adapter.run()
       const promise = this.config.adapter.run(context);

       const task: DispatchedTask = {
         nodeId: node.id,
         node,
         startTime: Date.now(),
         promise
       };

       this.queue.push(task);
       this.inFlight.set(node.id, task);

       // Attach result handler
       promise
         .then(result => {
           this.results.set(node.id, result);
           this.inFlight.delete(node.id);
         })
         .catch(error => {
           const result: ExecutionResult = {
             status: 'FAILED',
             logs: [(error as Error).message],
             error: (error as Error).message,
             cost: { tokens: 0, estimatedUSD: 0, provider: this.config.adapter.name() },
             confidence: 0,
             duration: Date.now() - task.startTime,
             timestamp: new Date().toISOString()
           };
           this.results.set(node.id, result);
           this.inFlight.delete(node.id);
         });

       return promise;
     }

     /**
      * Get result of completed task
      */
     getResult(nodeId: string): ExecutionResult | undefined {
       return this.results.get(nodeId);
     }

     /**
      * Check if task is in flight
      */
     isInflight(nodeId: string): boolean {
       return this.inFlight.has(nodeId);
     }

     /**
      * Get count of in-flight tasks
      */
     inflightCount(): number {
       return this.inFlight.size;
     }

     /**
      * Can dispatch more tasks
      */
     canDispatch(): boolean {
       return this.inFlight.size < this.config.maxConcurrent;
     }
   }"
```
- Expected Output: Dispatcher class with queue, dispatch, result tracking
- Validation: `npx tsc --noEmit dexgraph/dispatcher.ts`
- Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Build dispatcher queue..."`
- Fallback #2: `codex --full-auto -m o1 exec "Create execution dispatcher..."`
- Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Build dispatcher engine..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: Phase 5 (adapter)

#### W2: Node → Adapter Bridge
- Task ID: V20-P6-W2-NODE-ADAPTER-BRIDGE
- Objective: Map GraphNode properties (input, timeout, env, task type) to ExecutionContext for adapter
- Target Files: dexgraph/dispatcher.ts (ADD)
- Why this lane: Context mapping requires understanding both graph and adapter contracts. Sonnet for balanced precision.
- Power Tier: BALANCED
- Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Implement node-to-adapter context bridge in dispatcher.

   ADD to Dispatcher:
   private buildContext(node: GraphNode): ExecutionContext {
     return {
       nodeId: node.id,
       taskType: node.taskType || 'default',
       input: this.extractNodeInput(node),
       timeout: node.metadata?.timeout || 300000,
       environment: this.extractEnvironment(node),
       retryCount: node.metadata?.retryCount || 0
     };
   }

   private extractNodeInput(node: GraphNode): Record<string, unknown> {
     // Input comes from:
     // 1. node.input (static input)
     // 2. node.metadata.contextInjection (injected from dependencies)
     // Merge them with context taking precedence
     const base = node.input || {};
     const injected = node.metadata?.contextInjection || {};
     return { ...base, ...injected };
   }

   private extractEnvironment(node: GraphNode): Record<string, string> {
     // Extract env vars from node metadata
     const env: Record<string, string> = {};
     const envMetadata = node.metadata?.environment || {};
     for (const [k, v] of Object.entries(envMetadata)) {
       env[k] = String(v);
     }
     return env;
   }"
```
- Expected Output: Context building methods in Dispatcher
- Validation: `npx tsc --noEmit dexgraph/dispatcher.ts`
- Fallback #1: `gemini -y -p "Build context extraction bridge..."`
- Fallback #2: `codex --full-auto -m gpt-4o exec "Implement node context mapping..."`
- Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Create adapter context builder..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1

#### W3: Result Handling + State Update
- Task ID: V20-P6-W3-RESULT-HANDLER
- Objective: Process adapter results, validate, update state machine. Store result in memory for downstream context
- Target Files: dexgraph/dispatcher.ts (ADD)
- Why this lane: Result handling touches state machine and memory. Codex for reasoning about state transitions.
- Power Tier: HIGH
- Command:
```bash
codex --full-auto -m o1 exec \
  "Implement result handling in dispatcher.

   ADD to Dispatcher:
   async handleResult(nodeId: string, result: ExecutionResult, stateMachine: StateMachine): Promise<void> {
     // Validate result contract
     const validation = ResultValidator.validate(result);
     if (!validation.valid) {
       throw new Error(\`Invalid result: \${validation.errors.join(', ')}\`);
     }

     // Update state machine based on result.status
     const node = /* get node from graph */;
     
     switch (result.status) {
       case 'SUCCESS':
         // State is RUNNING → VERIFYING (will call verifier next in dispatcher)
         stateMachine.transition(node, 'VERIFYING', 'Awaiting verification');
         break;
       
       case 'FAILED':
         stateMachine.transition(node, 'FAILED', result.error || 'Unknown error');
         break;
       
       case 'TIMEOUT':
         stateMachine.transition(node, 'FAILED', 'Task timeout');
         break;
       
       case 'CANCELLED':
         stateMachine.transition(node, 'CANCELLED', 'Task cancelled');
         break;
     }

     // Store result for context propagation
     node.metadata.executionResult = result;
     node.metadata.executionCost = result.cost;
   }

   /**
    * Wait for specific task result
    */
   async waitForResult(nodeId: string, timeoutMs: number = 300000): Promise<ExecutionResult> {
     const task = this.inFlight.get(nodeId);
     if (!task) {
       const cached = this.results.get(nodeId);
       if (cached) return cached;
       throw new Error(\`Task \${nodeId} not found\`);
     }
     
     return Promise.race([
       task.promise,
       new Promise<ExecutionResult>((_, reject) =>
         setTimeout(() => reject(new Error('Dispatcher timeout')), timeoutMs)
       )
     ]);
   }"
```
- Expected Output: Result handling with state transitions
- Validation: `npx tsc --noEmit dexgraph/dispatcher.ts`
- Fallback #1: `codex --full-auto -m gpt-4o exec "Build result handler..."`
- Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Implement result processing..."`
- Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Build state update logic..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1, W2

#### W4: Verifier Integration + Tests
- Task ID: V20-P6-W4-DISPATCHER-VERIFIER
- Objective: After adapter SUCCESS, pass result to verifier before marking SUCCESS. Include full dispatcher tests.
- Target Files: dexgraph/dispatcher.ts (ADD), tests/dexgraph/dispatcher.test.ts (NEW)
- Why this lane: Verifier integration is critical quality gate. Gemini for test coverage.
- Power Tier: BALANCED
- Command:
```bash
gemini -y -p \
  "Implement verifier integration and tests for dispatcher.

   ADD to Dispatcher:
   async dispatchWithVerification(
     node: GraphNode,
     verifier: Verifier  // from Phase 9 (use interface for now)
   ): Promise<ExecutionResult> {
     const result = await this.dispatch(node);
     
     if (result.status === 'SUCCESS') {
       // Pass result to verifier
       const verification = await verifier.verify(node, result);
       
       if (!verification.valid) {
         // Verifier rejected; mark as FAILED
         result.status = 'FAILED';
         result.error = verification.reason;
         result.confidence = Math.min(result.confidence, verification.confidence);
       }
     }
     
     return result;
   }

   CREATE tests/dexgraph/dispatcher.test.ts:
   - Test: dispatch() enqueues task
   - Test: dispatch() returns promise
   - Test: dispatch() respects maxConcurrent
   - Test: canDispatch() returns true when below limit
   - Test: getResult() returns completed result
   - Test: isInflight() tracks in-flight tasks
   - Test: adapter SUCCESS result stored
   - Test: adapter FAILED result propagates error
   - Test: adapter TIMEOUT returns FAILED
   - Test: context includes node input + injected context
   - Test: context extracts environment vars
   - Test: waitForResult() waits for completion
   - Test: waitForResult() timeout throws
   - Test: dispatchWithVerification calls verifier on SUCCESS
   - Test: dispatchWithVerification respects verifier rejection
   - Test: multiple concurrent dispatches handled

   Use mock adapter and mock verifier interface."
```
- Expected Output: Verifier integration + 16 dispatcher tests
- Validation:
```bash
node --test tests/dexgraph/dispatcher.test.ts
```
- Fallback #1: `gemini -y --model gemini-2.5-flash -p "Write dispatcher tests..."`
- Fallback #2: `codex --full-auto -m o1 exec "Build dispatcher test suite..."`
- Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Write integration tests..."`
- Cost Class: FREE
- Dependencies: W1, W2, W3

### SEQUENCE
W1 → W2 → W3 → W4

### VALIDATION CRITERIA
- [ ] Dispatcher enqueues READY nodes
- [ ] Adapter is called with correct ExecutionContext
- [ ] Results are validated before state update
- [ ] State machine transitions triggered correctly
- [ ] Verifier integration enforces quality gate
- [ ] 16+ dispatcher tests pass
- [ ] Scheduler can use Dispatcher as boundary

### COST TRACKING
| Window | Tier | Agent | Est. Tokens |
|--------|------|-------|-------------|
| W1 | HIGH | Claude Opus | ~10K |
| W2 | BALANCED | Claude Sonnet | ~6K |
| W3 | HIGH | Codex o1 | ~8K |
| W4 | BALANCED | Gemini Pro | ~10K |

### RISKS
| Risk | Mitigation |
|------|------------|
| Scheduler assumes direct execution | Dispatcher is mandatory boundary in scheduler |
| Result validation too strict | Validator is configurable; tests verify edge cases |
| Verifier blocks all SUCCESS | Verifier can log warnings without blocking |
| Race condition in result storage | Map-based storage is atomic; test concurrent dispatch |

---

*Phase 6 dispatches generated 2026-04-12 | Dispatcher | 4 windows | Week 3*
