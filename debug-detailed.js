// Detailed debug of the exact paths
import { mkdirSync, writeFileSync, symlinkSync } from 'fs';
import { join, resolve } from 'path';
import { realpathSync } from 'fs';

// Create test directory
const testDir = './debug-detailed';
try {
  rmSync(testDir, { recursive: true, force: true });
} catch (e) {}
mkdirSync(testDir, { recursive: true });

console.log('Test directory:', testDir);

// Create .env file
const envPath = join(testDir, '.env');
writeFileSync(envPath, 'SECRET=test\n');
console.log('1. Created .env at:', envPath);

// Create symlink to .env
const linkPath = join(testDir, 'config.json');
symlinkSync(envPath, linkPath);
console.log('2. Created symlink from:', linkPath, 'to', envPath);

// Verify the symlink
console.log('3. Symlink verification:');
console.log('   linkPath exists:', true); // We just created it
console.log('   envPath exists:', true); // We just created it
const { lstatSync, readlinkSync } = await import('fs');
if (lstatSync(linkPath).isSymbolicLink()) {
  const target = readlinkSync(linkPath);
  console.log('   symlink target:', target);
  console.log('   target exists:', true); // We know it exists
}

// Now let's trace EXACTLY what happens in isSensitivePath
const projectRoot = resolve(testDir);
console.log('\n=== TRACING isSensitivePath ===');
console.log('projectRoot:', projectRoot);

const filePath = 'config.json'; // This is what normalizeTarget returns for 'config.json'
console.log('Input filePath (after normalizeTarget):', filePath);

// Step 1: Convert to absolute path
const absolutePath = path.isAbsolute(filePath) ? filePath : resolve(projectRoot, filePath);
console.log('Step 1 - absolutePath:', absolutePath);

// Step 2: Make relative to project root
const relPath = path.relative(projectRoot, absolutePath);
console.log('Step 2 - relPath:', relPath);

// Step 3: Resolve symlinks to get the real path
let realAbsolutePath;
try {
  realAbsolutePath = realpathSync(absolutePath);
  console.log('Step 3 - realAbsolutePath (after realpathSync):', realAbsolutePath);
} catch (err) {
  console.log('Step 3 - Error in realpathSync:', err.message);
  realAbsolutePath = absolutePath; // fallback
}

// Step 4: Make relative again from project root
const realRelPath = path.relative(projectRoot, realAbsolutePath);
console.log('Step 4 - realRelPath:', realRelPath);

// Step 5: Check against patterns
const SENSITIVE_PATH_PATTERNS = [/(^|\/)\.env(\.|$)/i, /(^|\/)\.env\./i];

console.log('\nStep 5 - Checking patterns against realRelPath:', realRelPath);
SENSITIVE_PATH_PATTERNS.forEach((pattern, i) => {
  const match1 = pattern.test(realRelPath);
  const match2 = pattern.test('/' + realRelPath);
  if (match1 || match2) {
    console.log(`  Pattern ${i}: ${pattern} -> MATCH`);
  }
});
const anyMatch = SENSITIVE_PATH_PATTERNS.some(
  (pattern) => pattern.test(realRelPath) || pattern.test('/' + realRelPath)
);
console.log('   Any pattern matches:', anyMatch);

// Let's also double-check by computing what .env would give us
console.log('\n=== FOR COMPARISON: Tracing .env ===');
const envFilePath = '.env';
const envAbsolutePath = path.isAbsolute(envFilePath)
  ? envFilePath
  : resolve(projectRoot, envFilePath);
console.log('env absolutePath:', envAbsolutePath);
const envRelPath = path.relative(projectRoot, envAbsolutePath);
console.log('env relPath:', envRelPath);
let envRealAbsolutePath;
try {
  envRealAbsolutePath = realpathSync(envAbsolutePath);
  console.log('env realAbsolutePath:', envRealAbsolutePath);
} catch (err) {
  envRealAbsolutePath = envAbsolutePath;
}
const envRealRelPath = path.relative(projectRoot, envRealAbsolutePath);
console.log('env realRelPath:', envRealRelPath);
const envAnyMatch = SENSITIVE_PATH_PATTERNS.some(
  (pattern) => pattern.test(envRealRelPath) || pattern.test('/' + envRealRelPath)
);
console.log('env pattern matches:', envAnyMatch);

// Cleanup
try {
  const { unlinkSync, rmdirSync } = await import('fs');
  unlinkSync(linkPath);
  unlinkSync(envPath);
  rmdirSync(testDir);
  console.log('4. Cleanup completed');
} catch (e) {
  console.log('4. Cleanup error:', e.message);
}
