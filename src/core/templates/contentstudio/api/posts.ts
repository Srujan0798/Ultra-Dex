import { prisma } from '../lib/prisma.js';
import { slugify } from '../lib/slugify.js';
import { createVersion } from '../lib/versioning.js';
async function createPost(authorId, title, body = "") {
  const slug = slugify(title);
  return prisma.content.create({
    data: {
      title,
      slug,
      body,
      status: "draft",
      authorId
    }
  });
}
async function updatePost(id, data) {
  const existing = await prisma.content.findUnique({ where: { id } });
  if (!existing)
    throw new Error("Content not found");
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
      publishedAt: data.status === "published" && !existing.publishedAt ? /* @__PURE__ */ new Date() : existing.publishedAt
    }
  });
}
async function getPost(slug) {
  return prisma.content.findUnique({
    where: { slug },
    include: { author: true, category: true, tags: true }
  });
}
async function deletePost(id) {
  return prisma.content.delete({ where: { id } });
}
function handlePostsError(error) {
  try {
    console.error("[posts]", error instanceof Error ? error.message : String(error));
  } catch (_) {
  }
}
export {
  createPost,
  deletePost,
  getPost,
  updatePost
};
