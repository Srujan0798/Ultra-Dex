/**
 * DexGraph Execution Engine
 *
 * The "system heart" of Ultra-Dex — the main orchestration entry point that
 * wires together parser → graph → scheduler → dispatcher → adapters.
 *
 * Ultra-Dex NEVER executes directly; it SUPERVISES execution via adapters.
 * The ExecutionEngine is the control-plane coordinator, not an executor.
 */

import { parse } from '../../dexgraph/parser.js';
import { DexGraph } from '../../dexgraph/graph.js';
import { Scheduler, type Dispatcher, type SchedulerConfig, type SchedulerResult } from '../../dexgraph/scheduler.js';
import { GovernanceManager } from '../../governance/governance-manager.js';
import { WorkflowStore } from '../../memory/workflowStore.js';
import { EventBus, createEventBus } from '../../core/events.js';
import type { ExecutionAdapter } from '../../adapters/executionAdapter.js';
import type { GraphNode } from '../../dexgraph/types.js';
import { randomUUID } from 'crypto';

// ──────────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────────

export interface EngineConfig {
  /** Maximum concurrent node executions */
  maxConcurrent?: number;
  /** Per-node timeout in milliseconds (default 5 min) */
  timeoutMs?: number;
  /** Maximum retries per node (default 2) */
  maxRetries?: number;
  /** What to do on unrecoverable failure (default rollback) */
  onFailure?: 'halt' | 'continue' | 'rollback';
  /** Persistence directory for workflow state (default .ultra-dex/workflows) */
  storeDir?: string;
  /** Explicit workflow ID — auto-generated UUID if omitted */
  workflowId?: string;
}

export interface EngineRunResult extends SchedulerResult {
  workflowId: string;
  workflowName: string;
  startedAt: string;
  completedAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// ExecutionEngine
// ──────────────────────────────────────────────────────────────────────────────

export class ExecutionEngine {
  private adapter: ExecutionAdapter;
  private governanceManager?: GovernanceManager;
  private eventBus: EventBus;
  private config: Required<EngineConfig>;

  constructor(
    adapter: ExecutionAdapter,
    config?: EngineConfig,
    governanceManager?: GovernanceManager,
    eventBus?: EventBus,
  ) {
    this.adapter = adapter;
    this.governanceManager = governanceManager;
    this.eventBus = eventBus ?? createEventBus();
    this.config = {
      maxConcurrent: config?.maxConcurrent ?? 4,
      timeoutMs: config?.timeoutMs ?? 300_000,
      maxRetries: config?.maxRetries ?? 2,
      onFailure: config?.onFailure ?? 'rollback',
      storeDir: config?.storeDir ?? '.ultra-dex/workflows',
      workflowId: config?.workflowId ?? randomUUID(),
    };
  }

  /**
   * Run a .dex workflow file end-to-end:
   * parse → build graph → validate DAG → schedule → execute → persist
   */
  async run(workflowFilePath: string): Promise<EngineRunResult> {
    const startedAt = new Date().toISOString();

    // 1. Parse workflow file
    const parseResult = parse(workflowFilePath);

    // 2. Build validated DAG
    const graph = DexGraph.fromParseResult(parseResult);

    // 3. Initialise persistent store
    const store = await WorkflowStore.create({ basePath: this.config.storeDir });
    store.createWorkflow(this.config.workflowId);
    store.updateWorkflowStatus(this.config.workflowId, 'RUNNING');

    // 4. Emit workflow.started
    this.eventBus.emit({
      type: 'workflow.started',
      workflowId: this.config.workflowId,
      timestamp: startedAt,
      totalNodes: graph.size,
      workflowName: parseResult.metadata.name,
    });

    // 5. Build dispatcher adapter shim (Scheduler.Dispatcher interface)
    const dispatcherShim: Dispatcher = {
      dispatch: async (node: GraphNode) => {
        this.eventBus.emit({
          type: 'task.started',
          taskId: node.id,
          workflowId: this.config.workflowId,
          timestamp: new Date().toISOString(),
          agentType: node.role,
        });

        const startMs = Date.now();
        const result = await this.adapter.run({
          nodeId: node.id,
          taskType: node.role,
          input: node.context,
          timeout: this.config.timeoutMs,
        });
        const durationMs = Date.now() - startMs;

        if (result.status === 'SUCCESS') {
          // Persist output for downstream context injection
          store.setNodeOutput(this.config.workflowId, node.id, result.output);
          store.updateNode(this.config.workflowId, {
            nodeId: node.id,
            taskType: node.role,
            state: 'SUCCESS',
            input: node.context,
            output: result.output,
            executedAt: new Date().toISOString(),
            duration: durationMs,
          });

          this.eventBus.emit({
            type: 'task.completed',
            taskId: node.id,
            workflowId: this.config.workflowId,
            timestamp: new Date().toISOString(),
            output: result.output,
            cost: result.cost,
            durationMs,
            confidence: result.confidence,
          });
        } else {
          store.updateNode(this.config.workflowId, {
            nodeId: node.id,
            taskType: node.role,
            state: 'FAILED',
            input: node.context,
            error: result.error,
            executedAt: new Date().toISOString(),
            duration: durationMs,
          });

          this.eventBus.emit({
            type: 'task.failed',
            taskId: node.id,
            workflowId: this.config.workflowId,
            timestamp: new Date().toISOString(),
            error: result.error ?? 'unknown',
            reason: result.status,
            retryCount: 0,
          });
        }

        return result;
      },
    };

    // 6. Run scheduler
    const schedulerConfig: Partial<SchedulerConfig> = {
      maxConcurrent: this.config.maxConcurrent,
      timeoutMs: this.config.timeoutMs,
      maxRetries: this.config.maxRetries,
      onFailure: this.config.onFailure,
    };

    const scheduler = new Scheduler(
      graph,
      dispatcherShim,
      schedulerConfig,
      this.governanceManager,
      undefined, // eventEmitter handled above via eventBus
      this.config.workflowId,
    );

    const schedulerResult = await scheduler.run();

    const completedAt = new Date().toISOString();

    // 7. Persist final workflow status
    store.updateWorkflowStatus(
      this.config.workflowId,
      schedulerResult.success ? 'SUCCESS' : 'FAILED',
    );
    await store.close();

    // 8. Emit workflow.completed
    this.eventBus.emit({
      type: 'workflow.completed',
      workflowId: this.config.workflowId,
      timestamp: completedAt,
      status: schedulerResult.success ? 'SUCCESS' : 'FAILED',
      totalCost: { tokens: 0, estimatedUSD: 0, provider: this.adapter.name() },
      durationMs: schedulerResult.duration,
      completedNodes: schedulerResult.completedNodes,
      failedNodes: schedulerResult.failedNodes,
    });

    return {
      ...schedulerResult,
      workflowId: this.config.workflowId,
      workflowName: parseResult.metadata.name,
      startedAt,
      completedAt,
    };
  }

  /** The EventBus for attaching external listeners */
  get events(): EventBus {
    return this.eventBus;
  }
}
