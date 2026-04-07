var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { logger } from '../../utils/logging.js';
import { ObservabilitySystem } from '../system/observability.js';
import { SmartAIRouter } from '../ai/router.js';
import { AgentRegistry } from './registry.js';
import { ExecutionTrace } from '../agents/protocol.js';
let ExecutionTask = class {
  constructor(id, input, agent, steps = [], status = "pending") {
    this.id = id;
    this.input = input;
    this.agent = agent;
    this.steps = steps;
    this.status = status;
    this.results = {};
    this.errors = [];
  }
};
ExecutionTask = __decorateClass([
  singleton()
], ExecutionTask);
let ExecutionEngine = class {
  constructor(options = {}) {
    this.options = {
      enableTracing: options.enableTracing !== false,
      maxRetries: options.maxRetries || 3,
      enablePerformanceMetrics: options.enablePerformanceMetrics !== false,
      ...options
    };
    this.aiRouter = options.aiRouter || new SmartAIRouter();
    this.agentRegistry = options.agentRegistry || new AgentRegistry();
    this.observability = options.observability || new ObservabilitySystem();
    this.mcpServer = options.mcpServer;
    this.performanceMetrics = options.performanceMetrics || null;
  }
  async initialize() {
    if (this.aiRouter && typeof this.aiRouter.initialize === "function") {
      await this.aiRouter.initialize();
    }
    if (this.agentRegistry && typeof this.agentRegistry.initialize === "function") {
      await this.agentRegistry.initialize();
    }
    if (this.observability && typeof this.observability.initialize === "function") {
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
    const executionStartTime = Date.now();
    try {
      if (trace) {
        trace.start();
        task.steps.forEach((step, i) => {
          const stepId = step.id || `step_${i}`;
          trace.addStep(stepId, task.agent, step.type, []);
        });
      }
      logger.info("Starting task execution", { taskId: task.id, steps: task.steps.length, run_id: trace?.taskId });
      task.status = "running";
      for (let i = 0; i < task.steps.length; i++) {
        const step = task.steps[i];
        const stepId = step.id || `step_${i}`;
        if (trace) {
          try {
            trace.startStep(stepId);
          } catch (traceError) {
            logger.warn("Failed to start step in trace", { taskId: task.id, stepId, error: traceError.message });
          }
        }
        logger.info("Executing step", { taskId: task.id, stepId, type: step.type, agent: task.agent });
        const startTime = Date.now();
        try {
          const result = await this.executeStep(step, task);
          const duration = Date.now() - startTime;
          task.results[stepId] = result;
          if (trace) {
            try {
              trace.recordResult(task.agent, { stepId, result, duration }, true);
            } catch (traceError) {
              logger.warn("Failed to record step result in trace", { taskId: task.id, stepId, error: traceError.message });
            }
          }
          logger.info("Step completed successfully", { taskId: task.id, stepId, duration });
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error("Step execution failed", { taskId: task.id, stepId, error: error.message });
          task.errors.push({ stepId, error: error.message });
          if (trace) {
            try {
              trace.recordResult(task.agent, { stepId, error: error.message, duration }, false);
            } catch (traceError) {
              logger.warn("Failed to record step error in trace", { taskId: task.id, stepId, error: traceError.message });
            }
          }
          throw error;
        }
      }
      task.status = "completed";
      logger.info("Task execution completed", { taskId: task.id, duration: trace?.getDurationFormatted() });
      if (trace) {
        trace.complete(true);
      }
      return {
        status: "completed",
        results: task.results,
        trace: trace ? trace.toJSON() : null,
        run_id: trace?.taskId,
        agents: trace ? trace.pipeline.map((s) => s.agent) : [task.agent],
        steps: task.steps.map((s, i) => s.id || `step_${i}`),
        duration: trace?.getDuration()
      };
    } catch (error) {
      task.status = "failed";
      logger.error("Task execution failed", { taskId: task.id, error: error.message, duration: trace?.getDurationFormatted() });
      if (trace) {
        try {
          trace.complete(false);
        } catch (traceError) {
          logger.warn("Failed to complete trace on error", { taskId: task.id, error: traceError.message });
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
  async *executeStream(task, options = {}) {
    const { onProgress, cancellationToken } = options;
    const trace = this.options.enableTracing ? new ExecutionTrace(task.id, task.input) : null;
    try {
      if (cancellationToken?.aborted) {
        throw new Error("Execution cancelled");
      }
      if (trace) {
        trace.start();
        task.steps.forEach((step, i) => {
          const stepId = step.id || `step_${i}`;
          trace.addStep(stepId, task.agent, step.type, []);
        });
      }
      logger.info("Starting task execution", { taskId: task.id, steps: task.steps.length, run_id: trace ? trace.taskId : void 0 });
      task.status = "running";
      const initialProgress = {
        type: "start",
        taskId: task.id,
        totalSteps: task.steps.length,
        completedSteps: 0,
        status: "running",
        trace: trace ? trace.toJSON() : null
      };
      if (onProgress)
        onProgress(initialProgress);
      yield initialProgress;
      for (let i = 0; i < task.steps.length; i++) {
        if (cancellationToken?.aborted) {
          throw new Error("Execution cancelled");
        }
        const step = task.steps[i];
        const stepId = step.id || `step_${i}`;
        if (trace) {
          try {
            trace.startStep(stepId);
          } catch (traceError) {
            logger.warn("Failed to start step in trace", { taskId: task.id, stepId, error: traceError.message });
          }
        }
        logger.info("Executing step", { taskId: task.id, stepId, type: step.type, agent: task.agent });
        const startTime = Date.now();
        const stepStartProgress = {
          type: "step_start",
          taskId: task.id,
          stepId,
          stepIndex: i,
          totalSteps: task.steps.length,
          stepType: step.type,
          agent: task.agent,
          status: "running"
        };
        if (onProgress)
          onProgress(stepStartProgress);
        yield stepStartProgress;
        try {
          const result = await this.executeStep(step, task);
          const duration = Date.now() - startTime;
          task.results[stepId] = result;
          if (trace) {
            try {
              trace.recordResult(task.agent, { stepId, result, duration }, true);
            } catch (traceError) {
              logger.warn("Failed to record step result in trace", { taskId: task.id, stepId, error: traceError.message });
            }
          }
          const stepCompleteProgress = {
            type: "step_complete",
            taskId: task.id,
            stepId,
            stepIndex: i,
            totalSteps: task.steps.length,
            result,
            duration,
            status: "running",
            trace: trace ? trace.toJSON() : null
          };
          if (onProgress)
            onProgress(stepCompleteProgress);
          yield stepCompleteProgress;
          logger.info("Step completed successfully", { taskId: task.id, stepId, duration });
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error("Step execution failed", { taskId: task.id, stepId, error: error.message });
          task.errors.push({ stepId, error: error.message });
          if (trace) {
            try {
              trace.recordResult(task.agent, { stepId, error: error.message, duration }, false);
            } catch (traceError) {
              logger.warn("Failed to record step error in trace", { taskId: task.id, stepId, error: traceError.message });
            }
          }
          const stepErrorProgress = {
            type: "step_error",
            taskId: task.id,
            stepId,
            stepIndex: i,
            totalSteps: task.steps.length,
            error: error.message,
            duration,
            status: "running"
          };
          if (onProgress)
            onProgress(stepErrorProgress);
          yield stepErrorProgress;
          if (step.type === "delegate" || step.type === "generate") {
            logger.warn("Continuing execution despite step error", { taskId: task.id, stepId });
          } else {
            throw error;
          }
        }
      }
      task.status = "completed";
      logger.info("Task execution completed", { taskId: task.id, duration: trace?.getDurationFormatted() });
      if (trace) {
        trace.complete(true);
      }
      const finalResult = {
        type: "complete",
        status: "completed",
        results: task.results,
        trace: trace ? trace.toJSON() : null,
        run_id: trace?.taskId,
        agents: trace ? trace.pipeline.map((s) => s.agent) : [task.agent],
        steps: task.steps.map((s, i) => s.id || `step_${i}`),
        duration: trace?.getDuration(),
        errors: task.errors
      };
      if (onProgress)
        onProgress(finalResult);
      yield finalResult;
      return finalResult;
    } catch (error) {
      task.status = "failed";
      logger.error("Task execution failed", { taskId: task.id, error: error.message, duration: trace?.getDurationFormatted() });
      if (trace) {
        try {
          trace.complete(false);
        } catch (traceError) {
          logger.warn("Failed to complete trace on error", { taskId: task.id, error: traceError.message });
        }
      }
      const errorResult = {
        type: "error",
        status: "failed",
        error: error.message,
        trace: trace ? trace.toJSON() : null,
        run_id: trace?.taskId
      };
      if (onProgress)
        onProgress(errorResult);
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
        task.steps.forEach((step, i) => {
          const stepId = step.id || `step_${i}`;
          trace.addStep(stepId, task.agent, step.type, []);
        });
      }
      logger.info("Starting task execution", { taskId: task.id, steps: task.steps.length, run_id: trace?.taskId });
      task.status = "running";
      if (onProgress) {
        onProgress({
          type: "start",
          taskId: task.id,
          totalSteps: task.steps.length,
          completedSteps: 0,
          status: "running",
          trace: trace ? trace.toJSON() : null
        });
      }
      for (let i = 0; i < task.steps.length; i++) {
        const step = task.steps[i];
        const stepId = step.id || `step_${i}`;
        if (trace) {
          try {
            trace.startStep(stepId);
          } catch (traceError) {
            logger.warn("Failed to start step in trace", { taskId: task.id, stepId, error: traceError.message });
          }
        }
        logger.info("Executing step", { taskId: task.id, stepId, type: step.type, agent: task.agent });
        const startTime = Date.now();
        if (onProgress) {
          onProgress({
            type: "step_start",
            taskId: task.id,
            stepId,
            stepIndex: i,
            totalSteps: task.steps.length,
            stepType: step.type,
            agent: task.agent,
            status: "running"
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
              logger.warn("Failed to record step result in trace", { taskId: task.id, stepId, error: traceError.message });
            }
          }
          if (onProgress) {
            onProgress({
              type: "step_complete",
              taskId: task.id,
              stepId,
              stepIndex: i,
              totalSteps: task.steps.length,
              result,
              duration,
              status: "running",
              trace: trace ? trace.toJSON() : null
            });
          }
          logger.info("Step completed successfully", { taskId: task.id, stepId, duration });
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error("Step execution failed", { taskId: task.id, stepId, error: error.message });
          task.errors.push({ stepId, error: error.message });
          if (trace) {
            try {
              trace.recordResult(task.agent, { stepId, error: error.message, duration }, false);
            } catch (traceError) {
              logger.warn("Failed to record step error in trace", { taskId: task.id, stepId, error: traceError.message });
            }
          }
          if (onProgress) {
            onProgress({
              type: "step_error",
              taskId: task.id,
              stepId,
              stepIndex: i,
              totalSteps: task.steps.length,
              error: error.message,
              duration,
              status: "running"
            });
          }
          throw error;
        }
      }
      task.status = "completed";
      logger.info("Task execution completed", { taskId: task.id, duration: trace?.getDurationFormatted() });
      if (trace) {
        trace.complete(true);
      }
      if (onProgress) {
        onProgress({
          type: "complete",
          status: "completed",
          results: task.results,
          trace: trace ? trace.toJSON() : null,
          run_id: trace?.taskId,
          agents: trace ? trace.pipeline.map((s) => s.agent) : [task.agent],
          steps: task.steps.map((s, i) => s.id || `step_${i}`),
          duration: trace?.getDuration(),
          errors: task.errors
        });
      }
      return {
        status: "completed",
        results: task.results,
        trace: trace ? trace.toJSON() : null,
        run_id: trace?.taskId,
        agents: trace ? trace.pipeline.map((s) => s.agent) : [task.agent],
        steps: task.steps.map((s, i) => s.id || `step_${i}`),
        duration: trace?.getDuration()
      };
    } catch (error) {
      task.status = "failed";
      logger.error("Task execution failed", { taskId: task.id, error: error.message, duration: trace?.getDurationFormatted() });
      if (trace) {
        try {
          trace.complete(false);
        } catch (traceError) {
          logger.warn("Failed to complete trace on error", { taskId: task.id, error: traceError.message });
        }
      }
      if (onProgress) {
        onProgress({
          type: "error",
          status: "failed",
          error: error.message,
          trace: trace ? trace.toJSON() : null,
          run_id: trace?.taskId
        });
      }
      throw error;
    }
  }
  async executeStep(step, task, cancellationToken = null) {
    switch (step.type) {
      case "generate":
        return await this.executeGenerateStep(step, task);
      case "tool":
        return await this.executeToolStep(step, task);
      case "delegate":
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
      { role: "system", content: `You are executing task: ${task.input}` },
      { role: "user", content: prompt || task.input }
    ];
    const response = await this.aiRouter.routeRequest(messages, "quality", {
      model: model || "gpt-4",
      temperature: temperature || 0.7,
      signal: cancellationToken
    });
    return response.text || response.content;
  }
  /**
   * Execute a tool step (read/write/shell)
   */
  async executeToolStep(step, task, cancellationToken = null) {
    const { toolName, args } = step.params || {};
    if (!this.mcpServer || !this.mcpServer.toolsMap) {
      throw new Error("MCP server not configured for tool execution");
    }
    const tool = this.mcpServer.toolsMap.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    if (cancellationToken?.aborted) {
      throw new Error("Execution cancelled");
    }
    return await tool.handler(args);
  }
  /**
   * Execute a delegate step (delegate to another agent)
   */
  async executeDelegateStep(step, task, cancellationToken = null) {
    const { agentId, subTask } = step.params || {};
    if (cancellationToken?.aborted) {
      throw new Error("Execution cancelled");
    }
    const agent = await this.agentRegistry.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    if (cancellationToken?.aborted) {
      throw new Error("Execution cancelled");
    }
    const subExecutionTask = new ExecutionTask(
      `${task.id}_delegate_${agentId}`,
      subTask || task.input,
      agentId,
      [],
      // Assume agent handles its own steps, or pass if needed
      "pending"
    );
    if (agent.execute) {
      return await agent.execute(subExecutionTask);
    } else {
      const { agentOrchestrator } = await import("./index.js");
      return await agentOrchestrator.executeTask(subTask || task.input, { agentId });
    }
  }
};
ExecutionEngine = __decorateClass([
  singleton()
], ExecutionEngine);
var execution_engine_default = ExecutionEngine;
export {
  ExecutionEngine,
  ExecutionTask,
  execution_engine_default as default
};
