// Copyright (c) 2026 Ultra-Dex
// S3-Compatible Storage Adapter

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class S3Adapter {
  constructor(config) {
    this.config = {
      region: config.region || 'us-east-1',
      accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      bucket: config.bucket || process.env.S3_BUCKET,
      endpoint: config.endpoint, // For S3-compatible services like MinIO
      forcePathStyle: config.forcePathStyle || !!config.endpoint, // Required for MinIO
    };

    this.s3Client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      ...(this.config.endpoint && { endpoint: this.config.endpoint }),
      ...(this.config.forcePathStyle && { forcePathStyle: true }),
    });
  }

  async upload(fileBuffer, fileName, options = {}) {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: fileName,
      Body: fileBuffer,
      ContentType: options.contentType || 'application/octet-stream',
      Metadata: options.metadata || {},
      ACL: options.acl || 'private', // Default to private
    });

    try {
      const response = await this.s3Client.send(command);
      return {
        success: true,
        key: fileName,
        etag: response.ETag,
        versionId: response.VersionId,
      };
    } catch (error) {
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  async download(fileName) {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: fileName,
    });

    try {
      const response = await this.s3Client.send(command);
      const buffer = await response.Body.transformToByteArray();
      return {
        success: true,
        buffer: Buffer.from(buffer),
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
      };
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        throw new Error(`File not found: ${fileName}`);
      }
      throw new Error(`S3 download failed: ${error.message}`);
    }
  }

  async delete(fileName) {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: fileName,
    });

    try {
      await this.s3Client.send(command);
      return { success: true };
    } catch (error) {
      throw new Error(`S3 delete failed: ${error.message}`);
    }
  }

  async generatePresignedUrl(fileName, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: fileName,
    });

    try {
      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return { success: true, url };
    } catch (error) {
      throw new Error(`S3 presigned URL generation failed: ${error.message}`);
    }
  }

  async healthCheck() {
    try {
      // Try to list objects (with limit 0) to check connectivity
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        MaxKeys: 0,
      });

      await this.s3Client.send(command);
      return { status: 'healthy', bucket: this.config.bucket };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Utility method to upload from a local file path
  async uploadFromFile(filePath, fileName, options = {}) {
    const fs = await import('fs');
    const fsPromises = fs.promises;

    try {
      const fileBuffer = await fsPromises.readFile(filePath);
      return await this.upload(fileBuffer, fileName, options);
    } catch (error) {
      throw new Error(`Upload from file failed: ${error.message}`);
    }
  }

  // Utility method to download to a local file path
  async downloadToFile(fileName, filePath) {
    try {
      const result = await this.download(fileName);
      const fs = await import('fs');
      const fsPromises = fs.promises;

      await fsPromises.writeFile(filePath, result.buffer);
      return { success: true, path: filePath };
    } catch (error) {
      throw new Error(`Download to file failed: ${error.message}`);
    }
  }
}

export default S3Adapter;