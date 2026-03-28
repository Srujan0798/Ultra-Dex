// Verify that symlinks work correctly in this environment
import { mkdirSync, writeFileSync, symlinkSync, realpathSync } from 'fs';
import { join } from 'path';

// Create test directory
const testDir = './verify-symlink';
try {
  require('fs').rmdirSync(testDir, { recursive: true, force: true });
} catch (e) {}
require('fs').mkdirSync(testDir, { recursive: true });

// Create target file
const targetPath = join(testDir, 'target.txt');
writeFileSync(targetPath, 'hello world');
console.log('Created target file:', targetPath);

// Create symlink
const linkPath = join(testDir, 'link.txt');
symlinkSync(targetPath, linkPath);
console.log('Created symlink:', linkPath, '->', targetPath);

// Verify symlink works
console.log('\\nVerification:');
console.log('targetPath exists:', require('fs').existsSync(targetPath));
console.log('linkPath exists:', require('fs').existsSync(linkPath));
const { lstatSync } = require('fs');
console.log('linkPath is symbolic link:', lstatSync(linkPath).isSymbolicLink());

console.log('\\nrealpathSync tests:');
console.log('realpathSync(targetPath):', realpathSync(targetPath));
console.log('realpathSync(linkPath):', realpathSync(linkPath));
console.log('Are they equal?', realpathSync(targetPath) === realpathSync(linkPath));

// Cleanup
try {
  require('fs').unlinkSync(linkPath);
  require('fs').unlinkSync(targetPath);
  require('fs').rmdirSync(testDir);
  console.log('\\nCleanup completed');
} catch (e) {
  console.log('\\nCleanup error:', e.message);
}
