#!/usr/bin/env node

// Copyright (c) 2026 Ultra-Dex — AWS Deployment Script

import { AWSLambda } from '../deployment/lambda.js';
import { AWSS3Storage } from '../storage/s3-storage.js';
import { AWSCloudWatch } from '../monitoring/cloudwatch.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function deployToAWS() {
  console.log('🚀 Deploying Ultra-Dex to AWS...');

  try {
    // Initialize AWS services
    const lambda = new AWSLambda();
    const s3 = new AWSS3Storage();
    const cloudwatch = new AWSCloudWatch();

    // Read function code
    const functionCode = readFileSync(join(__dirname, '../../apps/cli/bin/ultra-dex.js'));

    // Create Lambda function
    console.log('📦 Creating Lambda function...');
    const lambdaFunction = await lambda.createFunction(
      'ultra-dex-serverless',
      functionCode,
      'handler',
      'nodejs20.x'
    );
    console.log('✅ Lambda function created:', lambdaFunction.functionName);

    // Set up monitoring
    console.log('📊 Setting up CloudWatch monitoring...');
    await cloudwatch.putMetric('Deployment', 1, [{ name: 'Service', value: 'Ultra-Dex' }], 'Count');

    // Deploy worker function if exists
    try {
      const workerCode = readFileSync(join(__dirname, '../../apps/cli/lib/worker.js'));
      const workerFunction = await lambda.createFunction(
        'ultra-dex-worker',
        workerCode,
        'worker.handler',
        'nodejs20.x'
      );
      console.log('✅ Worker function created:', workerFunction.functionName);
    } catch (error) {
      console.log('⚠️  Worker function not found, skipping...');
    }

    console.log('🎉 Ultra-Dex successfully deployed to AWS!');
    console.log(
      '🔗 Function URL:',
      `https://${lambdaFunction.functionName}.lambda-url.amazonaws.com/`
    );
  } catch (error) {
    console.error('❌ AWS deployment failed:', error.message);
    process.exit(1);
  }
}

async function undeployFromAWS() {
  console.log('🗑️  Undeploying Ultra-Dex from AWS...');

  try {
    const lambda = new AWSLambda();

    // Delete functions
    await lambda.client.deleteFunction({ FunctionName: 'ultra-dex-serverless' });
    console.log('✅ Deleted ultra-dex-serverless function');

    try {
      await lambda.client.deleteFunction({ FunctionName: 'ultra-dex-worker' });
      console.log('✅ Deleted ultra-dex-worker function');
    } catch (error) {
      console.log('⚠️  Worker function not found');
    }

    console.log('🎉 Ultra-Dex successfully undeployed from AWS!');
  } catch (error) {
    console.error('❌ AWS undeployment failed:', error.message);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'deploy':
    deployToAWS();
    break;
  case 'undeploy':
    undeployFromAWS();
    break;
  default:
    console.log('Usage: node aws-deploy.js [deploy|undeploy]');
    process.exit(1);
}
