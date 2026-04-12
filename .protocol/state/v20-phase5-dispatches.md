# Phase 5: Execution Adapter Interface (Week 3)

### OBJECTIVE
Implement adapters/executionAdapter.ts — the contract between DexGraph and external execution engines. Define the ExecutionAdapter interface that all execution providers (mock, CLI, Composio, eventually) must implement. Start with mock adapter for testing before integrating real providers.

### SKILLS REFERENCED
- /engineering:architecture → Adapter pattern ADR
- /engineering:system-design → Interface contracts and abstraction boundaries
- /engineering:testing-strategy → Mock adapter test plan

### WINDOWS

#### W1: Adapter Interface Definition
- Task ID: V20-P5-W1-ADAPTER-INTERFACE
- Objective: Define ExecutionAdapter interface with run(), cancel(), and status tracking methods
- Target Files: adapters/executionAdapter.ts (START)
- Why this lane: Interface contracts must be precise. Opus for correctness of the abstraction.
- Power Tier: HIGH
- Command:
```bash
claude --model opus --effort max -p \
  "Define DexGraph execution adapter interface.

   CREATE adapters/executionAdapter.ts:
   
   export interface ExecutionContext {
     nodeId: string;
     taskType: string;
     input: Record<string, unknown>;
     timeout: number;  // ms
     environment?: Record<string, string>;
     retryCount?: number;
   }

   export interface ExecutionResult {
     status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
     output?: unknown;
     logs: string[];
     error?: string;
     cost: {
       tokens: number;
       estimatedUSD: number;
       provider: string;
     };
     confidence: number;  // 0-1
     duration: number;  // ms
     timestamp: string;  // ISO
   }

   export interface ExecutionAdapter {
     /**
      * Execute a task node in the workflow
      * @param context - Node context, input, timeout
      * @returns ExecutionResult with output, logs, cost, confidence
      */
     run(context: ExecutionContext): Promise<ExecutionResult>;

     /**
      * Cancel in-flight execution
      * @param nodeId - Node to cancel
      */
     cancel(nodeId: string): Promise<void>;

     /**
      * Get current status of node execution
      */
     status(nodeId: string): Promise<{ running: boolean; progress?: number }>;

     /**
      * Name of adapter for logging
      */
     name(): string;
   }

   CONSTRAINTS:
   - ExecutionResult MUST be serializable
   - cost MUST be populated (even if 0)
   - logs MUST capture all output
   - confidence 0.5-1.0 indicates quality
   - timeout MUST be respected (throw TIMEOUT)
   - error MUST contain root cause"
```
- Expected Output: ExecutionAdapter interface + types
- Validation: `npx tsc --noEmit adapters/executionAdapter.ts`
- Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Define execution adapter interface..."`
- Fallback #2: `codex --full-auto -m o1 exec "Design adapter contract..."`
- Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Create execution adapter interface..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: None (foundation)

#### W2: Mock Adapter Implementation
- Task ID: V20-P5-W2-MOCK-ADAPTER
- Objective: Implement MockAdapter that resolves with fake results for testing without API calls
- Target Files: adapters/mockAdapter.ts (NEW)
- Why this lane: Mock adapter enables testing before real providers. Sonnet for pragmatic implementation.
- Power Tier: BALANCED
- Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Implement mock executor adapter for DexGraph.

   CREATE adapters/mockAdapter.ts:
   
   import { ExecutionAdapter, ExecutionContext, ExecutionResult } from './executionAdapter';

   export class MockAdapter implements ExecutionAdapter {
     private tasks: Map<string, { running: boolean; progress: number }> = new Map();
     private delay: number;
     private failNodes: Set<string>;

     constructor(delay: number = 100, failNodes: string[] = []) {
       this.delay = delay;
       this.failNodes = new Set(failNodes);
     }

     async run(context: ExecutionContext): Promise<ExecutionResult> {
       this.tasks.set(context.nodeId, { running: true, progress: 0 });
       
       try {
         const shouldFail = this.failNodes.has(context.nodeId);
         
         await new Promise(r => setTimeout(r, this.delay));

         this.tasks.set(context.nodeId, { running: false, progress: 100 });

         if (shouldFail) {
           return {
             status: 'FAILED',
             logs: ['Mock task failed as configured'],
             error: 'Intentional failure for testing',
             cost: { tokens: 0, estimatedUSD: 0, provider: 'mock' },
             confidence: 0.5,
             duration: this.delay,
             timestamp: new Date().toISOString()
           };
         }

         return {
           status: 'SUCCESS',
           output: { result: 'mock output', input: context.input },
           logs: ['Mock execution completed', JSON.stringify(context.input)],
           cost: { tokens: 100, estimatedUSD: 0.001, provider: 'mock' },
           confidence: 0.95,
           duration: this.delay,
           timestamp: new Date().toISOString()
         };
       } catch (error) {
         return {
           status: 'FAILED',
           logs: ['Mock execution error'],
           error: error instanceof Error ? error.message : String(error),
           cost: { tokens: 0, estimatedUSD: 0, provider: 'mock' },
           confidence: 0,
           duration: this.delay,
           timestamp: new Date().toISOString()
         };
       }
     }

     async cancel(nodeId: string): Promise<void> {
       this.tasks.delete(nodeId);
     }

     async status(nodeId: string): Promise<{ running: boolean; progress?: number }> {
       return this.tasks.get(nodeId) || { running: false, progress: 0 };
     }

     name(): string {
       return 'MockAdapter';
     }
   }"
