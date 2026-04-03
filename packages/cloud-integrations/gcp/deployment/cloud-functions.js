// Copyright (c) 2026 Ultra-Dex — GCP Cloud Functions

import { CloudFunctionsServiceClient } from '@google-cloud/functions';

export class GCPCloudFunctions {
  constructor(config = {}) {
    this.client = new CloudFunctionsServiceClient({
      projectId: config.projectId || process.env.GCP_PROJECT_ID,
      keyFilename: config.keyFilename || process.env.GCP_KEY_FILE,
    });
    this.projectId = config.projectId || process.env.GCP_PROJECT_ID;
    this.location = config.location || process.env.GCP_LOCATION || 'us-central1';
  }

  async createFunction(functionName, sourceCode, options = {}) {
    const location = `projects/${this.projectId}/locations/${this.location}`;
    const functionPath = `${location}/functions/${functionName}`;

    const functionData = {
      name: functionPath,
      description: options.description || 'Ultra-Dex serverless function',
      sourceArchiveUrl: options.sourceArchiveUrl,
      sourceRepository: options.sourceRepository,
      entryPoint: options.entryPoint || 'handler',
      runtime: options.runtime || 'nodejs20',
      timeout: options.timeout || '60s',
      availableMemoryMb: options.memoryMb || 256,
      environmentVariables: {
        NODE_ENV: 'production',
        ...options.environmentVariables,
      },
      httpsTrigger: options.httpsTrigger || {},
      maxInstances: options.maxInstances || 100,
    };

    if (sourceCode) {
      // For inline code, we'd need to upload to GCS first
      // This is simplified - in practice, you'd upload code to GCS
      functionData.sourceArchiveUrl = sourceCode;
    }

    const request = {
      location,
      function: functionData,
    };

    try {
      const [operation] = await this.client.createFunction(request);
      const [response] = await operation.promise();
      return {
        name: response.name,
        status: response.status,
        entryPoint: response.entryPoint,
        runtime: response.runtime,
        timeout: response.timeout,
        availableMemoryMb: response.availableMemoryMb,
      };
    } catch (error) {
      throw new Error(`Cloud Functions create error: ${error.message}`);
    }
  }

  async callFunction(functionName, data = {}) {
    const functionPath = `projects/${this.projectId}/locations/${this.location}/functions/${functionName}`;

    const request = {
      name: functionPath,
      data: JSON.stringify(data),
    };

    try {
      const [response] = await this.client.callFunction(request);
      return {
        executionId: response.executionId,
        result: response.result,
        error: response.error,
      };
    } catch (error) {
      throw new Error(`Cloud Functions call error: ${error.message}`);
    }
  }

  async deleteFunction(functionName) {
    const functionPath = `projects/${this.projectId}/locations/${this.location}/functions/${functionName}`;

    const request = {
      name: functionPath,
    };

    try {
      const [operation] = await this.client.deleteFunction(request);
      await operation.promise();
      return { name: functionName };
    } catch (error) {
      throw new Error(`Cloud Functions delete error: ${error.message}`);
    }
  }

  async listFunctions() {
    const location = `projects/${this.projectId}/locations/${this.location}`;

    const request = {
      parent: location,
    };

    try {
      const [response] = await this.client.listFunctions(request);
      return response.map((func) => ({
        name: func.name,
        status: func.status,
        entryPoint: func.entryPoint,
        runtime: func.runtime,
        timeout: func.timeout,
        availableMemoryMb: func.availableMemoryMb,
      }));
    } catch (error) {
      throw new Error(`Cloud Functions list error: ${error.message}`);
    }
  }

  // Deploy Ultra-Dex as serverless functions
  async deployUltraDexFunction(sourceCode, functionName = 'ultra-dex-serverless') {
    return this.createFunction(functionName, sourceCode, {
      entryPoint: 'index.handler',
      runtime: 'nodejs20',
      description: 'Ultra-Dex main serverless function',
    });
  }

  async deployWorkerFunction(sourceCode, functionName = 'ultra-dex-worker') {
    return this.createFunction(functionName, sourceCode, {
      entryPoint: 'worker.handler',
      runtime: 'nodejs20',
      description: 'Ultra-Dex worker function',
    });
  }
}
