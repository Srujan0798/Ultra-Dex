// Copyright (c) 2026 Ultra-Dex

let s3Client = null;
let signer = null;
let storageConfig = {
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  bucket: process.env.S3_BUCKET,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
};

async function ensureClient() {
  if (s3Client && signer) return { s3Client, signer };

  const s3Mod = await import('@aws-sdk/client-s3');
  const presignMod = await import('@aws-sdk/s3-request-presigner');

  const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
  } = s3Mod;

  const { getSignedUrl } = presignMod;

  if (!storageConfig.bucket) {
    throw new Error('[storage] S3 bucket is required (S3_BUCKET)');
  }

  s3Client = new S3Client({
    region: storageConfig.region,
    endpoint: storageConfig.endpoint,
    forcePathStyle: storageConfig.forcePathStyle,
    credentials:
      storageConfig.accessKeyId && storageConfig.secretAccessKey
        ? {
            accessKeyId: storageConfig.accessKeyId,
            secretAccessKey: storageConfig.secretAccessKey,
          }
        : undefined,
  });

  signer = {
    getSignedUrl,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
  };

  return { s3Client, signer };
}

function normalizeBody(body) {
  if (typeof body === 'string' || body instanceof Uint8Array || body instanceof Buffer) {
    return body;
  }
  return JSON.stringify(body);
}

export function configureStorage(config = {}) {
  storageConfig = { ...storageConfig, ...config };
  s3Client = null;
  signer = null;
}

export async function upload(key, body, contentType = 'application/octet-stream') {
  const { s3Client, signer } = await ensureClient();
  const command = new signer.PutObjectCommand({
    Bucket: storageConfig.bucket,
    Key: key,
    Body: normalizeBody(body),
    ContentType: contentType,
  });

  await s3Client.send(command);
  return { key, bucket: storageConfig.bucket };
}

export async function download(key) {
  const { s3Client, signer } = await ensureClient();
  const command = new signer.GetObjectCommand({
    Bucket: storageConfig.bucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  const chunks = [];

  if (response.Body && response.Body[Symbol.asyncIterator]) {
    for await (const chunk of response.Body) {
      chunks.push(Buffer.from(chunk));
    }
  }

  return {
    key,
    contentType: response.ContentType,
    body: Buffer.concat(chunks),
  };
}

export async function deleteObject(key) {
  const { s3Client, signer } = await ensureClient();
  const command = new signer.DeleteObjectCommand({
    Bucket: storageConfig.bucket,
    Key: key,
  });
  await s3Client.send(command);
  return { deleted: true, key };
}

export async function listObjects(prefix = '') {
  const { s3Client, signer } = await ensureClient();
  const command = new signer.ListObjectsV2Command({
    Bucket: storageConfig.bucket,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);
  return {
    items: (response.Contents || []).map((entry) => ({
      key: entry.Key,
      size: entry.Size,
      lastModified: entry.LastModified,
      etag: entry.ETag,
    })),
  };
}

export async function getSignedUrl(key, expiresIn = 3600) {
  const { s3Client, signer } = await ensureClient();
  const command = new signer.GetObjectCommand({
    Bucket: storageConfig.bucket,
    Key: key,
  });

  const url = await signer.getSignedUrl(s3Client, command, {
    expiresIn,
  });

  return {
    key,
    expiresIn,
    url,
  };
}
