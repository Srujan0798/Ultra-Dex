// Copyright (c) 2026 Ultra-Dex

/**
 * Core Scheduler
 * Manages task scheduling, prioritization, and execution ordering.
 * Handles sequential, parallel, and dependency-based task execution.
 */

import { logger } from '../utils/logger.js';

/**
 * Task status constants
 */
export const TASK_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  BLOCKED: 'blocked',
};

/**
 * Task priority levels
 */
export const TASK_PRIORITY = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
  BACKGROUND: 4,
};

/**
 * Task definition
 * @typedef {Object} Task
 * @property {string} id - Unique task identifier
 * @property {string} agent - Agent name to execute the task
 * @property {string} task - Task description
 * @property {string} status - Current task status
 * @property {number} priority - Task priority (lower = higher priority)
 * @property {string[]} [dependencies] - Task IDs that must complete first
 * @property {Object} [options] - Task-specific options
 * @property {any} [result] - Task result after completion
 * @property {string} [error] - Error message if failed
 */

export class Scheduler {
  /**
   * Create a new scheduler
   * @param {Object} [options]
   * @param {number} [options.maxConcurrency=3] - Maximum concurrent tasks
   * @param {boolean} [options.failFast=false] - Stop on first failure
   */
  constructor(options = {}) {
    this.maxConcurrency = options.maxConcurrency ?? 3;
    this.failFast = options.failFast ?? false;
    /** @type {Map<string, Task>} */
    this.tasks = new Map();
    /** @type {Set<string>} */
    this.completed = new Set();
    /** @type {Set<string>} */
    this.failed = new Set();
    this._running = 0;
    this._abortController = new AbortController();
  }

  /**
   * Add a task to the scheduler
   * @param {Omit<Task, 'status'>} taskDef
   * @returns {string} Task ID
   */
  addTask(taskDef) {
    const id = taskDef.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const task = {
      ...taskDef,
      id,
      status: TASK_STATUS.PENDING,
      priority: taskDef.priority ?? TASK_PRIORITY.NORMAL,
      dependencies: taskDef.dependencies ?? [],
    };
    this.tasks.set(id, task);
    logger.debug(`Task added: ${id}`, { agent: taskDef.agent, priority: task.priority });
    return id;
  }

  /**
   * Add multiple tasks
   * @param {Omit<Task, 'status'>[]} taskDefs
   * @returns {string[]} Task IDs
   */
  addTasks(taskDefs) {
    return taskDefs.map((def) => this.addTask(def));
  }

  /**
   * Execute all scheduled tasks
   * @param {Function} executor - Function to execute a single task
   * @returns {Promise<Map<string, any>>} Map of task ID to result
   */
  async executeAll(executor) {
    this._abortController = new AbortController();
    const results = new Map();

    // Resolve dependencies and order tasks
    const executionOrder = this._resolveDependencies();

    logger.info(`Starting execution of ${executionOrder.length} tasks`, {
      maxConcurrency: this.maxConcurrency,
      failFast: this.failFast,
    });

    // Execute in batches based on concurrency limit
    for (let i = 0; i < executionOrder.length; i += this.maxConcurrency) {
      if (this._abortController.signal.aborted) {
        logger.warn('Execution aborted');
        break;
      }

      const batch = executionOrder.slice(i, i + this.maxConcurrency);
      const batchResults = await Promise.allSettled(
        batch.map((taskId) => this._executeTask(taskId, executor, results))
      );

      // Check for failures if failFast is enabled
      if (this.failFast) {
        const firstFailure = batchResults.find((r) => r.status === 'rejected');
        if (firstFailure) {
          logger.error('Fail-fast triggered: aborting remaining tasks');
          this._abortController.abort();
          break;
        }
      }
    }

    return results;
  }

  /**
   * Cancel a specific task
   * @param {string} taskId
   */
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = TASK_STATUS.CANCELLED;
      logger.info(`Task cancelled: ${taskId}`);
    }
  }

  /**
   * Get task status summary
   * @returns {Object}
   */
  getStatus() {
    const summary = {
      total: this.tasks.size,
      pending: 0,
      running: 0,
      completed: this.completed.size,
      failed: this.failed.size,
      cancelled: 0,
      blocked: 0,
    };

    for (const task of this.tasks.values()) {
      switch (task.status) {
        case TASK_STATUS.PENDING:
          summary.pending++;
          break;
        case TASK_STATUS.RUNNING:
          summary.running++;
          break;
        case TASK_STATUS.CANCELLED:
          summary.cancelled++;
          break;
        case TASK_STATUS.BLOCKED:
          summary.blocked++;
          break;
      }
    }

    return summary;
  }

  /**
   * Resolve task dependencies and return execution order
   * @private
   * @returns {string[]}
   */
  _resolveDependencies() {
    const visited = new Set();
    const order = [];
    const blocked = new Set();

    const visit = (taskId) => {
      if (visited.has(taskId)) return;
      if (blocked.has(taskId)) return;

      const task = this.tasks.get(taskId);
      if (!task) return;

      // Check dependencies
      for (const depId of task.dependencies) {
        if (!this.tasks.has(depId)) {
          logger.warn(`Task ${taskId} depends on unknown task ${depId}`);
          task.status = TASK_STATUS.BLOCKED;
          blocked.add(taskId);
          return;
        }

        if (this.failed.has(depId)) {
          task.status = TASK_STATUS.BLOCKED;
          blocked.add(taskId);
          return;
        }

        visit(depId);
      }

      visited.add(taskId);
      order.push(taskId);
    };

    // Sort by priority first, then visit
    const sorted = [...this.tasks.entries()].sort(
      ([, a], [, b]) => (a.priority ?? TASK_PRIORITY.NORMAL) - (b.priority ?? TASK_PRIORITY.NORMAL)
    );

    for (const [id] of sorted) {
      visit(id);
    }

    return order;
  }

  /**
   * Execute a single task
   * @private
   */
  async _executeTask(taskId, executor, results) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Check dependencies are met
    for (const depId of task.dependencies) {
      if (!this.completed.has(depId)) {
        task.status = TASK_STATUS.BLOCKED;
        logger.warn(`Task ${taskId} blocked: dependency ${depId} not completed`);
        return;
      }
    }

    task.status = TASK_STATUS.RUNNING;
    this._running++;

    try {
      const result = await executor(task);
      task.status = TASK_STATUS.COMPLETED;
      task.result = result;
      this.completed.add(taskId);
      results.set(taskId, result);
      logger.debug(`Task completed: ${taskId}`);
    } catch (error) {
      task.status = TASK_STATUS.FAILED;
      task.error = error.message;
      this.failed.add(taskId);
      logger.error(`Task failed: ${taskId} - ${error.message}`);
      throw error;
    } finally {
      this._running--;
    }
  }
}

/**
 * Create a new scheduler instance
 * @param {Object} [options]
 * @returns {Scheduler}
 */
export function createScheduler(options = {}) {
  return new Scheduler(options);
}

export default { Scheduler, createScheduler, TASK_STATUS, TASK_PRIORITY };
