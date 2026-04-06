// Copyright (c) 2026 Ultra-Dex
// RBAC Manager - Role Based Access Control

export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

export const PERMISSIONS = {
  PROJECT_READ: 'project.read',
  PROJECT_CREATE: 'project.create',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',
  TEAM_SETTINGS: 'team.settings',
  TEAM_MEMBERS: 'team.members',
};

/**
 * @type {{ [key: string]: string[] }}
 */
export const ROLE_PERMISSIONS = {
  admin: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.TEAM_SETTINGS,
    PERMISSIONS.TEAM_MEMBERS,
  ],
  editor: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.TEAM_SETTINGS,
  ],
  viewer: [PERMISSIONS.PROJECT_READ],
  member: [PERMISSIONS.PROJECT_READ, PERMISSIONS.PROJECT_CREATE],
};

export class RBACManager {
  constructor() {
    this.roles = new Map();
    this.customRoles = new Map();
    this.roleHierarchy = {
      [ROLES.ADMIN]: [
        PERMISSIONS.PROJECT_READ,
        PERMISSIONS.PROJECT_CREATE,
        PERMISSIONS.PROJECT_UPDATE,
        PERMISSIONS.PROJECT_DELETE,
        PERMISSIONS.TEAM_SETTINGS,
        PERMISSIONS.TEAM_MEMBERS,
      ],
      [ROLES.EDITOR]: [
        PERMISSIONS.PROJECT_READ,
        PERMISSIONS.PROJECT_CREATE,
        PERMISSIONS.PROJECT_UPDATE,
        PERMISSIONS.TEAM_SETTINGS,
      ],
      [ROLES.VIEWER]: [PERMISSIONS.PROJECT_READ],
    };
    this.defaultRole = ROLES.VIEWER;
  }

  assignRole(userId, role) {
    if (
      role !== ROLES.ADMIN &&
      role !== ROLES.EDITOR &&
      role !== ROLES.VIEWER &&
      !this.customRoles.has(role)
    ) {
      throw new Error('Invalid role: ${role}');
    }
    this.roles.set(userId, role);
  }

  getRole(userId) {
    return this.roles.get(userId) || this.defaultRole;
  }

  checkPermission(userId, permission) {
    const role = this.getRole(userId);
    
    // Check if role is a custom role
    if (this.customRoles.has(role)) {
      const customRolePermissions = this.customRoles.get(role);
      return customRolePermissions.includes(permission);
    }
    
    // Check standard role permissions
    const permissions = this.roleHierarchy[role] || this.roleHierarchy[this.defaultRole];
    return permissions.includes(permission);
  }

  defineCustomRole(roleName, permissions) {
    this.customRoles.set(roleName, permissions);
  }
}

export default RBACManager;
