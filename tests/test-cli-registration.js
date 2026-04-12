#!/usr/bin/env node

/**
 * Test CLI command registration
 */

import { program } from 'commander';

console.log('🧪 Testing CLI command registration...');

// Register a simple command
program
  .command('test-cmd')
  .description('Test command')
  .action(() => {
    console.log('✅ Test command executed successfully!');
  });

// Parse arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  args.push('--help');
}

program.parse(args);
