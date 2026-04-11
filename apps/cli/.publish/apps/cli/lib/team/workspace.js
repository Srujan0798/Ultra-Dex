// Copyright (c) 2026 Ultra-Dex

import path from 'path';
import { TeamContext } from './collaboration.js';

export class TeamWorkspaceManager {
  constructor(options = {}) {
    this.context = new TeamContext({ workspacePath: options.workspacePath || process.cwd() });
  }

  async init() {
    return this.context.initialize();
  }

  async addWorkspace(name, dir) {
    const config = await this.context.initialize();
    const workspace = {
      name,
      path: path.resolve(dir),
      addedAt: new Date().toISOString(),
    };
    config.workspaces = config.workspaces || [];
    config.workspaces.push(workspace);
    this.context.saveConfig(config);
    return workspace;
  }

  async listWorkspaces() {
    const config = await this.context.initialize();
    return config.workspaces || [];
  }
}

export default TeamWorkspaceManager;

/**
 * Safe execution wrapper with error handling for workspace
 * @param {Function} fn - Async function to execute
 * @param {string} [context='workspace'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'workspace') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
