#!/usr/bin/env node

// Copyright (c) 2026 Ultra-Dex — Multi-Cloud Deployment Script

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const providers = ['aws', 'gcp', 'azure'];

async function deployToCloud(provider, command = 'deploy') {
  if (!providers.includes(provider)) {
    console.error(`❌ Unknown provider: ${provider}`);
    console.log(`Available providers: ${providers.join(', ')}`);
    process.exit(1);
  }

  const scriptPath = join(__dirname, `${provider}/deployment/deploy-${provider}.js`);

  console.log(`🚀 Deploying to ${provider.toUpperCase()}...`);

  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, command], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${provider.toUpperCase()} deployment completed successfully!`);
        resolve();
      } else {
        console.error(`❌ ${provider.toUpperCase()} deployment failed with code ${code}`);
        reject(new Error(`Deployment failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ ${provider.toUpperCase()} deployment error:`, error.message);
      reject(error);
    });
  });
}

async function deployToAll(command = 'deploy') {
  console.log(`🚀 Deploying Ultra-Dex to all cloud providers (${command})...`);

  for (const provider of providers) {
    try {
      await deployToCloud(provider, command);
    } catch (error) {
      console.error(`❌ Failed to ${command} on ${provider}:`, error.message);
      // Continue with other providers
    }
  }

  console.log(`🎉 Multi-cloud ${command} process completed!`);
}

async function showStatus() {
  console.log('📊 Cloud Deployment Status:');
  console.log('');

  for (const provider of providers) {
    try {
      const scriptPath = join(__dirname, `${provider}/deployment/deploy-${provider}.js`);

      // This would need to be implemented in each provider script
      console.log(`${provider.toUpperCase()}: Status check not implemented yet`);
    } catch (error) {
      console.log(`${provider.toUpperCase()}: Error - ${error.message}`);
    }
  }
}

// CLI interface
const [, , provider, command] = process.argv;

if (!provider) {
  console.log('Usage: node deploy.js <provider|all> [command]');
  console.log('');
  console.log('Providers: aws, gcp, azure, all');
  console.log('Commands: deploy (default), undeploy, status');
  console.log('');
  console.log('Examples:');
  console.log('  node deploy.js aws deploy');
  console.log('  node deploy.js all undeploy');
  console.log('  node deploy.js all status');
  process.exit(1);
}

const cmd = command || 'deploy';

switch (provider) {
  case 'all':
    if (cmd === 'status') {
      showStatus();
    } else {
      deployToAll(cmd);
    }
    break;
  default:
    if (cmd === 'status') {
      console.log('Status check not implemented for individual providers yet');
    } else {
      deployToCloud(provider, cmd);
    }
    break;
}
