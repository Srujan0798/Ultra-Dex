# Phase 7: Memory Store (Week 4)

### OBJECTIVE
Implement memory/workflowStore.ts — persistent memory for workflow state. Store node execution results, outputs, history, timestamps in JSON filesystem initially. Enable context propagation by saving node outputs so downstream nodes can inject them as context. Support crash recovery by loading state from persisted store.

### SKILLS REFERENCED
- /data:explore-data → Memory schema design
- /engineering:system-design → Persistence patterns
- /engineering:testing-strategy → Crash recovery testing

### WINDOWS

#### W1: Memory Types + Schema Definition
- Task ID: V20-P7-W1-MEMORY-SCHEMA
- Objective: Define WorkflowStore schema with workflow state, node outputs, execution history, timestamps
- Target Files: memory/workflowStore.ts (START)
- Why this lane: Schema defines the contract for all downstream features. Opus for correctness.
- Power Tier: HIGH
- Command:
```bash
claude --model opus --effort max -p \
  "Design memory schema for DexGraph workflow persistence.

   CREATE memory/workflowStore.ts:
   
   export interface NodeState {
     nodeId: string;
     taskType: string;
     state: 'CREATED' | 'READY' | 'RUNNING' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'ROLLBACK';
     input: Record<string, unknown>;
     output?: unknown;
     error?: string;
     executedAt?: string;  // ISO timestamp
     duration?: number;    // ms
   }

   export interface ExecutionHistory {
     attempt: number;
     status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
     output?: unknown;
     error?: string;
     startTime: string;    // ISO
     endTime: string;      // ISO
     duration: number;     // ms
     cost: {
       tokens: number;
       estimatedUSD: number;
       provider: string;
     };
   }

   export interface WorkflowMemory {
     workflowId: string;
     createdAt: string;    // ISO
     updatedAt: string;    // ISO
     status: 'CREATED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
     nodes: Map<string, NodeState>;
     nodeHistory: Map<string, ExecutionHistory[]>;  // per-node history
     metrics: {
       totalCost: {
         tokens: number;
         estimatedUSD: number;
       };
       totalDuration: number;
       successCount: number;
       failureCount: number;
     };
     tags?: string[];
   }

   export interface WorkflowStoreConfig {
     basePath: string;    // .ultra-dex/workflows by default
     autoSave: boolean;
     saveInterval?: number;  // ms, default 5000
   }

   export class WorkflowStore {
     private config: WorkflowStoreConfig;
     private workflows: Map<string, WorkflowMemory> = new Map();
     private saveQueue: Set<string> = new Set();
     private saveTimer?: NodeJS.Timer;

     constructor(config?: Partial<WorkflowStoreConfig>) {
       this.config = {
         basePath: '.ultra-dex/workflows',
         autoSave: true,
         saveInterval: 5000,
         ...config
       };
       this.initializeStore();
     }

     private initializeStore(): void {
       // Create basePath if not exists
     }

     /**
      * Create new workflow memory
      */
     createWorkflow(workflowId: string): WorkflowMemory {
       const now = new Date().toISOString();
       const memory: WorkflowMemory = {
         workflowId,
         createdAt: now,
         updatedAt: now,
         status: 'CREATED',
         nodes: new Map(),
         nodeHistory: new Map(),
         metrics: {
           totalCost: { tokens: 0, estimatedUSD: 0 },
           totalDuration: 0,
           successCount: 0,
           failureCount: 0
         }
       };
       this.workflows.set(workflowId, memory);
       return memory;
     }

     /**
      * Update node state
      */
     updateNode(workflowId: string, nodeState: NodeState): void {
       const workflow = this.workflows.get(workflowId);
       if (!workflow) throw new Error(\`Workflow not found: \${workflowId}\`);
       
       workflow.nodes.set(nodeState.nodeId, nodeState);
       workflow.updatedAt = new Date().toISOString();
       
       if (this.config.autoSave) {
         this.saveQueue.add(workflowId);
         this.scheduleSave();
       }
     }

     /**
      * Add execution history entry
      */
     addHistory(workflowId: string, nodeId: string, entry: ExecutionHistory): void {
       const workflow = this.workflows.get(workflowId);
       if (!workflow) throw new Error(\`Workflow not found: \${workflowId}\`);

       const history = workflow.nodeHistory.get(nodeId) || [];
       history.push(entry);
       workflow.nodeHistory.set(nodeId, history);

       // Update metrics
       workflow.metrics.totalDuration += entry.duration;
       if (entry.status === 'SUCCESS') workflow.metrics.successCount++;
       else if (entry.status === 'FAILED') workflow.metrics.failureCount++;
       workflow.metrics.totalCost.tokens += entry.cost.tokens;
       workflow.metrics.totalCost.estimatedUSD += entry.cost.estimatedUSD;

       workflow.updatedAt = new Date().toISOString();
       if (this.config.autoSave) {
         this.saveQueue.add(workflowId);
         this.scheduleSave();
       }
     }

     /**
      * Get workflow memory
      */
     getWorkflow(workflowId: string): WorkflowMemory | undefined {
       return this.workflows.get(workflowId);
     }

     private scheduleSave(): void {
       if (this.saveTimer) return;
       this.saveTimer = setTimeout(async () => {
         await this.flush();
         this.saveTimer = undefined;
       }, this.config.saveInterval);
     }

     async flush(): Promise<void> {
       // Save all dirty workflows to disk
     }
   }"
```
- Expected Output: WorkflowMemory interface + WorkflowStore class with schema
- Validation: `npx tsc --noEmit memory/workflowStore.ts`
- Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Design workflow memory schema..."`
- Fallback #2: `codex --full-auto -m o1 exec "Create persistence schema..."`
- Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Build workflow storage model..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: None (foundation)

