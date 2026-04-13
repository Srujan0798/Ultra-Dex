import * as fs from 'fs/promises';
import * as path from 'path';

export interface NodeState {
  nodeId: string;
  taskType: string;
  state: 'CREATED' | 'READY' | 'RUNNING' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'ROLLBACK' | 'BLOCKED' | 'RETRY';
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

/** Simple LRU cache — avoids unbounded memory growth in long-running servers */
class LRUCache<K, V> {
  private readonly max: number;
  private readonly map: Map<K, V>;

  constructor(max = 256) {
    this.max = max;
    this.map = new Map();
  }

  get(key: K): V | undefined {
    const val = this.map.get(key);
    if (val !== undefined) {
      // Re-insert to mark as recently used
      this.map.delete(key);
      this.map.set(key, val);
    }
    return val;
  }

  set(key: K, val: V): void {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.max) {
      // Evict oldest entry (first key in insertion order)
      this.map.delete(this.map.keys().next().value!);
    }
    this.map.set(key, val);
  }

  delete(key: K): void { this.map.delete(key); }
  has(key: K): boolean { return this.map.has(key); }
  keys(): IterableIterator<K> { return this.map.keys(); }
  values(): IterableIterator<V> { return this.map.values(); }
  get size(): number { return this.map.size; }
}

export class WorkflowStore {
  private config: Required<WorkflowStoreConfig>;
  /** LRU in-memory cache — capped at 256 workflows to prevent unbounded growth */
  private workflows: LRUCache<string, WorkflowMemory> = new LRUCache(256);
  private saveQueue: Set<string> = new Set();
  private saveTimer?: NodeJS.Timeout;

  constructor(config?: Partial<WorkflowStoreConfig>) {
    this.config = {
      basePath: '.ultra-dex/workflows',
      autoSave: true,
      saveInterval: 5000,
      ...config,
    };
  }

  /**
   * Async factory — ensures the store directory exists before first use.
   */
  static async create(config?: Partial<WorkflowStoreConfig>): Promise<WorkflowStore> {
    const store = new WorkflowStore(config);
    await store.ensureDir(store.config.basePath);
    return store;
  }


  private async ensureDir(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
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
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);
    
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
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

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
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

    const node = workflow.nodes.get(nodeId);
    if (node) {
      node.output = output;
      workflow.updatedAt = new Date().toISOString();
      if (this.config.autoSave) {
        this.saveQueue.add(workflowId);
        this.scheduleSave();
      }
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(async () => {
      await this.flush();
      this.saveTimer = undefined;
    }, this.config.saveInterval);
  }

  /**
   * Save workflow to disk
   */
  async saveWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

    await this.ensureDir(this.config.basePath);
    
    const filePath = path.join(this.config.basePath, `${workflowId}.json`);
    
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
    const filePath = path.join(this.config.basePath, `${workflowId}.json`);
    
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
    } catch (error: any) {
      if (error.code === 'ENOENT') {
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
    const filePath = path.join(this.config.basePath, `${workflowId}.json`);
    try {
      await fs.unlink(filePath);
      this.workflows.delete(workflowId);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Update workflow status
   */
  updateWorkflowStatus(workflowId: string, status: WorkflowMemory['status']): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);
    workflow.status = status;
    workflow.updatedAt = new Date().toISOString();
    if (this.config.autoSave) {
      this.saveQueue.add(workflowId);
      this.scheduleSave();
    }
  }

  /**
   * List all workflow IDs
   */
  listWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }

  /**
   * Force immediate persistence to disk
   */
  async forceSave(workflowId: string): Promise<void> {
    await this.saveWorkflow(workflowId);
    this.saveQueue.delete(workflowId);
  }

  /**
   * Flush pending saves and stop the auto-save timer.
   * Call this when the process is shutting down.
   */
  async close(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = undefined;
    }
    await this.flush();
  }
}
