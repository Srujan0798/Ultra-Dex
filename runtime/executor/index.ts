/**
 * DexGraph Executor
 *
 * Routes execution requests from the Scheduler to the correct Worker.
 * Maintains a pool of workers; balances load across them.
 * The Executor is the bridge between the control plane and execution workers.
 */

import type { ExecutionAdapter, ExecutionContext, ExecutionResult } from '../../adapters/executionAdapter.js';

// ──────────────────────────────────────────────────────────────────────────────
// Worker slot (wraps an adapter instance for pool management)
// ──────────────────────────────────────────────────────────────────────────────

interface WorkerSlot {
  id: string;
  adapter: ExecutionAdapter;
  busy: boolean;
  taskCount: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Executor
// ──────────────────────────────────────────────────────────────────────────────

export interface ExecutorConfig {
  /** Maximum workers in pool (default 4) */
  poolSize?: number;
  /** Global task timeout in ms */
  timeoutMs?: number;
}

export class Executor {
  private pool: WorkerSlot[] = [];
  private config: Required<ExecutorConfig>;
  private taskCount = 0;

  constructor(adapters: ExecutionAdapter[], config?: ExecutorConfig) {
    this.config = {
      poolSize: config?.poolSize ?? adapters.length,
      timeoutMs: config?.timeoutMs ?? 300_000,
    };

    for (const adapter of adapters) {
      this.pool.push({
        id: `worker-${this.pool.length}`,
        adapter,
        busy: false,
        taskCount: 0,
      });
    }
  }

  /**
   * Execute a task on the least-busy available worker.
   * Blocks until a worker is available if pool is saturated.
   */
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const worker = await this.acquireWorker();
    this.taskCount++;

    try {
      return await Promise.race([
        worker.adapter.run(context),
        new Promise<ExecutionResult>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Executor timeout after ${this.config.timeoutMs}ms`)),
            this.config.timeoutMs,
          ),
        ),
      ]);
    } finally {
      worker.busy = false;
    }
  }

  /**
   * Cancel a running task by nodeId across all workers.
   */
  async cancel(nodeId: string): Promise<void> {
    await Promise.all(this.pool.map(w => w.adapter.cancel(nodeId)));
  }

  /**
   * Get status of a node execution across all workers.
   */
  async status(nodeId: string): Promise<{ running: boolean; progress?: number }> {
    for (const w of this.pool) {
      const s = await w.adapter.status(nodeId);
      if (s.running) return s;
    }
    return { running: false };
  }

  /** Total tasks dispatched since construction */
  get totalTaskCount(): number {
    return this.taskCount;
  }

  /** Number of workers currently busy */
  get activeTasks(): number {
    return this.pool.filter(w => w.busy).length;
  }

  /** Number of available (idle) workers */
  get availableWorkers(): number {
    return this.pool.filter(w => !w.busy).length;
  }

  private async acquireWorker(): Promise<WorkerSlot> {
    // Spin until a worker is free
    while (true) {
      const free = this.pool.find(w => !w.busy);
      if (free) {
        free.busy = true;
        free.taskCount++;
        return free;
      }
      await new Promise(r => setTimeout(r, 10));
    }
  }
}