#### W2: JSON Filesystem Store Implementation
- Task ID: V20-P7-W2-JSON-FILESYSTEM
- Objective: Implement save/load to .ultra-dex/workflows/ directory using JSON + file I/O
- Target Files: memory/workflowStore.ts (ADD)
- Why this lane: Filesystem I/O is straightforward. Sonnet for pragmatic implementation.
- Power Tier: BALANCED
- Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Implement JSON filesystem storage for workflows.

   ADD to WorkflowStore:
   
   import * as fs from 'fs/promises';
   import * as path from 'path';

   private async ensureDir(dir: string): Promise<void> {
     try {
       await fs.access(dir);
     } catch {
       await fs.mkdir(dir, { recursive: true });
     }
   }

   /**
    * Save workflow to disk
    */
   async saveWorkflow(workflowId: string): Promise<void> {
     const workflow = this.workflows.get(workflowId);
     if (!workflow) throw new Error(\`Workflow not found: \${workflowId}\`);

     await this.ensureDir(this.config.basePath);
     
     const filePath = path.join(this.config.basePath, \`\${workflowId}.json\`);
     
     // Convert Map to Object for JSON serialization
     const data = {
       ...workflow,
       nodes: Object.fromEntries(workflow.nodes),
       nodeHistory: Object.fromEntries(workflow.nodeHistory)
     };

     await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
   }

   /**
    * Load workflow from disk
    */
   async loadWorkflow(workflowId: string): Promise<WorkflowMemory | undefined> {
     const filePath = path.join(this.config.basePath, \`\${workflowId}.json\`);
     
     try {
       const content = await fs.readFile(filePath, 'utf-8');
       const data = JSON.parse(content);
       
       // Reconstruct Maps
       const workflow: WorkflowMemory = {
         ...data,
         nodes: new Map(Object.entries(data.nodes)),
         nodeHistory: new Map(Object.entries(data.nodeHistory))
       };
       
       this.workflows.set(workflowId, workflow);
       return workflow;
     } catch (error) {
       if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
         return undefined;
       }
       throw error;
     }
   }

   /**
    * Load all persisted workflows
    */
   async loadAllWorkflows(): Promise<WorkflowMemory[]> {
     await this.ensureDir(this.config.basePath);
     const files = await fs.readdir(this.config.basePath);
     const workflows: WorkflowMemory[] = [];
     
     for (const file of files) {
       if (file.endsWith('.json')) {
         const workflowId = file.slice(0, -5);
         const workflow = await this.loadWorkflow(workflowId);
         if (workflow) workflows.push(workflow);
       }
     }
     
     return workflows;
   }

   /**
    * Persist all dirty workflows
    */
   async flush(): Promise<void> {
     for (const workflowId of this.saveQueue) {
       await this.saveWorkflow(workflowId);
     }
     this.saveQueue.clear();
   }

   /**
    * Delete workflow
    */
   async deleteWorkflow(workflowId: string): Promise<void> {
     const filePath = path.join(this.config.basePath, \`\${workflowId}.json\`);
     try {
       await fs.unlink(filePath);
       this.workflows.delete(workflowId);
     } catch (error) {
       if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
         throw error;
       }
     }
   }"
```
- Expected Output: File I/O methods for JSON persistence
- Validation: `npx tsc --noEmit memory/workflowStore.ts`
- Fallback #1: `gemini -y -p "Implement JSON file storage..."`
- Fallback #2: `codex --full-auto -m gpt-4o exec "Build filesystem persistence..."`
- Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Create file-based storage..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1

#### W3: Context Persistence + Dependency Output Collection
- Task ID: V20-P7-W3-CONTEXT-PERSISTENCE
- Objective: Save node outputs so dependents can inject them. Implement dependency output collector.
- Target Files: memory/workflowStore.ts (ADD), memory/contextCollector.ts (NEW)
- Why this lane: Context propagation is core to no-rewrite execution. Sonnet for pragmatic logic.
- Power Tier: BALANCED
- Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Implement context persistence and dependency collection.

   ADD to WorkflowStore:
   /**
    * Get collected outputs from node dependencies
    */
   getDependencyOutputs(
     workflowId: string,
     nodeId: string,
     dependencyIds: string[]
   ): Record<string, unknown> {
     const workflow = this.workflows.get(workflowId);
     if (!workflow) return {};

     const outputs: Record<string, unknown> = {};
     for (const depId of dependencyIds) {
       const depNode = workflow.nodes.get(depId);
       if (depNode?.output !== undefined) {
         outputs[depId] = depNode.output;
       }
     }
     return outputs;
   }

   /**
    * Save node output for downstream context
    */
   setNodeOutput(workflowId: string, nodeId: string, output: unknown): void {
     const workflow = this.workflows.get(workflowId);
     if (!workflow) throw new Error(\`Workflow not found: \${workflowId}\`);

     const node = workflow.nodes.get(nodeId);
     if (node) {
       node.output = output;
       workflow.updatedAt = new Date().toISOString();
       if (this.config.autoSave) {
         this.saveQueue.add(workflowId);
       }
     }
   }

   CREATE memory/contextCollector.ts:
   
   export class ContextCollector {
     /**
      * Collect all dependency outputs into a context object
      */
     static collect(
       dependencyOutputs: Record<string, unknown>,
       currentInput: Record<string, unknown>
     ): Record<string, unknown> {
       // Dependency outputs take precedence over input
       return {
         ...currentInput,
         ...dependencyOutputs,
         _dependencies: dependencyOutputs
       };
     }

     /**
      * Extract specific fields from context
      */
     static extract(
       context: Record<string, unknown>,
       fieldNames: string[]
     ): Record<string, unknown> {
       const result: Record<string, unknown> = {};
       for (const field of fieldNames) {
         result[field] = context[field];
       }
       return result;
     }
   }"
```
- Expected Output: Context persistence methods + ContextCollector utility
- Validation: `npx tsc --noEmit memory/workflowStore.ts memory/contextCollector.ts`
- Fallback #1: `gemini -y -p "Build context collection..."`
- Fallback #2: `codex --full-auto -m gpt-4o exec "Implement dependency output collection..."`
- Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create context propagation..."`
- Cost Class: SUBSCRIPTION-INCLUDED
- Dependencies: W1, W2

#### W4: Crash Recovery Test
- Task ID: V20-P7-W4-CRASH-RECOVERY
- Objective: Test crash resilience — kill workflow mid-execution, resume from persisted state, verify all outputs intact
- Target Files: tests/memory/workflowStore.test.ts (NEW)
- Why this lane: Crash recovery validation is critical. Gemini for comprehensive test coverage.
- Power Tier: BALANCED
- Command:
```bash
gemini -y -p \
  "Write crash recovery tests for workflow memory.

   CREATE tests/memory/workflowStore.test.ts:
   - Test: createWorkflow() initializes memory
   - Test: updateNode() updates node state
   - Test: updateNode() marks workflow dirty
   - Test: saveWorkflow() writes JSON to disk
   - Test: loadWorkflow() reads JSON from disk
   - Test: loadAllWorkflows() finds all saved workflows
   - Test: deleteWorkflow() removes file
   - Test: addHistory() tracks execution attempts
   - Test: metrics accumulate across attempts
   - Test: getDependencyOutputs() collects from dependencies
   - Test: setNodeOutput() persists output
   - Test: flush() saves all dirty workflows
   - Test: Crash recovery: start workflow, save state, kill, reload, resume
   - Test: Crash recovery: outputs intact after reload
   - Test: Crash recovery: history preserved
   - Test: Crash recovery: metrics correct after reload
   - Test: ContextCollector.collect() merges context
   - Test: ContextCollector.extract() pulls fields
   - Test: Auto-save triggers on interval
   - Test: Auto-save respects dirty set

   For crash recovery test:
   1. Create workflow, add nodes, execute 2 steps
   2. Save state (flush)
   3. Kill process (simulate crash)
   4. Load workflow from disk
   5. Verify all nodes, outputs, history intact
   6. Resume from crashed state (node 3 onwards)

   Use Node's built-in test runner."
```
- Expected Output: 20+ workflow store tests including crash recovery
- Validation:
```bash
node --test tests/memory/workflowStore.test.ts
```
- Fallback #1: `gemini -y --model gemini-2.5-flash -p "Write memory store tests..."`
- Fallback #2: `codex --full-auto -m o1 exec "Build crash recovery tests..."`
- Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Write persistence tests..."`
- Cost Class: FREE
- Dependencies: W1, W2, W3

### SEQUENCE
W1 → W2 → W3 → W4

### VALIDATION CRITERIA
- [ ] WorkflowMemory schema defined
- [ ] JSON serialization/deserialization works
- [ ] Filesystem I/O creates .ultra-dex/workflows/ directory
- [ ] Context outputs collected from dependencies
- [ ] Crash recovery test passes (state intact after reload)
- [ ] 20+ tests pass
- [ ] Auto-save respects dirty set

### COST TRACKING
| Window | Tier | Agent | Est. Tokens |
|--------|------|-------|-------------|
| W1 | HIGH | Claude Opus | ~10K |
| W2 | BALANCED | Claude Sonnet | ~6K |
| W3 | BALANCED | Claude Sonnet | ~6K |
| W4 | BALANCED | Gemini Pro | ~12K |

### RISKS
| Risk | Mitigation |
|------|------------|
| Large workflows slow to serialize | Compress historical entries; index by date |
| Filesystem permission errors | Ensure .ultra-dex/ is user-writable at startup |
| Concurrent writes corrupt JSON | saveQueue is serial; timer-based flushing prevents races |
| Lost outputs on abnormal exit | flush() called on SIGTERM; test coverage validates |

---

*Phase 7 dispatches generated 2026-04-12 | Memory Store | 4 windows | Week 4*
