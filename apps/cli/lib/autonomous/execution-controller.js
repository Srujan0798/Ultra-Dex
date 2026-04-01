/**
 * Execution Controller
 * Orchestrates task execution with provider integration
 * @module autonomous/execution-controller
 */

import { EventEmitter } from 'events';

/**
 * Execution Controller for running decomposed tasks
 * @extends EventEmitter
 */
export class ExecutionController extends EventEmitter {
  /**
   * @param {object} options - Controller options
   * @param {object} options.provider - AI provider instance
   * @param {object} options.swarm - SwarmOrchestrator instance (optional)
   * @param {number} options.maxConcurrency - Max parallel tasks (default: 5)
   * @param {number} options.taskTimeout - Task timeout in ms (default: 60000)
   */
  constructor(options = {}) {
    super();
    this.provider = options.provider || null;
    this.swarm = options.swarm || null;
    this.maxConcurrency = options.maxConcurrency || 5;
    this.taskTimeout = options.taskTimeout || 60000;
    this.metrics = this.initMetrics();
    this.circuitBreaker = {
      failures: 0,
      threshold: 3,
      resetTimeout: 30000,
      lastFailure: null,
      isOpen: false
    };
  }

  /**
   * Initialize execution metrics
   * @returns {object}
   */
  initMetrics() {
    return {
      startTime: null,
      endTime: null,
      totalTasks: 0,
      completed: 0,
      failed: 0,
      retried: 0,
      avgTaskTime: 0,
      taskTimes: []
    };
  }

  /**
   * Execute all batches from decomposed plan
   * @param {object} decomposedPlan - Output from TaskDecomposer
   * @param {string} mode - Execution mode: 'parallel', 'sequential', 'waterfall'
   * @returns {Promise<object>} Execution results
   */
  async execute(decomposedPlan, mode = 'parallel') {
    this.metrics = this.initMetrics();
    this.metrics.startTime = Date.now();
    this.metrics.totalTasks = decomposedPlan.orderedTasks.length;

    this.emit('execution:start', { 
      planId: decomposedPlan.planId,
      totalTasks: this.metrics.totalTasks,
      mode 
    });

    const results = [];

    try {
      for (const batch of decomposedPlan.batches) {
        this.emit('batch:start', { batchId: batch.id, taskCount: batch.tasks.length });

        let batchResults;
        if (mode === 'sequential' || !batch.canParallelize) {
          batchResults = await this.executeSequential(batch.tasks);
        } else {
          batchResults = await this.executeParallel(batch.tasks);
        }

        results.push(...batchResults);
        this.emit('batch:complete', { batchId: batch.id, results: batchResults });

        // Check circuit breaker
        if (this.circuitBreaker.isOpen) {
          this.emit('execution:circuit-open', { failures: this.circuitBreaker.failures });
          break;
        }
      }
    } catch (error) {
      this.emit('execution:error', error);
    }

    this.metrics.endTime = Date.now();
    this.metrics.avgTaskTime = this.metrics.taskTimes.length > 0
      ? this.metrics.taskTimes.reduce((a, b) => a + b, 0) / this.metrics.taskTimes.length
      : 0;

    const summary = {
      planId: decomposedPlan.planId,
      status: this.metrics.failed === 0 ? 'success' : 'partial',
      results,
      metrics: { ...this.metrics },
      duration: this.metrics.endTime - this.metrics.startTime
    };

    this.emit('execution:complete', summary);
    return summary;
  }

  /**
   * Execute tasks in parallel with concurrency limit
   * @param {Array} tasks - Tasks to execute
   * @returns {Promise<Array>} Task results
   */
  async executeParallel(tasks) {
    const results = [];
    const chunks = this.chunkArray(tasks, this.maxConcurrency);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(task => this.executeTask(task))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Execute tasks sequentially
   * @param {Array} tasks - Tasks to execute
   * @returns {Promise<Array>} Task results
   */
  async executeSequential(tasks) {
    const results = [];

    for (const task of tasks) {
      const result = await this.executeTask(task);
      results.push(result);

      if (!result.success && task.critical) {
        break; // Stop on critical task failure
      }
    }

    return results;
  }

  /**
   * Execute a single task
   * @param {object} task - Task to execute
   * @returns {Promise<object>} Task result
   */
  async executeTask(task) {
    const startTime = Date.now();
    this.emit('task:start', { taskId: task.id, description: task.description });

    // Check circuit breaker
    if (this.circuitBreaker.isOpen) {
      return {
        taskId: task.id,
        success: false,
        error: 'Circuit breaker open',
        skipped: true
      };
    }

    try {
      const result = await this.withTimeout(
        this.runTask(task),
        this.taskTimeout
      );

      const duration = Date.now() - startTime;
      this.metrics.taskTimes.push(duration);
      this.metrics.completed++;
      this.resetCircuitBreaker();

      this.emit('task:complete', { taskId: task.id, duration, result });

      return {
        taskId: task.id,
        success: true,
        result,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.failed++;
      this.recordFailure();

      this.emit('task:error', { taskId: task.id, error: error.message, duration });

      return {
        taskId: task.id,
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Run task with provider
   * @param {object} task - Task to run
   * @returns {Promise<any>} Task output
   */
  async runTask(task) {
    if (!this.provider) {
      // Mock execution for testing
      await this.delay(100);
      return { mock: true, taskId: task.id, status: 'completed' };
    }

    const prompt = `Execute the following task and return the result:

Task ID: ${task.id}
Description: ${task.description}
Type: ${task.type || 'general'}

Provide a structured response with:
1. Status (success/failure)
2. Output or result
3. Any errors or warnings`;

    if (typeof this.provider.complete === 'function') {
      return await this.provider.complete(prompt);
    } else if (typeof this.provider.chat === 'function') {
      const response = await this.provider.chat([{ role: 'user', content: prompt }]);
      return response.content || response;
    }

    throw new Error('No compatible provider method');
  }

  /**
   * Wrap promise with timeout
   * @param {Promise} promise - Promise to wrap
   * @param {number} ms - Timeout in ms
   * @returns {Promise}
   */
  withTimeout(promise, ms) {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Task timeout')), ms);
    });
    return Promise.race([promise, timeout]);
  }

  /**
   * Record failure for circuit breaker
   */
  recordFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.isOpen = true;
      
      // Auto-reset after timeout
      setTimeout(() => {
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.failures = 0;
      }, this.circuitBreaker.resetTimeout);
    }
  }

  /**
   * Reset circuit breaker on success
   */
  resetCircuitBreaker() {
    this.circuitBreaker.failures = 0;
  }

  /**
   * Split array into chunks
   * @param {Array} arr - Array to chunk
   * @param {number} size - Chunk size
   * @returns {Array<Array>}
   */
  chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get execution metrics
   * @returns {object}
   */
  getMetrics() {
    return { ...this.metrics };
  }
}

export default ExecutionController;
