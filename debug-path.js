// Debug the path resolution logic directly
import { join, resolve } from 'path';
import { realpathSync } from 'fs';

// Simulate the exact scenario from our test
const projectRoot = '/Users/srujansai/Desktop/Ultra-Dex/debug-is-sensitive';
console.log('Project root:', projectRoot);

// This is what we get after normalizeTarget('config.json')
const filePath = 'config.json';
console.log('\nInput filePath:', filePath);

// Step 1 in isSensitivePath: Convert to absolute path
const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
console.log('Step 1 - absolutePath:', absolutePath);

// Step 2: Make it relative to project root
const relPath = path.relative(projectRoot, absolutePath);
console.log('Step 2 - relPath:', relPath);

// Step 3: Resolve symlinks
let realAbsolutePath;
try {
  realAbsolutePath = realpathSync(absolutePath);
  console.log('Step 3 - realAbsolutePath:', realAbsolutePath);
} catch (err) {
  console.log('Step 3 - Error resolving symlinks:', err.message);
  realAbsolutePath = absolutePath;
}

// Step 4: Make relative again from project root
const realRelPath = path.relative(projectRoot, realAbsolutePath);
console.log('Step 4 - realRelPath:', realRelPath);

// Let's also check what the actual files are on disk
console.log('\n=== Checking actual files ===');
const { existsSync, lstatSync, readlinkSync } = require('fs');
const envPath = join(projectRoot, '.env');
const linkPath = join(projectRoot, 'config.json');

console.log('.env file exists:', existsSync(envPath));
console.log('config.json file exists:', existsSync(linkPath));

if (existsSync(linkPath)) {
  console.log('config.json is symbolic link:', lstatSync(linkPath).isSymbolicLink());
  if (lstatSync(linkPath).isSymbolicLink()) {
    try {
      const target = readlinkSync(linkPath);
      console.log('config.json points to:', target);
      console.log('Target exists:', existsSync(join(projectRoot, target)));
    } catch (err) {
      console.log('Error reading symlink:', err.message);
    }
  }
}

// Now let's check what resolveRealPath function in governance does
console.log('\n=== Testing resolveRealPath function ===');
// Copy the resolveRealPath function from governance/index.js
function resolveRealPath(targetPath) {
  try {
    return realpathSync(targetPath);
  } catch {
    // File doesn't exist yet — resolve normally
    return resolve(targetPath);
  }
}

console.log('resolveRealPath(absolutePath):', resolveRealPath(absolutePath));
console.log('resolveRealPath(linkPath):', resolveRealPath(linkPath));

// Cleanup
try {
  const { unlinkSync, rmdirSync } = require('fs');
  unlinkSync(linkPath);
  unlinkSync(envPath);
  rmdirSync(projectRoot);
} catch (e) {
  // Ignore cleanup errors
}
