/**
 * @fileoverview Versions module
 * @module api/versions
 */

import { prisma } from '../lib/prisma';
import { createVersion } from '../lib/versioning';

export async function getPostVersions(contentId: string) {
  return prisma.contentVersion.findMany({
    where: { contentId },
    orderBy: { versionNumber: 'desc' },
  });
}

export async function rollbackPost(contentId: string, versionNumber: number) {
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

/**
 * Error handler for versions
 * @param {Error} error - Error to handle
 */
function handleVersionsError(error: Error | unknown) {
  try {
    console.error('[versions]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
