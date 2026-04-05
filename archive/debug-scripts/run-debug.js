// Simple debug script to test isSensitivePath
import { GovernanceEngine } from './src/platform/cli/governance/index.js';
import { mkdirSync, writeFileSync, symlinkSync } from 'fs';
import { join } from 'path';

// Create test directory
const testDir = './run-debug';
try {
  require('fs').rmdirSync(testDir, { recursive: true, force: true });
} catch (e) {}
require('fs').mkdirSync(testDir, { recursive: true });

// Create .env file
const envPath = join(testDir, '.env');
require('fs').writeFileSync(envPath, 'SECRET=test\n');

// Create symlink to .env
const linkPath = join(testDir, 'config.json');
require('fs').symlinkSync(envPath, linkPath);

// Create governance engine
const gov = new GovernanceEngine(testDir);

// Test isSensitivePath directly
console.log('Testing isSensitivePath:');
console.log('isSensitivePath(\".env\"):', gov.isSensitivePath('.env'));
console.log('isSensitivePath(\"config.json\"):', gov.isSensitivePath('config.json'));

// Let's also test what the normalized target is
console.log('\\nTesting normalizeTarget:');
console.log('normalizeTarget(\".env\"):', gov.normalizeTarget('.env'));
console.log('normalizeTarget(\"config.json\"):', gov.normalizeTarget('config.json'));

// Test authorize
console.log('\\nTesting authorize:');
const envAuth = gov.authorize('backend', 'read', '.env');
console.log('authorize(\"backend\", \"read\", \".env\"):', envAuth);

const linkAuth = gov.authorize('backend', 'read', 'config.json');
console.log('authorize(\"backend\", \"read\", \"config.json\"):', linkAuth);

// Cleanup
try {
  require('fs').unlinkSync(linkPath);
  require('fs').unlinkSync(envPath);
  require('fs').rmdirSync(testDir);
  console.log('\\nCleanup completed');
} catch (e) {
  console.log('\\nCleanup error:', e.message);
}
