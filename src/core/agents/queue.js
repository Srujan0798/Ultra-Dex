// Copyright (c) 2026 Ultra-Dex

/**
 * Agent Task Queue System
 * Manages prioritized task queues for agent execution
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import { AppError } from '../utils/errors.js';

// Queue storage directory
const QUEUE_DIR = path.join(os.homedir(), '.ultra-dex', 'queues');

// Priority levels
const PRIORITY_LEVELS = {
  p0: 100, // Critical
  p1: 75, // High
  p2: 50, // Normal
  p3: 25, // Low
};

export class AgentTaskQueue {
  constructor() {
    this.queues = new Map();
    this.activeTasks = new Map();
    this.events = new EventEmitter();
    this.processorInterval = null;
    this.initialized = false;
  }

  /**
   * Initialize the queue system
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await fs.mkdir(QUEUE_DIR, { recursive: true });
      this.initialized = true;

      printInfo(chalk.cyan('🔄 Initializing Agent Task Queue System...'));

      // Load existing queues from disk
      await this.loadQueues();

      // Start processor
      this.startProcessor();

      printSuccess(chalk.green('✅ Agent Task Queue System Initialized'));
    } catch (error) {
      printError(chalk.red(`❌ Failed to initialize queue system: ${error.message}`));
      throw error;
    }
  }

  /**
   * Load queues from disk
   */
  async loadQueues() {
    try {
      const queueFiles = await fs.readdir(QUEUE_DIR);

      for (const file of queueFiles) {
        if (file.endsWith('.json')) {
          const queuePath = path.join(QUEUE_DIR, file);
          const queueName = path.basename(file, '.json');

          const content = await fs.readFile(queuePath, 'utf8');
          const queueData = JSON.parse(content);

          this.queues.set(queueName, queueData);

          printInfo(chalk.gray(`📋 Loaded queue: ${queueName} (${queueData.tasks.length} tasks)`));
        }
      }
    } catch (error) {
      printWarning(chalk.yellow(`⚠️  Could not load queues: ${error.message}`));
    }
  }

  /**
   * Save a queue to disk
   */
  async saveQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return;

    const queuePath = path.join(QUEUE_DIR, `${queueName}.json`);
    await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
  }

  /**
   * Create a new queue
   */
  createQueue(name, options = {}) {
    if (this.queues.has(name)) {
      throw new AppError(`Queue already exists: ${name}`, { code: 'QUEUE_EXISTS' });
    }

    const queue = {
      name,
      tasks: [],
      options: {
        maxConcurrency: options.maxConcurrency || 3,
        retryAttempts: options.retryAttempts || 3,
        timeout: options.timeout || 300000, // 5 minutes
        ...options,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.queues.set(name, queue);
    this.saveQueue(name).catch((error) => {
      printWarning(chalk.yellow(`⚠️  Could not save queue: ${error.message}`));
    });

    printSuccess(chalk.green(`✅ Created queue: ${name}`));
    return queue;
  }

  /**
   * Add a task to a queue
   */
  async addTask(queueName, task, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.queues.has(queueName)) {
      this.createQueue(queueName);
    }

    const taskId = options.id || uuidv4();
    const priority = options.priority || 'p2';
    const dependencies = options.dependencies || [];

    const queueTask = {
      id: taskId,
      task,
      priority,
      dependencies,
      status: 'pending',
      createdAt: new Date().toISOString(),
      scheduledAt: options.scheduledAt || new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      error: null,
      retryCount: 0,
      agent: options.agent || 'default',
      context: options.context || {},
    };

    const queue = this.queues.get(queueName);
    queue.tasks.push(queueTask);
    queue.updatedAt = new Date().toISOString();

    await this.saveQueue(queueName);

    printInfo(chalk.blue(`📋 Added task to queue ${queueName}: ${taskId}`));

    this.events.emit('task:added', { queueName, taskId, task });

    return queueTask;
  }

  /**
   * Get next task from queue based on priority and dependencies
   */
  getNextTask(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    // Filter pending tasks
    const pendingTasks = queue.tasks.filter(
      (task) => task.status === 'pending' && this.areDependenciesMet(queue.tasks, task.dependencies)
    );

    if (pendingTasks.length === 0) return null;

    // Sort by priority (highest first)
    pendingTasks.sort((a, b) => {
      const priorityA = PRIORITY_LEVELS[a.priority] || 50;
      const priorityB = PRIORITY_LEVELS[b.priority] || 50;
      return priorityB - priorityA; // Higher priority first
    });

    return pendingTasks[0];
  }

  /**
   * Check if dependencies are met
   */
  areDependenciesMet(allTasks, dependencies) {
    if (!dependencies || dependencies.length === 0) return true;

    for (const depId of dependencies) {
      const depTask = allTasks.find((t) => t.id === depId);
      if (!depTask || depTask.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  /**
   * Start processing tasks
   */
  startProcessor() {
    if (this.processorInterval) return;

    this.processorInterval = setInterval(async () => {
      await this.processQueues();
    }, 1000); // Check every second
  }

  /**
   * Process tasks in all queues
   */
  async processQueues() {
    if (!this.initialized) return;

    for (const [queueName, queue] of this.queues) {
      // Check if we can start more tasks based on concurrency limit
      const activeCount = Array.from(this.activeTasks.values()).filter(
        (task) => task.queueName === queueName
      ).length;

      if (activeCount >= queue.options.maxConcurrency) {
        continue; // Reached concurrency limit
      }

      const nextTask = this.getNextTask(queueName);
      if (nextTask) {
        await this.startTask(queueName, nextTask.id);
      }
    }
  }

  /**
   * Start a task
   */
  async startTask(queueName, taskId) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new AppError(`Queue not found: ${queueName}`, { code: 'QUEUE_NOT_FOUND' });
    }

    const task = queue.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new AppError(`Task not found: ${taskId}`, { code: 'TASK_NOT_FOUND' });
    }

    if (task.status !== 'pending') {
      return; // Task is not pending
    }

    // Mark as started
    task.status = 'started';
    task.startedAt = new Date().toISOString();
    queue.updatedAt = new Date().toISOString();

    // Add to active tasks
    this.activeTasks.set(taskId, {
      queueName,
      task,
      startedAt: task.startedAt,
    });

    try {
      // Simulate task execution (in a real implementation, this would call the agent)
      await this.executeTask(task);

      // Mark as completed
      task.status = 'completed';
      task.completedAt = new Date().toISOString();

      printSuccess(chalk.green(`✅ Completed task: ${taskId}`));
      this.events.emit('task:completed', { queueName, taskId, task });
    } catch (error) {
      // Handle task failure
      task.error = error.message;
      task.retryCount++;

      if (task.retryCount < queue.options.retryAttempts) {
        // Retry task
        task.status = 'pending';
        task.startedAt = null;
        task.completedAt = null;

        printWarning(
          chalk.yellow(
            `⚠️  Retrying task ${taskId} (${task.retryCount}/${queue.options.retryAttempts})`
          )
        );
        this.events.emit('task:retry', { queueName, taskId, task, error });
      } else {
        // Mark as failed after max retries
        task.status = 'failed';
        task.completedAt = new Date().toISOString();

        printError(chalk.red(`❌ Failed task ${taskId}: ${error.message}`));
        this.events.emit('task:failed', { queueName, taskId, task, error });
      }
    } finally {
      // Remove from active tasks
      this.activeTasks.delete(taskId);

      // Update queue
      queue.updatedAt = new Date().toISOString();
      await this.saveQueue(queueName);
    }
  }

  /**
   * Execute a task (placeholder implementation)
   */
  async executeTask(task) {
    // In a real implementation, this would call the appropriate agent
    // For now, we'll simulate execution with a timeout

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => {
          // Simulate successful completion
          resolve({ success: true, result: `Task ${task.id} completed successfully` });
        },
        Math.random() * 5000 + 1000
      ); // Random delay between 1-6 seconds

      // In a real implementation, we'd call the agent here
      // const result = await callAgent(task.agent, task.task, task.context);

      // Clear timeout on completion
      // clearTimeout(timeout);
      // resolve(result);
    });
  }

  /**
   * Get queue status
   */
  getQueueStatus(queueName) {
    if (!this.initialized) {
      throw new AppError('Queue system not initialized', { code: 'QUEUE_SYSTEM_NOT_INITIALIZED' });
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      return { name: queueName, exists: false };
    }

    const pendingTasks = queue.tasks.filter((t) => t.status === 'pending').length;
    const startedTasks = queue.tasks.filter((t) => t.status === 'started').length;
    const completedTasks = queue.tasks.filter((t) => t.status === 'completed').length;
    const failedTasks = queue.tasks.filter((t) => t.status === 'failed').length;

    return {
      name: queue.name,
      exists: true,
      options: queue.options,
      stats: {
        total: queue.tasks.length,
        pending: pendingTasks,
        started: startedTasks,
        completed: completedTasks,
        failed: failedTasks,
      },
      activeTasks: startedTasks,
      maxConcurrency: queue.options.maxConcurrency,
    };
  }

  /**
   * Get all queue statuses
   */
  getAllQueueStatuses() {
    if (!this.initialized) {
      throw new AppError('Queue system not initialized', { code: 'QUEUE_SYSTEM_NOT_INITIALIZED' });
    }

    const statuses = [];

    for (const [queueName] of this.queues) {
      statuses.push(this.getQueueStatus(queueName));
    }

    return statuses;
  }

  /**
   * Get tasks in a queue
   */
  getQueueTasks(queueName, status = null) {
    if (!this.initialized) {
      throw new AppError('Queue system not initialized', { code: 'QUEUE_SYSTEM_NOT_INITIALIZED' });
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new AppError(`Queue not found: ${queueName}`, { code: 'QUEUE_NOT_FOUND' });
    }

    if (status) {
      return queue.tasks.filter((task) => task.status === status);
    }

    return [...queue.tasks];
  }

  /**
   * Pause a queue
   */
  pauseQueue(queueName) {
    if (!this.initialized) {
      throw new AppError('Queue system not initialized', { code: 'QUEUE_SYSTEM_NOT_INITIALIZED' });
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new AppError(`Queue not found: ${queueName}`, { code: 'QUEUE_NOT_FOUND' });
    }

    queue.paused = true;
    queue.updatedAt = new Date().toISOString();

    printInfo(chalk.yellow(`⏸️  Paused queue: ${queueName}`));

    return queue;
  }

  /**
   * Resume a queue
   */
  resumeQueue(queueName) {
    if (!this.initialized) {
      throw new AppError('Queue system not initialized', { code: 'QUEUE_SYSTEM_NOT_INITIALIZED' });
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new AppError(`Queue not found: ${queueName}`, { code: 'QUEUE_NOT_FOUND' });
    }

    queue.paused = false;
    queue.updatedAt = new Date().toISOString();

    printSuccess(chalk.green(`▶️  Resumed queue: ${queueName}`));

    return queue;
  }

  /**
   * Clear a queue
   */
  async clearQueue(queueName) {
    if (!this.initialized) {
      await this.initialize();
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new AppError(`Queue not found: ${queueName}`, { code: 'QUEUE_NOT_FOUND' });
    }

    // Stop any active tasks for this queue
    for (const [taskId, activeTask] of this.activeTasks) {
      if (activeTask.queueName === queueName) {
        this.activeTasks.delete(taskId);
      }
    }

    // Clear tasks
    queue.tasks = [];
    queue.updatedAt = new Date().toISOString();

    await this.saveQueue(queueName);

    printSuccess(chalk.green(`🗑️  Cleared queue: ${queueName}`));

    return queue;
  }

  /**
   * Remove completed tasks from queue
   */
  async cleanupQueue(queueName) {
    if (!this.initialized) {
      await this.initialize();
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new AppError(`Queue not found: ${queueName}`, { code: 'QUEUE_NOT_FOUND' });
    }

    const originalCount = queue.tasks.length;
    queue.tasks = queue.tasks.filter((task) => task.status !== 'completed');
    const removedCount = originalCount - queue.tasks.length;

    queue.updatedAt = new Date().toISOString();

    await this.saveQueue(queueName);

    printInfo(chalk.blue(`🧹 Cleaned up ${removedCount} completed tasks from queue: ${queueName}`));

    return {
      queueName,
      originalCount,
      removedCount,
      remainingCount: queue.tasks.length,
    };
  }

  /**
   * Shutdown the queue system
   */
  async shutdown() {
    if (this.processorInterval) {
      clearInterval(this.processorInterval);
      this.processorInterval = null;
    }

    printInfo(chalk.blue('🛑 Queue system shut down'));
  }

  /**
   * Subscribe to queue events
   */
  on(event, listener) {
    this.events.on(event, listener);
  }

  /**
   * Unsubscribe from queue events
   */
  off(event, listener) {
    this.events.off(event, listener);
  }
}

// Create singleton instance
export const agentTaskQueue = new AgentTaskQueue();

// Handle process exit
process.on('exit', () => {
  agentTaskQueue.shutdown().catch((error) => {
    printError(chalk.red(`❌ Error shutting down queue: ${error.message}`));
  });
});

export default agentTaskQueue;
