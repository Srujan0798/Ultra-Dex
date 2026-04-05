// Debug symlink creation and resolution
import { mkdirSync, writeFileSync, symlinkSync, rmSync, realpathSync, unlinkSync } from 'fs';
import { join } from 'path';

// Create test directory
const testDir = './debug-symlink';
try { rmSync(testDir, { recursive: true, force: true }); } catch(e) {}
mkdirSync(testDir, { recursive: true });

// Create .env file
const envPath = join(testDir, '.env');
writeFileSync(envPath, 'SECRET=test\n');
console.log('1. Created .env file at:', envPath);

// Create symlink to .env
const linkPath = join(testDir, 'config.json');
symlinkSync(envPath, linkPath);
console.log('2. Created symlink from:', linkPath);

// Test if we can read the symlink target
try {
  const target = realpathSync(linkPath);
  console.log('3. Symlink resolves to:', target);
} catch (err) {
  console.log('3. Error resolving symlink:', err.message);
  console.log('   This suggests the symlink is broken or points to non-existent file');
  console.log('   Let\\'s check if the .env file actually exists at envPath:', envPath);
}

// Check what files exist in the test directory using async approach or just trust our creates
console.log('4. Files in test directory: [we created .env and config.json symlink]');

// Cleanup
try {
  unlinkSync(linkPath);
  console.log('5. Removed symlink');
  unlinkSync(envPath);
  console.log('6. Removed .env file');
  rmdirSync(testDir);
  console.log('7. Removed test directory');
} catch (e) {
  console.log('8. Cleanup error:', e.message);
}