// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/storage/StorageManager.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { StorageConfig, Task, SyncResult } from '../types';

export class StorageManager {
  private config: StorageConfig;
  private isOnline = true;
  private syncTimer?: NodeJS.Timeout;

  private static readonly TASKS_KEY = '@ultradex_tasks';
  private static readonly PENDING_SYNC_KEY = '@ultradex_pending_sync';

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Monitor network status
    NetInfo.addEventListener((state) => {
      this.isOnline = state.isConnected ?? false;
    });

    // Get initial network status
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected ?? false;

    // Start sync timer if enabled
    if (this.config.syncInterval && this.config.syncInterval > 0) {
      this.startSyncTimer();
    }
  }

  async shutdown(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }

  async isOnline(): Promise<boolean> {
    return this.isOnline;
  }

  async isOfflineMode(): Promise<boolean> {
    return !this.isOnline && this.config.enableOfflineStorage;
  }

  /**
   * Save a task to local storage
   */
  async saveTask(task: Task): Promise<void> {
    if (!this.config.enableOfflineStorage) {
      return;
    }

    try {
      const tasks = await this.getCachedTasks();
      const existingIndex = tasks.findIndex((t) => t.id === task.id);

      if (existingIndex >= 0) {
        tasks[existingIndex] = task;
      } else {
        tasks.push(task);
      }

      // Limit stored tasks if configured
      if (this.config.maxOfflineTasks && tasks.length > this.config.maxOfflineTasks) {
        tasks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        tasks.splice(this.config.maxOfflineTasks);
      }

      await AsyncStorage.setItem(StorageManager.TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save task:', error);
      throw error;
    }
  }

  /**
   * Save multiple tasks to local storage
   */
  async saveTasks(tasks: Task[]): Promise<void> {
    if (!this.config.enableOfflineStorage) {
      return;
    }

    try {
      await AsyncStorage.setItem(StorageManager.TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
      throw error;
    }
  }

  /**
   * Get cached tasks from local storage
   */
  async getCachedTasks(): Promise<Task[]> {
    if (!this.config.enableOfflineStorage) {
      return [];
    }

    try {
      const tasksJson = await AsyncStorage.getItem(StorageManager.TASKS_KEY);
      if (!tasksJson) {
        return [];
      }

      const tasks = JSON.parse(tasksJson);
      // Convert date strings back to Date objects
      return tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        syncedAt: task.syncedAt ? new Date(task.syncedAt) : undefined,
      }));
    } catch (error) {
      console.error('Failed to load cached tasks:', error);
      return [];
    }
  }

  /**
   * Check if there are pending changes to sync
   */
  async hasPendingSync(): Promise<boolean> {
    if (!this.config.enableOfflineStorage) {
      return false;
    }

    try {
      const pending = await AsyncStorage.getItem(StorageManager.PENDING_SYNC_KEY);
      return pending === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Sync offline data with server
   */
  async syncWithServer(): Promise<SyncResult> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    const result: SyncResult = {
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      const cachedTasks = await this.getCachedTasks();

      // Upload local changes
      const unsyncedTasks = cachedTasks.filter((task) => !task.syncedAt);
      for (const task of unsyncedTasks) {
        try {
          // In a real implementation, this would call the server API
          // await this.uploadTaskToServer(task);
          task.syncedAt = new Date();
          result.uploaded++;
        } catch (error) {
          result.errors.push(`Failed to upload task ${task.id}: ${error.message}`);
        }
      }

      // Download server changes
      try {
        // In a real implementation, this would fetch from server
        // const serverTasks = await this.downloadTasksFromServer();
        // Merge with local tasks
        result.downloaded = 0; // serverTasks.length;
      } catch (error) {
        result.errors.push(`Failed to download tasks: ${error.message}`);
      }

      // Save updated tasks
      await this.saveTasks(cachedTasks);

      // Mark sync as complete
      await AsyncStorage.setItem(StorageManager.PENDING_SYNC_KEY, 'false');
    } catch (error) {
      result.errors.push(`Sync failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(StorageManager.TASKS_KEY);
      await AsyncStorage.removeItem(StorageManager.PENDING_SYNC_KEY);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(
      async () => {
        if (this.isOnline && (await this.hasPendingSync())) {
          try {
            await this.syncWithServer();
          } catch (error) {
            console.error('Auto-sync failed:', error);
          }
        }
      },
      (this.config.syncInterval || 15) * 60 * 1000
    ); // Convert minutes to milliseconds
  }
}
