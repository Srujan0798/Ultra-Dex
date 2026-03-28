// Test realpathSync on a symlink
import { realpathSync, symlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

// Create a test directory
const testDir = './test-realpath-symlink';
try {
  require('fs').rmdirSync(testDir, { recursive: true, force: true });
} catch (e) {}
require('fs').mkdirSync(testDir, { recursive: true });

// Create a target file
const targetPath = join(testDir, 'target.txt');
writeFileSync(targetPath, 'hello world');

// Create a symlink to the target
const linkPath = join(testDir, 'link.txt');
symlinkSync(targetPath, linkPath);

console.log('Target file:', targetPath);
console.log('Symlink file:', linkPath);
console.log('realpathSync(targetPath):', realpathSync(targetPath));
console.log('realpathSync(linkPath):', realpathSync(linkPath));
console.log('Are they equal?', realpathSync(targetPath) === realpathSync(linkPath));

// Cleanup
try {
  require('fs').unlinkSync(linkPath);
  require('fs').unlinkSync(targetPath);
  require('fs').rmdirSync(testDir);
} catch (e) {}
