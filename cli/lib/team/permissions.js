/**
 * Team role permissions helper
 */

export const TEAM_PERMISSIONS = {
  admin: ['*'],
  maintainer: ['read', 'write', 'execute', 'manage_team'],
  member: ['read', 'write', 'execute'],
  viewer: ['read']
};

export function hasTeamPermission(role, permission) {
  const perms = TEAM_PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}

export function listTeamRoles() {
  return Object.keys(TEAM_PERMISSIONS);
}
