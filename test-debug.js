// Test the actual logic step by step
import { GovernanceEngine } from './src/platform/cli/governance/index.js';
import { mkdirSync, writeFileSync, symlinkSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import path from 'path';
import { realpathSync } from 'fs';

// Create test directory
const testDir = './test-debug';
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
console.log('envPath:', envPath);
console.log('linkPath:', linkPath);
console.log('');

// Test what normalizeTarget does
console.log('=== normalizeTarget tests ===');
const normEnv = gov.normalizeTarget(envPath);
const normLink = gov.normalizeTarget(linkPath);
console.log('normalizeTarget(envPath):', normEnv);
console.log('normalizeTarget(linkPath):', normLink);
console.log('');

// Now test isSensitivePath step by step for the symlink
console.log('=== isSensitivePath step by step for symlink ===');
const filePath = normLink; // This is what gets passed to isSensitivePath
console.log('1. filePath (normalized):', filePath);
const relPath = path.isAbsolute(filePath) ? path.relative(gov.projectRoot, filePath) : filePath;
console.log('2. relPath:', relPath);
const projectRootResolved = resolve(gov.projectRoot, relPath);
console.log('3. projectRoot + relPath:', projectRootResolved);
try {
  const absolutePath = realpathSync(projectRootResolved);
  console.log('4. realpathSync result:', absolutePath);
  const realRelPath = path.relative(gov.projectRoot, absolutePath);
  console.log('5. realRelPath:', realRelPath);
  const SENSITIVE_PATH_PATTERNS = [/(^|\/)\.env(\.|$)/i, /(^|\/)\.env\./i];
  const matches = SENSITIVE_PATH_PATTERNS.some(
    (pattern) => pattern.test(realRelPath) || pattern.test('/' + realRelPath)
  );
  console.log('6. Matches sensitive pattern:', matches);
} catch (err) {
  console.log('4. ERROR in realpathSync:', err.message);
}

// Test the actual method
console.log('\n=== Actual isSensitivePath result ===');
console.log('gov.isSensitivePath(linkPath):', gov.isSensitivePath(linkPath));

// Test with the actual .env path too
console.log('\n=== For comparison, .env file ===');
console.log('gov.isSensitivePath(envPath):', gov.isSensitivePath(envPath));

// Cleanup
try {
  rmSync(testDir, { recursive: true, force: true });
} catch (e) {}
