// Copyright (c) 2026 Ultra-Dex
/**
 * Role-Based Access Control (RBAC) System
 * Enterprise-grade permission management
 *
 * @module core/auth/rbac-manager
 */

import { v4 as uuidv4 } from 'uuid';
import { ppmManager } from '../memory/manager.js';

/**
 * Permission definition
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'manage';
  scope: 'organization' | 'team' | 'project' | 'user';
}

/**
 * Role definition
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User role assignment
 */
export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  scope: {
    type: 'organization' | 'team' | 'project';
    id: string;
  };
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

/**
 * Access control decision
 */
export interface AccessDecision {
  allowed: boolean;
  reason?: string;
  permissions: string[];
  constraints?: Record<string, any>;
}

/**
 * System-defined roles
 */
export const SystemRoles = {
  SUPER_ADMIN: {
    id: 'role-super-admin',
    name: 'Super Admin',
    description: 'Full system access and control',
    permissions: ['*'],
  },
  ORG_ADMIN: {
    id: 'role-org-admin',
    name: 'Organization Admin',
    description: 'Organization-level administration',
    permissions: [
      'organization:manage',
      'team:create',
      'team:manage',
      'team:delete',
      'user:invite',
      'user:manage',
      'user:remove',
      'billing:manage',
      'settings:manage',
    ],
  },
  TEAM_ADMIN: {
    id: 'role-team-admin',
    name: 'Team Admin',
    description: 'Team-level administration',
    permissions: [
      'team:manage',
      'project:create',
      'project:manage',
      'project:delete',
      'member:invite',
      'member:manage',
      'member:remove',
    ],
  },
  DEVELOPER: {
    id: 'role-developer',
    name: 'Developer',
    description: 'Standard development access',
    permissions: [
      'project:view',
      'project:create',
      'project:edit',
      'code:read',
      'code:write',
      'deployment:create',
      'deployment:view',
      'agent:execute',
    ],
  },
  VIEWER: {
    id: 'role-viewer',
    name: 'Viewer',
    description: 'Read-only access',
    permissions: ['project:view', 'code:read', 'deployment:view'],
  },
};

/**
 * RBAC Manager class
 */
export class RBACManager {
  private initialized: boolean = false;
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await ppmManager.init();

    // Initialize system roles
    for (const [key, roleDef] of Object.entries(SystemRoles)) {
      const role: Role = {
        id: roleDef.id,
        name: roleDef.name,
        description: roleDef.description,
        permissions: roleDef.permissions,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.roles.set(role.id, role);
    }

    console.log('✓ RBAC system initialized with', this.roles.size, 'system roles');
    this.initialized = true;
  }

