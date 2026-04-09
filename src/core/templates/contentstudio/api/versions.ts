import { prisma } from '../lib/prisma.js';
import { createVersion } from '../lib/versioning.js';
async function getPostVersions(contentId) {
  return prisma.contentVersion.findMany({
    where: { contentId },
    orderBy: { versionNumber: 'desc' },
  });
}
async function rollbackPost(contentId, versionNumber) {
  const version = await prisma.contentVersion.findUnique({
    where: { contentId_versionNumber: { contentId, versionNumber } },
  });
  if (!version) throw new Error('Version not found');
  await createVersion(contentId);
  return prisma.content.update({
    where: { id: contentId },
    data: { body: version.content, status: 'draft' },
  });
}
function handleVersionsError(error) {
  try {
    console.error('[versions]', error instanceof Error ? error.message : String(error));
  } catch (_) {}
}
export { getPostVersions, rollbackPost };
