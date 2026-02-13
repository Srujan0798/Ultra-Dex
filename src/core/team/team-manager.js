/**
 * Ultra-Dex Team Management Service
 * Handles team creation, membership, and project association.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

const TEAM_DIR = '.ultra-dex';
const TEAM_FILE = 'team.json';

class TeamManager extends EventEmitter {
  constructor(cwd = process.cwd()) {
    super();
    this.cwd = cwd;
    this.teamPath = path.resolve(this.cwd, TEAM_DIR, TEAM_FILE);
    this.data = null; // Lazy loaded
  }

  async _ensureLoaded() {
    if (this.data) return;
    try {
      const content = await fs.readFile(this.teamPath, 'utf8');
      this.data = JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.data = null;
      } else {
        throw error;
      }
    }
  }

  async _save() {
    if (!this.data) return;
    const dir = path.dirname(this.teamPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.teamPath, JSON.stringify(this.data, null, 2));
  }

  /**
   * Create a new team
   * @param {string} name - Team name
   * @param {string} ownerId - User ID of the owner
   * @param {Object} extra - Extra fields (description, etc.)
   * @returns {Promise<Object>} Created team object
   */
  async createTeam(name, ownerId, extra = {}) {
    // Don't load existing data for create - we want to create a new team
    if (!name || !ownerId) {
      throw new Error('Name and Owner ID are required');
    }

    const teamId = uuidv4();
    this.data = {
      id: teamId,
      name,
      ownerId,
      description: extra.description || '',
      members: [],
      workspaces: [],
      activeWorkspace: null,
      agentAccess: extra.agentAccess || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this._save(); // Save the team before adding members
    await this.addMember(teamId, ownerId, 'owner');

    this.emit('team:created', this.data);
    return this.data;
  }

  /**
   * Add a member to a team
   * @param {string} teamId
   * @param {string} userId
   * @param {string} role
   */
  async addMember(teamId, userId, role = 'member') {
    await this._ensureLoaded();
    if (!this.data) {
      throw new Error('Team not found');
    }

    // Check if the team ID matches
    if (this.data.id !== teamId) {
      throw new Error('Team not found');
    }

    const exists = this.data.members.some(m => m.userId === userId || m.email === userId);
    if (exists) {
      throw new Error('Member already exists');
    }

    const membership = {
      userId, // treating as email/username for local CLI usage
      email: userId,
      role,
      joinedAt: new Date().toISOString()
    };

    this.data.members.push(membership);
    this.data.updatedAt = new Date().toISOString();

    await this._save();
    this.emit('team:member_added', membership);
    return membership;
  }

  async removeMember(teamId, userId) {
    await this._ensureLoaded();
    if (!this.data) throw new Error('Team not found');

    const index = this.data.members.findIndex(m => m.userId === userId || m.email === userId);
    if (index === -1) throw new Error('Member not found');

    const removed = this.data.members.splice(index, 1)[0];
    this.data.updatedAt = new Date().toISOString();
    await this._save();
    
    this.emit('team:member_removed', removed);
    return removed;
  }

  /**
   * Get team details
   * @param {string} teamId - Optional, if omitted returns current loaded team
   */
  async getTeam(teamId) {
    await this._ensureLoaded();
    if (!this.data) return null;
    if (teamId && this.data.id !== teamId) return null;
    return this.data;
  }

  /**
   * Get all members of a team
   * @param {string} teamId 
   */
  async getTeamMembers(teamId) {
    const team = await this.getTeam(teamId);
    return team ? team.members : [];
  }

  async updateConfig(teamId, key, value) {
    await this._ensureLoaded();
    if (!this.data) throw new Error('Team not found');
    
    this.data[key] = value;
    this.data.updatedAt = new Date().toISOString();
    await this._save();
    return this.data;
  }

  /**
   * Share a project with a team
   * @param {string} teamId 
   * @param {string} projectId 
   * @param {string[]} permissions 
   */
  async shareProject(teamId, projectId, permissions = ['read']) {
    // Placeholder for project sharing logic
    return {
      teamId,
      projectId,
      permissions,
      sharedAt: new Date().toISOString()
    };
  }
}

export default TeamManager;
