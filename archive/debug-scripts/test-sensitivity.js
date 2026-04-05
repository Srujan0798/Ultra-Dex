// Test script to debug isSensitivePath
import { GovernanceEngine } from './src/platform/cli/governance/index.js';
import { mkdirSync, writeFileSync, symlinkSync, rmSync } from 'fs';
import { join } from 'path';

// Create test directory
const testDir = './test-sensitivity';
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

// Test governance
const gov = new GovernanceEngine(testDir);
console.log('projectRoot:', gov.projectRoot);

// Test direct .env access
console.log('\n--- Testing .env file ---');
const envResult = gov.isSensitivePath(envPath);
console.log('isSensitivePath(.env):', envResult);

// Test symlink access
console.log('\n--- Testing symlink ---');
const linkResult = gov.isSensitivePath(linkPath);
console.log('isSensitivePath(symlink):', linkResult);

// Let's also test isPathSafe
console.log('\n--- Testing path safety ---');
const safeEnv = gov.isPathSafe(envPath);
const safeLink = gov.isPathSafe(linkPath);
console.log('isPathSafe(.env):', safeEnv);
console.log('isPathSafe(symlink):', safeLink);

// Test authorization
console.log('\n--- Testing authorization ---');
const authEnv = gov.authorize('backend', 'read', envPath);
const authLink = gov.authorize('backend', 'read', linkPath);
console.log('authorize(.env):', authEnv);
console.log('authorize(symlink):', authLink);

// Cleanup
try {
  rmSync(testDir, { recursive: true, force: true });
} catch (e) {}
