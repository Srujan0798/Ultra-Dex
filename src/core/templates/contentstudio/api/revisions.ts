import { prisma } from '../lib/prisma.js';
import { restoreVersion } from '../lib/versioning.js';
async function listRevisions(contentId, authorId) {
  const content = await prisma.content.findFirst({
    where: { id: contentId, authorId },
  });
  if (!content) throw new Error('Content not found');
  return prisma.contentVersion.findMany({
    where: { contentId },
    orderBy: { versionNumber: 'desc' },
  });
}
async function restorePostRevision(contentId, versionNumber, authorId) {
  const content = await prisma.content.findFirst({
    where: { id: contentId, authorId },
  });
  if (!content) throw new Error('Content not found');
  return restoreVersion(contentId, versionNumber);
}
function handleRevisionsError(error) {
  try {
    console.error('[revisions]', error instanceof Error ? error.message : String(error));
  } catch (_) {}
}
export { listRevisions, restorePostRevision };
