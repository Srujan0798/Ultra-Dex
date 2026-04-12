# Phase 8: Context Injection (Week 4)

### OBJECTIVE
Implement context injection pipeline — gather outputs from completed dependencies, inject them into current node's context, propagate through graph without re-prompting. No agent should ask for inputs twice; context becomes infrastructure. Wire dependency outputs through ContextCollector into ExecutionContext before dispatcher passes to adapter.

### SKILLS REFERENCED
- /engineering:architecture → Context propagation ADR
- /engineering:system-design → Data flow through layers
- /engineering:testing-strategy → Context propagation testing

### WINDOWS

#### W1: Dependency Output Collector
- Task ID: V20-P8-W1-DEPENDENCY-COLLECTOR
- Objective: Gather outputs from all completed READY-blocking dependencies, build context object
- Target Files: dexgraph/contextInjector.ts (START)
- Why this lane: Dependency collection must be precise. Opus for correctness of dependency graph queries.
- Power Tier: HIGH
- Command:
```bash
claude --model opus --effort max -p \
  "Build dependency output collector for context injection.

   CREATE dexgraph/contextInjector.ts:
   
   import { DexGraph, GraphNode } from './graph';
   import { WorkflowStore } from 'src/memory/workflowStore';
   import { ContextCollector } from 'src/memory/contextCollector';

   export class ContextInjector {
     constructor(
       private graph: DexGraph,
       private store: WorkflowStore,
       private workflowId: string
     ) {}

     /**
      * Collect outputs from all dependencies of a node
      */
     collectDependencyOutputs(nodeId: string): Record<string, unknown> {
       const node = this.graph.getNode(nodeId);
       if (!node) throw new Error(\`Node not found: \${nodeId}\`);

       const dependencyIds = this.graph.getDependencies(nodeId);
       const outputs = this.store.getDependencyOutputs(
         this.workflowId,
         nodeId,
         dependencyIds
       );

       return outputs;
     }

     /**
      * Check if all dependencies are completed (SUCCESS state)
      */
     areDependenciesSatisfied(nodeId: string): boolean {
       const node = this.graph.getNode(nodeId);
       if (!node) throw new Error(\`Node not found: \${nodeId}\`);

       const dependencyIds = this.graph.getDependencies(nodeId);
       const workflow = this.store.getWorkflow(this.workflowId);
       if (!workflow) return false;

       return dependencyIds.every(depId => {
         const depNode = workflow.nodes.get(depId);
         return depNode?.state === 'SUCCESS';
       });
     }

     /**
      * Wait for dependencies to complete (polling)
      */
     async waitForDependencies(
       nodeId: string,
       timeoutMs: number = 300000
     ): Promise<Record<string, unknown>> {
       const startTime = Date.now();
       const pollInterval = 100; // ms

       while (Date.now() - startTime < timeoutMs) {
         if (this.areDependenciesSatisfied(nodeId)) {
           return this.collectDependencyOutputs(nodeId);
         }
         await this.sleep(pollInterval);
       }

       throw new Error(
         \`Timeout waiting for dependencies of \${nodeId} after \${timeoutMs}ms\`
       );
     }

     /**
      * Get node's static input
      */
     getNodeInput(nodeId: string): Record<string, unknown> {
       const node = this.graph.getNode(nodeId);
       return node?.input || {};
     }

     private sleep(ms: number): Promise<void> {
       return new Promise(r => setTimeout(r, ms));
     }
   }"
```
- Expected Output: ContextInjector class with dependency collection
- Validation: `npx tsc --noEmit dexgraph/contextInjector.ts`
- Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Build dependency collector..."`
- Fallback #2: `codex --full-auto -m o1 exec "Create dependency output collector..."`
- Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Build dependency gatherer..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: Phase 6 (dispatcher), Phase 7 (memory)

