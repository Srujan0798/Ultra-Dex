/**
 * @fileoverview Permissions module
 * @module auth/permissions
 */

export type Role = 'admin' | 'editor' | 'viewer';

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: ['*'],
  editor: ['post:create', 'post:edit', 'post:delete', 'settings:view'],
  viewer: ['post:view', 'settings:view'],
};

export function hasPermission(role: Role, permission: string) {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes('*') || allowed.includes(permission);
}

export function requirePermission(role: Role, permission: string) {
  if (!hasPermission(role, permission)) {
    const error = new Error(`Missing permission: ${permission}`);
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
}

export function usePermission(permission: string, role: Role) {
  return hasPermission(role, permission);
}

/**
 * Error handler for permissions
 * @param {Error} error - Error to handle
 */
function handlePermissionsError(error) {
  try {
    console.error('[permissions]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
