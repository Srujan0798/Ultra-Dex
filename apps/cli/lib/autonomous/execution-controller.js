// Copyright (c) 2026 Ultra-Dex
// Execution Controller - Orchestrates task execution with swarm integration

import { EventEmitter } from 'events';
import SwarmOrchestrator from '../../../../src/core/agents/swarm-orchestrator.js';
import { createProvider } from '../providers/index.js';

/**
 * @typedef {Object} TaskResult
 * @property {string} taskId - Task identifier
 * @property {boolean} success - Whether task succeeded
 * @property {*} output - Task output/result
 * @property {string} [error] - Error message if failed
 * @property {number} duration - Execution time in ms
 * @property {number} retries - Number of retry attempts
 * @property {string} executor - Executor type (provider/agent/swarm)
 * @property {Object} [metadata] - Additional execution metadata
 */

/**
 * @typedef {Object} ExecutionResult
 * @property {boolean} success - Overall execution success
 * @property {TaskResult[]} results - Results per task
 * @property {Object} metrics - Execution metrics
 * @property {Date} startedAt - Execution start time
 * @property {Date} completedAt - Execution end time
 */

/**
 * Circuit Breaker states
 */
const CIRCUIT_STATES = {
  CLOSED: 'closed',    // Normal operation
  OPEN: 'open',        // Failing, reject requests
  HALF_OPEN: 'half_open' // Testing if recovered
};

/**
 * ExecutionController - Orchestrates task execution for autonomous loops
 * 
 * Features:
 * - Multiple execution modes (parallel, sequential, waterfall)
 * - SwarmOrchestrator integration for multi-agent execution
 * - Circuit breaker pattern for failure protection
 * - Dependency-aware scheduling
 * - Provider integration for AI-powered task execution
 * 
 * @extends EventEmitter
 * @example
 * const controller = new ExecutionController({ provider: 'claude' });
 * const results = await controller.execute(decomposedPlan, { mode: 'parallel' });
 */
export class ExecutionController extends EventEmitter {
  /**
   * Create a new ExecutionController
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.provider='claude'] - Default AI provider
   * @param {number} [options.maxRetries=2] - Max retries per task
   * @param {number} [options.timeout=60000] - Task timeout in ms
   * @param {number} [options.circuitThreshold=3] - Failures before circuit opens
   * @param {number} [options.circuitResetTime=30000] - Time before circuit resets
   * @param {boolean} [options.useSwarm=true] - Enable swarm orchestration
   */
  constructor(options = {}) {
    super();
    this.options = {
      provider: options.provider || 'claude',
      maxRetries: options.maxRetries ?? 2,
      timeout: options.timeout ?? 60000,
      circuitThreshold: options.circuitThreshold ?? 3,
      circuitResetTime: options.circuitResetTime ?? 30000,
      useSwarm: options.useSwarm ?? true,
      ...options
    };

    // Circuit breaker state
    this._circuitState = CIRCUIT_STATES.CLOSED;
    this._circuitFailures = 0;
    this._circuitLastFailure = null;
    this._circuitLock = Promise.resolve();
    
    // Execution tracking
    this._provider = null;
    this._swarm = null;
    this._executionId = 0;
    
    // Metrics
    this.metrics = {
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      totalRetries: 0,
      avgDuration: 0,
      circuitBreaks: 0
    };
  }

  /**
   * Initialize provider (lazy loading)
   * @private
   */
  async _getProvider() {
    if (!this._provider) {
      try {
        this._provider = createProvider(this.options.provider);
        this.emit('provider:initialized', { provider: this.options.provider });
      } catch (error) {
        this.emit('provider:error', { error: error.message });
        throw new Error(`Failed to initialize provider: ${error.message}`);
      }
    }
    return this._provider;
  }

  /**
   * Generate unique execution ID
   * @private
   */
  _generateExecutionId() {
    return `exec_${Date.now()}_${++this._executionId}`;
  }

