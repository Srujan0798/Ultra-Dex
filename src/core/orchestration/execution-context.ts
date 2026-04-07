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
let TaskGraph = class {
  constructor() {
    this.tasks = /* @__PURE__ */ new Map();
  }
  addTask(task) {
    if (!task.id)
      task.id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.tasks.set(task.id, {
      ...task,
      dependencies: task.dependencies || [],
      status: task.status || "pending",
      createdAt: task.createdAt || Date.now()
    });
    return task.id;
  }
  markComplete(taskId, result = null) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = "completed";
      task.completedAt = Date.now();
      if (result !== null) {
        task.result = result;
      }
    }
  }
  getReadyTasks() {
    const ready = [];
    for (const task of this.tasks.values()) {
      if (task.status !== "pending")
        continue;
      const depsMet = task.dependencies.every((depId) => {
        const dep = this.tasks.get(depId);
        return dep && dep.status === "completed";
      });
      if (depsMet)
        ready.push(task);
    }
    return ready;
  }
  hasPending() {
    return Array.from(this.tasks.values()).some((task) => task.status === "pending");
  }
  prune(maxAgeMs = 3e5) {
    const cutoff = Date.now() - maxAgeMs;
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === "completed" && task.completedAt < cutoff) {
        this.tasks.delete(taskId);
      }
    }
  }
};
TaskGraph = __decorateClass([
  singleton()
], TaskGraph);
let ExecutionContext = class {
  constructor(sessionId, objective, options = {}) {
    this.sessionId = sessionId;
    this.objective = objective;
    this.options = options;
    this.tasks = new TaskGraph();
    this.startedAt = Date.now();
    this.status = "running";
    this.steps = [];
  }
  addTask(task) {
    return this.tasks.addTask({ ...task, sessionId: this.sessionId });
  }
  getReadyTasks() {
    return this.tasks.getReadyTasks();
  }
  markComplete(taskId, result = null) {
    return this.tasks.markComplete(taskId, result);
  }
  hasPendingTasks() {
    return this.tasks.hasPending();
  }
};
ExecutionContext = __decorateClass([
  singleton()
], ExecutionContext);
export {
  ExecutionContext,
  TaskGraph
};
