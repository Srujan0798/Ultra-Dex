import { prisma } from './prisma.js';
async function createVersion(contentId) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content)
    throw new Error("Content not found");
  const latest = await prisma.contentVersion.findFirst({
    where: { contentId },
    orderBy: { versionNumber: "desc" }
  });
  const nextVersion = (latest?.versionNumber || 0) + 1;
  return prisma.contentVersion.create({
    data: {
      contentId,
      versionNumber: nextVersion,
      content: content.body
    }
  });
}
async function restoreVersion(contentId, versionNumber) {
  const version = await prisma.contentVersion.findUnique({
    where: { contentId_versionNumber: { contentId, versionNumber } }
  });
  if (!version)
    throw new Error("Version not found");
  return prisma.content.update({
    where: { id: contentId },
    data: { body: version.content, status: "draft" }
  });
}
async function createRevisionFromPost(contentId) {
  return createVersion(contentId);
}
async function restoreRevision(contentId, revisionId) {
  return restoreVersion(contentId, revisionId);
}
function diff(before, after) {
  if (before === after)
    return [];
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const max = Math.max(beforeLines.length, afterLines.length);
  const changes = [];
  for (let i = 0; i < max; i += 1) {
    if (beforeLines[i] !== afterLines[i]) {
      changes.push({
        line: i + 1,
        before: beforeLines[i],
        after: afterLines[i]
      });
    }
  }
  return changes;
}
function handleVersioningError(error) {
  try {
    console.error("[versioning]", error instanceof Error ? error.message : String(error));
  } catch (_) {
  }
}
export {
  createRevisionFromPost,
  createVersion,
  diff,
  restoreRevision,
  restoreVersion
};