  /**
   * Atomic state transition method
   * @private
   */
  _transitionCircuit(expectedState, newState, updateFn) {
    if (this._circuitState !== expectedState) return false;
    this._circuitState = newState;
    if (updateFn) updateFn();
    return true;
  }

  /**
   * Wrap operation with circuit lock
   * @private
   */
  async _withCircuitLock(fn) {
    const lock = this._circuitLock;
    this._circuitLock = lock.then(fn).catch(fn);
    return this._circuitLock;
  }

  /**
   * Check circuit breaker state
   * @private
   * @returns {Promise<boolean>} True if requests should proceed
   */
  async _checkCircuit() {
    return this._withCircuitLock(() => {
      if (this._circuitState === CIRCUIT_STATES.CLOSED) {
        return true;
      }

      if (this._circuitState === CIRCUIT_STATES.OPEN) {
        // Check if reset time has passed
        const elapsed = Date.now() - this._circuitLastFailure;
        if (elapsed >= this.options.circuitResetTime) {
          const transitioned = this._transitionCircuit(
            CIRCUIT_STATES.OPEN, 
            CIRCUIT_STATES.HALF_OPEN,
            () => this.emit('circuit:half_open')
          );
          return transitioned;
        }
        return false;
      }

      // HALF_OPEN - allow single request through
      return true;
    });
  }

  /**
   * Record circuit success
   * @private
   */
  async _recordCircuitSuccess() {
    return this._withCircuitLock(() => {
      if (this._circuitState === CIRCUIT_STATES.HALF_OPEN) {
        this._transitionCircuit(
          CIRCUIT_STATES.HALF_OPEN,
          CIRCUIT_STATES.CLOSED,
          () => {
            this._circuitFailures = 0;
            this.emit('circuit:closed');
          }
        );
      }
    });
  }

  /**
   * Record circuit failure
   * @private
   */
  async _recordCircuitFailure() {
    return this._withCircuitLock(() => {
      this._circuitFailures++;
      this._circuitLastFailure = Date.now();

      if (this._circuitState === CIRCUIT_STATES.HALF_OPEN) {
        this._transitionCircuit(
          CIRCUIT_STATES.HALF_OPEN,
          CIRCUIT_STATES.OPEN,
          () => {
            this.metrics.circuitBreaks++;
            this.emit('circuit:open', { failures: this._circuitFailures });
          }
        );
      } else if (this._circuitFailures >= this.options.circuitThreshold) {
        this._transitionCircuit(
          CIRCUIT_STATES.CLOSED,
          CIRCUIT_STATES.OPEN,
          () => {
            this.metrics.circuitBreaks++;
            this.emit('circuit:open', { failures: this._circuitFailures });
          }
        );
      }
    });
  }