#### W2: Context Injection Logic
- Task ID: V20-P8-W2-INJECTION-LOGIC
- Objective: Merge dependency outputs + static input into ExecutionContext for the node
- Target Files: dexgraph/contextInjector.ts (ADD)
- Why this lane: Injection merging requires careful precedence. Sonnet for balanced precision.
- Power Tier: BALANCED
- Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Implement context injection logic in ContextInjector.

   ADD to ContextInjector:
   
   /**
    * Build injection metadata for node
    */
    buildInjectionMetadata(nodeId: string): {
      dependencyOutputs: Record<string, unknown>;
      injectedContext: Record<string, unknown>;
      staticInput: Record<string, unknown>;
    } {
     const dependencyOutputs = this.collectDependencyOutputs(nodeId);
     const staticInput = this.getNodeInput(nodeId);

     // Merge with dependency outputs taking precedence
     const injectedContext = ContextCollector.collect(
       dependencyOutputs,
       staticInput
     );

     return { dependencyOutputs, injectedContext, staticInput };
   }

   /**
    * Inject context into node for execution
    * Modifies node.metadata with injection info
    */
    injectContext(nodeId: string): void {
     const node = this.graph.getNode(nodeId);
     if (!node) throw new Error(\`Node not found: \${nodeId}\`);

     const { dependencyOutputs, injectedContext, staticInput } =
       this.buildInjectionMetadata(nodeId);

     // Store injection metadata on node
     if (!node.metadata) node.metadata = {};
     node.metadata.contextInjection = {
       dependencyOutputs,
       injectedContext,
       staticInput,
       injectedAt: new Date().toISOString(),
       dependencies: this.graph.getDependencies(nodeId)
     };
   }

   /**
    * Build execution context with injected values
    * Called by dispatcher before passing to adapter
    */
    buildExecutionContext(nodeId: string): Record<string, unknown> {
     const node = this.graph.getNode(nodeId);
     if (!node) throw new Error(\`Node not found: \${nodeId}\`);

     // If context not yet injected, inject now
     if (!node.metadata?.contextInjection) {
       this.injectContext(nodeId);
     }

     // Execution context includes injected values
     return node.metadata.contextInjection.injectedContext;
   }

   /**
    * Verify context is ready for execution
    */
    isContextReady(nodeId: string): boolean {
     const node = this.graph.getNode(nodeId);
     if (!node) return false;
     
     // Context ready if: all deps satisfied AND (has injection OR no deps)
     const hasDeps = this.graph.getDependencies(nodeId).length > 0;
     const depsReady = this.areDependenciesSatisfied(nodeId);
     const hasInjection = !!node.metadata?.contextInjection;

     return depsReady || (!hasDeps && hasInjection);
   }"
```
- Expected Output: Context injection merging logic
- Validation: `npx tsc --noEmit dexgraph/contextInjector.ts`
- Fallback #1: `gemini -y -p "Implement context merging logic..."`
- Fallback #2: `codex --full-auto -m gpt-4o exec "Build injection merging..."`
- Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Implement context assembly..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1

#### W3: Propagation Engine
- Task ID: V20-P8-W3-PROPAGATION-ENGINE
- Objective: Wire context injection into dispatcher → adapter pipeline. Context flows without re-prompting
- Target Files: dexgraph/dispatcher.ts (MODIFY), dexgraph/contextInjector.ts (ADD)
- Why this lane: Pipeline wiring must be correct. Codex for reasoning about data flow.
- Power Tier: HIGH
- Command:
```bash
codex --full-auto -m o1 exec \
  "Wire context injection into dispatcher pipeline.

   MODIFY dexgraph/dispatcher.ts:
   
   import { ContextInjector } from './contextInjector';

   export class Dispatcher {
     private contextInjector: ContextInjector;

     constructor(config: DispatcherConfig, contextInjector: ContextInjector) {
       this.config = config;
       this.contextInjector = contextInjector;
     }

     /**
      * Enhanced dispatch with context injection
      */
     async dispatchWithContext(
       node: GraphNode,
       verifier?: Verifier
     ): Promise<ExecutionResult> {
       // Step 1: Wait for dependencies if needed
       const dependencyOutputs = await this.contextInjector.waitForDependencies(
         node.id,
         node.metadata?.timeout || 300000
       );

       // Step 2: Inject context
       this.contextInjector.injectContext(node.id);

       // Step 3: Build execution context with injections
       const injectedInput = this.contextInjector.buildExecutionContext(node.id);

       // Step 4: Create execution context with injected input
       const context: ExecutionContext = {
         nodeId: node.id,
         taskType: node.taskType || 'default',
         input: injectedInput,  // Includes dependency outputs
         timeout: node.metadata?.timeout || 300000,
         environment: this.extractEnvironment(node),
         retryCount: node.metadata?.retryCount || 0
       };

       // Step 5: Dispatch to adapter (no re-prompting needed)
       const result = await this.config.adapter.run(context);

       // Step 6: Verify (if enabled)
       if (verifier && result.status === 'SUCCESS') {
         const verification = await verifier.verify(node, result);
         if (!verification.valid) {
           result.status = 'FAILED';
           result.error = verification.reason;
         }
       }

       return result;
     }
   }

   ADD to ContextInjector:
   /**
    * Propagate context from node to all dependents
    */
    propagateContext(nodeId: string): void {
     const node = this.graph.getNode(nodeId);
     if (!node || node.state !== 'SUCCESS') return;

     const dependents = this.graph.getDependents(nodeId);
     for (const depId of dependents) {
       // Mark dependent as ready for context injection
       const depNode = this.graph.getNode(depId);
       if (depNode && depNode.state === 'READY') {
         // Don't inject yet; wait for all deps
         // But mark that this dependency is satisfied
         if (!depNode.metadata?.readyDependencies) {
           depNode.metadata.readyDependencies = [];
         }
         depNode.metadata.readyDependencies.push(nodeId);
       }
     }
    }"
```
- Expected Output: dispatchWithContext integration + propagation
- Validation: `npx tsc --noEmit dexgraph/dispatcher.ts dexgraph/contextInjector.ts`
- Fallback #1: `codex --full-auto -m gpt-4o exec "Wire context pipeline..."`
- Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Implement propagation..."`
- Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Build context flow..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1, W2

#### W4: No Re-prompting Verification Tests
- Task ID: V20-P8-W4-NO-REPROMPT-TEST
- Objective: End-to-end test of multi-step workflow. Verify context propagates without agents re-asking for input
- Target Files: tests/dexgraph/contextInjection.test.ts (NEW)
- Why this lane: Validation that context infrastructure works. Gemini for comprehensive coverage.
- Power Tier: BALANCED
- Command:
```bash
gemini -y -p \
  "Write context injection and no-reprompting tests.

   CREATE tests/dexgraph/contextInjection.test.ts:
   - Test: collectDependencyOutputs() returns outputs from all deps
   - Test: areDependenciesSatisfied() true only when all deps SUCCESS
   - Test: waitForDependencies() blocks until deps complete
   - Test: getNodeInput() returns static input
   - Test: buildInjectionMetadata() merges dependency + static
   - Test: injectContext() stores metadata on node
   - Test: buildExecutionContext() includes injected values
   - Test: isContextReady() checks readiness
   - Test: dispatcher.dispatchWithContext() passes injected input to adapter
   - Test: Linear workflow A→B→C: C receives output from both A and B
   - Test: Diamond A→B,A→C,B→D,C→D: D receives outputs from B and C
   - Test: No re-prompting: adapter only called once per node
   - Test: Context persists across dispatcher calls
   - Test: Failed dependency blocks downstream
   - Test: Propagation marks dependent ready
   - Test: Timeout waiting for dependencies throws
   - Test: Static input overridden by dependency output
   - Test: ExecutionContext.input includes all injected fields

   Key test: multi-step workflow
   1. Node A outputs { result: 'data_a' }
   2. Node B (depends on A) receives context with result='data_a', no re-ask
   3. Node B outputs { result: 'data_b' }
   4. Node C (depends on A,B) receives { result_from_a: 'data_a', result_from_b: 'data_b' }
   5. Verify adapter called 3 times total (once per node)

   Use Node's built-in test runner, mock adapter."
```
- Expected Output: 18+ context injection tests
- Validation:
```bash
node --test tests/dexgraph/contextInjection.test.ts
```
- Fallback #1: `gemini -y --model gemini-2.5-flash -p "Write context tests..."`
- Fallback #2: `codex --full-auto -m o1 exec "Build context propagation tests..."`
- Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Write end-to-end tests..."`
- Cost Class: FREE
- Dependencies: W1, W2, W3

### SEQUENCE
W1 → W2 → W3 → W4

### VALIDATION CRITERIA
- [ ] Dependency outputs collected correctly
- [ ] Context injection merges dependency + static input
- [ ] Dispatcher passes injected context to adapter
- [ ] No agent re-prompts for input on multi-step workflow
- [ ] Context propagates through diamond DAGs
- [ ] Failed dependency blocks downstream
- [ ] 18+ tests pass
- [ ] Adapter called once per node only

### COST TRACKING
| Window | Tier | Agent | Est. Tokens |
|--------|------|-------|-------------|
| W1 | HIGH | Claude Opus | ~10K |
| W2 | BALANCED | Claude Sonnet | ~6K |
| W3 | HIGH | Codex o1 | ~8K |
| W4 | BALANCED | Gemini Pro | ~12K |

### RISKS
| Risk | Mitigation |
|------|------------|
| Circular dependencies block forever | Graph validation in Phase 2 prevents cycles |
| Context lost on serialization | JSON roundtrip tested in Phase 7 |
| Adapter still re-prompts despite injection | Mock adapter in tests verifies single call per node |
| Dependency output format mismatch | ContextCollector tests verify structure |
| Timeout causes incomplete context | waitForDependencies throws; scheduler handles retry |

---

*Phase 8 dispatches generated 2026-04-12 | Context Injection | 4 windows | Week 4*
