import { prisma } from '../lib/prisma.js';
import { createVersion } from '../lib/versioning.js';
import { slugify } from '../lib/slugify.js';
async function createContent(authorId, data) {
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
async function updateContent(contentId, authorId, data) {
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
        data.status === 'published' && !content.publishedAt
          ? /* @__PURE__ */ new Date()
          : content.publishedAt,
    },
  });
}
async function publishContent(contentId, authorId) {
  return prisma.content.updateMany({
    where: { id: contentId, authorId },
    data: { status: 'published', publishedAt: /* @__PURE__ */ new Date() },
  });
}
async function listContent(authorId, status) {
  return prisma.content.findMany({
    where: {
      authorId,
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  });
}
function handleContentError(error) {
  try {
    console.error('[content]', error instanceof Error ? error.message : String(error));
  } catch (_) {}
}
export { createContent, listContent, publishContent, updateContent };
