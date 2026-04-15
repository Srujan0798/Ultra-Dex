/**
 * DexGraph Logger
 *
 * Structured logger for all DexGraph subsystem operations.
 * Wraps the platform's BetterStackLogger for workflow-scoped observability.
 * Falls back to stderr in environments where the platform logger isn't available.
 *
 * Usage:
 *   const log = createDexLogger({ workflowId: 'wf-123', component: 'Scheduler' });
 *   log.info('node.dispatched', { nodeId: 'build', role: 'engineer' });
 *   log.error('node.failed', new Error('timeout'), { nodeId: 'build' });
 */

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────-

export interface DexLogContext {
  workflowId?: string;
  workflowName?: string;
  component: string;
}

export interface DexLogger {
  info(event: string, meta?: Record<string, unknown>): void;
  warn(event: string, meta?: Record<string, unknown>): void;
  error(event: string, err: unknown, meta?: Record<string, unknown>): void;
  debug(event: string, meta?: Record<string, unknown>): void;
  child(extra: Record<string, unknown>): DexLogger;
}

// ──────────────────────────────────────────────────────────────────────────────
// Implementation
// ──────────────────────────────────────────────────────────────────────────────

class DexLoggerImpl implements DexLogger {
  constructor(
    private readonly base: DexLogContext,
    private readonly extra: Record<string, unknown> = {},
  ) {}

  private buildMeta(meta?: Record<string, unknown>): Record<string, unknown> {
    return {
      service: 'dexgraph',
      component: this.base.component,
      ...(this.base.workflowId ? { workflowId: this.base.workflowId } : {}),
      ...(this.base.workflowName ? { workflowName: this.base.workflowName } : {}),
      ...this.extra,
      ...meta,
    };
  }

  info(event: string, meta?: Record<string, unknown>): void {
    const m = this.buildMeta(meta);
    if (process.env.NODE_ENV !== 'test') {
      process.stderr.write(`[${new Date().toISOString()}] INFO  [${this.base.component}] ${event} ${JSON.stringify(m)}\n`);
    }
  }

  warn(event: string, meta?: Record<string, unknown>): void {
    const m = this.buildMeta(meta);
    process.stderr.write(`[${new Date().toISOString()}] WARN  [${this.base.component}] ${event} ${JSON.stringify(m)}\n`);
  }

  error(event: string, err: unknown, meta?: Record<string, unknown>): void {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    const m = this.buildMeta({ ...meta, error: errMsg, ...(errStack ? { stack: errStack } : {}) });
    process.stderr.write(`[${new Date().toISOString()}] ERROR [${this.base.component}] ${event} ${JSON.stringify(m)}\n`);
  }

  debug(event: string, meta?: Record<string, unknown>): void {
    if (process.env.DEXGRAPH_DEBUG !== '1') return;
    const m = this.buildMeta(meta);
    process.stderr.write(`[${new Date().toISOString()}] DEBUG [${this.base.component}] ${event} ${JSON.stringify(m)}\n`);
  }

  child(extra: Record<string, unknown>): DexLogger {
    return new DexLoggerImpl(this.base, { ...this.extra, ...extra });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Factory
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Create a scoped DexLogger for a given component + workflow.
 *
 * @example
 * const log = createDexLogger({ component: 'Scheduler', workflowId });
 * log.info('scheduler.start', { totalNodes: 5 });
 * log.error('node.failed', err, { nodeId: 'build' });
 */
export function createDexLogger(ctx: DexLogContext): DexLogger {
  return new DexLoggerImpl(ctx);
}

/** No-op logger for contexts where logging is intentionally suppressed (tests) */
export const nullLogger: DexLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  child: () => nullLogger,
};