  /**
   * Execute a single task with retry logic
   * @private
   * @param {Object} task - Task to execute
   * @param {Object} context - Execution context
   * @returns {Promise<TaskResult>} Task result
   */
  async _executeTask(task, context = {}) {
    const startTime = Date.now();
    let lastError = null;
    let retries = 0;

    this.emit('task:start', { taskId: task.id, description: task.description });

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      // Check circuit breaker
      if (!(await this._checkCircuit())) {
        return {
          taskId: task.id,
          success: false,
          output: null,
          error: 'Circuit breaker open - too many failures',
          duration: Date.now() - startTime,
          retries,
          executor: 'circuit_breaker'
        };
      }

      try {
        if (attempt > 0) {
          retries++;
          this.metrics.totalRetries++;
          this.emit('task:retry', { taskId: task.id, attempt });
          // Exponential backoff
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        }

        // Execute with timeout
        const result = await Promise.race([
          this._runTaskExecution(task, context),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Task timeout')), this.options.timeout)
          )
        ]);

        await this._recordCircuitSuccess();
        
        const duration = Date.now() - startTime;
        this._updateMetrics(true, duration);

        const taskResult = {
          taskId: task.id,
          success: true,
          output: result,
          duration,
          retries,
          executor: context.executor || 'provider',
          metadata: { attempt: attempt + 1 }
        };

        this.emit('task:complete', taskResult);
        return taskResult;

      } catch (error) {
        lastError = error;
        await this._recordCircuitFailure();
      }
    }

    // All retries exhausted
    const duration = Date.now() - startTime;
    this._updateMetrics(false, duration);

    const failResult = {
      taskId: task.id,
      success: false,
      output: null,
      error: lastError?.message || 'Unknown error',
      duration,
      retries,
      executor: context.executor || 'provider',
      metadata: { attempts: this.options.maxRetries + 1 }
    };

    this.emit('task:error', failResult);
    return failResult;
  }

  /**
   * Run actual task execution logic
   * @private
   */
  async _runTaskExecution(task, context) {
    const provider = await this._getProvider();

    // Build execution prompt from task
    const prompt = this._buildExecutionPrompt(task, context);

    const response = await provider.generate({
      systemPrompt: 'You are an expert code executor. Complete the task and return the result.',
      userPrompt: prompt,
      options: {
        temperature: 0.2,
        maxTokens: 2000
      }
    });

    return typeof response === 'string' 
      ? response 
      : response?.content || response?.text || response;
  }

  /**
   * Build execution prompt for task
   * @private
   */
  _buildExecutionPrompt(task, context) {
    let prompt = `TASK: ${task.description}\n`;
    
    if (task.metadata?.rationale) {
      prompt += `\nRATIONALE: ${task.metadata.rationale}\n`;
    }
    
    if (context.previousResults?.length > 0) {
      const relevant = context.previousResults
        .filter(r => task.dependencies?.includes(r.taskId))
        .slice(0, 3);
      
      if (relevant.length > 0) {
        prompt += `\nPREVIOUS RESULTS:\n`;
        relevant.forEach(r => {
          prompt += `- ${r.taskId}: ${typeof r.output === 'string' ? r.output.slice(0, 200) : 'completed'}\n`;
        });
      }
    }

    prompt += `\nComplete this task. Respond with the result only.`;
    return prompt;
  }

  /**
   * Update execution metrics
   * @private
   */
  _updateMetrics(success, duration) {
    this.metrics.totalTasks++;
    if (success) {
      this.metrics.successfulTasks++;
    } else {
      this.metrics.failedTasks++;
    }
    
    // Running average
    this.metrics.avgDuration = 
      (this.metrics.avgDuration * (this.metrics.totalTasks - 1) + duration) / 
      this.metrics.totalTasks;
  }

  /**
   * Execute tasks in parallel mode
   * @private
   */
  async _executeParallel(tasks, context) {
    const promises = tasks.map(task => this._executeTask(task, context));
    return Promise.all(promises);
  }

  /**
   * Execute tasks in sequential mode
   * @private
   */
  async _executeSequential(tasks, context) {
    const results = [];
    const ctx = { ...context, previousResults: [] };

    for (const task of tasks) {
      const result = await this._executeTask(task, ctx);
      results.push(result);
      ctx.previousResults.push(result);

      // Stop on failure if configured
      if (!result.success && this.options.stopOnError) {
        break;
      }
    }

    return results;
  }

  /**
   * Execute tasks respecting dependencies
   * @private
   */
  async _executeDependencyAware(decomposition, context) {
    const results = [];
    const completed = new Set();
    const ctx = { ...context, previousResults: [] };

    for (const batch of decomposition.batches) {
      this.emit('batch:start', { 
        batchIndex: batch.batchIndex, 
        taskCount: batch.tasks.length 
      });

      // Execute batch in parallel
      const batchResults = await Promise.all(
        batch.tasks.map(task => this._executeTask(task, ctx))
      );

      // Record completions
      for (const result of batchResults) {
        results.push(result);
        ctx.previousResults.push(result);
        if (result.success) {
          completed.add(result.taskId);
        }
      }

      this.emit('batch:complete', { 
        batchIndex: batch.batchIndex, 
        results: batchResults 
      });
    }

    return results;
  }

  /**
   * Execute tasks using SwarmOrchestrator
   * @private
   */
  async _executeWithSwarm(tasks, context, mode) {
    if (!this._swarm) {
      this._swarm = new SwarmOrchestrator();
    }

    // Create task agents
    const agents = tasks.map(task => ({
      id: task.id,
      name: task.id,
      execute: async () => this._executeTask(task, context)
    }));

    this._swarm.agents = agents;

    // Execute based on mode
    let swarmResults;
    switch (mode) {
      case 'sequential':
        swarmResults = await this._swarm.runSequential({ context });
        break;
      case 'waterfall':
        swarmResults = await this._swarm.runWaterfall({ context });
        break;
      default:
        swarmResults = await this._swarm.runParallel({ context });
    }

    // Extract results from swarm output
    return swarmResults.map(r => r.result || r);
  }

  /**
   * Execute decomposed plan
   * 
   * @param {Object} decomposition - Decomposition result from TaskDecomposer
   * @param {Object} [options={}] - Execution options
   * @param {string} [options.mode='dependency'] - Execution mode
   * @param {Object} [options.context={}] - Additional context
   * @returns {Promise<ExecutionResult>} Execution result
   * 
   * @example
   * const result = await controller.execute(decomposition, { mode: 'parallel' });
   */
  async execute(decomposition, options = {}) {
    const { 
      mode = 'dependency', 
      context = {},
      useSwarm = this.options.useSwarm 
    } = options;

    const executionId = this._generateExecutionId();
    const startedAt = new Date();

    this.emit('execution:start', { 
      executionId, 
      mode, 
      taskCount: decomposition.orderedTasks?.length || 0 
    });

    let results;
    const tasks = decomposition.orderedTasks || decomposition.tasks || [];

    try {
      if (useSwarm && this.options.useSwarm) {
        results = await this._executeWithSwarm(tasks, context, mode);
      } else {
        switch (mode) {
          case 'parallel':
            results = await this._executeParallel(tasks, context);
            break;
          case 'sequential':
            results = await this._executeSequential(tasks, context);
            break;
          case 'dependency':
          default:
            if (decomposition.batches) {
              results = await this._executeDependencyAware(decomposition, context);
            } else {
              results = await this._executeSequential(tasks, context);
            }
        }
      }
    } catch (error) {
      this.emit('execution:error', { executionId, error: error.message });
      throw error;
    }

    const completedAt = new Date();
    const successCount = results.filter(r => r.success).length;
    const success = successCount === results.length;

    const executionResult = {
      executionId,
      success,
      results,
      metrics: {
        totalTasks: results.length,
        successful: successCount,
        failed: results.length - successCount,
        totalDuration: completedAt - startedAt,
        avgTaskDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length
      },
      startedAt,
      completedAt
    };

    this.emit('execution:complete', executionResult);
    return executionResult;
  }

  /**
   * Execute a single task directly
   * 
   * @param {Object} task - Task to execute
   * @param {Object} [context={}] - Execution context
   * @returns {Promise<TaskResult>} Task result
   */
  async executeOne(task, context = {}) {
    return this._executeTask(task, context);
  }

  /**
   * Get circuit breaker state
   * @returns {string} Current circuit state
   */
  getCircuitState() {
    return this._circuitState;
  }

  /**
   * Reset circuit breaker
   */
  resetCircuit() {
    this._circuitState = CIRCUIT_STATES.CLOSED;
    this._circuitFailures = 0;
    this._circuitLastFailure = null;
    this.emit('circuit:reset');
  }

  /**
   * Get execution metrics
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return { 
      ...this.metrics,
      circuitState: this._circuitState,
      circuitFailures: this._circuitFailures
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      totalRetries: 0,
      avgDuration: 0,
      circuitBreaks: 0
    };
  }
}

export default ExecutionController;

