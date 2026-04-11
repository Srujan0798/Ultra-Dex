// Copyright (c) 2026 Ultra-Dex — Azure Functions

import { WebSiteManagementClient } from '@azure/arm-appservice';
import { DefaultAzureCredential } from '@azure/identity';

export class AzureFunctions {
  constructor(config = {}) {
    this.credential = config.credential || new DefaultAzureCredential();
    this.subscriptionId = config.subscriptionId || process.env.AZURE_SUBSCRIPTION_ID;
    this.resourceGroupName =
      config.resourceGroupName || process.env.AZURE_RESOURCE_GROUP || 'ultra-dex-rg';
    this.location = config.location || process.env.AZURE_LOCATION || 'eastus';
    this.client = new WebSiteManagementClient(this.credential, this.subscriptionId);
  }

  async createFunctionApp(functionAppName, options = {}) {
    const functionAppEnvelope = {
      location: this.location,
      kind: 'functionapp',
      functionAppConfig: {
        deployment: {
          storage: {
            type: 'blobContainer',
            value: options.storageConnectionString || process.env.AZURE_STORAGE_CONNECTION_STRING,
            path: options.storagePath || './function-releases',
          },
        },
        runtime: {
          name: options.runtime || 'node',
          version: options.runtimeVersion || '20',
        },
      },
      siteConfig: {
        linuxFxVersion: options.linuxFxVersion || 'NODE|20',
        appSettings: [
          {
            name: 'FUNCTIONS_WORKER_RUNTIME',
            value: 'node',
          },
          {
            name: 'WEBSITE_NODE_DEFAULT_VERSION',
            value: '20',
          },
          {
            name: 'NODE_ENV',
            value: 'production',
          },
          ...(options.appSettings || []),
        ],
      },
    };

    try {
      const result = await this.client.webApps.createOrUpdateFunctionApp(
        this.resourceGroupName,
        functionAppName,
        functionAppEnvelope
      );
      return {
        name: result.name,
        location: result.location,
        defaultHostName: result.defaultHostName,
        state: result.state,
        lastModifiedTimeUtc: result.lastModifiedTimeUtc,
      };
    } catch (error) {
      throw new Error(`Azure Functions create error: ${error.message}`);
    }
  }

  async deployFunction(functionAppName, functionName, code, options = {}) {
    // Create function configuration
    const functionConfig = {
      config: {
        bindings: [
          {
            name: 'req',
            type: 'httpTrigger',
            direction: 'in',
            authLevel: options.authLevel || 'function',
            methods: options.methods || ['get', 'post'],
          },
          {
            name: 'res',
            type: 'http',
            direction: 'out',
          },
        ],
        scriptFile: options.scriptFile || 'index.js',
        entryPoint: options.entryPoint || 'handler',
      },
      files: {
        'index.js': code,
        'function.json': JSON.stringify(functionConfig.config),
      },
    };

    try {
      const result = await this.client.webApps.createOrUpdateFunction(
        this.resourceGroupName,
        functionAppName,
        functionName,
        functionConfig
      );
      return {
        name: result.name,
        functionName: result.functionName,
        scriptHref: result.scriptHref,
        testDataHref: result.testDataHref,
        configHref: result.configHref,
      };
    } catch (error) {
      throw new Error(`Azure Functions deploy error: ${error.message}`);
    }
  }

  async listFunctions(functionAppName) {
    try {
      const result = await this.client.webApps.listFunctions(
        this.resourceGroupName,
        functionAppName
      );
      return result.map((func) => ({
        name: func.name,
        functionName: func.functionName,
        scriptHref: func.scriptHref,
        configHref: func.configHref,
      }));
    } catch (error) {
      throw new Error(`Azure Functions list error: ${error.message}`);
    }
  }

  async deleteFunction(functionAppName, functionName) {
    try {
      await this.client.webApps.deleteFunction(
        this.resourceGroupName,
        functionAppName,
        functionName
      );
      return { functionAppName, functionName };
    } catch (error) {
      throw new Error(`Azure Functions delete error: ${error.message}`);
    }
  }

  // Deploy Ultra-Dex as serverless functions
  async deployUltraDexFunction(
    code,
    functionAppName = 'ultra-dex-functions',
    functionName = 'ultra-dex-serverless'
  ) {
    // First ensure function app exists
    await this.createFunctionApp(functionAppName);
    return this.deployFunction(functionAppName, functionName, code, {
      entryPoint: 'index.handler',
    });
  }

  async deployWorkerFunction(
    code,
    functionAppName = 'ultra-dex-functions',
    functionName = 'ultra-dex-worker'
  ) {
    return this.deployFunction(functionAppName, functionName, code, {
      entryPoint: 'worker.handler',
    });
  }
}
