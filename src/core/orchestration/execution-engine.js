// Copyright (c) 2026 Ultra-Dex
// src/core/orchestration/execution-engine.js

import { logger } from '../../utils/logging.js';
import { ObservabilitySystem } from '../system/observability.js';
import { SmartAIRouter } from '../ai/router.js';
import { AgentRegistry } from './registry.js';
import { ExecutionTrace } from '../../platform/cli/swarm/protocol.js';

/**
 * ExecutionTask represents a task to be executed by the engine
 */
export class ExecutionTask {
  constructor(id, input, agent, steps = [], status = 'pending') {
    this.id = id;
    this.input = input;
    this.agent = agent;
    this.steps = steps;
    this.status = status;
    this.results = {};
    this.errors = [];
  }
}

/**
 * ExecutionEngine handles deterministic execution of task steps
 */
export class ExecutionEngine {
  constructor(options = {}) {
    this.options = {
      enableTracing: options.enableTracing !== false,
      maxRetries: options.maxRetries || 3,
      ...options,
    };

    this.aiRouter = options.aiRouter || new SmartAIRouter();
    this.agentRegistry = options.agentRegistry || new AgentRegistry();
    this.observability = options.observability || new ObservabilitySystem();
    this.mcpServer = options.mcpServer;
  }

  async initialize() {
    if (this.aiRouter && typeof this.aiRouter.initialize === 'function') {
      await this.aiRouter.initialize();
    }
    if (this.agentRegistry && typeof this.agentRegistry.initialize === 'function') {
      await this.agentRegistry.initialize();
    }
    if (this.observability && typeof this.observability.initialize === 'function') {
      await this.observability.initialize();
    }
    return this;
  }

  /**
   * Execute a task deterministically
   * @param {ExecutionTask} task - The task to execute
   * @returns {Object} Execution result
   */
  async execute(task) {
    const trace = this.options.enableTracing ? new ExecutionTrace(task.id, task.input) : null;

    try {
      if (trace) {
        trace.start();
        // Add all steps to pipeline
        task.steps.forEach((step, i) => {
          const stepId = step.id || `step_${i}`;
          trace.addStep(stepId, task.agent, step.type, []);
        });
      }

      logger.info('Starting task execution', { taskId: task.id, steps: task.steps.length, run_id: trace?.taskId });
      task.status = 'running';

      for (let i = 0; i < task.steps.length; i++) {
        const step = task.steps[i];
        const stepId = step.id || `step_${i}`;

        if (trace) {
          try {
            trace.startStep(stepId);
          } catch (traceError) {
            logger.warn('Failed to start step in trace', { taskId: task.id, stepId, error: traceError.message });
          }
        }

        logger.info('Executing step', { taskId: task.id, stepId, type: step.type, agent: task.agent });
        const startTime = Date.now();

        try {
          const result = await this.executeStep(step, task);
          const duration = Date.now() - startTime;
          task.results[stepId] = result;

          if (trace) {
            try {
              trace.recordResult(task.agent, { stepId, result, duration }, true);
            } catch (traceError) {
              logger.warn('Failed to record step result in trace', { taskId: task.id, stepId, error: traceError.message });
            }
          }

          logger.info('Step completed successfully', { taskId: task.id, stepId, duration });
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error('Step execution failed', { taskId: task.id, stepId, error: error.message });
          task.errors.push({ stepId, error: error.message });

          if (trace) {
            try {
              trace.recordResult(task.agent, { stepId, error: error.message, duration }, false);
            } catch (traceError) {
              logger.warn('Failed to record step error in trace', { taskId: task.id, stepId, error: traceError.message });
            }
          }

          // For now, fail fast on error. Could implement retry logic later
          throw error;
        }
      }

      task.status = 'completed';
      logger.info('Task execution completed', { taskId: task.id, duration: trace?.getDurationFormatted() });

      if (trace) {
        trace.complete(true);
      }

      return {
        status: 'completed',
        results: task.results,
        trace: trace ? trace.toJSON() : null,
        run_id: trace?.taskId,
        agents: trace ? trace.pipeline.map(s => s.agent) : [task.agent],
        steps: task.steps.map((s, i) => s.id || `step_${i}`),
        duration: trace?.getDuration()
      };
    } catch (error) {
      task.status = 'failed';
      logger.error('Task execution failed', { taskId: task.id, error: error.message, duration: trace?.getDurationFormatted() });

      if (trace) {
        try {
          trace.complete(false);
        } catch (traceError) {
          logger.warn('Failed to complete trace on error', { taskId: task.id, error: traceError.message });
        }
      }

      throw error;
    }
  }



