import { prisma } from './prisma.js';
import crypto from "crypto";
const SUPPORTED_MEDIA = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf"
];
const DEFAULT_MAX_MEDIA_SIZE = 25 * 1024 * 1024;
class MediaValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "MediaValidationError";
  }
}
function isSupportedMediaType(mimeType) {
  return SUPPORTED_MEDIA.includes(mimeType);
}
function assertValidUrl(url) {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new MediaValidationError("Only http/https media URLs are allowed");
    }
  } catch {
    throw new MediaValidationError("Invalid media URL");
  }
}
function getMaxMediaSize() {
  const value = Number.parseInt(process.env.MEDIA_MAX_SIZE_BYTES || "", 10);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return DEFAULT_MAX_MEDIA_SIZE;
}
function sanitizeFileName(fileName) {
  const normalized = fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "-");
  return normalized || "upload.bin";
}
async function createMedia(ownerId, data) {
  if (!ownerId?.trim()) {
    throw new MediaValidationError("ownerId is required");
  }
  if (!isSupportedMediaType(data.type)) {
    throw new MediaValidationError("Unsupported media type");
  }
  assertValidUrl(data.url);
  if (typeof data.size === "number") {
    if (data.size <= 0) {
      throw new MediaValidationError("Media size must be greater than 0");
    }
    if (data.size > getMaxMediaSize()) {
      throw new MediaValidationError(
        `Media exceeds max size of ${getMaxMediaSize()} bytes`
      );
    }
  }
  if (data.contentId) {
    const exists = await prisma.content.findUnique({
      where: { id: data.contentId },
      select: { id: true }
    });
    if (!exists) {
      throw new MediaValidationError("contentId does not reference existing content");
    }
  }
  return prisma.media.create({
    data: {
      ownerId: ownerId.trim(),
      url: data.url.trim(),
      type: data.type,
      size: data.size,
      metadata: data.metadata,
      contentId: data.contentId
    }
  });
}
async function listMedia(ownerId, options = {}) {
  if (!ownerId?.trim()) {
    throw new MediaValidationError("ownerId is required");
  }
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
  const where = {
    ownerId: ownerId.trim(),
    ...options.type ? { type: options.type } : {},
    ...options.contentId ? { contentId: options.contentId } : {}
  };
  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.media.count({ where })
  ]);
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}
async function getMedia(mediaId, ownerId) {
  if (!mediaId?.trim() || !ownerId?.trim()) {
    throw new MediaValidationError("mediaId and ownerId are required");
  }
  const media = await prisma.media.findUnique({
    where: { id: mediaId }
  });
  if (!media || media.ownerId !== ownerId) {
    throw new MediaValidationError("Media not found");
  }
  return media;
}
async function deleteMedia(mediaId, ownerId) {
  const media = await getMedia(mediaId, ownerId);
  return prisma.media.delete({
    where: { id: media.id }
  });
}
function prepareUpload(fileName, options = {}) {
  if (!fileName?.trim()) {
    throw new MediaValidationError("fileName is required");
  }
  if (options.mimeType && !isSupportedMediaType(options.mimeType)) {
    throw new MediaValidationError("Unsupported media type");
  }
  if (typeof options.size === "number" && options.size > getMaxMediaSize()) {
    throw new MediaValidationError(
      `Media exceeds max size of ${getMaxMediaSize()} bytes`
    );
  }
  const base = process.env.MEDIA_UPLOAD_BASE_URL || "https://uploads.example.com";
  const safeName = sanitizeFileName(fileName);
  const key = `${options.ownerId || "public"}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const encodedKey = encodeURIComponent(key);
  return {
    key,
    uploadUrl: `${base}/upload/${encodedKey}`,
    publicUrl: `${base}/files/${encodedKey}`,
    expiresInSeconds: 900
  };
}
async function attachMediaToContent(mediaId, ownerId, contentId) {
  const media = await getMedia(mediaId, ownerId);
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) {
    throw new MediaValidationError("Content not found");
  }
  return prisma.media.update({
    where: { id: media.id },
    data: { contentId }
  });
}
async function detachMediaFromContent(mediaId, ownerId) {
  const media = await getMedia(mediaId, ownerId);
  return prisma.media.update({
    where: { id: media.id },
    data: { contentId: null }
  });
}
async function deleteAllMediaForOwner(ownerId) {
  if (!ownerId?.trim()) {
    throw new MediaValidationError("ownerId is required");
  }
  return prisma.media.deleteMany({
    where: { ownerId: ownerId.trim() }
  });
}
async function pruneOrphanedMedia() {
  return prisma.media.deleteMany({
    where: {
      contentId: null,
      createdAt: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3)
      }
    }
  });
}
async function listMediaByContent(contentId, ownerId) {
  return prisma.media.findMany({
    where: {
      contentId,
      ...ownerId ? { ownerId } : {}
    },
    orderBy: { createdAt: "desc" }
  });
}
export {
  MediaValidationError,
  attachMediaToContent,
  createMedia,
  deleteAllMediaForOwner,
  deleteMedia,
  detachMediaFromContent,
  getMedia,
  isSupportedMediaType,
  listMedia,
  listMediaByContent,
  prepareUpload,
  pruneOrphanedMedia
};
