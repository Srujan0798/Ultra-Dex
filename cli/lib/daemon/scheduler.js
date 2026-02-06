// Copyright (c) 2026 Ultra-Dex

import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

export class DaemonScheduler extends EventEmitter {
  constructor() {
    super();
    this.tasks = new Map();
  }

  registerTask(task) {
    const id = task.id || randomUUID();
    const entry = { ...task, id, timer: null };
    this.tasks.set(id, entry);
    return entry;
  }

  start() {
    for (const task of this.tasks.values()) {
      if (task.timer) continue;
      const intervalMs = task.intervalMs || 3600000;
      task.timer = setInterval(async () => {
        try {
          await task.handler();
          this.emit('task:success', task);
        } catch (error) {
          this.emit('task:error', { task, error });
        }
      }, intervalMs);
    }
  }

  stop() {
    for (const task of this.tasks.values()) {
      if (task.timer) clearInterval(task.timer);
      task.timer = null;
    }
  }

  listTasks() {
    return Array.from(this.tasks.values()).map((task) => ({
      id: task.id,
      name: task.name,
      intervalMs: task.intervalMs,
    }));
  }
}
