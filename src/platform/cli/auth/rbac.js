// Copyright (c) 2026 Ultra-Dex

/**
 * Role-Based Access Control (RBAC) System
 * Enforces permissions across Team and Enterprise features
 */

export const ROLES = {
  ADMIN: 'admin',
  MAINTAINER: 'maintainer',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

export const PERMISSIONS = {
  // Admin only
  MANAGE_TEAM: 'manage_team',
  CONFIGURE_SSO: 'configure_sso',
  MANAGE_BILLING: 'manage_billing',

  // Maintainer + Admin
  PUBLISH_AGENTS: 'publish_agents',
  MANAGE_ENV: 'manage_env',
  APPROVE_PR: 'approve_pr',

  // Member + Above
  USE_AGENTS: 'use_agents',
  CREATE_AGENTS: 'create_agents',
  READ_CODE: 'read_code',
  WRITE_CODE: 'write_code',

  // Viewer + Above
  VIEW_AGENTS: 'view_agents',
  VIEW_METRICS: 'view_metrics',
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MAINTAINER]: [
    PERMISSIONS.PUBLISH_AGENTS,
    PERMISSIONS.MANAGE_ENV,
    PERMISSIONS.APPROVE_PR,
    PERMISSIONS.USE_AGENTS,
    PERMISSIONS.CREATE_AGENTS,
    PERMISSIONS.READ_CODE,
    PERMISSIONS.WRITE_CODE,
    PERMISSIONS.VIEW_AGENTS,
    PERMISSIONS.VIEW_METRICS,
  ],
  [ROLES.MEMBER]: [
    PERMISSIONS.USE_AGENTS,
    PERMISSIONS.CREATE_AGENTS,
    PERMISSIONS.READ_CODE,
    PERMISSIONS.WRITE_CODE,
    PERMISSIONS.VIEW_AGENTS,
    PERMISSIONS.VIEW_METRICS,
  ],
  [ROLES.VIEWER]: [PERMISSIONS.VIEW_AGENTS, PERMISSIONS.VIEW_METRICS],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - The user's role
 * @param {string} permission - The permission to check
 * @returns {boolean} True if allowed
 */
export function hasPermission(role, permission) {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role.toLowerCase()] || [];
  return permissions.includes(permission);
}

/**
 * Get definition of a role
 */
export function getRoleDefinition(role) {
  return {
    name: role,
    permissions: ROLE_PERMISSIONS[role.toLowerCase()] || [],
  };
}

export default {
  ROLES,
  PERMISSIONS,
  hasPermission,
  getRoleDefinition,
};

/**
 * Handle errors in rbac module
 * @param {Error} error - The error to handle
 * @param {string} [context='rbac'] - Error context
 */
function handleModuleError(error, context = 'rbac') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
