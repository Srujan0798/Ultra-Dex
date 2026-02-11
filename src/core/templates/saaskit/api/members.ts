/**
 * @fileoverview Members module
 * @module api/members
 */

import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

export async function addMember(workspaceId: string, email: string, role: Role) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');
  
  return prisma.workspaceMember.create({
    data: { workspaceId, userId: user.id, role }
  });
}

export async function removeMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId } }
  });
}

export async function updateRole(workspaceId: string, userId: string, role: Role) {
  return prisma.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId } },
    data: { role }
  });
}

/**
 * Error handler for members
 * @param {Error} error - Error to handle
 */
function handleMembersError(error) {
  try {
    console.error('[members]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
