import { createMedia, deleteMedia, listMedia, prepareUpload } from '../lib/media';

export async function uploadMedia(
  ownerId: string,
  data: { fileName: string; mimeType: string; url?: string }
) {
  const { uploadUrl, publicUrl } = prepareUpload(data.fileName);
  const mediaUrl = data.url ?? publicUrl;

  const media = await createMedia(ownerId, { url: mediaUrl, type: data.mimeType });

  return {
    media,
    uploadUrl,
  };
}

export async function getMedia(ownerId: string) {
  return listMedia(ownerId);
}

export async function removeMedia(ownerId: string, mediaId: string) {
  return deleteMedia(mediaId, ownerId);
}
