// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/api/TaskManager.ts

import { AuthManager } from '../auth/AuthManager';
import { StorageManager } from '../storage/StorageManager';
import { NotificationManager } from '../notifications/NotificationManager';
import { Task, TaskStatus, TaskPriority, APIResponse } from '../types';

export class TaskManager {
  private authManager: AuthManager;
  private storageManager: StorageManager;
  private notificationManager: NotificationManager;
  private activeTasks: Map<string, Task> = new Map();

  constructor(
    authManager: AuthManager,
    storageManager: StorageManager,
    notificationManager: NotificationManager
  ) {
    this.authManager = authManager;
    this.storageManager = storageManager;
    this.notificationManager = notificationManager;
  }

  async initialize(): Promise<void> {
    // Load cached tasks
    const cachedTasks = await this.storageManager.getCachedTasks();
    for (const task of cachedTasks) {
      this.activeTasks.set(task.id, task);
    }
  }

  async shutdown(): Promise<void> {
    // Save any pending tasks
    await this.storageManager.saveTasks(Array.from(this.activeTasks.values()));
  }

  /**
   * Execute a task using Ultra-Dex API
   */
  async executeTask(
    taskDescription: string,
    options: {
      priority?: TaskPriority;
      tags?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<Task> {
    const task: Task = {
      id: this.generateTaskId(),
      title: taskDescription,
      status: 'pending',
      priority: options.priority || 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: options.tags || [],
      metadata: options.metadata || {},
    };

    // Store locally first
    this.activeTasks.set(task.id, task);
    await this.storageManager.saveTask(task);

    // Check if we're online
    const isOnline = await this.storageManager.isOnline();

    if (isOnline) {
      try {
        // Execute via API
        task.status = 'running';
        await this.updateTask(task);

        const result = await this.callUltraDexAPI('/api/execute', {
          task: taskDescription,
          options: {
            priority: task.priority,
            tags: task.tags,
            metadata: task.metadata,
          },
        });

        task.status = 'completed';
        task.completedAt = new Date();
        task.metadata = { ...task.metadata, result };

        await this.updateTask(task);

        // Send notification
        await this.notificationManager.sendTaskCompletionNotification(task);

        return task;
      } catch (error) {
        console.error('Task execution failed:', error);
        task.status = 'failed';
        task.metadata = { ...task.metadata, error: error.message };
        await this.updateTask(task);
        throw error;
      }
    } else {
      // Queue for later execution when online
      task.metadata = { ...task.metadata, queuedForOffline: true };
      await this.updateTask(task);
      return task;
    }
  }

  /**
   * Get all tasks
   */
  async getTasks(status?: TaskStatus): Promise<Task[]> {
    let tasks = Array.from(this.activeTasks.values());

    if (status) {
      tasks = tasks.filter((task) => task.status === status);
    }

    // Sort by creation date, newest first
    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get a specific task by ID
   */
  async getTask(taskId: string): Promise<Task | null> {
    return this.activeTasks.get(taskId) || null;
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status === 'running') {
      task.status = 'cancelled';
      task.updatedAt = new Date();
      await this.updateTask(task);
    }
  }

  /**
   * Retry a failed task
   */
  async retryTask(taskId: string): Promise<Task> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status === 'failed') {
      return this.executeTask(task.title, {
        priority: task.priority,
        tags: task.tags,
        metadata: { ...task.metadata, retry: true },
      });
    }

    throw new Error(`Task ${taskId} is not in failed state`);
  }

  private async updateTask(task: Task): Promise<void> {
    task.updatedAt = new Date();
    this.activeTasks.set(task.id, task);
    await this.storageManager.saveTask(task);
  }

  private async callUltraDexAPI(endpoint: string, data: any): Promise<any> {
    const config = this.authManager.getConfig();
    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const result: APIResponse = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'API call failed');
    }

    return result.data;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
