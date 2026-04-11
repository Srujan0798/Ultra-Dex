// Copyright (c) 2026 Ultra-Dex

/**
 * Team role permissions helper
 */

export const TEAM_PERMISSIONS = {
  admin: ['*'],
  maintainer: ['read', 'write', 'execute', 'manage_team'],
  member: ['read', 'write', 'execute'],
  viewer: ['read'],
};

export function hasTeamPermission(role, permission) {
  const perms = TEAM_PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}

export function listTeamRoles() {
  return Object.keys(TEAM_PERMISSIONS);
}

/**
 * Handle errors in permissions module
 * @param {Error} error - The error to handle
 * @param {string} [context='permissions'] - Error context
 */
function _handleModuleError(error, context = 'permissions') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
