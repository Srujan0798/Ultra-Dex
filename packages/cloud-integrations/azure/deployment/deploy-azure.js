#!/usr/bin/env node

// Copyright (c) 2026 Ultra-Dex — Azure Deployment Script

import { AzureFunctions } from '../deployment/azure-functions.js';
import { AzureBlobStorage } from '../storage/blob-storage.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function deployToAzure() {
  console.log('🚀 Deploying Ultra-Dex to Azure...');

  try {
    // Initialize Azure services
    const functions = new AzureFunctions();
    const storage = new AzureBlobStorage();

    // Read function code
    const functionCode = readFileSync(join(__dirname, '../../apps/cli/bin/ultra-dex.js'));
    const codeString = functionCode.toString();

    // Create function app and deploy function
    console.log('📦 Creating Azure Function...');
    const functionResult = await functions.deployUltraDexFunction(
      codeString,
      'ultra-dex-functions',
      'ultra-dex-serverless'
    );
    console.log('✅ Azure Function created:', functionResult.name);

    // Deploy worker function if exists
    try {
      const workerCode = readFileSync(join(__dirname, '../../apps/cli/lib/worker.js'));
      const workerCodeString = workerCode.toString();

      const workerFunction = await functions.deployWorkerFunction(
        workerCodeString,
        'ultra-dex-functions',
        'ultra-dex-worker'
      );
      console.log('✅ Worker function created:', workerFunction.name);
    } catch (error) {
      console.log('⚠️  Worker function not found, skipping...');
    }

    console.log('🎉 Ultra-Dex successfully deployed to Azure!');
  } catch (error) {
    console.error('❌ Azure deployment failed:', error.message);
    process.exit(1);
  }
}

async function undeployFromAzure() {
  console.log('🗑️  Undeploying Ultra-Dex from Azure...');

  try {
    const functions = new AzureFunctions();

    // Delete functions
    await functions.deleteFunction('ultra-dex-functions', 'ultra-dex-serverless');
    console.log('✅ Deleted ultra-dex-serverless function');

    try {
      await functions.deleteFunction('ultra-dex-functions', 'ultra-dex-worker');
      console.log('✅ Deleted ultra-dex-worker function');
    } catch (error) {
      console.log('⚠️  Worker function not found');
    }

    console.log('🎉 Ultra-Dex successfully undeployed from Azure!');
  } catch (error) {
    console.error('❌ Azure undeployment failed:', error.message);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'deploy':
    deployToAzure();
    break;
  case 'undeploy':
    undeployFromAzure();
    break;
  default:
    console.log('Usage: node azure-deploy.js [deploy|undeploy]');
    process.exit(1);
}
