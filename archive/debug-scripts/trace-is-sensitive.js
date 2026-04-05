// Trace exactly what happens in isSensitivePath
import { GovernanceEngine } from './src/platform/cli/governance/index.js';
import { mkdirSync, writeFileSync, symlinkSync } from 'fs';
import { join, resolve } from 'path';
import { realpathSync } from 'fs';
import path from 'path';

// Create test directory
const testDir = './trace-is-sensitive';
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

// Now let's manually trace EXACTLY what happens in isSensitivePath for 'config.json'
console.log("=== TRACING isSensitivePath('config.json') ===");
const filePath = 'config.json'; // This is what gets passed after normalizeTarget
console.log('Input filePath:', filePath);

// Step 1: Convert to absolute path first (handles both absolute and relative inputs)
const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(gov.projectRoot, filePath);
console.log('Step 1 - absolutePath:', absolutePath);

// Step 2: Now make it relative to project root
const relPath = path.relative(gov.projectRoot, absolutePath);
console.log('Step 2 - relPath:', relPath);

// Step 3: Resolve symlinks to get the real path
let realAbsolutePath;
try {
  realAbsolutePath = realpathSync(absolutePath);
  console.log('Step 3 - realAbsolutePath:', realAbsolutePath);
} catch (err) {
  console.log('Step 3 - Error in realpathSync:', err.message);
  realAbsolutePath = absolutePath; // fallback
}

// Step 4: Make relative again from project root
const realRelPath = path.relative(gov.projectRoot, realAbsolutePath);
console.log('Step 4 - realRelPath:', realRelPath);

// Step 5: Check against patterns
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

console.log('\nStep 5 - Checking patterns:');
let foundMatch = false;
SENSITIVE_PATH_PATTERNS.forEach((pattern, i) => {
  const match1 = pattern.test(realRelPath);
  const match2 = pattern.test('/' + realRelPath);
  if (match1 || match2) {
    console.log(`  Pattern ${i}: ${pattern}`);
    console.log(`    test(realRelPath): ${match1}`);
    console.log(`    test('/' + realRelPath): ${match2}`);
    foundMatch = true;
  }
});

if (!foundMatch) {
  console.log('  No patterns matched');
}

console.log(
  `\nResult: ${foundMatch ? 'SENSITIVE (should be BLOCKED)' : 'NOT sensitive (would be ALLOWED)'}`
);

// Now let's see what the actual method returns
console.log('\n=== ACTUAL METHOD RESULT ===');
const actualResult = gov.isSensitivePath('config.json');
console.log(`gov.isSensitivePath('config.json'):`, actualResult);
console.log(`This means: ${actualResult ? 'SENSITIVE (BLOCKED)' : 'NOT sensitive (ALLOWED)'}`);

// Let's also check what happens with the .env file directly
console.log("\n=== FOR COMPARISON: isSensitivePath('.env') ===");
const envResult = gov.isSensitivePath('.env');
console.log(`gov.isSensitivePath('.env'):`, envResult);

// Cleanup
try {
  unlinkSync(linkPath);
  unlinkSync(envPath);
  rmdirSync(testDir);
} catch (e) {
  console.log('Cleanup error:', e.message);
}
