// Debug the patterns and the resolution
import { GovernanceEngine } from './src/platform/cli/governance/index.js';
import { mkdirSync, writeFileSync, symlinkSync, rmSync } from 'fs';
import { join } from 'path';
import path from 'path';
import { realpathSync } from 'fs';

// Create test directory
const testDir = './debug-patterns';
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

// Let's access the SENSITIVE_PATH_PATTERNS from the module
// We can't directly, but we can log what the method does step by step by copying the logic

const filePath = 'config.json'; // relative path as passed to isSensitivePath
console.log('\nfilePath:', filePath);

// Step 1: Convert to absolute path
const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(gov.projectRoot, filePath);
console.log('absolutePath:', absolutePath);

// Step 2: Resolve symlinks
let realAbsolutePath;
try {
  realAbsolutePath = realpathSync(absolutePath);
  console.log('realAbsolutePath (after realpathSync):', realAbsolutePath);
} catch (err) {
  console.log('Error in realpathSync:', err.message);
  realAbsolutePath = absolutePath;
}

// Step 3: Get relative path from project root
const realRelPath = path.relative(gov.projectRoot, realAbsolutePath);
console.log('realRelPath:', realRelPath);

// Step 4: Check patterns
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
console.log('\nChecking patterns:');
SENSITIVE_PATH_PATTERNS.forEach((pattern, i) => {
  const matches = pattern.test(realRelPath) || pattern.test('/' + realRelPath);
  if (matches) {
    console.log(`  Pattern ${i}: ${pattern} -> MATCH`);
  }
});
const anyMatch = SENSITIVE_PATH_PATTERNS.some(
  (pattern) => pattern.test(realRelPath) || pattern.test('/' + realRelPath)
);
console.log('\nAny pattern matches:', anyMatch);

// Now let's see what the actual method returns
console.log('\nActual gov.isSensitivePath(filePath):', gov.isSensitivePath(filePath));

// Cleanup
try {
  rmSync(testDir, { recursive: true, force: true });
} catch (e) {}
