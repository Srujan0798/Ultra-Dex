/**
 * Ultra-Dex Team Permissions
 * Defines standard roles and permission sets.
 */

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

export const PERMISSIONS = {
  // Project Permissions
  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  
  // Team Permissions
  TEAM_INVITE: 'team:invite',
  TEAM_REMOVE: 'team:remove',
  TEAM_SETTINGS: 'team:settings',
  
  // Resource Permissions
  RESOURCE_PROVISION: 'resource:provision',
  DEPLOYMENT_MANAGE: 'deployment:manage',
};

export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: [
    ...Object.values(PERMISSIONS)
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.TEAM_INVITE,
    PERMISSIONS.TEAM_SETTINGS,
    PERMISSIONS.RESOURCE_PROVISION,
    PERMISSIONS.DEPLOYMENT_MANAGE
  ],
  [ROLES.EDITOR]: [
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.RESOURCE_PROVISION,
    PERMISSIONS.DEPLOYMENT_MANAGE
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.PROJECT_READ
  ]
};

/**
 * Check if a role has a specific permission
 * @param {string} role 
 * @param {string} permission 
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}
