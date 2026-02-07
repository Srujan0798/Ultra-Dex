import { prisma } from '../lib/prisma';
import { slugify } from '../lib/slugify';
import { createVersion } from '../lib/versioning';

export async function createPost(authorId: string, title: string, body = '') {
  const slug = slugify(title);
  return prisma.content.create({
    data: {
      title,
      slug,
      body,
      status: 'draft',
      authorId,
    },
  });
}

export async function updatePost(
  id: string,
  data: { title?: string; body?: string; status?: string; categoryId?: string }
) {
  const existing = await prisma.content.findUnique({ where: { id } });
  if (!existing) throw new Error('Content not found');

  if (data.body && data.body !== existing.body) {
    await createVersion(id);
  }

  return prisma.content.update({
    where: { id },
    data: {
      title: data.title ?? existing.title,
      slug: data.title ? slugify(data.title) : existing.slug,
      body: data.body ?? existing.body,
      status: data.status ?? existing.status,
      categoryId: data.categoryId ?? existing.categoryId,
      publishedAt:
        data.status === 'published' && !existing.publishedAt
          ? new Date()
          : existing.publishedAt,
    },
  });
}

export async function getPost(slug: string) {
  return prisma.content.findUnique({
    where: { slug },
    include: { author: true, category: true, tags: true },
  });
}

export async function deletePost(id: string) {
  return prisma.content.delete({ where: { id } });
}
