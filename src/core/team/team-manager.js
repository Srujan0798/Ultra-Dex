// Copyright (c) 2026 Ultra-Dex

/**
 * Team Manager - Core team configuration and membership management
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class TeamManager {
  constructor(workspacePath) {
    this.workspacePath = workspacePath || process.cwd();
    this.teamDir = path.join(this.workspacePath, '.ultra-dex');
    this.teamFile = path.join(this.teamDir, 'team.json');
  }

  async ensureTeamDir() {
    await fs.mkdir(this.teamDir, { recursive: true });
  }

  async getTeam() {
    try {
      const content = await fs.readFile(this.teamFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async createTeam(name, ownerId, options = {}) {
    await this.ensureTeamDir();
    
    const team = {
      id: uuidv4(),
      name,
      ownerId,
      description: options.description || '',
      members: [
        {
          userId: ownerId,
          email: null,
          role: 'admin',
          joinedAt: new Date().toISOString(),
        },
      ],
      workspaces: [],
      activeWorkspace: null,
      agentAccess: options.agentAccess || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(this.teamFile, JSON.stringify(team, null, 2));
    return team;
  }

  async updateConfig(teamId, key, value) {
    const team = await this.getTeam();
    if (!team) {
      throw new Error('Team not initialized');
    }

    team[key] = value;
    team.updatedAt = new Date().toISOString();
    await fs.writeFile(this.teamFile, JSON.stringify(team, null, 2));
    return team;
  }

  async addMember(teamId, email, role = 'member') {
    const team = await this.getTeam();
    if (!team) {
      throw new Error('Team not initialized');
    }

    // Check if member already exists
    const existingMember = team.members.find(
      (m) => m.email === email || m.userId === email
    );

    if (existingMember) {
      throw new Error('Member already exists');
    }

    team.members.push({
      userId: null,
      email,
      role,
      joinedAt: new Date().toISOString(),
    });

    team.updatedAt = new Date().toISOString();
    await fs.writeFile(this.teamFile, JSON.stringify(team, null, 2));
    return team;
  }

  async removeMember(teamId, email) {
    const team = await this.getTeam();
    if (!team) {
      throw new Error('Team not initialized');
    }

    const initialLength = team.members.length;
    team.members = team.members.filter((m) => m.email !== email);

    if (team.members.length === initialLength) {
      throw new Error('Member not found');
    }

    team.updatedAt = new Date().toISOString();
    await fs.writeFile(this.teamFile, JSON.stringify(team, null, 2));
    return team;
  }

  async getTeamMembers(teamId) {
    const team = await this.getTeam();
    if (!team) {
      return [];
    }
    return team.members || [];
  }
}

export default TeamManager;
