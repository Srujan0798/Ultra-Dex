/**
 * @fileoverview Rbac module
 * @module lib/rbac
 */

import { prisma } from './prisma';

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export const PERMISSIONS = {
  OWNER: ['*'],
  ADMIN: ['workspace:manage', 'member:manage', 'project:*'],
  MEMBER: ['project:read', 'project:write'],
  VIEWER: ['project:read']
};

export async function requireRole(workspaceId: string, userId: string, minimumRole: Role) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } }
  });
  
  if (!member) throw new Error('Not a member');
  
  const roleHierarchy: Role[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];
  const userLevel = roleHierarchy.indexOf(member.role as Role);
  const requiredLevel = roleHierarchy.indexOf(minimumRole);
  
  if (userLevel < requiredLevel) throw new Error('Insufficient permissions');
  return member;
}

export function hasPermission(role: Role, permission: string): boolean {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes('*') || perms.includes(permission);
}

/**
 * Error handler for rbac
 * @param {Error} error - Error to handle
 */
function handleRbacError(error) {
  try {
    console.error('[rbac]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