  /**
   * Execute a task with streaming progress updates
   * @param {ExecutionTask} task - The task to execute
   * @param {Object} options - Streaming options
   * @param {Function} options.onProgress - Progress callback
   * @returns {AsyncGenerator} Generator yielding progress updates
   */
  async* executeStream(task, options = {}) {
    const { onProgress, cancellationToken } = options;
    const trace = this.options.enableTracing ? new ExecutionTrace(task.id, task.input) : null;

    try {
      // Check for cancellation before starting
      if (cancellationToken?.aborted) {
        throw new Error('Execution cancelled');
      }

      if (trace) {
        trace.start();
        // Add all steps to pipeline
        task.steps.forEach((step, i) => {
          const stepId = step.id || `step_${i}`;
          trace.addStep(stepId, task.agent, step.type, []);
        });
      }

      logger.info('Starting task execution', { taskId: task.id, steps: task.steps.length, run_id: trace ? trace.taskId : undefined });
      task.status = 'running';

      // Yield initial progress
      const initialProgress = {
        type: 'start',
        taskId: task.id,
        totalSteps: task.steps.length,
        completedSteps: 0,
        status: 'running',
        trace: trace ? trace.toJSON() : null,
      };
      if (onProgress) onProgress(initialProgress);
      yield initialProgress;

      for (let i = 0; i < task.steps.length; i++) {
        // Check for cancellation before each step
        if (cancellationToken?.aborted) {
          throw new Error('Execution cancelled');
        }

        const step = task.steps[i];
        const stepId = step.id || `step_${i}`;

        if (trace) {
          try {
            trace.startStep(stepId);
          } catch (traceError) {
            logger.warn('Failed to start step in trace', { taskId: task.id, stepId, error: traceError.message });
          }
        }

        logger.info('Executing step', { taskId: task.id, stepId, type: step.type, agent: task.agent });
        const startTime = Date.now();

        // Yield step start progress
        const stepStartProgress = {
          type: 'step_start',
          taskId: task.id,
          stepId,
          stepIndex: i,
          totalSteps: task.steps.length,
          stepType: step.type,
          agent: task.agent,
          status: 'running',
        };
        if (onProgress) onProgress(stepStartProgress);
        yield stepStartProgress;

        try {
          const result = await this.executeStep(step, task, cancellationToken);
          const duration = Date.now() - startTime;
          task.results[stepId] = result;

          if (trace) {
            try {
              trace.recordResult(task.agent, { stepId, result, duration }, true);
            } catch (traceError) {
              logger.warn('Failed to record step result in trace', { taskId: task.id, stepId, error: traceError.message });
            }
          }

          // Yield step completion progress
          const stepCompleteProgress = {
            type: 'step_complete',
            taskId: task.id,
            stepId,
            stepIndex: i,
            totalSteps: task.steps.length,
            result,
            duration,
            status: 'running',
            trace: trace ? trace.toJSON() : null,
          };
          if (onProgress) onProgress(stepCompleteProgress);
          yield stepCompleteProgress;

          logger.info('Step completed successfully', { taskId: task.id, stepId, duration });
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error('Step execution failed', { taskId: task.id, stepId, error: error.message });
          task.errors.push({ stepId, error: error.message });

          if (trace) {
            try {
              trace.recordResult(task.agent, { stepId, error: error.message, duration }, false);
            } catch (traceError) {
              logger.warn('Failed to record step error in trace', { taskId: task.id, stepId, error: traceError.message });
            }
          }

          // Yield step error progress
          const stepErrorProgress = {
            type: 'step_error',
            taskId: task.id,
            stepId,
            stepIndex: i,
            totalSteps: task.steps.length,
            error: error.message,
            duration,
            status: 'running',
          };
          if (onProgress) onProgress(stepErrorProgress);
          yield stepErrorProgress;

          // For streaming, continue with other steps unless critical
          if (step.type === 'delegate' || step.type === 'generate') {
            // Yield error but continue
            logger.warn('Continuing execution despite step error', { taskId: task.id, stepId });
          } else {
            // Critical step failed, abort execution
            throw error;
          }
        }
      }

      task.status = 'completed';
      logger.info('Task execution completed', { taskId: task.id, duration: trace?.getDurationFormatted() });

      if (trace) {
        trace.complete(true);
      }

      // Yield final result
      const finalResult = {
        type: 'complete',
        status: 'completed',
        results: task.results,
        trace: trace ? trace.toJSON() : null,
        run_id: trace?.taskId,
        agents: trace ? trace.pipeline.map(s => s.agent) : [task.agent],
        steps: task.steps.map((s, i) => s.id || `step_${i}`),
        duration: trace?.getDuration(),
        errors: task.errors,
      };
      if (onProgress) onProgress(finalResult);
      yield finalResult;

      return finalResult;
    } catch (error) {
      task.status = 'failed';
      logger.error('Task execution failed', { taskId: task.id, error: error.message, duration: trace?.getDurationFormatted() });

      if (trace) {
        try {
          trace.complete(false);
        } catch (traceError) {
          logger.warn('Failed to complete trace on error', { taskId: task.id, error: traceError.message });
        }
      }

      // Yield error result
      const errorResult = {
        type: 'error',
        status: 'failed',
        error: error.message,
        trace: trace ? trace.toJSON() : null,
        run_id: trace?.taskId,
      };
      if (onProgress) onProgress(errorResult);
      yield errorResult;

      throw error;
    }
  }

