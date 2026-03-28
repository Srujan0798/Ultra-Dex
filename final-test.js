// Final test for symlink protection in governance
const { GovernanceEngine } = require('./src/platform/cli/governance/index.js');
const { mkdirSync, writeFileSync, symlinkSync, rmSync, unlinkSync, realpathSync } = require('fs');
const { join } = require('path');

console.log('=== Testing Symlink Protection in Governance ===\n');

// Create test directory
const testDir = './final-test';
try {
  rmSync(testDir, { recursive: true, force: true });
} catch (e) {}
mkdirSync(testDir, { recursive: true });

// Create .env file
const envPath = join(testDir, '.env');
writeFileSync(envPath, 'SECRET=test\n');
console.log('✓ Created .env file');

// Create symlink to .env
const linkPath = join(testDir, 'config.json');
symlinkSync(envPath, linkPath);
console.log('✓ Created symlink from config.json to .env');

// Test governance
const gov = new GovernanceEngine(testDir);

// Test 1: Direct access to .env should be blocked
console.log('\n--- Test 1: Direct .env access ---');
const directResult = gov.authorize('backend', 'read', '.env');
console.log(`Result: ${directResult.allowed ? 'ALLOWED' : 'BLOCKED'}`);
console.log(`Reason: ${directResult.reason}`);
const test1Pass = !directResult.allowed;
console.log(`Expected: BLOCKED → ${test1Pass ? '✓ PASS' : '✗ FAIL'}`);

// Test 2: Access via symlink should also be blocked
console.log('\n--- Test 2: Symlink access ---');
const symlinkResult = gov.authorize('backend', 'read', 'config.json');
console.log(`Result: ${symlinkResult.allowed ? 'ALLOWED' : 'BLOCKED'}`);
console.log(`Reason: ${symlinkResult.reason}`);
const test2Pass = !symlinkResult.allowed;
console.log(`Expected: BLOCKED → ${test2Pass ? '✓ PASS' : '✗ FAIL'}`);

// Test 3: Normal file should be allowed
console.log('\n--- Test 3: Normal file access ---');
const normalPath = join(testDir, 'normal.txt');
writeFileSync(normalPath, 'normal content\n');
const normalResult = gov.authorize('backend', 'read', 'normal.txt');
console.log(`Result: ${normalResult.allowed ? 'ALLOWED' : 'BLOCKED'}`);
console.log(`Reason: ${normalResult.reason}`);
const test3Pass = normalResult.allowed;
console.log(`Expected: ALLOWED → ${test3Pass ? '✓ PASS' : '✗ FAIL'}`);

// Test 4: Destructive command patterns
console.log('\n--- Test 4: Destructive command patterns ---');
const rmRfResult = gov.authorize('devops', 'execute', 'rm -rf /tmp/test');
const rmFrResult = gov.authorize('devops', 'execute', 'rm -fr /tmp/test');
const rmRecForceResult = gov.authorize('devops', 'execute', 'rm --recursive --force /tmp/test');
const rmForceRecResult = gov.authorize('devops', 'execute', 'rm --force --recursive /tmp/test');
const lsResult = gov.authorize('devops', 'execute', 'ls -la');

console.log(`rm -rf /tmp/test: ${rmRfResult.allowed ? 'ALLOWED' : 'BLOCKED'}`);
console.log(`rm -fr /tmp/test: ${rmFrResult.allowed ? 'ALLOWED' : 'BLOCKED'}`);
console.log(
  `rm --recursive --force /tmp/test: ${rmRecForceResult.allowed ? 'ALLOWED' : 'BLOCKED'}`
);
console.log(
  `rm --force --recursive /tmp/test: ${rmForceRecResult.allowed ? 'ALLOWED' : 'BLOCKED'}`
);
console.log(`ls -la: ${lsResult.allowed ? 'ALLOWED' : 'BLOCKED'}`);

const test4Pass =
  !rmRfResult.allowed &&
  !rmFrResult.allowed &&
  !rmRecForceResult.allowed &&
  !rmForceRecResult.allowed &&
  lsResult.allowed;

console.log(`Expected: rm* BLOCKED, ls ALLOWED → ${test4Pass ? '✓ PASS' : '✗ FAIL'}`);

// Cleanup
try {
  unlinkSync(linkPath);
  unlinkSync(envPath);
  unlinkSync(normalPath);
  rmdirSync(testDir);
  console.log('\n✓ Cleanup completed');
} catch (e) {
  console.log('\n✗ Cleanup error:', e.message);
}

// Overall result
const allPass = test1Pass && test2Pass && test3Pass && test4Pass;
console.log('\n' + '='.repeat(50));
console.log(`FINAL RESULT: ${allPass ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
console.log('='.repeat(50));

process.exit(allPass ? 0 : 1);
