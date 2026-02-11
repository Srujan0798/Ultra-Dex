// Copyright (c) 2026 Ultra-Dex

import { ContextSyncManager } from './collaboration.js';

export class TeamSyncManager {
  constructor(options = {}) {
    this.manager = new ContextSyncManager({
      workspacePath: options.workspacePath || process.cwd(),
    });
  }

  createSnapshot() {
    return this.manager.createSnapshot();
  }

  listSnapshots() {
    return this.manager.listSnapshots();
  }

  loadSnapshot(id) {
    return this.manager.loadSnapshot(id);
  }
}

export default TeamSyncManager;

/**
 * Error handler for sync
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[sync]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
