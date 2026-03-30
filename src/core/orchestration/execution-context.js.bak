// Copyright (c) 2026 Ultra-Dex

export class TaskGraph {
  constructor() {
    this.tasks = new Map();
  }

  addTask(task) {
    if (!task.id) task.id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.tasks.set(task.id, {
      ...task,
      dependencies: task.dependencies || [],
      status: task.status || 'pending',
      createdAt: task.createdAt || Date.now(),
    });
    return task.id;
  }

  markComplete(taskId, result = null) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = Date.now();
      if (result !== null) {
        task.result = result;
      }
    }
  }

  getReadyTasks() {
    const ready = [];
    for (const task of this.tasks.values()) {
      if (task.status !== 'pending') continue;
      const depsMet = task.dependencies.every((depId) => {
        const dep = this.tasks.get(depId);
        return dep && dep.status === 'completed';
      });
      if (depsMet) ready.push(task);
    }
    return ready;
  }

  hasPending() {
    return Array.from(this.tasks.values()).some((task) => task.status === 'pending');
  }

  prune() {
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === 'completed') {
        this.tasks.delete(taskId);
      }
    }
  }
}

export class ExecutionContext {
  constructor(sessionId, objective, options = {}) {
    this.sessionId = sessionId;
    this.objective = objective;
    this.options = options;
    this.tasks = new TaskGraph();
    this.startedAt = Date.now();
    this.status = 'running';
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
}
