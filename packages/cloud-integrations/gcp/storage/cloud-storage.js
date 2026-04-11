// Copyright (c) 2026 Ultra-Dex — GCP Cloud Storage

import { Storage } from '@google-cloud/storage';

export class GCPCloudStorage {
  constructor(config = {}) {
    this.storage = new Storage({
      projectId: config.projectId || process.env.GCP_PROJECT_ID,
      keyFilename: config.keyFilename || process.env.GCP_KEY_FILE,
    });
    this.bucketName = config.bucketName || process.env.GCP_STORAGE_BUCKET;
    this.bucket = this.storage.bucket(this.bucketName);
  }

  async upload(fileName, data, options = {}) {
    const file = this.bucket.file(fileName);
    const stream = file.createWriteStream({
      metadata: {
        contentType: options.contentType || 'application/octet-stream',
        metadata: options.metadata || {},
      },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', async () => {
        try {
          const [metadata] = await file.getMetadata();
          resolve({
            name: metadata.name,
            size: metadata.size,
            contentType: metadata.contentType,
            timeCreated: metadata.timeCreated,
            updated: metadata.updated,
          });
        } catch (error) {
          reject(error);
        }
      });

      stream.end(data);
    });
  }

  async download(fileName) {
    const file = this.bucket.file(fileName);
    const [data] = await file.download();
    const [metadata] = await file.getMetadata();

    return {
      data,
      contentType: metadata.contentType,
      size: metadata.size,
      timeCreated: metadata.timeCreated,
      updated: metadata.updated,
      metadata: metadata.metadata || {},
    };
  }

  async delete(fileName) {
    const file = this.bucket.file(fileName);
    await file.delete();
    return { name: fileName };
  }

  async list(prefix = '') {
    const [files] = await this.bucket.getFiles({ prefix });
    return files.map((file) => ({
      name: file.name,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      timeCreated: file.metadata.timeCreated,
      updated: file.metadata.updated,
    }));
  }

  // Store traces and data persistence
  async storeTrace(traceId, traceData) {
    const fileName = `traces/${traceId}.json`;
    const data = JSON.stringify(traceData);
    return this.upload(fileName, data, { contentType: 'application/json' });
  }

  async getTrace(traceId) {
    const fileName = `traces/${traceId}.json`;
    const result = await this.download(fileName);
    return JSON.parse(result.data.toString());
  }

  async storeData(dataId, data) {
    const fileName = `data/${dataId}.json`;
    const dataStr = JSON.stringify(data);
    return this.upload(fileName, dataStr, { contentType: 'application/json' });
  }

  async getData(dataId) {
    const fileName = `data/${dataId}.json`;
    const result = await this.download(fileName);
    return JSON.parse(result.data.toString());
  }
}
