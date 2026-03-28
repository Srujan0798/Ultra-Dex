// Debug the isSensitivePath method directly
import { GovernanceEngine } from './src/platform/cli/governance/index.js';
import { mkdirSync, writeFileSync, symlinkSync, unlinkSync, rmdirSync, realpathSync } from 'fs';
import { join } from 'path';

// Create test directory
const testDir = './debug-is-sensitive';
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

console.log('Project root:', gov.projectRoot);
console.log('.env file:', envPath);
console.log('Symlink file:', linkPath);
console.log('Symlink target:', realpathSync(linkPath));
console.log('');

console.log('--- Testing isSensitivePath directly ---');
console.log("isSensitivePath('.env'):", gov.isSensitivePath('.env'));
console.log("isSensitivePath('config.json'):", gov.isSensitivePath('config.json'));

// Let's also test the normalizeTarget method to see what it does
console.log('');
console.log('--- Testing normalizeTarget ---');
console.log("normalizeTarget('.env'):", gov.normalizeTarget('.env'));
console.log("normalizeTarget('config.json'):", gov.normalizeTarget('config.json'));

// And test the absolute path conversion inside isSensitivePath by mimicking the first steps
console.log('');
console.log('--- Manual steps of isSensitivePath for symlink ---');
const filePath = 'config.json'; // relative input
console.log('Input filePath:', filePath);

// Step 1: absolutePath
const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(gov.projectRoot, filePath);
console.log('1. absolutePath:', absolutePath);

// Step 2: relPath (relative to project root)
const relPath = path.relative(gov.projectRoot, absolutePath);
console.log('2. relPath:', relPath);

// Step 3: realAbsolutePath (resolve symlinks)
let realAbsolutePath;
try {
  realAbsolutePath = realpathSync(absolutePath);
  console.log('3. realAbsolutePath (after realpathSync):', realAbsolutePath);
} catch (err) {
  console.log('3. Error in realpathSync:', err.message);
  realAbsolutePath = absolutePath;
}

// Step 4: realRelPath (relative to project root of the real path)
const realRelPath = path.relative(gov.projectRoot, realAbsolutePath);
console.log('4. realRelPath:', realRelPath);

// Step 5: Check patterns
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
console.log('\n5. Checking patterns against realRelPath:', realRelPath);
SENSITIVE_PATH_PATTERNS.forEach((pattern, i) => {
  const matches = pattern.test(realRelPath) || pattern.test('/' + realRelPath);
  if (matches) {
    console.log(`   Pattern ${i} matches: ${pattern}`);
  }
});
const anyMatch = SENSITIVE_PATH_PATTERNS.some(
  (pattern) => pattern.test(realRelPath) || pattern.test('/' + realRelPath)
);
console.log('   Any pattern matches:', anyMatch);

// Now compare with the actual method
console.log('\n--- Actual method result ---');
console.log("gov.isSensitivePath('config.json'):", gov.isSensitivePath('config.json'));

// Cleanup
try {
  unlinkSync(linkPath);
  unlinkSync(envPath);
  rmdirSync(testDir);
  console.log('Cleanup completed.');
} catch (e) {
  console.log('Cleanup error:', e.message);
}
