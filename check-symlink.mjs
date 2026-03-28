// Check if symlink was created properly
import { mkdirSync, writeFileSync, symlinkSync } from 'fs';
import { join } from 'path';

// Create test directory
const testDir = './check-symlink';
try {
  rmSync(testDir, { recursive: true, force: true });
} catch (e) {}
mkdirSync(testDir, { recursive: true });

// Create .env file
const envPath = join(testDir, '.env');
writeFileSync(envPath, 'SECRET=test\n');
console.log('Created .env file at:', envPath);

// Create symlink to .env
const linkPath = join(testDir, 'config.json');
symlinkSync(envPath, linkPath);
console.log('Created symlink from:', linkPath);

// Check what files exist
const { readdirSync, lstatSync, readlinkSync } = await import('fs');
const files = readdirSync(testDir);
console.log('Files in test directory:', files);

files.forEach((file) => {
  const fullPath = join(testDir, file);
  const stats = lstatSync(fullPath);
  if (stats.isSymbolicLink()) {
    const target = readlinkSync(fullPath);
    console.log(`  ${file} -> ${target} (symbolic link)`);
  } else {
    console.log(`  ${file} (regular file)`);
  }
});

// Cleanup
try {
  unlinkSync(linkPath);
  unlinkSync(envPath);
  rmdirSync(testDir);
} catch (e) {
  console.log('Cleanup error:', e.message);
}
