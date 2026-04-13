/**
 * DexGraph Worker
 *
 * A stateless execution unit that wraps an ExecutionAdapter.
 * Workers accept a single task, execute it via their adapter, and report results.
 * Workers have no memory of previous tasks — all state lives in WorkflowStore.
 *
 * Ultra-Dex principle: workers are fungible; any worker can run any task.
 */

import type { ExecutionAdapter, ExecutionContext, ExecutionResult } from '../../adapters/executionAdapter.js';

// ──────────────────────────────────────────────────────────────────────────────
// Worker lifecycle
// ──────────────────────────────────────────────────────────────────────────────

export type WorkerStatus = 'idle' | 'running' | 'error';

export interface WorkerStats {
  workerId: string;
  adapterName: string;
  status: WorkerStatus;
  completedTasks: number;
  failedTasks: number;
  totalDurationMs: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Worker
// ──────────────────────────────────────────────────────────────────────────────

export class Worker {
  private status: WorkerStatus = 'idle';
  private completedTasks = 0;
  private failedTasks = 0;
  private totalDurationMs = 0;
  private currentTaskId?: string;

  constructor(
    public readonly workerId: string,
    private readonly adapter: ExecutionAdapter,
  ) {}

  /**
   * Execute a single task context.
   * Worker is stateless — it does not track workflow state.
   * @throws if the worker is already running a task
   */
  async run(context: ExecutionContext): Promise<ExecutionResult> {
    if (this.status === 'running') {
      throw new Error(`Worker ${this.workerId} is already running task ${this.currentTaskId}`);
    }

    this.status = 'running';
    this.currentTaskId = context.nodeId;
    const startMs = Date.now();

    try {
      const result = await this.adapter.run(context);
      this.totalDurationMs += Date.now() - startMs;

      if (result.status === 'SUCCESS') {
        this.completedTasks++;
      } else {
        this.failedTasks++;
      }

      this.status = 'idle';
      this.currentTaskId = undefined;
      return result;
    } catch (error) {
      this.failedTasks++;
      this.totalDurationMs += Date.now() - startMs;
      this.status = 'error';
      this.currentTaskId = undefined;

      // Reset to idle so worker can be reused
      this.status = 'idle';

      // Re-throw as a FAILED result (don't propagate raw errors out of worker)
      return {
        status: 'FAILED',
        logs: [`Worker ${this.workerId} error: ${(error as Error).message}`],
        error: (error as Error).message,
        cost: { tokens: 0, estimatedUSD: 0, provider: this.adapter.name() },
        confidence: 0,
        duration: Date.now() - startMs,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Cancel the currently running task.
   */
  async cancel(): Promise<void> {
    if (this.currentTaskId) {
      await this.adapter.cancel(this.currentTaskId);
      this.status = 'idle';
      this.currentTaskId = undefined;
    }
  }

  /** Whether the worker is available to accept a new task */
  get isIdle(): boolean {
    return this.status === 'idle';
  }

  /** Current status */
  get currentStatus(): WorkerStatus {
    return this.status;
  }

  /** Statistics for monitoring */
  getStats(): WorkerStats {
    return {
      workerId: this.workerId,
      adapterName: this.adapter.name(),
      status: this.status,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      totalDurationMs: this.totalDurationMs,
    };
  }

  /** Adapter name (for identification in logs) */
  get adapterName(): string {
    return this.adapter.name();
  }
}

/**
 * Create a pool of workers from a set of adapters.
 * Workers are numbered 0..n.
 */
export function createWorkerPool(adapters: ExecutionAdapter[]): Worker[] {
  return adapters.map((adapter, i) => new Worker(`worker-${i}`, adapter));
}
