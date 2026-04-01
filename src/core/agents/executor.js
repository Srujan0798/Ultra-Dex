// Copyright (c) 2026 Ultra-Dex
// Executor - Task execution engine with retry and recovery

import { EventEmitter } from 'events';
import { BaseAgent } from './base-agent.js';

/**
 * Executor
 * Handles task execution with retry logic, error handling, and result tracking
 */
export class Executor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.tasks = new Map();
    this.results = new Map();
    this.config = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      executionTimeout: options.executionTimeout || 30000,
      maxConcurrentTasks: options.maxConcurrentTasks || 10,
      enableProfiling: options.enableProfiling || false,
      ...options
    };
    this.state = 'idle';
    this.activeTasks = new Map();
    this.executionQueue = [];
    this.metrics = {
      totalExecuted: 0,
      totalSucceeded: 0,
      totalFailed: 0,
      averageExecutionTime: 0,
      executionTimes: []
    };
  }

  /**
   * Initialize executor
   */
  async initialize() {
    this.state = 'ready';
    this.emit('executor.ready');
    return this;
  }

  /**
   * Execute a task
   */
  async execute(task, options = {}) {
    const executionId = this.generateId();
    const startTime = Date.now();

    this.emit('task.execution.started', { executionId, task });

    try {
      const result = await this.executeWithRetry(task, options);

      this.recordExecution(executionId, startTime, true, result);
      this.emit('task.execution.succeeded', { executionId, task, result });

      return result;
    } catch (error) {
      this.recordExecution(executionId, startTime, false, error);
      this.emit('task.execution.failed', { executionId, task, error });
      throw error;
    }
  }

  /**
   * Execute task with retry logic
   */
  async executeWithRetry(task, options = {}) {
    const maxRetries = options.maxRetries ?? this.config.maxRetries;
    const retryDelay = options.retryDelay ?? this.config.retryDelay;

    let lastError = null;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        this.emit('task.execution.attempt', { task, attempt: attempt + 1 });

        const result = await this.executeWithTimeout(
          task,
          options.executionTimeout || this.config.executionTimeout
        );

        if (attempt > 0) {
          this.emit('task.execution.retry-succeeded', { task, attempt: attempt + 1 });
        }

        return result;
      } catch (error) {
        lastError = error;
        attempt++;

        if (attempt <= maxRetries) {
          this.emit('task.execution.retry', {
            task,
            attempt,
            delay: retryDelay,
            error
          });

          await this.delay(retryDelay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Execute task with timeout
   */
  async executeWithTimeout(task, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task execution timeout after ${timeout}ms`));
      }, timeout);

      this.performExecution(task)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Perform actual task execution
   */
  async performExecution(task) {
    if (!task.handler && !task.agent) {
      throw new Error('Task must have either handler function or agent');
    }

    if (task.handler) {
      return await task.handler(task.data);
    }

    if (task.agent) {
      return await task.agent.execute(task);
    }

    throw new Error('Unable to execute task');
  }

  /**
   * Execute multiple tasks
   */
  async executeMultiple(tasks, options = {}) {
    const strategy = options.strategy || 'parallel';
    const results = [];

    if (strategy === 'sequential') {
      for (const task of tasks) {
        try {
          const result = await this.execute(task, options);
          results.push({ task, result, success: true });
        } catch (error) {
          results.push({ task, error, success: false });
        }
      }
    } else if (strategy === 'parallel') {
      const promises = tasks.map(task =>
        this.execute(task, options)
          .then(result => ({ task, result, success: true }))
          .catch(error => ({ task, error, success: false }))
      );

      await Promise.all(promises);
      results.push(...await Promise.all(promises));
    } else if (strategy === 'limited-concurrency') {
      const concurrency = options.concurrency || this.config.maxConcurrentTasks;
      for (let i = 0; i < tasks.length; i += concurrency) {
        const batch = tasks.slice(i, i + concurrency);
        const batchResults = await Promise.all(
          batch.map(task =>
            this.execute(task, options)
              .then(result => ({ task, result, success: true }))
              .catch(error => ({ task, error, success: false }))
          )
        );
        results.push(...batchResults);
      }
    } else {
      throw new Error(`Unknown execution strategy: ${strategy}`);
    }

    return results;
  }

  /**
   * Queue task for later execution
   */
  queueTask(task, options = {}) {
    const taskId = this.generateId();
    const queuedTask = {
      id: taskId,
      task,
      options,
      status: 'queued',
      queuedAt: Date.now(),
      priority: options.priority || 0
    };

    this.executionQueue.push(queuedTask);
    this.executionQueue.sort((a, b) => b.priority - a.priority);

    this.emit('task.queued', { taskId, task });
    this.processQueue();

    return taskId;
  }

  /**
   * Process task queue
   */
  async processQueue() {
    while (
      this.executionQueue.length > 0 &&
      this.activeTasks.size < this.config.maxConcurrentTasks
    ) {
      const queuedTask = this.executionQueue.shift();

      queuedTask.status = 'executing';
      this.activeTasks.set(queuedTask.id, queuedTask);

      this.execute(queuedTask.task, queuedTask.options)
        .then(result => {
          queuedTask.status = 'completed';
          queuedTask.result = result;
          this.activeTasks.delete(queuedTask.id);
          this.emit('queued-task.completed', { taskId: queuedTask.id, result });
        })
        .catch(error => {
          queuedTask.status = 'failed';
          queuedTask.error = error;
          this.activeTasks.delete(queuedTask.id);
          this.emit('queued-task.failed', { taskId: queuedTask.id, error });
        })
        .finally(() => {
          this.processQueue();
        });
    }
  }

  /**
   * Record execution metrics
   */
  recordExecution(executionId, startTime, success, result) {
    const duration = Date.now() - startTime;

    this.metrics.totalExecuted++;
    if (success) {
      this.metrics.totalSucceeded++;
    } else {
      this.metrics.totalFailed++;
    }

    this.metrics.executionTimes.push(duration);

    // Keep only last 1000 times
    if (this.metrics.executionTimes.length > 1000) {
      this.metrics.executionTimes.shift();
    }

    this.metrics.averageExecutionTime =
      this.metrics.executionTimes.reduce((a, b) => a + b, 0) /
      this.metrics.executionTimes.length;

    this.results.set(executionId, {
      success,
      duration,
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Get execution statistics
   */
  getStats() {
    return {
      ...this.metrics,
      activeTaskCount: this.activeTasks.size,
      queuedTaskCount: this.executionQueue.length,
      successRate: (this.metrics.totalSucceeded / this.metrics.totalExecuted) * 100
    };
  }

  /**
   * Cancel task execution
   */
  cancelTask(taskId) {
    if (this.activeTasks.has(taskId)) {
      const task = this.activeTasks.get(taskId);
      task.status = 'cancelled';
      this.activeTasks.delete(taskId);
      this.emit('task.cancelled', { taskId });
      return true;
    }

    const queueIndex = this.executionQueue.findIndex(t => t.id === taskId);
    if (queueIndex !== -1) {
      this.executionQueue.splice(queueIndex, 1);
      this.emit('queued-task.cancelled', { taskId });
      return true;
    }

    return false;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shutdown executor
   */
  async shutdown() {
    this.state = 'shutdown';
    this.emit('executor.shutdown', { activeTaskCount: this.activeTasks.size });
  }
}

export default Executor;
