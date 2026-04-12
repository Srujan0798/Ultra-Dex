/**
 * @fileoverview Content module
 * @module api/content
 */

import { prisma } from '../lib/prisma';
import { createVersion } from '../lib/versioning';
import { slugify } from '../lib/slugify';

export async function createContent(
  authorId: string,
  data: { title: string; body: string; status?: string; categoryId?: string }
) {
  const slug = slugify(data.title);

  return prisma.content.create({
    data: {
      title: data.title,
      slug,
      body: data.body,
      status: data.status ?? 'draft',
      authorId,
      categoryId: data.categoryId,
    },
  });
}

export async function updateContent(
  contentId: string,
  authorId: string,
  data: { title?: string; body?: string; status?: string; categoryId?: string }
) {
  const content = await prisma.content.findFirst({
    where: { id: contentId, authorId },
  });

  if (!content) throw new Error('Content not found');

  await createVersion(contentId);

  return prisma.content.update({
    where: { id: contentId },
    data: {
      title: data.title ?? content.title,
      slug: data.title ? slugify(data.title) : content.slug,
      body: data.body ?? content.body,
      status: data.status ?? content.status,
      categoryId: data.categoryId ?? content.categoryId,
      publishedAt:
        data.status === 'published' && !content.publishedAt ? new Date() : content.publishedAt,
    },
  });
}

export async function publishContent(contentId: string, authorId: string) {
  return prisma.content.updateMany({
    where: { id: contentId, authorId },
    data: { status: 'published', publishedAt: new Date() },
  });
}

export async function listContent(authorId: string, status?: string) {
  return prisma.content.findMany({
    where: {
      authorId,
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Error handler for content
 * @param {Error} error - Error to handle
 */
function handleContentError(error) {
  try {
    console.error('[content]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
