/**
 * Ultra-Dex Teams Module
 * Collaborative team management with project isolation
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

const TEAMS_DIR = '.ultra-dex/teams';

class TeamsManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      storagePath: options.storagePath || TEAMS_DIR,
      maxTeamsPerOrg: options.maxTeamsPerOrg || 50,
      maxMembersPerTeam: options.maxMembersPerTeam || 20,
      ...options
    };
    
    this.teams = new Map(); // teamId -> teamData
    this.storagePath = path.resolve(this.options.storagePath);
    this.initialize();
  }

  async initialize() {
    // Ensure teams directory exists
    await fs.mkdir(this.storagePath, { recursive: true });
    
    // Load existing teams
    await this.loadTeams();
  }

  /**
   * Create a new team within an organization
   * @param {object} teamData - Team data
   * @param {string} teamData.orgId - Organization ID
   * @param {string} teamData.name - Team name
   * @param {string} teamData.ownerId - Owner user ID
   * @param {string} teamData.description - Team description (optional)
   * @returns {object} Created team
   */
  async createTeam(teamData) {
    if (!teamData.orgId || !teamData.name || !teamData.ownerId) {
      throw new Error('Organization ID, team name, and owner ID are required');
    }

    // Check organization exists and user has permission
    if (!this.organizationManager.hasAccess(teamData.ownerId, teamData.orgId, 'member')) {
      throw new Error('User does not have access to create team in this organization');
    }

    // Check if team name already exists in organization
    for (const [_, team] of this.teams) {
      if (team.orgId === teamData.orgId && team.name.toLowerCase() === teamData.name.toLowerCase()) {
        throw new Error(`Team with name "${teamData.name}" already exists in organization`);
      }
    }

    const teamId = `team_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const team = {
      id: teamId,
      orgId: teamData.orgId,
      name: teamData.name,
      description: teamData.description || '',
      ownerId: teamData.ownerId,
      members: [{
        userId: teamData.ownerId,
        role: 'owner',
        joinedAt: new Date().toISOString()
      }],
      projects: [],
      settings: {
        allowExternalAccess: teamData.allowExternalAccess || false,
        defaultVisibility: teamData.defaultVisibility || 'private',
        maxConcurrentAgents: teamData.maxConcurrentAgents || 10
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Create team directory
    const teamDir = path.join(this.storagePath, team.orgId, team.id);
    await fs.mkdir(teamDir, { recursive: true });

    // Save team to disk
    await this.saveTeam(team);

    // Add to in-memory store
    this.teams.set(teamId, team);

    this.emit('team:created', { team, timestamp: new Date().toISOString() });

    return team;
  }

  /**
   * Get a team by ID
   * @param {string} teamId - Team ID
   * @returns {object|null} Team or null if not found
   */
  getTeam(teamId) {
    return this.teams.get(teamId) || null;
  }

  /**
   * Add a member to a team
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID to add
   * @param {string} role - Role to assign (admin, member, viewer)
   * @returns {object} Updated team
   */
  async addMember(teamId, userId, role = 'member') {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Valid roles: ${validRoles.join(', ')}`);
    }

    // Check if user is already a member
    const existingMember = team.members.find(m => m.userId === userId);
    if (existingMember) {
      throw new Error(`User ${userId} is already a member of team ${teamId}`);
    }

    // Check member limit
    if (team.members.length >= this.options.maxMembersPerTeam) {
      throw new Error(`Team ${teamId} has reached maximum member limit of ${this.options.maxMembersPerTeam}`);
    }

    // Add member
    team.members.push({
      userId,
      role,
      joinedAt: new Date().toISOString()
    });

    team.updatedAt = new Date().toISOString();

    // Save to disk
    await this.saveTeam(team);

    this.emit('member:added', { teamId, userId, role, timestamp: new Date().toISOString() });

    return team;
  }

  /**
   * Remove a member from a team
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID to remove
   * @returns {object} Updated team
   */
  async removeMember(teamId, userId) {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    // Don't allow removing the owner
    const owner = team.members.find(m => m.role === 'owner');
    if (owner && owner.userId === userId) {
      throw new Error('Cannot remove team owner');
    }

    const initialLength = team.members.length;
    team.members = team.members.filter(m => m.userId !== userId);

    if (team.members.length === initialLength) {
      throw new Error(`User ${userId} is not a member of team ${teamId}`);
    }

    team.updatedAt = new Date().toISOString();

    // Save to disk
    await this.saveTeam(team);

    this.emit('member:removed', { teamId, userId, timestamp: new Date().toISOString() });

    return team;
  }

  /**
   * Change a member's role in a team
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID
   * @param {string} newRole - New role to assign
   * @returns {object} Updated team
   */
  async changeMemberRole(teamId, userId, newRole) {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    // Validate role
    const validRoles = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}. Valid roles: ${validRoles.join(', ')}`);
    }

    const member = team.members.find(m => m.userId === userId);
    if (!member) {
      throw new Error(`User ${userId} is not a member of team ${teamId}`);
    }

    const oldRole = member.role;
    member.role = newRole;
    team.updatedAt = new Date().toISOString();

    // Save to disk
    await this.saveTeam(team);

    this.emit('member:role_changed', { 
      teamId, 
      userId, 
      oldRole, 
      newRole, 
      timestamp: new Date().toISOString() 
    });

    return team;
  }

  /**
   * Create a project within a team
   * @param {string} teamId - Team ID
   * @param {object} projectData - Project data
   * @returns {object} Created project
   */
  async createProject(teamId, projectData) {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    // Check if user has permission to create project
    const user = team.members.find(m => m.userId === projectData.creatorId);
    if (!user || !['owner', 'admin', 'member'].includes(user.role)) {
      throw new Error('Insufficient permissions to create project');
    }

    // Check project limit
    if (this.options.enableProjectLimits && 
        team.projects.length >= this.options.maxProjectsPerTeam) {
      throw new Error(`Team ${teamId} has reached maximum project limit`);
    }

    const projectId = `proj_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const project = {
      id: projectId,
      name: projectData.name,
      description: projectData.description || '',
      creatorId: projectData.creatorId,
      members: [{
        userId: projectData.creatorId,
        role: 'owner',
        joinedAt: new Date().toISOString()
      }],
      settings: {
        visibility: projectData.visibility || 'private',
        enableSandbox: projectData.enableSandbox !== false,
        maxRuntime: projectData.maxRuntime || 300000 // 5 minutes
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    team.projects.push(project);
    team.updatedAt = new Date().toISOString();

    // Create project directory within team
    const projectDir = path.join(this.storagePath, team.orgId, team.id, 'projects', projectId);
    await fs.mkdir(projectDir, { recursive: true });

    // Save team to disk
    await this.saveTeam(team);

    this.emit('project:created', { teamId, project, timestamp: new Date().toISOString() });

    return project;
  }

  /**
   * Get all teams for a user across all organizations
   * @param {string} userId - User ID
   * @returns {Array<object>} Array of teams with user's role
   */
  getUserTeams(userId) {
    const userTeams = [];
    
    for (const [_, team] of this.teams) {
      const member = team.members.find(m => m.userId === userId);
      if (member) {
        userTeams.push({
          id: team.id,
          orgId: team.orgId,
          name: team.name,
          description: team.description,
          role: member.role,
          memberCount: team.members.length,
          projectCount: team.projects.length,
          createdAt: team.createdAt,
          isActive: team.isActive
        });
      }
    }
    
    return userTeams;
  }

  /**
   * Check if a user has access to a team
   * @param {string} userId - User ID
   * @param {string} teamId - Team ID
   * @param {string} requiredRole - Required role (optional)
   * @returns {boolean} True if user has access
   */
  hasAccess(userId, teamId, requiredRole = null) {
    const team = this.teams.get(teamId);
    if (!team || !team.isActive) {
      return false;
    }

    const member = team.members.find(m => m.userId === userId);
    if (!member) {
      return false;
    }

    if (!requiredRole) {
      return true; // User is a member
    }

    // Define role hierarchy
    const roleHierarchy = {
      'owner': 4,
      'admin': 3,
      'member': 2,
      'viewer': 1
    };

    const userRoleLevel = roleHierarchy[member.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  }

  /**
   * Save team to disk
   * @param {object} team - Team to save
   * @private
   */
  async saveTeam(team) {
    const teamPath = path.join(this.storagePath, team.orgId, team.id, 'team.json');
    await fs.writeFile(teamPath, JSON.stringify(team, null, 2));
  }

  /**
   * Load all teams from disk
   * @private
   */
  async loadTeams() {
    try {
      const orgDirs = await fs.readdir(this.storagePath);
      
      for (const orgDir of orgDirs) {
        const orgPath = path.join(this.storagePath, orgDir);
        const stat = await fs.stat(orgPath);
        
        if (stat.isDirectory()) {
          const teamDirs = await fs.readdir(orgPath);
          
          for (const teamDir of teamDirs) {
            const teamPath = path.join(orgPath, teamDir, 'team.json');
            
            try {
              const teamContent = await fs.readFile(teamPath, 'utf8');
              const team = JSON.parse(teamContent);
              
              this.teams.set(team.id, team);
            } catch (error) {
              console.warn(`Failed to load team from ${teamPath}:`, error.message);
            }
          }
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // Directory doesn't exist yet, which is fine
    }
  }

  /**
   * Get all teams in an organization
   * @param {string} orgId - Organization ID
   * @returns {Array<object>} Array of teams
   */
  getOrgTeams(orgId) {
    const orgTeams = [];
    
    for (const [_, team] of this.teams) {
      if (team.orgId === orgId) {
        orgTeams.push({
          id: team.id,
          name: team.name,
          description: team.description,
          memberCount: team.members.length,
          projectCount: team.projects.length,
          createdAt: team.createdAt,
          isActive: team.isActive
        });
      }
    }
    
    return orgTeams;
  }

  /**
   * Get team health information
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      teamCount: this.teams.size,
      totalMembers: Array.from(this.teams.values()).reduce((sum, team) => sum + team.members.length, 0),
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const teamsManager = new TeamsManager();

// Export class for instantiation with custom options
export default TeamsManager;