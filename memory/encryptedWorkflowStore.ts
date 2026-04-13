/**
 * Ultra-Dex Encrypted Workflow Store
 *
 * Secure storage for workflow state with AES-256-GCM encryption.
 * Addresses security audit finding: C-001 (unencrypted data at rest)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkflowMemory, WorkflowStoreConfig, NodeState, ExecutionHistory } from './workflowStore.js';
import { EncryptionService } from '../security/encryption.js';

// ──────────────────────────────────────────────────────────────────────────────
// Encrypted Workflow Store
// ──────────────────────────────────────────────────────────────────────────────

export interface EncryptedWorkflowStoreConfig extends WorkflowStoreConfig {
  /** Master encryption key (should be from environment variable) */
  encryptionKey: string;
}

export class EncryptedWorkflowStore {
  private config: Required<EncryptedWorkflowStoreConfig>;
  private workflows: Map<string, WorkflowMemory> = new Map();
  private saveQueue: Set<string> = new Set();
  private saveTimer?: NodeJS.Timeout;
  private encryption: EncryptionService;

  constructor(config: EncryptedWorkflowStoreConfig) {
    if (!config.encryptionKey || config.encryptionKey.length < 32) {
      throw new Error('Encryption key must be at least 32 characters');
    }

    this.config = {
      ...config,
      basePath: config.basePath ?? '.ultra-dex/workflows',
      autoSave: config.autoSave ?? true,
      saveInterval: config.saveInterval ?? 5000,
    };

    this.encryption = new EncryptionService({
      masterKey: config.encryptionKey,
    });
  }

  /**
   * Async factory — ensures the store directory exists before first use.
   */
  static async create(config: EncryptedWorkflowStoreConfig): Promise<EncryptedWorkflowStore> {
    const store = new EncryptedWorkflowStore(config);
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
   * Get all workflow IDs
   */
  getAllWorkflowIds(): string[] {
    return Array.from(this.workflows.keys());
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
   * Set node output (convenience method)
   */
  setNodeOutput(workflowId: string, nodeId: string, output: unknown): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);
    
    const node = workflow.nodes.get(nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);
    
    node.output = output;
    workflow.updatedAt = new Date().toISOString();
    
    if (this.config.autoSave) {
      this.saveQueue.add(workflowId);
      this.scheduleSave();
    }
  }

  /**
   * Persist single workflow to disk with encryption
   */
  async save(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

    // Convert Maps to plain objects for serialization
    const data = {
      ...workflow,
      nodes: Object.fromEntries(workflow.nodes),
      nodeHistory: Object.fromEntries(workflow.nodeHistory),
    };

    // Encrypt sensitive fields (node outputs and history)
    const encrypted = this.encryption.encryptObject(data);

    const filePath = path.join(this.config.basePath, `${workflowId}.json.enc`);
    await fs.writeFile(filePath, JSON.stringify(encrypted, null, 2), 'utf-8');
  }

  /**
   * Load workflow from disk with decryption
   */
  async load(workflowId: string): Promise<WorkflowMemory> {
    const filePath = path.join(this.config.basePath, `${workflowId}.json.enc`);
    
    try {
      const encrypted = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      const data = this.encryption.decryptObject<{
        workflowId: string;
        createdAt: string;
        updatedAt: string;
        status: WorkflowMemory['status'];
        nodes: Record<string, NodeState>;
        nodeHistory: Record<string, ExecutionHistory[]>;
        metrics: WorkflowMemory['metrics'];
        tags?: string[];
      }>(encrypted);

      // Convert plain objects back to Maps
      const workflow: WorkflowMemory = {
        ...data,
        nodes: new Map(Object.entries(data.nodes)),
        nodeHistory: new Map(Object.entries(data.nodeHistory)),
      };

      this.workflows.set(workflowId, workflow);
      return workflow;
    } catch (error) {
      throw new Error(`Failed to load workflow ${workflowId}: ${(error as Error).message}`);
    }
  }

  /**
   * Check if encrypted workflow exists
   */
  async exists(workflowId: string): Promise<boolean> {
    const filePath = path.join(this.config.basePath, `${workflowId}.json.enc`);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
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
   * Flush all pending saves immediately
   */
  async flush(): Promise<void> {
    const ids = Array.from(this.saveQueue);
    this.saveQueue.clear();
    
    await Promise.all(ids.map(id => this.save(id).catch(err => {
      console.error(`Failed to save workflow ${id}:`, err);
      this.saveQueue.add(id); // Re-queue for retry
    })));
  }

  /**
   * Close store and flush pending saves
   */
  async close(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = undefined;
    }
    await this.flush();
  }

  /**
   * Delete workflow from memory and disk
   */
  async delete(workflowId: string): Promise<void> {
    this.workflows.delete(workflowId);
    
    const filePath = path.join(this.config.basePath, `${workflowId}.json.enc`);
    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist
    }
  }
}
