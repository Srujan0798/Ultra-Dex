// Direct test of isSensitivePath
import { GovernanceEngine } from './src/platform/cli/governance/index.js';
import { mkdirSync, writeFileSync, symlinkSync } from 'fs';
import { join } from 'path';

// Create test directory
const testDir = './simple-direct-test';
try {
  require('fs').rmdirSync(testDir, { recursive: true, force: true });
} catch (e) {}
require('fs').mkdirSync(testDir, { recursive: true });

// Create .env file
const envPath = join(testDir, '.env');
require('fs').writeFileSync(envPath, 'SECRET=test\n');

// Create symlink to .env
const linkPath = join(testDir, 'config.json');
require('fs').symlinkSync(envPath, linkPath);

// Create governance engine
const gov = new GovernanceEngine(testDir);

// Initialize it (though isSensitivePath doesn't require initialization)
gov
  .init()
  .then(() => {
    console.log('Governance initialized');

    // Test isSensitivePath directly
    console.log('\n--- Testing isSensitivePath ---');
    console.log('isSensitivePath(\".env\"):', gov.isSensitivePath('.env'));
    console.log('isSensitivePath(\"config.json\"):', gov.isSensitivePath('config.json'));

    // Test authorize
    console.log('\n--- Testing authorize ---');
    const envResult = gov.authorize('backend', 'read', '.env');
    console.log('authorize(\"backend\", \"read\", \".env\"):', envResult);

    const linkResult = gov.authorize('backend', 'read', 'config.json');
    console.log('authorize(\"backend\", \"read\", \"config.json\"):', linkResult);

    // Cleanup
    try {
      require('fs').unlinkSync(linkPath);
      require('fs').unlinkSync(envPath);
      require('fs').rmdirSync(testDir);
      console.log('\nCleanup completed');
    } catch (e) {
      console.log('\nCleanup error:', e.message);
    }
  })
  .catch((err) => {
    console.log('Init error:', err);
  });
