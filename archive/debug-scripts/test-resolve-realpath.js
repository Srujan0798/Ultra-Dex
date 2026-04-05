// Test the resolveRealPath function from governance/index.js
import { realpathSync } from 'fs';
import { join } from 'path';

// Copy the exact function from governance/index.js
function resolveRealPath(targetPath) {
  try {
    return realpathSync(targetPath);
  } catch {
    // File doesn't exist yet — resolve normally
    // Note: In the actual code, this uses path.resolve, but we need to know what the base is
    // For this test, we'll assume the base is the project root
    // But actually, looking at the code, it's called with an already-resolved absolute path
    // So we should just return the targetPath as-is if realpathSync fails
    return targetPath;
  }
}

// Create test directory
const testDir = './test-resolve-realpath';
const { mkdirSync, writeFileSync, symlinkSync, rmSync } = require('fs');
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

console.log('Testing resolveRealPath function:');
console.log('envPath:', envPath);
console.log('linkPath:', linkPath);
console.log('resolveRealPath(envPath):', resolveRealPath(envPath));
console.log('resolveRealPath(linkPath):', resolveRealPath(linkPath));
console.log('Are they equal?', resolveRealPath(envPath) === resolveRealPath(linkPath));

// Cleanup
try {
  unlinkSync(linkPath);
  unlinkSync(envPath);
  rmdirSync(testDir);
} catch (e) {
  console.log('Cleanup error:', e.message);
}
