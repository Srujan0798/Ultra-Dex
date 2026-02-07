import { prisma } from './prisma';

const SUPPORTED_MEDIA = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'application/pdf',
];

export function isSupportedMediaType(mimeType: string) {
  return SUPPORTED_MEDIA.includes(mimeType);
}

export async function createMedia(
  ownerId: string,
  data: { url: string; type: string }
) {
  if (!isSupportedMediaType(data.type)) {
    throw new Error('Unsupported media type');
  }

  return prisma.media.create({
    data: {
      ownerId,
      url: data.url,
      type: data.type,
    },
  });
}

export async function listMedia(ownerId: string) {
  return prisma.media.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteMedia(mediaId: string, ownerId: string) {
  return prisma.media.deleteMany({
    where: { id: mediaId, ownerId },
  });
}

export function prepareUpload(fileName: string) {
  const base = process.env.MEDIA_UPLOAD_BASE_URL || 'https://uploads.example.com';
  const path = encodeURIComponent(fileName);
  return {
    uploadUrl: `${base}/upload/${path}`,
    publicUrl: `${base}/files/${path}`,
  };
}
