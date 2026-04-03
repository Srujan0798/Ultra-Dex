// Copyright (c) 2026 Ultra-Dex — Azure Blob Storage

import { BlobServiceClient } from '@azure/storage-blob';

export class AzureBlobStorage {
  constructor(config = {}) {
    this.connectionString = config.connectionString || process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = config.containerName || process.env.AZURE_STORAGE_CONTAINER || 'ultra-dex';
    this.blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
  }

  async upload(blobName, data, options = {}) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: options.contentType || 'application/octet-stream',
      },
      metadata: options.metadata || {},
    };

    try {
      const result = await blockBlobClient.upload(data, data.length, uploadOptions);
      return {
        blobName,
        etag: result.etag,
        lastModified: result.lastModified,
        requestId: result.requestId,
      };
    } catch (error) {
      throw new Error(`Azure Blob upload error: ${error.message}`);
    }
  }

  async download(blobName) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    try {
      const downloadResponse = await blockBlobClient.download();
      const data = await this._streamToBuffer(downloadResponse.readableStreamBody);
      const properties = await blockBlobClient.getProperties();

      return {
        data,
        contentType: properties.contentType,
        size: properties.contentLength,
        lastModified: properties.lastModified,
        metadata: properties.metadata || {},
      };
    } catch (error) {
      throw new Error(`Azure Blob download error: ${error.message}`);
    }
  }

  async delete(blobName) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    try {
      const result = await blockBlobClient.delete();
      return {
        blobName,
        requestId: result.requestId,
      };
    } catch (error) {
      throw new Error(`Azure Blob delete error: ${error.message}`);
    }
  }

  async list(prefix = '') {
    const blobs = [];
    for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
      blobs.push({
        name: blob.name,
        size: blob.properties.contentLength,
        contentType: blob.properties.contentType,
        lastModified: blob.properties.lastModified,
        metadata: blob.metadata || {},
      });
    }
    return blobs;
  }

  async _streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  // Store traces and data persistence
  async storeTrace(traceId, traceData) {
    const blobName = `traces/${traceId}.json`;
    const data = Buffer.from(JSON.stringify(traceData));
    return this.upload(blobName, data, { contentType: 'application/json' });
  }

  async getTrace(traceId) {
    const blobName = `traces/${traceId}.json`;
    const result = await this.download(blobName);
    return JSON.parse(result.data.toString());
  }

  async storeData(dataId, data) {
    const blobName = `data/${dataId}.json`;
    const dataStr = Buffer.from(JSON.stringify(data));
    return this.upload(blobName, dataStr, { contentType: 'application/json' });
  }

  async getData(dataId) {
    const blobName = `data/${dataId}.json`;
    const result = await this.download(blobName);
    return JSON.parse(result.data.toString());
  }
}
