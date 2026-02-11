// Copyright (c) 2026 Ultra-Dex
// src/core/orchestration/scheduler.js

/**
 * Agent Scheduler
 * Manages agent execution scheduling and resource allocation
 */

export class AgentScheduler {
  constructor(options = {}) {
    this.options = {
      maxConcurrentAgents: options.maxConcurrentAgents || 8,
      queueSize: options.queueSize || 100,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      enablePrioritization: options.enablePrioritization !== false,
      enableLoadBalancing: options.enableLoadBalancing !== false,
      ...options
    };

    this.agentQueues = new Map(); // agentId -> queue of tasks
    this.runningTasks = new Map(); // taskId -> { agentId, startTime, promise }
    this.agentLoad = new Map(); // agentId -> current load
    this.taskQueue = []; // Priority queue for tasks
    this.isRunning = false;
  }

  /**
   * Schedule a task for an agent
   */
  async schedule(agentId, task, options = {}) {
    // Check if agent is available
    const currentLoad = this.getAgentLoad(agentId);
    if (currentLoad >= this.options.maxConcurrentAgents) {
      // Add to queue if agent is busy
      if (!this.agentQueues.has(agentId)) {
        this.agentQueues.set(agentId, []);
      }

      const queue = this.agentQueues.get(agentId);
      if (queue.length >= this.options.queueSize) {
        throw new Error(`Agent ${agentId} queue is full (${this.options.queueSize})`);
      }

      const taskId = this.generateTaskId();
      const queuedTask = {
        id: taskId,
        agentId,
        task,
        options,
        priority: options.priority || 5,
        scheduledAt: Date.now(),
        retries: 0
      };

      // Insert in priority order (higher priority first)
      const insertIndex = queue.findIndex(qt => qt.priority < queuedTask.priority);
      if (insertIndex === -1) {
        queue.push(queuedTask); // Add to end if no lower priority tasks
      } else {
        queue.splice(insertIndex, 0, queuedTask); // Insert at correct position
      }

      return {
        taskId,
        status: 'queued',
        queuePosition: queue.indexOf(queuedTask)
      };
    }

    // Execute immediately if agent is available
    return await this.executeTask(agentId, task, options);
  }

  /**
   * Execute a task with an agent
   */
  async executeTask(agentId, task, options = {}) {
    const taskId = this.generateTaskId();
    const startTime = Date.now();

    // Track running task
    const taskPromise = this.runTask(agentId, task, options, taskId);
    this.runningTasks.set(taskId, {
      agentId,
      startTime,
      promise: taskPromise,
      options
    });

    // Update agent load
    this.incrementAgentLoad(agentId);

    try {
      const result = await taskPromise;
      
      // Update metrics
      const executionTime = Date.now() - startTime;
      this.decrementAgentLoad(agentId);
      this.runningTasks.delete(taskId);

      return {
        taskId,
        status: 'completed',
        result,
        executionTime,
        agentId
      };
    } catch (error) {
      this.decrementAgentLoad(agentId);
      this.runningTasks.delete(taskId);

      // Handle retry logic
      if (options.retryAttempts === undefined || options.retryAttempts > 0) {
        const remainingRetries = options.retryAttempts - 1;
        if (remainingRetries > 0) {
          // Retry with exponential backoff
          const delay = this.options.retryDelay * Math.pow(2, options.retryAttempts - remainingRetries);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return await this.executeTask(agentId, task, { ...options, retryAttempts: remainingRetries });
        }
      }

      throw error;
    }
  }

  /**
   * Internal task runner
   */
  async runTask(agentId, task, options, taskId) {
    // This would typically call the agent execution system
    // For now, we'll simulate execution
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate task execution
        resolve({
          success: true,
          output: `Task executed by agent ${agentId}`,
          taskId
        });
      }, 100 + Math.random() * 200); // Random delay between 100-300ms
    });
  }

  /**
   * Get current load for an agent
   */
  getAgentLoad(agentId) {
    return this.agentLoad.get(agentId) || 0;
  }

  /**
   * Increment agent load counter
   */
  incrementAgentLoad(agentId) {
    const current = this.getAgentLoad(agentId);
    this.agentLoad.set(agentId, current + 1);
  }

  /**
   * Decrement agent load counter
   */
  decrementAgentLoad(agentId) {
    const current = this.getAgentLoad(agentId);
    if (current > 0) {
      this.agentLoad.set(agentId, current - 1);
    } else {
      this.agentLoad.delete(agentId);
    }
  }

  /**
   * Get agent utilization metrics
   */
  getAgentUtilization(agentId) {
    const load = this.getAgentLoad(agentId);
    const maxLoad = this.options.maxConcurrentAgents;
    return {
      currentLoad: load,
      maxLoad,
      utilization: maxLoad > 0 ? (load / maxLoad) * 100 : 0
    };
  }

  /**
   * Get scheduler metrics
   */
  getMetrics() {
    return {
      totalRunningTasks: this.runningTasks.size,
      totalQueuedTasks: Array.from(this.agentQueues.values()).reduce((acc, queue) => acc + queue.length, 0),
      agentUtilization: Object.fromEntries(
        Array.from(this.agentLoad.entries()).map(([id, load]) => [
          id, 
          this.getAgentUtilization(id)
        ])
      )
    };
  }

  /**
   * Generate a unique task ID
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Process queued tasks
   */
  async processQueue() {
    if (!this.isRunning) return;

    // Process queues for each agent
    for (const [agentId, queue] of this.agentQueues) {
      if (queue.length > 0 && this.getAgentLoad(agentId) < this.options.maxConcurrentAgents) {
        const task = queue.shift(); // Get highest priority task
        if (task) {
          // Execute the queued task
          this.executeTask(agentId, task.task, { ...task.options, retryAttempts: task.retries });
        }
      }
    }

    // Continue processing
    setTimeout(() => this.processQueue(), 100); // Check every 100ms
  }

  /**
   * Start the scheduler
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.processQueue();
  }

  /**
   * Stop the scheduler
   */
  async stop() {
    this.isRunning = false;
  }
}