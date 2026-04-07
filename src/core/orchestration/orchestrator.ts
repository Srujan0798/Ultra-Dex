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
import { Planner } from './planner.js';
import { Scheduler } from './scheduler.js';
import { ExecutionTask } from './execution-engine.js';
import TraceCollector from '../observability/trace-collector.js';
import { AgentRegistry } from './registry.js';
import { createLogger } from '../../utils/logging.js';
let Orchestrator = class {
  constructor(options = {}) {
    this.planner = options.planner || new Planner(options.plannerOptions);
    this.agentRegistry = options.agentRegistry || new AgentRegistry();
    this.traceCollector = options.traceCollector || new TraceCollector();
    this.scheduler = options.scheduler || new Scheduler(this.agentRegistry, this.traceCollector, options.schedulerOptions);
    this.logger = createLogger();
    this.supportedModes = ["simple", "detailed", "iterative"];
  }
  /**
   * Orchestrate a task: plan, assign, and prepare for execution
   * @param {string} input - The task input to orchestrate
   * @param {string} mode - Orchestration mode: 'simple', 'detailed', 'iterative'
   * @param {Object} context - Additional context for orchestration
   * @returns {ExecutionTask} - Task ready for ExecutionEngine
   */
  async orchestrate(input, mode = "simple", context = {}) {
    if (!this.supportedModes.includes(mode)) {
      throw new Error(`Unsupported orchestration mode: ${mode}. Supported: ${this.supportedModes.join(", ")}`);
    }
    const traceId = this.traceCollector?.startTrace({
      agentId: "orchestrator",
      task: `Orchestrate task: ${input}`,
      metadata: { input, mode, context }
    });
    const spanId = this.traceCollector?.startSpan({
      traceId,
      operation: "orchestration",
      agentId: "orchestrator",
      metadata: { mode }
    });
    try {
      this.logger.info("Starting orchestration", { input, mode });
      let steps;
      try {
        steps = await this.planner.plan(input, mode);
        this.traceCollector?.addEvent(traceId, spanId, "planning_completed", {
          stepsCount: steps.length,
          mode
        });
        this.logger.info("Planning phase completed", { stepsCount: steps.length });
      } catch (error) {
        this.logger.error("Planning phase failed", { error: error.message });
        this.traceCollector?.failSpan(traceId, spanId, error);
        throw new Error(`Planning phase failed: ${error.message}`);
      }
      const assignedSteps = [];
      try {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const assignment = await this.scheduler.assignStep(step.required, {
            traceId,
            stepCount: i,
            totalSteps: steps.length
          });
          assignedSteps.push({
            id: `step_${i}`,
            type: "delegate",
            // Assume delegation to assigned agent
            action: step.action,
            agent: step.agent,
            required: step.required,
            assignedAgentId: assignment.agentId,
            assignment
          });
        }
        this.traceCollector?.addEvent(traceId, spanId, "scheduling_completed", {
          assignedStepsCount: assignedSteps.length
        });
        this.logger.info("Scheduling phase completed", { assignedStepsCount: assignedSteps.length });
      } catch (error) {
        this.logger.error("Scheduling phase failed", { error: error.message });
        for (const assigned of assignedSteps) {
          this.scheduler.releaseAgentLoad(assigned.assignment.agentId);
        }
        this.traceCollector?.failSpan(traceId, spanId, error);
        throw new Error(`Scheduling phase failed: ${error.message}`);
      }
      const taskId = `orchestrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const executionTask = new ExecutionTask(
        taskId,
        input,
        "orchestrator",
        // Coordinating agent
        assignedSteps,
        "planned"
      );
      this.traceCollector?.addEvent(traceId, spanId, "orchestration_completed", {
        taskId,
        totalSteps: assignedSteps.length
      });
      this.traceCollector?.endSpan(traceId, spanId);
      this.logger.info("Orchestration completed successfully", { taskId, stepsCount: assignedSteps.length });
      return executionTask;
    } catch (error) {
      if (spanId)
        this.traceCollector?.failSpan(traceId, spanId, error);
      throw error;
    }
  }
  /**
   * Get orchestration metrics
   * @returns {Object} Metrics
   */
  getMetrics() {
    return {
      planner: this.planner ? "configured" : "not configured",
      scheduler: this.scheduler.getMetrics(),
      supportedModes: this.supportedModes
    };
  }
};
Orchestrator = __decorateClass([
  singleton()
], Orchestrator);
var orchestrator_default = Orchestrator;
export {
  Orchestrator,
  orchestrator_default as default
};
