// Test script to verify symlink fix in governance
import { GovernanceEngine } from './src/platform/cli/governance/index.js';
import { mkdirSync, writeFileSync, symlinkSync, rmSync, realpathSync } from 'fs';
import { join } from 'path';

// Create test directory
const testDir = './test-symlink-fix';
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
(async () => {
  const gov = new GovernanceEngine(testDir);
  await gov.init(); // Initialize the governance engine

  console.log('Testing symlink protection in governance engine...');
  console.log('Project root:', gov.projectRoot);
  console.log('.env file exists at:', envPath);
  console.log('Symlink exists at:', linkPath);
  console.log('Symlink points to:', realpathSync(linkPath));
  console.log('');

  // Test 1: Direct access to .env should be blocked
  console.log('Test 1: Direct access to .env file');
  const directResult = gov.authorize('backend', 'read', '.env');
  console.log(`  Result: ${directResult.allowed ? 'ALLOWED' : 'BLOCKED'} - ${directResult.reason}`);
  console.log(`  Expected: BLOCKED - ${directResult.allowed === false ? '✓ PASS' : '✗ FAIL'}`);
  console.log('');

  // Test 2: Access via symlink should also be blocked (this is the key fix)
  console.log('Test 2: Access via symlink to .env');
  const symlinkResult = gov.authorize('backend', 'read', 'config.json');
  console.log(
    `  Result: ${symlinkResult.allowed ? 'ALLOWED' : 'BLOCKED'} - ${symlinkResult.reason}`
  );
  console.log(`  Expected: BLOCKED - ${symlinkResult.allowed === false ? '✓ PASS' : '✗ FAIL'}`);
  console.log('');

  // Test 3: Path safety check with symlink
  console.log('Test 3: Path safety check');
  const safeResult = gov.authorize('backend', 'read', 'config.json');
  // For path safety, we expect it to be allowed (since it's within project root)
  // The sensitivity check should block it
  console.log(`  Result: ${safeResult.allowed ? 'ALLOWED' : 'BLOCKED'} - ${safeResult.reason}`);
  console.log(
    `  Expected: BLOCKED (by sensitive path check) - ${!safeResult.allowed && safeResult.reason?.includes('sensitive file') ? '✓ PASS' : '✗ FAIL'}`
  );
  console.log('');

  // Test 4: Normal file should be allowed
  console.log('Test 4: Normal file access');
  const normalPath = join(testDir, 'normal.txt');
  writeFileSync(normalPath, 'normal content\n');
  const normalResult = gov.authorize('backend', 'read', 'normal.txt');
  console.log(`  Result: ${normalResult.allowed ? 'ALLOWED' : 'BLOCKED'} - ${normalResult.reason}`);
  console.log(`  Expected: ALLOWED - ${normalResult.allowed === true ? '✓ PASS' : '✗ FAIL'}`);
  console.log('');

  // Cleanup
  try {
    unlinkSync(linkPath);
    unlinkSync(envPath);
    unlinkSync(normalPath);
    rmdirSync(testDir);
    console.log('Cleanup completed.');
  } catch (e) {
    console.log('Cleanup error:', e.message);
  }

  // Determine overall success
  const allTestsPass =
    !directResult.allowed &&
    !symlinkResult.allowed &&
    !safeResult.allowed &&
    safeResult.reason?.includes('sensitive file') &&
    normalResult.allowed;

  console.log('='.repeat(50));
  console.log(`OVERALL RESULT: ${allTestsPass ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
  console.log('='.repeat(50));

  // Exit with appropriate code
  process.exit(allTestsPass ? 0 : 1);
})();
