import { createMedia, deleteMedia, listMedia, prepareUpload } from '../lib/media.js';
async function uploadMedia(ownerId, data) {
  const { uploadUrl, publicUrl } = prepareUpload(data.fileName);
  const mediaUrl = data.url ?? publicUrl;
  const media = await createMedia(ownerId, { url: mediaUrl, type: data.mimeType });
  return {
    media,
    uploadUrl,
  };
}
async function getMedia(ownerId) {
  return listMedia(ownerId);
}
async function removeMedia(ownerId, mediaId) {
  return deleteMedia(mediaId, ownerId);
}
function handleMediaError(error) {
  try {
    console.error('[media]', error instanceof Error ? error.message : String(error));
  } catch (_) {}
}
export { getMedia, removeMedia, uploadMedia };
