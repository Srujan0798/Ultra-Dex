#!/usr/bin/env node

// Copyright (c) 2026 Ultra-Dex — GCP Deployment Script

import { GCPCloudFunctions } from '../deployment/cloud-functions.js';
import { GCPCloudStorage } from '../storage/cloud-storage.js';
import { GCPCloudLogging } from '../monitoring/cloud-logging.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function deployToGCP() {
  console.log('🚀 Deploying Ultra-Dex to GCP...');

  try {
    // Initialize GCP services
    const functions = new GCPCloudFunctions();
    const storage = new GCPCloudStorage();
    const logging = new GCPCloudLogging();

    // Read function code and create source archive
    const functionCode = readFileSync(join(__dirname, '../../apps/cli/bin/ultra-dex.js'));

    // Upload source code to Cloud Storage first (simplified)
    const sourceArchiveUrl = `gs://ultra-dex-sources/ultra-dex-${Date.now()}.zip`;
    await storage.upload('sources/ultra-dex-latest.js', functionCode);

    // Create Cloud Function
    console.log('📦 Creating Cloud Function...');
    const cloudFunction = await functions.createFunction('ultra-dex-serverless', sourceArchiveUrl, {
      entryPoint: 'handler',
      runtime: 'nodejs20',
      description: 'Ultra-Dex serverless function on GCP',
    });
    console.log('✅ Cloud Function created:', cloudFunction.name);

    // Log deployment
    await logging.info('Ultra-Dex deployed to GCP', { operation: 'deployment' });

    // Deploy worker function if exists
    try {
      const workerCode = readFileSync(join(__dirname, '../../apps/cli/lib/worker.js'));
      await storage.upload('sources/ultra-dex-worker-latest.js', workerCode);

      const workerFunction = await functions.createFunction(
        'ultra-dex-worker',
        `gs://ultra-dex-sources/ultra-dex-worker-${Date.now()}.zip`,
        {
          entryPoint: 'worker.handler',
          runtime: 'nodejs20',
          description: 'Ultra-Dex worker function on GCP',
        }
      );
      console.log('✅ Worker function created:', workerFunction.name);
    } catch (error) {
      console.log('⚠️  Worker function not found, skipping...');
    }

    console.log('🎉 Ultra-Dex successfully deployed to GCP!');
  } catch (error) {
    console.error('❌ GCP deployment failed:', error.message);
    process.exit(1);
  }
}

async function undeployFromGCP() {
  console.log('🗑️  Undeploying Ultra-Dex from GCP...');

  try {
    const functions = new GCPCloudFunctions();

    // Delete functions
    await functions.deleteFunction('ultra-dex-serverless');
    console.log('✅ Deleted ultra-dex-serverless function');

    try {
      await functions.deleteFunction('ultra-dex-worker');
      console.log('✅ Deleted ultra-dex-worker function');
    } catch (error) {
      console.log('⚠️  Worker function not found');
    }

    console.log('🎉 Ultra-Dex successfully undeployed from GCP!');
  } catch (error) {
    console.error('❌ GCP undeployment failed:', error.message);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'deploy':
    deployToGCP();
    break;
  case 'undeploy':
    undeployFromGCP();
    break;
  default:
    console.log('Usage: node gcp-deploy.js [deploy|undeploy]');
    process.exit(1);
}
