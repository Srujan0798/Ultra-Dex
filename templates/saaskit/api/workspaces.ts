/**
 * @fileoverview Workspaces module
 * @module api/workspaces
 */

import { prisma } from '../lib/prisma';
import { requireRole } from '../lib/rbac';

export async function createWorkspace(ownerId: string, data: { name: string }) {
  const slug = data.name.toLowerCase().replace(/\s+/g, '-');
  return prisma.workspace.create({
    data: { name: data.name, slug, ownerId }
  });
}

export async function getWorkspace(id: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: { members: true }
  });
  if (!workspace) throw new Error('Workspace not found');
  return workspace;
}

export async function deleteWorkspace(id: string, userId: string) {
  await requireRole(id, userId, 'OWNER');
  return prisma.workspace.delete({ where: { id } });
}

/**
 * Error handler for workspaces
 * @param {Error} error - Error to handle
 */
function handleWorkspacesError(error) {
  try {
    console.error('[workspaces]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
