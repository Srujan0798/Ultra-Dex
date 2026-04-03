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
  async executeStep(step, task) {
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
  async executeGenerateStep(step, task) {
    const { prompt, model, temperature } = step.params || {};

    const messages = [
      { role: 'system', content: `You are executing task: ${task.input}` },
      { role: 'user', content: prompt || task.input },
    ];

    const response = await this.aiRouter.routeRequest(messages, 'quality', {
      model: model || 'gpt-4',
      temperature: temperature || 0.7,
    });

    return response.text || response.content;
  }

  /**
   * Execute a tool step (read/write/shell)
   */
  async executeToolStep(step, task) {
    const { toolName, args } = step.params || {};

    if (!this.mcpServer || !this.mcpServer.toolsMap) {
      throw new Error('MCP server not configured for tool execution');
    }

    const tool = this.mcpServer.toolsMap.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    return await tool.handler(args);
  }

  /**
   * Execute a delegate step (delegate to another agent)
   */
  async executeDelegateStep(step, task) {
    const { agentId, subTask } = step.params || {};

    const agent = await this.agentRegistry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
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
