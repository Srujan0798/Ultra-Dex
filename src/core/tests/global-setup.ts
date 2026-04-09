import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
let originalDir;
async function setup() {
  console.log('\u{1F30D} Global setup started...');
  originalDir = process.cwd();
  process.chdir('/Users/roshwinram/Music/Ultra-Dex');
  process.env.NODE_ENV = 'test';
  process.env.ULTRADEX_TEST_MODE = 'true';
  process.env.MOCK_EXTERNAL_SERVICES = 'true';
  const testConfigPath = join(tmpdir(), 'ultra-dex-test-config.json');
  const testConfig = {
    metaLayer: {
      version: '6.0.0-test',
      name: 'Ultra-Dex Test Instance',
      mode: 'test',
    },
    aiProviders: {
      openai: { enabled: false },
      anthropic: { enabled: false },
      google: { enabled: false },
      ollama: { enabled: true, baseUrl: 'http://localhost:11434' },
    },
    security: {
      enableSandbox: true,
      allowedDomains: ['localhost', '127.0.0.1'],
    },
    memory: {
      storage: 'memory',
      enableCompression: false,
      enableEncryption: false,
    },
  };
  writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
  process.env.ULTRADEX_CONFIG_PATH = testConfigPath;
  console.log('\u2705 Global setup completed');
  console.log(`\u{1F4C1} Working in: ${process.cwd()}`);
  console.log(`\u{1F4CB} Test config: ${testConfigPath}`);
}
async function teardown() {
  console.log('\u{1F30D} Global teardown started...');
  if (originalDir) {
    process.chdir(originalDir);
  }
  delete process.env.ULTRADEX_TEST_MODE;
  delete process.env.MOCK_EXTERNAL_SERVICES;
  delete process.env.ULTRADEX_CONFIG_PATH;
  console.log('\u2705 Global teardown completed');
}
export { setup, teardown };
