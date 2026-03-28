// Debug script for isSensitivePath
import { GovernanceEngine } from './src/platform/cli/governance/index.js';
import { mkdirSync, writeFileSync, symlinkSync, rmSync } from 'fs';
import { join, resolve } from 'path';
import path from 'path';
import { realpathSync } from 'fs';

// Create test directory
const testDir = './debug-sensitive';
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

// Manually trace through isSensitivePath for the symlink
console.log('\n=== MANUAL TRACE OF isSensitivePath FOR SYMLINK ===');
const filePath = linkPath;
console.log('1. filePath:', filePath);
const relPath = path.isAbsolute(filePath) ? path.relative(gov.projectRoot, filePath) : filePath;
console.log('2. relPath:', relPath);
// The absolute path is projectRoot + relPath
const absolutePathCandidate = resolve(gov.projectRoot, relPath);
console.log('3. projectRoot + relPath:', absolutePathCandidate);
let absolutePath;
try {
  absolutePath = realpathSync(absolutePathCandidate);
  console.log('4. realpathSync result:', absolutePath);
  const realRelPath = path.relative(gov.projectRoot, absolutePath);
  console.log('5. realRelPath:', realRelPath);
  console.log('6. Testing patterns against realRelPath:');
  const SENSITIVE_PATH_PATTERNS = [
    /(^|\/)\.env(\.|$)/i,
    /(^|\/)\.env\./i,
    /(^|\/)\.git(\/|$)/i,
    /(^|\/)\.ssh(\/|$)/i,
    /(^|\/)\.aws(\/|$)/i,
    /(^|\/)\.gcp(\/|$)/i,
    /(^|\/)\.azure(\/|$)/i,
    /(^|\/)\.npmrc$/i,
    /(^|\/)\.pypirc$/i,
    /(^|\/)id_rsa(\.|$)/i,
    /(^|\/)credentials?(\/|$)/i,
    /(^|\/)secrets?(\/|$)/i,
    /(^|\/).*\.(pem|key|p12|pfx|crt)$/i,
  ];
  const matches = SENSITIVE_PATH_PATTERNS.some(
    (pattern) => pattern.test(realRelPath) || pattern.test('/' + realRelPath)
  );
  console.log('7. Matches sensitive pattern:', matches);
} catch (err) {
  console.log('4. Error in realpathSync:', err.message);
  console.log('5. Falling back to testing relPath directly');
  const SENSITIVE_PATH_PATTERNS = [
    /(^|\/)\.env(\.|$)/i,
    /(^|\/)\.env\./i,
    /(^|\/)\.git(\/|$)/i,
    /(^|\/)\.ssh(\/|$)/i,
    /(^|\/)\.aws(\/|$)/i,
    /(^|\/)\.gcp(\/|$)/i,
    /(^|\/)\.azure(\/|$)/i,
    /(^|\/)\.npmrc$/i,
    /(^|\/)\.pypirc$/i,
    /(^|\/)id_rsa(\.|$)/i,
    /(^|\/)credentials?(\/|$)/i,
    /(^|\/)secrets?(\/|$)/i,
    /(^|\/).*\.(pem|key|p12|pfx|crt)$/i,
  ];
  const matches = SENSITIVE_PATH_PATTERNS.some(
    (pattern) => pattern.test(relPath) || pattern.test('/' + relPath)
  );
  console.log('6. Fallback matches sensitive pattern:', matches);
}

console.log('\n=== ACTUAL METHOD RESULT ===');
console.log('gov.isSensitivePath(linkPath):', gov.isSensitivePath(linkPath));

// Also test isPathSafe
console.log('\n=== IS PATH SAFE ===');
console.log('gov.isPathSafe(linkPath):', gov.isPathSafe(linkPath));

// Cleanup
try {
  rmSync(testDir, { recursive: true, force: true });
} catch (e) {}
