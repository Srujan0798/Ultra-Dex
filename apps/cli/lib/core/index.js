// Copyright (c) 2026 Ultra-Dex

/**
 * Core module entry point
 * Exports the V2 execution orchestration stack.
 */

import { ExecutionEngine, createExecutionEngine } from './execution-engine.js';
import { Scheduler, createScheduler, TASK_STATUS, TASK_PRIORITY } from './scheduler.js';
import { CapabilityRouter, createCapabilityRouter } from './capability-router.js';

export { ExecutionEngine, createExecutionEngine };
export { Scheduler, createScheduler, TASK_STATUS, TASK_PRIORITY };
export { CapabilityRouter, createCapabilityRouter };

/**
 * Create a complete orchestration stack
 * @param {Object} options
 * @param {Object} options.provider - AI provider instance
 * @param {Object} options.agents - Available agent definitions
 * @returns {{ engine: ExecutionEngine, scheduler: Scheduler, router: CapabilityRouter }}
 */
export function createOrchestrationStack({ provider, agents }) {
  const router = createCapabilityRouter();
  const engine = createExecutionEngine({ provider, agents });
  const scheduler = createScheduler();

  return { engine, scheduler, router };
}

export default { createOrchestrationStack };
