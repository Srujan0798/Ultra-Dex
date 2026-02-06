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
