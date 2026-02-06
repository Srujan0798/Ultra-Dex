// Copyright (c) 2026 Ultra-Dex

import { EventEmitter } from 'node:events';
import { DaemonScheduler } from './scheduler.js';
import { collectDaemonHealth } from './health.js';

export class DaemonServer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.scheduler = new DaemonScheduler();
    this.options = options;
    this.startedAt = null;
  }

  registerDefaults() {
    const tasks = this.options.tasks || [
      {
        name: 'nightly-review',
        intervalMs: 24 * 60 * 60 * 1000,
        handler: async () => this.emit('log', 'Nightly code review placeholder'),
      },
      {
        name: 'daily-tests',
        intervalMs: 24 * 60 * 60 * 1000,
        handler: async () => this.emit('log', 'Daily tests placeholder'),
      },
    ];

    tasks.forEach((task) => this.scheduler.registerTask(task));
  }

  start() {
    if (this.startedAt) return;
    this.startedAt = new Date().toISOString();
    this.registerDefaults();
    this.scheduler.start();
    this.emit('started', { startedAt: this.startedAt });
  }

  stop() {
    this.scheduler.stop();
    this.startedAt = null;
    this.emit('stopped');
  }

  status() {
    return {
      running: Boolean(this.startedAt),
      startedAt: this.startedAt,
      tasks: this.scheduler.listTasks(),
      health: collectDaemonHealth(),
    };
  }
}
