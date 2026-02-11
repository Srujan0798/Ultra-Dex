/**
 * @fileoverview S3 module
 * @module upload/s3
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const generateUploadUrl = async (key: string, contentType: string) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const generateDownloadUrl = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const getPublicUrl = (key: string) => {
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

export const generateUniqueKey = (filename: string, userId: string) => {
  const timestamp = Date.now();
  const ext = filename.split('.').pop();
  return `uploads/${userId}/${timestamp}.${ext}`;
};

/**
 * Error handler for s3
 * @param {Error} error - Error to handle
 */
function handleS3Error(error) {
  try {
    console.error('[s3]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