  /**
   * Create custom role
   */
  async createRole(
    name: string,
    description: string,
    permissions: string[],
    createdBy: string
  ): Promise<Role> {
    await this.initialize();

    const role: Role = {
      id: `role-${uuidv4()}`,
      name: name.trim(),
      description: description?.trim() || '',
      permissions,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.roles.set(role.id, role);

    await ppmManager.add({
      content: `Role created: ${name}`,
      type: 'role-created',
      importance: 6,
      metadata: {
        roleId: role.id,
        name,
        permissions,
        createdBy,
      },
    });

    console.log(`✓ Role "${name}" created with ${permissions.length} permissions`);
    return role;
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    roleId: string,
    scope: { type: 'organization' | 'team' | 'project'; id: string },
    grantedBy: string,
    expiresAt?: Date
  ): Promise<UserRoleAssignment> {
    await this.initialize();

    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role ${roleId} not found`);
    }

    const assignment: UserRoleAssignment = {
      id: uuidv4(),
      userId,
      roleId,
      scope,
      grantedBy,
      grantedAt: new Date(),
      expiresAt,
    };

    await ppmManager.add({
      content: `Role ${role.name} assigned to user ${userId}`,
      type: 'role-assigned',
      importance: 6,
      metadata: {
        assignmentId: assignment.id,
        userId,
        roleId,
        roleName: role.name,
        scope,
        grantedBy,
      },
    });

    console.log(`✓ Role "${role.name}" assigned to user ${userId}`);
    return assignment;
  }

  /**
   * Check if user has permission
   */
  async checkPermission(
    userId: string,
    permission: string,
    scope?: { type: string; id: string }
  ): Promise<AccessDecision> {
    await this.initialize();

    // Get user roles
    const userRoles = await this.getUserRoles(userId, scope);

    // Check if any role has the permission
    const userPermissions = new Set<string>();

    for (const assignment of userRoles) {
      const role = this.roles.get(assignment.roleId);
      if (role) {
        for (const perm of role.permissions) {
          userPermissions.add(perm);
        }
      }
    }

    // Check for wildcard permission
    if (userPermissions.has('*')) {
      return {
        allowed: true,
        reason: 'Super admin access',
        permissions: Array.from(userPermissions),
      };
    }

    // Check specific permission
    const allowed = userPermissions.has(permission);

    return {
      allowed,
      reason: allowed ? 'Permission granted' : 'Permission denied',
      permissions: Array.from(userPermissions),
    };
  }

  /**
   * Get user roles
   */
  async getUserRoles(
    userId: string,
    scope?: { type: string; id: string }
  ): Promise<UserRoleAssignment[]> {
    await this.initialize();

    // Search for user role assignments
    const results = await ppmManager.search(`role-assignment:${userId}`);
    const assignments: UserRoleAssignment[] = [];

    for (const result of results || []) {
      if (result.metadata?.assignment) {
        const assignment = result.metadata.assignment as UserRoleAssignment;

        // Filter by scope if provided
        if (scope) {
          if (assignment.scope.type === scope.type && assignment.scope.id === scope.id) {
            assignments.push(assignment);
          }
        } else {
          assignments.push(assignment);
        }
      }
    }

    return assignments;
  }

  /**
   * Revoke role from user
   */
  async revokeRole(assignmentId: string, revokedBy: string): Promise<boolean> {
    await this.initialize();

    await ppmManager.add({
      content: `Role assignment ${assignmentId} revoked`,
      type: 'role-revoked',
      importance: 6,
      metadata: {
        assignmentId,
        revokedBy,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`✓ Role assignment ${assignmentId} revoked`);
    return true;
  }

  /**
   * List all roles
   */
  async listRoles(): Promise<Role[]> {
    await this.initialize();
    return Array.from(this.roles.values());
  }

  /**
   * Get role by ID
   */
  async getRole(roleId: string): Promise<Role | null> {
    await this.initialize();
    return this.roles.get(roleId) || null;
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(
    roleId: string,
    permissions: string[],
    updatedBy: string
  ): Promise<Role | null> {
    await this.initialize();

    const role = this.roles.get(roleId);
    if (!role) return null;

    if (role.isSystem) {
      throw new Error('Cannot modify system roles');
    }

    role.permissions = permissions;
    role.updatedAt = new Date();

    await ppmManager.add({
      content: `Role ${role.name} permissions updated`,
      type: 'role-updated',
      importance: 6,
      metadata: {
        roleId,
        permissions,
        updatedBy,
      },
    });

    console.log(`✓ Role "${role.name}" permissions updated`);
    return role;
  }

  /**
   * Delete custom role
   */
  async deleteRole(roleId: string, deletedBy: string): Promise<boolean> {
    await this.initialize();

    const role = this.roles.get(roleId);
    if (!role) return false;

    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    this.roles.delete(roleId);

    await ppmManager.add({
      content: `Role ${role.name} deleted`,
      type: 'role-deleted',
      importance: 7,
      metadata: {
        roleId,
        roleName: role.name,
        deletedBy,
      },
    });

    console.log(`✓ Role "${role.name}" deleted`);
    return true;
  }
}

// Export singleton instance
export const rbacManager = new RBACManager();
export default rbacManager;
