// Test resolveRealPath function directly
import { realpathSync } from 'fs';
import { join } from 'path';

// Copy the exact function from governance/index.js
function resolveRealPath(targetPath) {
  try {
    return realpathSync(targetPath);
  } catch {
    // File doesn't exist yet — resolve normally
    return targetPath; // Note: This is what the actual code does
  }
}

// Create test scenario
const testDir = './test-resolve-direct';
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

console.log('Testing resolveRealPath:');
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
