// tests/global-setup.js
// Global setup for Ultra-Dex tests

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

let originalDir;

export async function setup() {
  console.log('🌍 Global setup started...');
  
  // Save original directory
  originalDir = process.cwd();
  
  // Change to project root
  process.chdir('/Users/roshwinram/Music/Ultra-Dex');
  
  // Set up environment variables
  process.env.NODE_ENV = 'test';
  process.env.ULTRADEX_TEST_MODE = 'true';
  process.env.MOCK_EXTERNAL_SERVICES = 'true';
  
  // Create a test-specific configuration if needed
  const testConfigPath = join(tmpdir(), 'ultra-dex-test-config.json');
  const testConfig = {
    metaLayer: {
      version: '6.0.0-test',
      name: 'Ultra-Dex Test Instance',
      mode: 'test'
    },
    aiProviders: {
      openai: { enabled: false },
      anthropic: { enabled: false },
      google: { enabled: false },
      ollama: { enabled: true, baseUrl: 'http://localhost:11434' }
    },
    security: {
      enableSandbox: true,
      allowedDomains: ['localhost', '127.0.0.1']
    },
    memory: {
      storage: 'memory',
      enableCompression: false,
      enableEncryption: false
    }
  };
  
  writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
  process.env.ULTRADEX_CONFIG_PATH = testConfigPath;
  
  console.log('✅ Global setup completed');
  console.log(`📁 Working in: ${process.cwd()}`);
  console.log(`📋 Test config: ${testConfigPath}`);
}

export async function teardown() {
  console.log('🌍 Global teardown started...');
  
  // Restore original directory
  if (originalDir) {
    process.chdir(originalDir);
  }
  
  // Clean up environment variables
  delete process.env.ULTRADEX_TEST_MODE;
  delete process.env.MOCK_EXTERNAL_SERVICES;
  delete process.env.ULTRADEX_CONFIG_PATH;
  
  console.log('✅ Global teardown completed');
}