/**
 * @fileoverview Versioning module
 * @module lib/versioning
 */

import { prisma } from './prisma';

export async function createVersion(contentId: string) {
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) throw new Error('Content not found');

  const latest = await prisma.contentVersion.findFirst({
    where: { contentId },
    orderBy: { versionNumber: 'desc' },
  });

  const nextVersion = (latest?.versionNumber || 0) + 1;

  return prisma.contentVersion.create({
    data: {
      contentId,
      versionNumber: nextVersion,
      content: content.body,
    },
  });
}

export async function restoreVersion(contentId: string, versionNumber: number) {
  const version = await prisma.contentVersion.findUnique({
    where: { contentId_versionNumber: { contentId, versionNumber } },
  });

  if (!version) throw new Error('Version not found');

  return prisma.content.update({
    where: { id: contentId },
    data: { body: version.content, status: 'draft' },
  });
}

// Compatibility aliases for legacy calls
export async function createRevisionFromPost(contentId: string) {
  return createVersion(contentId);
}

export async function restoreRevision(contentId: string, revisionId: number) {
  return restoreVersion(contentId, revisionId);
}

export function diff(before: string, after: string) {
  if (before === after) return [];
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const max = Math.max(beforeLines.length, afterLines.length);
  const changes = [] as Array<{ line: number; before?: string; after?: string }>;

  for (let i = 0; i < max; i += 1) {
    if (beforeLines[i] !== afterLines[i]) {
      changes.push({
        line: i + 1,
        before: beforeLines[i],
        after: afterLines[i],
      });
    }
  }

  return changes;
}

/**
 * Error handler for versioning
 * @param {Error} error - Error to handle
 */
function handleVersioningError(error) {
  try {
    console.error('[versioning]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
