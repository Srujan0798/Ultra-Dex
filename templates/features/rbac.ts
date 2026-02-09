// RBAC Template

export type Role = 'ADMIN' | 'EDITOR' | 'VIEWER';

export const PERMISSIONS: Record<Role, string[]> = {
  ADMIN: ['*'],
  EDITOR: ['content:read', 'content:write', 'user:read'],
  VIEWER: ['content:read'],
};

export function hasPermission(role: Role, permission: string): boolean {
  const perms = PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}

export function assertPermission(role: Role, permission: string) {
  if (!hasPermission(role, permission)) {
    throw new Error(`Insufficient permissions: ${role} cannot ${permission}`);
  }
}

export function requireRole(minimum: Role) {
  const order: Role[] = ['VIEWER', 'EDITOR', 'ADMIN'];
  const minIndex = order.indexOf(minimum);

  return (role: Role) => {
    if (order.indexOf(role) < minIndex) {
      throw new Error(`Role ${role} must be >= ${minimum}`);
    }
  };
}
