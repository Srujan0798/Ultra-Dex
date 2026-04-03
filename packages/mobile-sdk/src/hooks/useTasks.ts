// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/hooks/useTasks.ts

import { useState, useEffect, useCallback } from 'react';
import { TaskManager } from '../api/TaskManager';
import { Task, TaskStatus, TaskPriority } from '../types';

export const useTasks = (taskManager: TaskManager | null) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(
    async (status?: TaskStatus) => {
      if (!taskManager) return;

      setLoading(true);
      setError(null);

      try {
        const loadedTasks = await taskManager.getTasks(status);
        setTasks(loadedTasks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    },
    [taskManager]
  );

  const executeTask = useCallback(
    async (
      description: string,
      options?: {
        priority?: TaskPriority;
        tags?: string[];
        metadata?: Record<string, any>;
      }
    ) => {
      if (!taskManager) {
        throw new Error('TaskManager not available');
      }

      setError(null);

      try {
        const newTask = await taskManager.executeTask(description, options);
        setTasks((prev) => [newTask, ...prev]);
        return newTask;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to execute task';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [taskManager]
  );

  const cancelTask = useCallback(
    async (taskId: string) => {
      if (!taskManager) return;

      try {
        await taskManager.cancelTask(taskId);
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, status: 'cancelled' as TaskStatus } : task
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cancel task');
      }
    },
    [taskManager]
  );

  const retryTask = useCallback(
    async (taskId: string) => {
      if (!taskManager) return;

      try {
        const retriedTask = await taskManager.retryTask(taskId);
        setTasks((prev) => prev.map((task) => (task.id === taskId ? retriedTask : task)));
        return retriedTask;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to retry task');
      }
    },
    [taskManager]
  );

  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    executeTask,
    cancelTask,
    retryTask,
    refreshTasks,
    loadTasks,
  };
};
