// Copyright (c) 2026 Ultra-Dex
// Unified Autonomous Agent — Full loop integration

import { EventEmitter } from 'events';
import { PlanningEngine } from './planning-engine.js';
import { TaskDecomposer } from './task-decomposer.js';
import { ExecutionController } from './execution-controller.js';
import { ValidationLayer } from './validation-layer.js';
import { MemoryBridge } from './memory-bridge.js';
import { AutonomousPipeline } from './pipeline.js';

/**
 * @typedef {Object} AutonomousResult
 * @property {string} sessionId - Session identifier
 * @property {string} status - 'completed' | 'paused' | 'failed'
 * @property {Object} plan - Generated plan
 * @property {Object} execution - Execution results
 * @property {Object} validation - Validation results
 * @property {Array} learnings - Extracted learnings
 * @property {Object} metrics - Performance metrics
 */

/**
 * AutonomousAgent - Unified autonomous execution agent
 *
 * Orchestrates the full autonomous loop:
 * 1. Planning - AI-driven goal decomposition
 * 2. Decomposition - Dependency analysis and batching
 * 3. Execution - Task execution with retry/circuit breaker
 * 4. Validation - Output verification
 * 5. Memory - Context persistence
 *
 * @extends EventEmitter
 * @example
 * const agent = new AutonomousAgent({ provider: 'claude' });
 * const result = await agent.run('Implement user authentication');
 */
export class AutonomousAgent extends EventEmitter {
  /**
   * Create a new AutonomousAgent
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.provider='claude'] - AI provider
   * @param {string} [options.strictness='normal'] - Validation strictness
   * @param {boolean} [options.persistContext=true] - Enable context persistence
   * @param {string[]} [options.approvedGates=[]] - Pre-approved gates
   * @param {Object} [options.planningOptions] - PlanningEngine options
   * @param {Object} [options.executionOptions] - ExecutionController options
   */
  constructor(options = {}) {
    super();
    this.options = {
      provider: options.provider || 'claude',
      strictness: options.strictness || 'normal',
      persistContext: options.persistContext ?? true,
      approvedGates: options.approvedGates || [],
      ...options,
    };

    // Initialize components
    this.planner = new PlanningEngine({
      provider: this.options.provider,
      ...this.options.planningOptions,
    });

    this.decomposer = new TaskDecomposer();

    this.executor = new ExecutionController({
      provider: this.options.provider,
      ...this.options.executionOptions,
    });

    this.validator = new ValidationLayer({
      strictness: this.options.strictness,
      approvedGates: this.options.approvedGates,
    });

    this.memory = new MemoryBridge();

    // Legacy pipeline for backward compatibility
    this.pipeline = new AutonomousPipeline(options);

    // Current session state
    this._currentSession = null;
    this._isRunning = false;

    // Wire up events
    this._setupEventForwarding();
  }

  /**
   * Forward component events to agent level
   * @private
   */
  _setupEventForwarding() {
    // Planning events
    this.planner.on('planning:start', (data) => this.emit('phase:planning', data));
    this.planner.on('planning:complete', (data) => this.emit('plan:ready', data));
    this.planner.on('planning:error', (data) => this.emit('plan:error', data));

    // Execution events
    this.executor.on('task:start', (data) => this.emit('task:start', data));
    this.executor.on('task:complete', (data) => this.emit('task:complete', data));
    this.executor.on('task:error', (data) => this.emit('task:error', data));
    this.executor.on('batch:complete', (data) => this.emit('batch:complete', data));
    this.executor.on('circuit:open', (data) => this.emit('circuit:open', data));

    // Memory events
    this.memory.on('context:saved', (data) => this.emit('context:saved', data));
  }

