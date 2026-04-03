// Copyright (c) 2026 Ultra-Dex — AWS S3 Storage Service

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

export class AWSS3Storage {
  constructor(config = {}) {
    this.client = new S3Client({
      region: config.region || process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = config.bucketName || process.env.AWS_S3_BUCKET;
  }

  async upload(key, data, options = {}) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: data,
      ContentType: options.contentType || 'application/octet-stream',
      Metadata: options.metadata || {},
    });

    try {
      const result = await this.client.send(command);
      return {
        key,
        etag: result.ETag,
        versionId: result.VersionId,
      };
    } catch (error) {
      throw new Error(`S3 upload error: ${error.message}`);
    }
  }

  async download(key) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const result = await this.client.send(command);
      const data = await result.Body.transformToByteArray();
      return {
        data,
        contentType: result.ContentType,
        metadata: result.Metadata,
        lastModified: result.LastModified,
      };
    } catch (error) {
      throw new Error(`S3 download error: ${error.message}`);
    }
  }

  async delete(key) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.client.send(command);
      return { key };
    } catch (error) {
      throw new Error(`S3 delete error: ${error.message}`);
    }
  }

  async list(prefix = '') {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    try {
      const result = await this.client.send(command);
      return result.Contents || [];
    } catch (error) {
      throw new Error(`S3 list error: ${error.message}`);
    }
  }

  // Store traces and data persistence
  async storeTrace(traceId, traceData) {
    const key = `traces/${traceId}.json`;
    const data = JSON.stringify(traceData);
    return this.upload(key, data, { contentType: 'application/json' });
  }

  async getTrace(traceId) {
    const key = `traces/${traceId}.json`;
    const result = await this.download(key);
    return JSON.parse(new TextDecoder().decode(result.data));
  }

  async storeData(dataId, data) {
    const key = `data/${dataId}.json`;
    const dataStr = JSON.stringify(data);
    return this.upload(key, dataStr, { contentType: 'application/json' });
  }

  async getData(dataId) {
    const key = `data/${dataId}.json`;
    const result = await this.download(key);
    return JSON.parse(new TextDecoder().decode(result.data));
  }
}
