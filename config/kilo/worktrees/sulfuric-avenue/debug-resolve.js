// Test the resolveRealPath function and the full flow
import { realpathSync } from 'fs';
import { join } from 'path';

// Copy the exact functions from governance/index.js
function resolveRealPath(targetPath) {
  try {
    return realpathSync(targetPath);
  } catch {
    // File doesn't exist yet — resolve normally
    return targetPath;
  }
}

function isSensitivePath(filePath, projectRoot) {
  // Convert to absolute path first (handles both absolute and relative inputs)
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);

  // Now make it relative to project root
  const relPath = path.relative(projectRoot, absolutePath);

  // Resolve symlinks to get the real path
  const realAbsolutePath = resolveRealPath(absolutePath);
  const realRelPath = path.relative(projectRoot, realAbsolutePath);

  // Check against patterns
  try {
    const SENSITIVE_PATH_PATTERNS = [/(^|\/)\.env(\.|$)/i, /(^|\/)\.env\./i];
    return SENSITIVE_PATH_PATTERNS.some(
      (pattern) => pattern.test(realRelPath) || pattern.test('/' + realRelPath)
    );
  } catch (err) {
    // If resolving symlinks fails, fall back to the original path
    return SENSITIVE_PATH_PATTERNS.some(
      (pattern) => pattern.test(relPath) || pattern.test('/' + relPath)
    );
  }
}

// Create test scenario
const testDir = './debug-resolve';
const { mkdirSync, writeFileSync, symlinkSync, rmSync } = await import('fs');
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

console.log('Test directory:', testDir);
console.log('.env file:', envPath);
console.log('Symlink file:', linkPath);

// Test the functions
const projectRoot = testDir; // In the actual code, this is set in constructor

console.log('\n=== Testing resolveRealPath directly ===');
console.log('envPath:', envPath);
console.log('linkPath:', linkPath);
console.log('resolveRealPath(envPath):', resolveRealPath(envPath));
console.log('resolveRealPath(linkPath):', resolveRealPath(linkPath));
console.log('Are they equal?', resolveRealPath(envPath) === resolveRealPath(linkPath));

console.log('\n=== Testing isSensitivePath function ===');
console.log("isSensitivePath('.env', projectRoot):", isSensitivePath('.env', projectRoot));
console.log(
  "isSensitivePath('config.json', projectRoot):",
  isSensitivePath('config.json', projectRoot)
);

// Let's also trace the exact steps for config.json
console.log('\n=== Detailed trace for config.json ===');
const filePath = 'config.json';
console.log('1. filePath:', filePath);
const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
console.log('2. absolutePath:', absolutePath);
const relPath = path.relative(projectRoot, absolutePath);
console.log('3. relPath:', relPath);
const realAbsolutePath = resolveRealPath(absolutePath);
console.log('4. realAbsolutePath:', realAbsolutePath);
const realRelPath = path.relative(projectRoot, realAbsolutePath);
console.log('5. realRelPath:', realRelPath);

// Check patterns manually
const SENSITIVE_PATH_PATTERNS = [/(^|\/)\.env(\.|$)/i, /(^|\/)\.env\./i];
console.log('6. Checking patterns:');
let matchFound = false;
SENSITIVE_PATH_PATTERNS.forEach((pattern, i) => {
  const match1 = pattern.test(realRelPath);
  const match2 = pattern.test('/' + realRelPath);
  if (match1 || match2) {
    console.log(
      `   Pattern ${i} matches: ${pattern} (test(realRelPath)=${match1}, test('/'+realRelPath)=${match2})`
    );
    matchFound = true;
  }
});
if (!matchFound) {
  console.log('   No patterns matched');
}
console.log('   Result:', matchFound ? 'SENSITIVE' : 'NOT SENSITIVE');

// Cleanup
try {
  unlinkSync(linkPath);
  unlinkSync(envPath);
  rmdirSync(testDir);
} catch (e) {
  console.log('Cleanup error:', e.message);
}
