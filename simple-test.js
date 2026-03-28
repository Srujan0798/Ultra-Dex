// Simple test to verify symlink and path resolution
import { GovernanceEngine } from './src/platform/cli/governance/index.js';
import { mkdirSync, writeFileSync, symlinkSync, rmSync } from 'fs';
import { join } from 'path';
import { realpathSync, readFileSync } from 'fs';
import path from 'path';

// Create test directory
const testDir = './simple-test';
try {
  rmSync(testDir, { recursive: true, force: true });
} catch (e) {}
mkdirSync(testDir, { recursive: true });

// Create .env file
const envPath = join(testDir, '.env');
writeFileSync(envPath, 'SECRET=test\n');
console.log('Created .env at:', envPath);

// Create symlink to .env
const linkPath = join(testDir, 'config.json');
symlinkSync(envPath, linkPath);
console.log('Created symlink from', linkPath, 'to', envPath);

// Verify symlink works
console.log('readFileSync(envPath):', readFileSync(envPath, 'utf8').trim());
console.log('readFileSync(linkPath):', readFileSync(linkPath, 'utf8').trim());
console.log('realpathSync(linkPath):', realpathSync(linkPath));

// Test governance
const gov = new GovernanceEngine(testDir);
console.log('\nprojectRoot:', gov.projectRoot);

// Test direct access to .env
console.log('\n--- Testing .env file ---');
const envResult = gov.isSensitivePath('.env');
console.log('isSensitivePath(.env):', envResult);

// Test access via symlink
console.log('\n--- Testing symlink ---');
const linkResult = gov.isSensitivePath('config.json');
console.log('isSensitivePath(config.json):', linkResult);

// Let's also manually trace what the function does
console.log('\n--- Manual trace ---');
const filePath = 'config.json';
console.log('Input filePath:', filePath);
const relPath = path.isAbsolute(filePath) ? path.relative(gov.projectRoot, filePath) : filePath;
console.log('relPath:', relPath);
const resolved = path.resolve(gov.projectRoot, relPath);
console.log('path.resolve(projectRoot, relPath):', resolved);
const realPath = realpathSync(resolved);
console.log('realpathSync(resolved):', realPath);
const realRel = path.relative(gov.projectRoot, realPath);
console.log('path.relative(projectRoot, realPath):', realRel);
const pattern = /(^|\/)\.env(\.|$)/i;
console.log('Testing pattern /(^|\\/)\\.env(\\.|$)/i against', realRel);
console.log('Match:', pattern.test(realRel) || pattern.test('/' + realRel));

// Cleanup
try {
  rmSync(testDir, { recursive: true, force: true });
} catch (e) {}