```
- Expected Output: MockAdapter class implementing ExecutionAdapter
- Validation: `npx tsc --noEmit adapters/mockAdapter.ts`
- Fallback #1: `gemini -y -p "Implement mock adapter for testing..."`
- Fallback #2: `codex --full-auto -m gpt-4o exec "Build mock execution adapter..."`
- Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Create mock task executor..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1

#### W3: Result Contract Types + Validation
- Task ID: V20-P5-W3-RESULT-TYPES
- Objective: Define and validate result schema — cost, confidence, logs, error handling
- Target Files: adapters/resultValidator.ts (NEW)
- Why this lane: Result contract validation prevents bad data flowing downstream. Sonnet for pragmatic validation logic.
- Power Tier: BALANCED
- Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Create result validator for execution adapter output.

   CREATE adapters/resultValidator.ts:
   
   import { ExecutionResult } from './executionAdapter';

   export class ResultValidator {
     static validate(result: ExecutionResult): { valid: boolean; errors: string[] } {
       const errors: string[] = [];

       // Status must be one of 4 values
       const validStatuses = ['SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED'];
       if (!validStatuses.includes(result.status)) {
         errors.push(\`Invalid status: \${result.status}\`);
       }

       // Cost must be present and non-negative
       if (!result.cost) {
         errors.push('cost is required');
       } else {
         if (result.cost.tokens < 0) errors.push('cost.tokens must be >= 0');
         if (result.cost.estimatedUSD < 0) errors.push('cost.estimatedUSD must be >= 0');
         if (!result.cost.provider) errors.push('cost.provider is required');
       }

       // Confidence must be 0-1
       if (result.confidence < 0 || result.confidence > 1) {
         errors.push('confidence must be between 0 and 1');
       }

       // Logs must be string array
       if (!Array.isArray(result.logs) || !result.logs.every(l => typeof l === 'string')) {
         errors.push('logs must be string array');
       }

       // Duration must be non-negative
       if (result.duration < 0) {
         errors.push('duration must be >= 0');
       }

       // Timestamp must be ISO
       if (!/^\d{4}-\d{2}-\d{2}T/.test(result.timestamp)) {
         errors.push('timestamp must be ISO 8601');
       }

       // If FAILED, error must be present
       if (result.status === 'FAILED' && !result.error) {
         errors.push('error required when status is FAILED');
       }

       // If SUCCESS, output should ideally be present (but may be undefined)
       // This is informational only, not an error

       return { valid: errors.length === 0, errors };
     }

     static serialize(result: ExecutionResult): string {
       return JSON.stringify(result);
     }

     static deserialize(json: string): ExecutionResult {
       return JSON.parse(json) as ExecutionResult;
     }
   }"
```
- Expected Output: ResultValidator class with validation rules
- Validation: `npx tsc --noEmit adapters/resultValidator.ts`
- Fallback #1: `gemini -y -p "Build result validator..."`
- Fallback #2: `codex --full-auto -m gpt-4o exec "Implement result validation..."`
- Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create validation schema..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1

#### W4: Adapter Unit + Integration Tests
- Task ID: V20-P5-W4-ADAPTER-TESTS
- Objective: Unit tests for adapter interface, mock adapter, and result validator
- Target Files: tests/adapters/mockAdapter.test.ts, tests/adapters/resultValidator.test.ts (NEW)
- Why this lane: Test coverage validates the contract. Gemini for test volume.
- Power Tier: BALANCED
- Command:
```bash
gemini -y -p \
  "Write tests for DexGraph execution adapters.

   CREATE tests/adapters/mockAdapter.test.ts:
   - Test: run() succeeds, returns SUCCESS result
   - Test: run() includes all required cost fields
   - Test: run() logs are captured
   - Test: run() respects delay
   - Test: run() returns confidence >= 0.9 on success
   - Test: cancel(nodeId) removes from tracking
   - Test: status(nodeId) returns running state
   - Test: MockAdapter with failNodes returns FAILED
   - Test: result is serializable to JSON
   - Test: ExecutionContext is properly passed through

   CREATE tests/adapters/resultValidator.test.ts:
   - Test: valid SUCCESS result passes
   - Test: valid FAILED result with error passes
   - Test: missing cost fails
   - Test: negative tokens fails
   - Test: confidence outside 0-1 fails
   - Test: non-ISO timestamp fails
   - Test: FAILED without error fails
   - Test: logs must be string array
   - Test: serialize/deserialize roundtrip
   - Test: invalid status fails

   Use Node's built-in test runner."
```
- Expected Output: 20+ adapter tests covering mock and validation
- Validation:
```bash
node --test tests/adapters/
```
- Fallback #1: `gemini -y --model gemini-2.5-flash -p "Write adapter tests..."`
- Fallback #2: `codex --full-auto -m o1 exec "Write execution adapter tests..."`
- Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Build adapter test suite..."`
- Cost Class: FREE
- Dependencies: W1, W2, W3

### SEQUENCE
W1 → W2 → W3 → W4

### VALIDATION CRITERIA
- [ ] ExecutionAdapter interface is defined
- [ ] MockAdapter implements interface correctly
- [ ] ResultValidator enforces all schema rules
- [ ] 20+ tests pass
- [ ] No real API calls in tests
- [ ] Result contract is serializable

### COST TRACKING
| Window | Tier | Agent | Est. Tokens |
|--------|------|-------|-------------|
| W1 | HIGH | Claude Opus | ~8K |
| W2 | BALANCED | Claude Sonnet | ~6K |
| W3 | BALANCED | Claude Sonnet | ~5K |
| W4 | BALANCED | Gemini Pro | ~10K |

### RISKS
| Risk | Mitigation |
|------|------------|
| Adapter interface too narrow | Design review before W2; interface is extensible |
| Cost tracking inaccuracy | Mock returns 0; real providers verify in W6+ |
| Timeout not enforced | Context.timeout is advisory; executor must respect |

---

*Phase 5 dispatches generated 2026-04-12 | Execution Adapter Interface | 4 windows | Week 3*
