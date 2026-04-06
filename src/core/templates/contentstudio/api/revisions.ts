/**
 * @fileoverview Revisions module
 * @module api/revisions
 */

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

/**
 * Error handler for revisions
 * @param {Error} error - Error to handle
 */
function handleRevisionsError(error: Error | unknown) {
  try {
    console.error('[revisions]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