  /**
   * Execute a task with progress updates (non-streaming version)
   * @param {ExecutionTask} task - The task to execute
   * @param {Object} options - Options
   * @returns {Object} Execution result
   */
  async executeWithProgress(task, options = {}) {
    const { onProgress } = options;
    const trace = this.options.enableTracing ? new ExecutionTrace(task.id, task.input) : null;

    try {
      if (trace) {
        trace.start();
        // Add all steps to pipeline
        task.steps.forEach((step, i) => {
          const stepId = step.id || `step_${i}`;
          trace.addStep(stepId, task.agent, step.type, []);
        });
      }

      logger.info('Starting task execution', { taskId: task.id, steps: task.steps.length, run_id: trace?.taskId });
      task.status = 'running';

      // Send initial progress
      if (onProgress) {
        onProgress({
          type: 'start',
          taskId: task.id,
          totalSteps: task.steps.length,
          completedSteps: 0,
          status: 'running',
          trace: trace ? trace.toJSON() : null,
        });
      }

      for (let i = 0; i < task.steps.length; i++) {
        const step = task.steps[i];
        const stepId = step.id || `step_${i}`;

        if (trace) {
          try {
            trace.startStep(stepId);
          } catch (traceError) {
            logger.warn('Failed to start step in trace', { taskId: task.id, stepId, error: traceError.message });
          }
        }

        logger.info('Executing step', { taskId: task.id, stepId, type: step.type, agent: task.agent });
        const startTime = Date.now();

        // Send step start progress
        if (onProgress) {
          onProgress({
            type: 'step_start',
            taskId: task.id,
            stepId,
            stepIndex: i,
            totalSteps: task.steps.length,
            stepType: step.type,
            agent: task.agent,
            status: 'running',
          });
        }

        try {
          const result = await this.executeStep(step, task);
          const duration = Date.now() - startTime;
          task.results[stepId] = result;

          if (trace) {
            try {
              trace.recordResult(task.agent, { stepId, result, duration }, true);
            } catch (traceError) {
              logger.warn('Failed to record step result in trace', { taskId: task.id, stepId, error: traceError.message });
            }
          }

          // Send step completion progress
          if (onProgress) {
            onProgress({
              type: 'step_complete',
              taskId: task.id,
              stepId,
              stepIndex: i,
              totalSteps: task.steps.length,
              result,
              duration,
              status: 'running',
              trace: trace ? trace.toJSON() : null,
            });
          }

          logger.info('Step completed successfully', { taskId: task.id, stepId, duration });
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error('Step execution failed', { taskId: task.id, stepId, error: error.message });
          task.errors.push({ stepId, error: error.message });

          if (trace) {
            try {
              trace.recordResult(task.agent, { stepId, error: error.message, duration }, false);
            } catch (traceError) {
              logger.warn('Failed to record step error in trace', { taskId: task.id, stepId, error: traceError.message });
            }
          }

          // Send step error progress
          if (onProgress) {
            onProgress({
              type: 'step_error',
              taskId: task.id,
              stepId,
              stepIndex: i,
              totalSteps: task.steps.length,
              error: error.message,
              duration,
              status: 'running',
            });
          }

          // For now, fail fast on error. Could implement retry logic later
          throw error;
        }
      }

      task.status = 'completed';
      logger.info('Task execution completed', { taskId: task.id, duration: trace?.getDurationFormatted() });

      if (trace) {
        trace.complete(true);
      }

      // Send final progress
      if (onProgress) {
        onProgress({
          type: 'complete',
          status: 'completed',
          results: task.results,
          trace: trace ? trace.toJSON() : null,
          run_id: trace?.taskId,
          agents: trace ? trace.pipeline.map(s => s.agent) : [task.agent],
          steps: task.steps.map((s, i) => s.id || `step_${i}`),
          duration: trace?.getDuration(),
          errors: task.errors,
        });
      }

      return {
        status: 'completed',
        results: task.results,
        trace: trace ? trace.toJSON() : null,
        run_id: trace?.taskId,
        agents: trace ? trace.pipeline.map(s => s.agent) : [task.agent],
        steps: task.steps.map((s, i) => s.id || `step_${i}`),
        duration: trace?.getDuration()
      };
    } catch (error) {
      task.status = 'failed';
      logger.error('Task execution failed', { taskId: task.id, error: error.message, duration: trace?.getDurationFormatted() });

      if (trace) {
        try {
          trace.complete(false);
        } catch (traceError) {
          logger.warn('Failed to complete trace on error', { taskId: task.id, error: traceError.message });
        }
      }

      // Send error progress
      if (onProgress) {
        onProgress({
          type: 'error',
          status: 'failed',
          error: error.message,
          trace: trace ? trace.toJSON() : null,
          run_id: trace?.taskId,
        });
      }

      throw error;
    }
  }
      if (trace) {
        trace.start();
        // Add all steps to pipeline
        task.steps.forEach((step, i) => {
          const stepId = step.id || `step_${i}`;
          trace.addStep(stepId, task.agent, step.type, []);
        });
      }

