import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export async function createInvite(workspaceId: string, email: string, invitedBy: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  return prisma.workspaceInvite.create({
    data: { workspaceId, email, token, invitedBy, expiresAt }
  });
}

export async function acceptInvite(token: string, userId: string) {
  const invite = await prisma.workspaceInvite.findUnique({ where: { token } });
  if (!invite || invite.status !== 'PENDING') throw new Error('Invalid invite');
  if (new Date() > invite.expiresAt) throw new Error('Invite expired');
  
  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId, role: invite.role }
    }),
    prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', invitedUserId: userId }
    })
  ]);
}

export async function revokeInvite(inviteId: string, revokedBy: string) {
  const invite = await prisma.workspaceInvite.findUnique({ where: { id: inviteId } });
  if (!invite) throw new Error('Invite not found');

  return prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: { status: 'REVOKED' }
  });
}