  /**
   * Run the autonomous loop for a goal
   *
   * @param {string} goal - Goal to achieve
   * @param {Object} [options={}] - Run options
   * @param {Object} [options.context={}] - Additional context
   * @param {Array} [options.validation=[]] - Validation criteria
   * @param {string} [options.mode='dependency'] - Execution mode
   * @returns {Promise<AutonomousResult>} Execution result
   */
  async run(goal, options = {}) {
    if (this._isRunning) {
      throw new Error('Agent is already running. Use stop() first or create a new instance.');
    }

    this._isRunning = true;
    const startTime = Date.now();

    this.emit('run:start', { goal });

    try {
      // Initialize session
      this._currentSession = {
        sessionId: `session_${Date.now()}`,
        goal,
        startedAt: new Date().toISOString(),
        status: 'running',
      };

      // PHASE 1: Planning
      this.emit('phase:start', { phase: 'planning' });
      const plan = await this.planner.generatePlan(goal, options.context);

      // Validate plan
      const planValidation = this.planner.validatePlan(plan);
      if (!planValidation.valid) {
        throw new Error(`Invalid plan: ${planValidation.errors.join(', ')}`);
      }

      this._currentSession.plan = plan;
      this.emit('phase:complete', { phase: 'planning', plan });

      // PHASE 2: Decomposition
      this.emit('phase:start', { phase: 'decomposition' });
      const decomposition = this.decomposer.decompose(plan);
      this._currentSession.decomposition = decomposition;
      this.emit('phase:complete', { phase: 'decomposition', decomposition });

      // PHASE 3: Execution
      this.emit('phase:start', { phase: 'execution' });
      const execution = await this.executor.execute(decomposition, {
        mode: options.mode || 'dependency',
        context: options.context,
      });
      this._currentSession.execution = execution;
      this.emit('phase:complete', { phase: 'execution', execution });

      // PHASE 4: Validation
      this.emit('phase:start', { phase: 'validation' });
      const validationResults = [];

      for (const taskResult of execution.results) {
        if (taskResult.success && taskResult.output) {
          const validation = await this.validator.validate(
            taskResult.output,
            options.validation || [],
            { taskId: taskResult.taskId }
          );
          validationResults.push({
            taskId: taskResult.taskId,
            ...validation,
          });
        }
      }

      this._currentSession.validation = validationResults;
      this.emit('phase:complete', { phase: 'validation', results: validationResults });

      // Extract learnings
      const learnings = this._extractLearnings(execution, validationResults);
      this._currentSession.learnings = learnings;

      // PHASE 5: Memory persistence
      if (this.options.persistContext) {
        this.emit('phase:start', { phase: 'memory' });
        await this.memory.saveContext({
          ...this._currentSession,
          updatedAt: new Date().toISOString(),
        });

        // Store learnings
        for (const learning of learnings) {
          await this.memory.addLearning(this._currentSession.sessionId, learning);
        }
        this.emit('phase:complete', { phase: 'memory' });
      }

      // Determine final status
      const allTasksSucceeded = execution.results.every((r) => r.success);
      const allValidationsPassed = validationResults.every((v) => v.valid);
      const status = allTasksSucceeded && allValidationsPassed ? 'completed' : 'partial';

      this._currentSession.status = status;
      this._currentSession.completedAt = new Date().toISOString();

      const result = {
        sessionId: this._currentSession.sessionId,
        status,
        plan,
        decomposition: {
          batches: decomposition.batches.length,
          maxParallelism: decomposition.metadata.maxParallelism,
        },
        execution: execution.metrics,
        validation: {
          total: validationResults.length,
          passed: validationResults.filter((v) => v.valid).length,
        },
        learnings,
        metrics: {
          totalDuration: Date.now() - startTime,
          planningDuration: plan.createdAt - startTime,
          ...this.executor.getMetrics(),
        },
      };

      this.emit('run:complete', result);
      return result;
    } catch (error) {
      this._currentSession = {
        ...this._currentSession,
        status: 'failed',
        error: error.message,
        completedAt: new Date().toISOString(),
      };

      if (this.options.persistContext) {
        await this.memory.saveContext(this._currentSession).catch(() => {});
      }

      this.emit('run:error', { error: error.message, session: this._currentSession });
      throw error;
    } finally {
      this._isRunning = false;
    }
  }

  /**
   * Execute with legacy pipeline (backward compatibility)
   *
   * @param {string} description - Task description
   * @param {string[]} [approvals=[]] - Gate approvals
   * @returns {Promise<Object>} Pipeline result
   */
  async execute(description, approvals = []) {
    return await this.pipeline.run(description, approvals);
  }

  /**
   * Extract learnings from execution results
   * @private
   */
  _extractLearnings(execution, validationResults) {
    const learnings = [];

    // Success patterns
    const successfulTasks = execution.results.filter((r) => r.success);
    if (successfulTasks.length > 0) {
      learnings.push({
        type: 'success',
        content: `Completed ${successfulTasks.length}/${execution.results.length} tasks successfully`,
        taskIds: successfulTasks.map((t) => t.taskId),
      });
    }

    // Failure patterns
    const failedTasks = execution.results.filter((r) => !r.success);
    if (failedTasks.length > 0) {
      const errorTypes = [...new Set(failedTasks.map((t) => t.error))];
      learnings.push({
        type: 'failure',
        content: `${failedTasks.length} tasks failed. Error types: ${errorTypes.join(', ')}`,
        taskIds: failedTasks.map((t) => t.taskId),
      });
    }

    // Retry patterns
    const retriedTasks = execution.results.filter((r) => r.retries > 0);
    if (retriedTasks.length > 0) {
      learnings.push({
        type: 'insight',
        content: `${retriedTasks.length} tasks required retries. Consider increasing timeout or improving prompts.`,
        taskIds: retriedTasks.map((t) => t.taskId),
      });
    }

    // Validation insights
    const failedValidations = validationResults.filter((v) => !v.valid);
    if (failedValidations.length > 0) {
      learnings.push({
        type: 'insight',
        content: `${failedValidations.length} outputs failed validation. Review validation criteria.`,
        taskIds: failedValidations.map((v) => v.taskId),
      });
    }

    return learnings;
  }

  /**
   * Resume a previous session
   *
   * @param {string} sessionId - Session to resume
   * @returns {Promise<AutonomousResult>} Continued result
   */
  async resume(sessionId) {
    const context = await this.memory.loadContext(sessionId);
    if (!context) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (context.status === 'completed') {
      return context;
    }

    // Resume from where we left off
    this.emit('resume:start', { sessionId });

    // For now, restart with same goal
    return this.run(context.goal, { context });
  }

  /**
   * Stop the current run
   */
  stop() {
    if (this._isRunning) {
      this._isRunning = false;
      this.emit('run:stopped');
    }
  }

  /**
   * Get current session state
   * @returns {Object|null} Current session
   */
  getCurrentSession() {
    return this._currentSession;
  }

  /**
   * Get session history
   * @returns {Array} History entries
   */
  getHistory() {
    return this.memory.getHistory();
  }

  /**
   * Approve a gate
   * @param {string} gateId - Gate to approve
   */
  approveGate(gateId) {
    this.validator.approveGate(gateId);
    this.options.approvedGates.push(gateId);
  }

  /**
   * Get agent metrics
   * @returns {Object} Combined metrics
   */
  getMetrics() {
    return {
      planning: this.planner.getMetrics(),
      execution: this.executor.getMetrics(),
      memory: this.memory.getStats(),
      isRunning: this._isRunning,
    };
  }
}

export default AutonomousAgent;