      logger.info('Starting task execution', { taskId: task.id, steps: task.steps.length, run_id: trace?.taskId });
      task.status = 'running';

      for (let i = 0; i < task.steps.length; i++) {
        const step = task.steps[i];
        const stepId = step.id || `step_${i}`;

        if (trace) {
          try {
            trace.startStep(stepId);
          } catch (traceError) {
            logger.warn('Failed to start step in trace', { taskId: task.id, stepId, error: traceError.message });
          }
        }

        logger.info('Executing step', { taskId: task.id, stepId, type: step.type, agent: task.agent });
        const startTime = Date.now();

        try {
          const result = await this.executeStep(step, task);
          const duration = Date.now() - startTime;
          task.results[stepId] = result;

          if (trace) {
            try {
              trace.recordResult(task.agent, { stepId, result, duration }, true);
            } catch (traceError) {
              logger.warn('Failed to record step result in trace', { taskId: task.id, stepId, error: traceError.message });
            }
          }

          logger.info('Step completed successfully', { taskId: task.id, stepId, duration });
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error('Step execution failed', { taskId: task.id, stepId, error: error.message, duration });
          task.errors.push({ stepId, error: error.message });

          if (trace) {
            try {
              trace.recordResult(task.agent, { stepId, error: error.message, duration }, false);
            } catch (traceError) {
              logger.warn('Failed to record step error in trace', { taskId: task.id, stepId, error: traceError.message });
            }
          }

          // For now, fail fast on error. Could implement retry logic later
          throw error;
        }
      }

