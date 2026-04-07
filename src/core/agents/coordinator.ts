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
import { BaseAgent } from './base-agent.js';
let Coordinator = class extends BaseAgent {
  constructor(options = {}) {
    super({ ...options, type: "coordinator", name: "coordinator" });
    this.agents = /* @__PURE__ */ new Map();
    this.tasks = /* @__PURE__ */ new Map();
    this.workflows = /* @__PURE__ */ new Map();
    this.maxConcurrent = options.maxConcurrent || 10;
    this.activeTasks = 0;
  }
  async initialize() {
    await super.initialize();
    this.emit("coordinator.ready", { coordinator: this.id });
    return this;
  }
  registerAgent(agent) {
    this.agents.set(agent.id, agent);
    this.emit("agent.registered", { coordinator: this.id, agent: agent.id });
    agent.on("task.complete", (data) => this.handleAgentTaskComplete(data));
    agent.on("task.error", (data) => this.handleAgentTaskError(data));
    return this;
  }
  unregisterAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.removeAllListeners();
      this.agents.delete(agentId);
      this.emit("agent.unregistered", { coordinator: this.id, agent: agentId });
    }
    return this;
  }
  async executeWorkflow(workflow) {
    const workflowId = this.generateId();
    this.workflows.set(workflowId, workflow);
    this.emit("workflow.start", { coordinator: this.id, workflow: workflowId });
    try {
      const result = await this.processWorkflow(workflow);
      this.workflows.delete(workflowId);
      this.emit("workflow.complete", { coordinator: this.id, workflow: workflowId, result });
      return result;
    } catch (error) {
      this.workflows.delete(workflowId);
      this.emit("workflow.error", { coordinator: this.id, workflow: workflowId, error });
      throw error;
    }
  }
  async processWorkflow(workflow) {
    const { tasks = [], strategy = "sequential" } = workflow;
    if (strategy === "parallel") {
      return await this.executeParallel(tasks);
    } else if (strategy === "sequential") {
      return await this.executeSequential(tasks);
    } else if (strategy === "conditional") {
      return await this.executeConditional(tasks);
    }
    throw new Error(`Unknown workflow strategy: ${strategy}`);
  }
  async executeParallel(tasks) {
    const promises = tasks.map((task) => this.delegateTask(task));
    return await Promise.all(promises);
  }
  async executeSequential(tasks) {
    const results = [];
    for (const task of tasks) {
      const result = await this.delegateTask(task);
      results.push(result);
    }
    return results;
  }
  async executeConditional(tasks) {
    const results = [];
    for (const task of tasks) {
      if (task.condition && !this.evaluateCondition(task.condition, results)) {
        continue;
      }
      const result = await this.delegateTask(task);
      results.push(result);
    }
    return results;
  }
  async delegateTask(task) {
    const agent = this.selectAgent(task);
    if (!agent) {
      throw new Error(`No suitable agent found for task: ${task.type}`);
    }
    this.activeTasks++;
    const taskId = this.generateId();
    this.tasks.set(taskId, { ...task, agent: agent.id, status: "running" });
    try {
      const result = await agent.execute(task);
      this.tasks.delete(taskId);
      this.activeTasks--;
      return result;
    } catch (error) {
      this.tasks.delete(taskId);
      this.activeTasks--;
      throw error;
    }
  }
  selectAgent(task) {
    for (const agent of this.agents.values()) {
      if (agent.status === "ready" && task.requiredCapabilities?.every((cap) => agent.capabilities.includes(cap))) {
        return agent;
      }
    }
    for (const agent of this.agents.values()) {
      if (agent.status === "ready") {
        return agent;
      }
    }
    return null;
  }
  evaluateCondition(condition, results) {
    if (typeof condition === "function") {
      return condition(results);
    }
    if (condition.type === "previous_success") {
      return results.length > 0 && results[results.length - 1].success;
    }
    return true;
  }
  handleAgentTaskComplete(data) {
    this.emit("task.delegated.complete", data);
  }
  handleAgentTaskError(data) {
    this.emit("task.delegated.error", data);
  }
  getStats() {
    return {
      ...this.getStatus(),
      agents: this.agents.size,
      activeTasks: this.activeTasks,
      workflows: this.workflows.size,
      maxConcurrent: this.maxConcurrent
    };
  }
  generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};
Coordinator = __decorateClass([
  singleton()
], Coordinator);
var coordinator_default = Coordinator;
export {
  Coordinator,
  coordinator_default as default
};
