import { prisma } from '../lib/prisma';
import { restoreVersion } from '../lib/versioning';

export async function listRevisions(contentId: string, authorId: string) {
  const content = await prisma.content.findFirst({
    where: { id: contentId, authorId },
  });
  if (!content) throw new Error('Content not found');

  return prisma.contentVersion.findMany({
    where: { contentId },
    orderBy: { versionNumber: 'desc' },
  });
}

export async function restorePostRevision(
  contentId: string,
  versionNumber: number,
  authorId: string
) {
  const content = await prisma.content.findFirst({
    where: { id: contentId, authorId },
  });
  if (!content) throw new Error('Content not found');

  return restoreVersion(contentId, versionNumber);
}