      task.status = 'completed';
      logger.info('Task execution completed', { taskId: task.id, duration: trace?.getDurationFormatted() });

      if (trace) {
        trace.complete(true);
      }

      return {
        status: 'completed',
        results: task.results,
        trace: trace ? trace.toJSON() : null,
        run_id: trace?.taskId,
        agents: trace ? trace.pipeline.map(s => s.agent) : [task.agent],
        steps: task.steps.map((s, i) => s.id || `step_${i}`),
        duration: trace?.getDuration()
      };
    } catch (error) {
      task.status = 'failed';
      logger.error('Task execution failed', { taskId: task.id, error: error.message, duration: trace?.getDurationFormatted() });

      if (trace) {
        try {
          trace.complete(false);
        } catch (traceError) {
          logger.warn('Failed to complete trace on error', { taskId: task.id, error: traceError.message });
        }
      }

      throw error;
    }
  }

  /**
   * Execute a single step
   * @param {Object} step - The step to execute
   * @param {ExecutionTask} task - The parent task
   * @returns {*} Step result
   */
  async executeStep(step, task, cancellationToken = null) {
    switch (step.type) {
      case 'generate':
        return await this.executeGenerateStep(step, task);
      case 'tool':
        return await this.executeToolStep(step, task);
      case 'delegate':
        return await this.executeDelegateStep(step, task);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute a generate step (LLM call)
   */
  async executeGenerateStep(step, task, cancellationToken = null) {
    const { prompt, model, temperature } = step.params || {};

    const messages = [
      { role: 'system', content: `You are executing task: ${task.input}` },
      { role: 'user', content: prompt || task.input },
    ];

    const response = await this.aiRouter.routeRequest(messages, 'quality', {
      model: model || 'gpt-4',
      temperature: temperature || 0.7,
      signal: cancellationToken,
    });

    return response.text || response.content;
  }

  /**
   * Execute a tool step (read/write/shell)
   */
  async executeToolStep(step, task, cancellationToken = null) {
    const { toolName, args } = step.params || {};

    if (!this.mcpServer || !this.mcpServer.toolsMap) {
      throw new Error('MCP server not configured for tool execution');
    }

    const tool = this.mcpServer.toolsMap.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    // Check for cancellation before tool execution
    if (cancellationToken?.aborted) {
      throw new Error('Execution cancelled');
    }

    return await tool.handler(args);
  }

  /**
   * Execute a delegate step (delegate to another agent)
   */
  async executeDelegateStep(step, task, cancellationToken = null) {
    const { agentId, subTask } = step.params || {};

    // Check for cancellation before delegation
    if (cancellationToken?.aborted) {
      throw new Error('Execution cancelled');
    }

    const agent = await this.agentRegistry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Check for cancellation after agent lookup
    if (cancellationToken?.aborted) {
      throw new Error('Execution cancelled');
    }

    // Create sub-task for delegation
    const subExecutionTask = new ExecutionTask(
      `${task.id}_delegate_${agentId}`,
      subTask || task.input,
      agentId,
      [], // Assume agent handles its own steps, or pass if needed
      'pending'
    );

    // For simplicity, assume agent has an execute method or delegate to orchestrator
    // This might need adjustment based on actual agent interface
    if (agent.execute) {
      return await agent.execute(subExecutionTask);
    } else {
      // Fallback to orchestrator
      const { agentOrchestrator } = await import('./index.js');
      return await agentOrchestrator.executeTask(subTask || task.input, { agentId });
    }
  }
}

export default ExecutionEngine;
