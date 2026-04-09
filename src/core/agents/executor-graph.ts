var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { GraphUtils } from './graph-utils.js';
let ExecutorGraph = class {
  constructor() {
    this.graph = GraphUtils.createGraph();
    this.executionState = /* @__PURE__ */ new Map();
    this.results = /* @__PURE__ */ new Map();
  }
  /**
   * Add execution step
   */
  addStep(stepId, stepData) {
    GraphUtils.addNode(this.graph, stepId, {
      type: 'execution-step',
      status: 'pending',
      ...stepData,
    });
    this.executionState.set(stepId, { status: 'pending', startTime: null, endTime: null });
    return this;
  }
  /**
   * Add execution flow
   */
  addFlow(fromStepId, toStepId, options = {}) {
    GraphUtils.addEdge(this.graph, fromStepId, toStepId, {
      type: 'execution-flow',
      ...options,
    });
    return this;
  }
  /**
   * Mark step as executing
   */
  markExecuting(stepId) {
    const state = this.executionState.get(stepId);
    if (state) {
      state.status = 'executing';
      state.startTime = Date.now();
    }
  }
  /**
   * Mark step as completed
   */
  markCompleted(stepId, result) {
    const state = this.executionState.get(stepId);
    if (state) {
      state.status = 'completed';
      state.endTime = Date.now();
    }
    this.results.set(stepId, result);
  }
  /**
   * Mark step as failed
   */
  markFailed(stepId, error) {
    const state = this.executionState.get(stepId);
    if (state) {
      state.status = 'failed';
      state.endTime = Date.now();
      state.error = error;
    }
  }
  /**
   * Get execution plan
   */
  getExecutionPlan() {
    return GraphUtils.topologicalSort(this.graph);
  }
  /**
   * Get step status
   */
  getStepStatus(stepId) {
    return this.executionState.get(stepId);
  }
  /**
   * Get step result
   */
  getStepResult(stepId) {
    return this.results.get(stepId);
  }
  /**
   * Get execution progress
   */
  getProgress() {
    let completed = 0;
    let failed = 0;
    let pending = 0;
    let executing = 0;
    for (const state of this.executionState.values()) {
      if (state.status === 'completed') completed++;
      else if (state.status === 'failed') failed++;
      else if (state.status === 'executing') executing++;
      else pending++;
    }
    const total = this.executionState.size;
    return {
      total,
      completed,
      failed,
      pending,
      executing,
      percentComplete: total > 0 ? (completed / total) * 100 : 0,
    };
  }
  /**
   * Can execute step (all dependencies met)
   */
  canExecute(stepId) {
    const incoming = GraphUtils.getIncoming(this.graph, stepId);
    for (const dep of incoming) {
      const depState = this.executionState.get(dep.id);
      if (!depState || depState.status !== 'completed') {
        return false;
      }
    }
    return true;
  }
  /**
   * Get next executable steps
   */
  getNextExecutable() {
    const executable = [];
    for (const [stepId, state] of this.executionState) {
      if (state.status === 'pending' && this.canExecute(stepId)) {
        executable.push(stepId);
      }
    }
    return executable;
  }
  /**
   * Get total execution time
   */
  getTotalExecutionTime() {
    let totalTime = 0;
    for (const state of this.executionState.values()) {
      if (state.startTime && state.endTime) {
        totalTime += state.endTime - state.startTime;
      }
    }
    return totalTime;
  }
};
ExecutorGraph = __decorateClass([singleton()], ExecutorGraph);
var executor_graph_default = ExecutorGraph;
export { ExecutorGraph, executor_graph_default as default };
