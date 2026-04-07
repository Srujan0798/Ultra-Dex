// Copyright (c) 2026 Ultra-Dex

/**
 * Team Collaboration Features
 * Multi-user context sharing and role-based access
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class TeamContext {
  constructor(options = {}) {
    this.workspacePath = options.workspacePath || process.cwd();
    this.teamDir = path.join(this.workspacePath, '.ultra-dex', 'team');
  }

  /**
   * Initialize team features
   */
  async initialize() {
    if (!fs.existsSync(this.teamDir)) {
      fs.mkdirSync(this.teamDir, { recursive: true });
    }

    const configPath = path.join(this.teamDir, 'config.json');

    if (!fs.existsSync(configPath)) {
      const config = {
        teamId: crypto.randomUUID(),
        created: new Date().toISOString(),
        members: [],
        roles: {
          admin: ['*'],
          developer: ['read', 'write', 'execute'],
          reviewer: ['read', 'comment'],
        },
        settings: {
          syncEnabled: false,
          conflictResolution: 'manual',
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

    return this.loadConfig();
  }

  /**
   * Load team config
   */
  loadConfig() {
    const configPath = path.join(this.teamDir, 'config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  /**
   * Save team config
   */
  saveConfig(config) {
    const configPath = path.join(this.teamDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Add team member
   */
  addMember(member) {
    const config = this.loadConfig();

    const newMember = {
      id: crypto.randomUUID(),
      email: member.email,
      name: member.name,
      role: member.role || 'developer',
      added: new Date().toISOString(),
      agents: member.agents || ['*'], // Agents they can access
    };

    config.members.push(newMember);
    this.saveConfig(config);

    return newMember;
  }

  /**
   * Remove team member
   */
  removeMember(memberId) {
    const config = this.loadConfig();
    config.members = config.members.filter((m) => m.id !== memberId);
    this.saveConfig(config);
  }

  /**
   * Check if member has permission
   */
  hasPermission(memberId, action) {
    const config = this.loadConfig();
    const member = config.members.find((m) => m.id === memberId);

    if (!member) return false;

    const rolePermissions = config.roles[member.role] || [];
    return rolePermissions.includes('*') || rolePermissions.includes(action);
  }

  /**
   * Share context with team
   */
  shareContext(options = {}) {
    const contextPath = path.join(this.workspacePath, 'CONTEXT.md');
    const sharedDir = path.join(this.teamDir, 'shared');

    if (!fs.existsSync(sharedDir)) {
      fs.mkdirSync(sharedDir, { recursive: true });
    }

    if (fs.existsSync(contextPath)) {
      const content = fs.readFileSync(contextPath, 'utf8');
      const sharedContext = {
        content,
        sharedAt: new Date().toISOString(),
        sharedBy: options.userId || 'anonymous',
        version: options.version || '1.0',
      };

      const outputPath = path.join(sharedDir, 'CONTEXT.json');
      fs.writeFileSync(outputPath, JSON.stringify(sharedContext, null, 2));

      return outputPath;
    }

    throw new Error('No CONTEXT.md found to share');
  }

  /**
   * Get team activity log
   */
  getActivityLog() {
    const logPath = path.join(this.teamDir, 'activity.log');

    if (fs.existsSync(logPath)) {
      return fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
    }

    return [];
  }

  /**
   * Log team activity
   */
  logActivity(activity) {
    const logPath = path.join(this.teamDir, 'activity.log');
    const entry = JSON.stringify({
      ...activity,
      timestamp: new Date().toISOString(),
    });

    fs.appendFileSync(logPath, entry + '\n');
  }

  /**
   * Generate team dashboard data
   */
  getDashboardData() {
    const config = this.loadConfig();
    const activity = this.getActivityLog().slice(-20);

    return {
      teamId: config.teamId,
      memberCount: config.members.length,
      members: config.members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
      })),
      recentActivity: activity.map((a) => JSON.parse(a)),
      settings: config.settings,
    };
  }
}

/**
 * Context Sync Manager
 * Handles syncing context between team members
 */
export class ContextSyncManager {
  constructor(options = {}) {
    this.workspacePath = options.workspacePath || process.cwd();
    this.syncDir = path.join(this.workspacePath, '.ultra-dex', 'sync');
  }

  /**
   * Create a sync snapshot
   */
  createSnapshot() {
    if (!fs.existsSync(this.syncDir)) {
      fs.mkdirSync(this.syncDir, { recursive: true });
    }

    const files = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md'];
    const snapshot = {
      id: crypto.randomUUID(),
      created: new Date().toISOString(),
      files: {},
    };

    for (const file of files) {
      const filePath = path.join(this.workspacePath, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        snapshot.files[file] = {
          content,
          hash: crypto.createHash('md5').update(content).digest('hex'),
        };
      }
    }

    const snapshotPath = path.join(this.syncDir, `snapshot-${snapshot.id}.json`);
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

    return snapshot;
  }

  /**
   * Apply a snapshot
   */
  applySnapshot(snapshotId) {
    const snapshotPath = path.join(this.syncDir, `snapshot-${snapshotId}.json`);

    if (!fs.existsSync(snapshotPath)) {
      throw new Error('Snapshot not found');
    }

    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

    for (const [file, data] of Object.entries(snapshot.files)) {
      const filePath = path.join(this.workspacePath, file);
      fs.writeFileSync(filePath, data.content);
    }

    return snapshot;
  }

  /**
   * Detect conflicts between local and remote
   */
  detectConflicts(remoteSnapshot) {
    const conflicts = [];

    for (const [file, remoteData] of Object.entries(remoteSnapshot.files)) {
      const localPath = path.join(this.workspacePath, file);

      if (fs.existsSync(localPath)) {
        const localContent = fs.readFileSync(localPath, 'utf8');
        const localHash = crypto.createHash('md5').update(localContent).digest('hex');

        if (localHash !== remoteData.hash) {
          conflicts.push({
            file,
            localHash,
            remoteHash: remoteData.hash,
          });
        }
      }
    }

    return conflicts;
  }
}

export default {
  TeamContext,
  ContextSyncManager,
};

/**
 * Safe execution wrapper with error handling for collaboration
 * @param {Function} fn - Async function to execute
 * @param {string} [context='collaboration'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'collaboration') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
