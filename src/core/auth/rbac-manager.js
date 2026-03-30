// Copyright (c) 2026 Ultra-Dex

/**
 * RBAC Manager - Role-Based Access Control
 */

export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

export const PERMISSIONS = {
  PROJECT_READ: 'project:read',
  PROJECT_CREATE: 'project:create',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  TEAM_SETTINGS: 'team:settings',
};

const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.EDITOR]: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
  ],
  [ROLES.VIEWER]: [PERMISSIONS.PROJECT_READ],
};

class RBACManager {
  constructor() {
    this.userRoles = new Map();
    this.customRoles = new Map();
  }

  assignRole(userId, role) {
    const normalizedRole = typeof role === 'string' ? role.toLowerCase() : role;
    if (!Object.values(ROLES).includes(normalizedRole) && !this.customRoles.has(normalizedRole)) {
      throw new Error(`Invalid role: ${role}`);
    }
    this.userRoles.set(userId, normalizedRole);
  }

  getRole(userId) {
    const role = this.userRoles.get(userId) || ROLES.VIEWER;
    return typeof role === 'string' ? role.toLowerCase() : role;
  }

  defineCustomRole(roleName, permissions) {
    this.customRoles.set(roleName, permissions);
  }

  checkPermission(userId, permission) {
    const role = this.getRole(userId);
    const permissions = this.customRoles.get(role) || ROLE_HIERARCHY[role] || [];
    return permissions.includes(permission);
  }

  revokeRole(userId) {
    this.userRoles.delete(userId);
  }

  getUserPermissions(userId) {
    const role = this.getRole(userId);
    return this.customRoles.get(role) || ROLE_HIERARCHY[role] || [];
  }
}

export default RBACManager;
