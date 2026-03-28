// Test the fixed isSensitivePath with correct paths
import { GovernanceEngine } from './src/platform/cli/governance/index.js';
import { mkdirSync, writeFileSync, symlinkSync, rmSync } from 'fs';
import { join } from 'path';

// Create test directory
const testDir = './test-fixed';
try {
  rmSync(testDir, { recursive: true, force: true });
} catch (e) {}
mkdirSync(testDir, { recursive: true });

// Create .env file
const envPath = join(testDir, '.env');
writeFileSync(envPath, 'SECRET=test\n');

// Create symlink to .env
const linkPath = join(testDir, 'config.json');
symlinkSync(envPath, linkPath);

// Test governance - note we pass paths relative to project root
const gov = new GovernanceEngine(testDir);
console.log('projectRoot:', gov.projectRoot);
console.log('Testing with relative paths from project root:');
console.log('  .env file: .env');
console.log('  symlink: config.json');
console.log('');

// Test isSensitivePath
console.log('=== isSensitivePath ===');
const envResult = gov.isSensitivePath('.env');
const linkResult = gov.isSensitivePath('config.json');
console.log('isSensitivePath(.env):', envResult);
console.log('isSensitivePath(config.json):', linkResult);

// Test isPathSafe
console.log('\n=== isPathSafe ===');
const safeEnv = gov.isPathSafe('.env');
const safeLink = gov.isPathSafe('config.json');
console.log('isPathSafe(.env):', safeEnv);
console.log('isPathSafe(config.json):', safeLink);

// Test authorization
console.log('\n=== authorize ===');
const authEnv = gov.authorize('backend', 'read', '.env');
const authLink = gov.authorize('backend', 'read', 'config.json');
console.log('authorize(.env):', authEnv);
console.log('authorize(config.json):', authLink);

// Also test with absolute paths to make sure they work
console.log('\n=== Testing with absolute paths ===');
const absEnv = gov.authorize('backend', 'read', envPath);
const absLink = gov.authorize('backend', 'read', linkPath);
console.log('authorize(absolute .env):', absEnv);
console.log('authorize(absolute symlink):', absLink);

// Cleanup
try {
  rmSync(testDir, { recursive: true, force: true });
} catch (e) {}
