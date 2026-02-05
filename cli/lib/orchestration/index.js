/**
 * Orchestration Engine
 * Supports agent messaging, task delegation, conflict resolution,
 * parallel execution, and dependency management.
 */

import { EventEmitter } from 'events';

export class AgentBus extends EventEmitter {
  send(message) {
    this.emit('message', { ...message, timestamp: new Date().toISOString() });
  }
}

export class TaskGraph {
  constructor() {
    this.tasks = new Map();
  }

  addTask(task) {
    if (!task.id) throw new Error('Task must include an id');
    this.tasks.set(task.id, {
      ...task,
      dependencies: task.dependencies || [],
      status: task.status || 'pending'
    });
  }

  markComplete(taskId) {
    const task = this.tasks.get(taskId);
    if (task) task.status = 'completed';
  }

  markFailed(taskId, error) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.error = error;
    }
  }

  getReadyTasks() {
    const ready = [];
    for (const task of this.tasks.values()) {
      if (task.status !== 'pending') continue;
      const depsMet = task.dependencies.every(depId => {
        const dep = this.tasks.get(depId);
        return dep && dep.status === 'completed';
      });
      if (depsMet) ready.push(task);
    }
    return ready;
  }

  hasPending() {
    return Array.from(this.tasks.values()).some(task => task.status === 'pending');
  }
}

export class Orchestrator {
  constructor(options = {}) {
    this.bus = new AgentBus();
    this.tasks = new TaskGraph();
    this.agents = new Map();
    this.parallelism = options.parallelism || 3;
    this.conflicts = [];
  }

  registerAgent(agent) {
    if (!agent.id) throw new Error('Agent must have an id');
    this.agents.set(agent.id, agent);
    this.bus.send({ type: 'agent.register', agent: agent.id });
  }

  addTask(task) {
    this.tasks.addTask(task);
    this.bus.send({ type: 'task.added', task: task.id });
  }

  delegateTask(taskId, agentId) {
    const task = this.tasks.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    task.assignedAgent = agentId;
    this.bus.send({ type: 'task.delegated', task: taskId, agent: agentId });
  }

  recordConflict(conflict) {
    this.conflicts.push({ ...conflict, timestamp: new Date().toISOString() });
    this.bus.send({ type: 'conflict.detected', conflict });
  }

  resolveConflict(conflict, strategy = 'priority') {
    if (strategy === 'priority') {
      return conflict.options.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
    }
    if (strategy === 'majority') {
      const votes = conflict.options.reduce((acc, opt) => {
        acc[opt.id] = (acc[opt.id] || 0) + (opt.votes || 1);
        return acc;
      }, {});
      const winner = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
      return conflict.options.find(opt => opt.id === winner[0]);
    }
    return conflict.options[0];
  }

  async execute(executor) {
    const running = new Set();

    while (this.tasks.hasPending() || running.size) {
      const availableSlots = this.parallelism - running.size;
      const readyTasks = this.tasks.getReadyTasks().slice(0, availableSlots);

      for (const task of readyTasks) {
        task.status = 'running';
        const agentId = task.assignedAgent || 'unassigned';

        const runPromise = (async () => {
          this.bus.send({ type: 'task.started', task: task.id, agent: agentId });
          try {
            const result = await executor(task, agentId, this.bus);
            this.tasks.markComplete(task.id);
            this.bus.send({ type: 'task.completed', task: task.id, result });
          } catch (error) {
            this.tasks.markFailed(task.id, error.message);
            this.bus.send({ type: 'task.failed', task: task.id, error: error.message });
          } finally {
            running.delete(runPromise);
          }
        })();

        running.add(runPromise);
      }

      if (running.size) {
        await Promise.race(Array.from(running));
      }
    }

    return {
      tasks: Array.from(this.tasks.tasks.values()),
      conflicts: this.conflicts
    };
  }
}

export default {
  AgentBus,
  TaskGraph,
  Orchestrator
};
