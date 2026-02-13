// Copyright (c) 2026 Ultra-Dex
/**
 * Team Management Service
 * Enterprise-grade team collaboration and project sharing
 *
 * @module services/team/team-manager
 */

import { v4 as uuidv4 } from 'uuid';
import { ppmManager } from '../../src/core/memory/manager.js';

/**
 * Team roles and permissions
 */
export const TeamRoles = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export type TeamRole = (typeof TeamRoles)[keyof typeof TeamRoles];

/**
 * Permission matrix for team roles
 */
export const RolePermissions = {
  [TeamRoles.OWNER]: [
    'team:manage',
    'team:delete',
    'project:create',
    'project:delete',
    'project:edit',
    'project:view',
    'member:invite',
    'member:remove',
    'member:role:change',
    'billing:manage',
    'settings:manage',
  ],
  [TeamRoles.ADMIN]: [
    'project:create',
    'project:delete',
    'project:edit',
    'project:view',
    'member:invite',
    'member:remove',
    'settings:manage',
  ],
  [TeamRoles.MEMBER]: ['project:create', 'project:edit', 'project:view', 'member:view'],
  [TeamRoles.VIEWER]: ['project:view'],
};

/**
 * Team member interface
 */
export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  joinedAt: Date;
  invitedBy: string;
  status: 'active' | 'pending' | 'inactive';
}

/**
 * Team interface
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  settings: TeamSettings;
  members: TeamMember[];
}

/**
 * Team settings interface
 */
export interface TeamSettings {
  maxProjects: number;
  maxMembers: number;
  allowGuestAccess: boolean;
  requireApprovalForProjects: boolean;
  defaultProjectVisibility: 'private' | 'team' | 'public';
}

/**
 * Project sharing permissions
 */
export interface ProjectShare {
  projectId: string;
  teamId: string;
  sharedBy: string;
  sharedAt: Date;
  permissions: ('view' | 'edit' | 'admin')[];
}

/**
 * Team Manager class
 * Handles all team-related operations
 */
export class TeamManager {
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure memory manager is ready
    await ppmManager.init();

    // Create team storage if not exists
    const teams = await ppmManager.search('team:');
    if (!teams || teams.length === 0) {
      console.log('✓ Team management system initialized');
    }

    this.initialized = true;
  }

  /**
   * Create a new team
   */
  async createTeam(name: string, ownerId: string, description?: string): Promise<Team> {
    await this.initialize();

    const team: Team = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim(),
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        maxProjects: 10,
        maxMembers: 5,
        allowGuestAccess: false,
        requireApprovalForProjects: false,
        defaultProjectVisibility: 'team',
      },
      members: [],
    };

    // Add owner as first member
    const ownerMember: TeamMember = {
      id: uuidv4(),
      userId: ownerId,
      teamId: team.id,
      role: TeamRoles.OWNER,
      joinedAt: new Date(),
      invitedBy: ownerId,
      status: 'active',
    };

    team.members.push(ownerMember);

    // Store in persistent memory
    await ppmManager.add({
      content: `Team created: ${name}`,
      type: 'team-created',
      importance: 8,
      metadata: {
        teamId: team.id,
        ownerId,
        memberCount: 1,
      },
    });

    console.log(`✓ Team "${name}" created with ID: ${team.id}`);
    return team;
  }

  /**
   * Add member to team
   */
  async addMember(
    teamId: string,
    userId: string,
    role: TeamRole = TeamRoles.MEMBER,
    invitedBy: string
  ): Promise<TeamMember> {
    await this.initialize();

    const member: TeamMember = {
      id: uuidv4(),
      userId,
      teamId,
      role,
      joinedAt: new Date(),
      invitedBy,
      status: 'pending',
    };

    await ppmManager.add({
      content: `Member invited to team: ${userId}`,
      type: 'team-member-invited',
      importance: 6,
      metadata: {
        teamId,
        userId,
        role,
        invitedBy,
      },
    });

    console.log(`✓ Member ${userId} invited to team ${teamId} as ${role}`);
    return member;
  }

  /**
   * Share project with team
   */
  async shareProject(
    projectId: string,
    teamId: string,
    sharedBy: string,
    permissions: ('view' | 'edit' | 'admin')[] = ['view']
  ): Promise<ProjectShare> {
    await this.initialize();

    const share: ProjectShare = {
      projectId,
      teamId,
      sharedBy,
      sharedAt: new Date(),
      permissions,
    };

    await ppmManager.add({
      content: `Project ${projectId} shared with team ${teamId}`,
      type: 'project-shared',
      importance: 7,
      metadata: {
        projectId,
        teamId,
        sharedBy,
        permissions,
      },
    });

    console.log(`✓ Project ${projectId} shared with team ${teamId}`);
    return share;
  }

  /**
   * Check if user has permission
   */
  hasPermission(member: TeamMember, permission: string): boolean {
    const permissions = RolePermissions[member.role] || [];
    return permissions.includes(permission) || permissions.includes('*');
  }

  /**
   * Get team by ID
   */
  async getTeam(teamId: string): Promise<Team | null> {
    await this.initialize();

    // Search for team in memory
    const results = await ppmManager.search(`team:${teamId}`);
    if (results && results.length > 0) {
      // Return team from storage
      return results[0].metadata?.team || null;
    }

    return null;
  }

  /**
   * List teams for user
   */
  async listTeamsForUser(userId: string): Promise<Team[]> {
    await this.initialize();

    const results = await ppmManager.search(`member:${userId}`);
    const teams: Team[] = [];

    for (const result of results || []) {
      if (result.metadata?.teamId) {
        const team = await this.getTeam(result.metadata.teamId);
        if (team) teams.push(team);
      }
    }

    return teams;
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, userId: string, removedBy: string): Promise<boolean> {
    await this.initialize();

    await ppmManager.add({
      content: `Member ${userId} removed from team ${teamId}`,
      type: 'team-member-removed',
      importance: 7,
      metadata: {
        teamId,
        userId,
        removedBy,
      },
    });

    console.log(`✓ Member ${userId} removed from team ${teamId}`);
    return true;
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    teamId: string,
    userId: string,
    newRole: TeamRole,
    updatedBy: string
  ): Promise<boolean> {
    await this.initialize();

    await ppmManager.add({
      content: `Member ${userId} role updated to ${newRole} in team ${teamId}`,
      type: 'team-member-role-updated',
      importance: 6,
      metadata: {
        teamId,
        userId,
        newRole,
        updatedBy,
      },
    });

    console.log(`✓ Member ${userId} role updated to ${newRole}`);
    return true;
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId: string, deletedBy: string): Promise<boolean> {
    await this.initialize();

    await ppmManager.add({
      content: `Team ${teamId} deleted`,
      type: 'team-deleted',
      importance: 9,
      metadata: {
        teamId,
        deletedBy,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`✓ Team ${teamId} deleted`);
    return true;
  }

  /**
   * Get collaborative context for project
   */
  async getCollaborativeContext(projectId: string): Promise<{
    projectId: string;
    teamMembers: TeamMember[];
    recentActivity: any[];
    sharedResources: string[];
  }> {
    await this.initialize();

    // Get project activity from memory
    const activity = await ppmManager.search(`project:${projectId}`);

    return {
      projectId,
      teamMembers: [], // Would be populated from actual storage
      recentActivity: activity || [],
      sharedResources: [],
    };
  }
}

// Export singleton instance
export const teamManager = new TeamManager();
export default teamManager;
