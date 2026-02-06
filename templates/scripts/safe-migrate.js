#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const confirm = args.includes('--confirm');
const backupPath =
  args.find((a) => a.startsWith('--backup='))?.split('=')[1] || 'backups/latest.sql';

if (!fs.existsSync(backupPath)) {
  console.error(`Backup not found at ${backupPath}. Aborting.`);
  process.exit(1);
}

if (!confirm) {
  console.log('Dry run only. Re-run with --confirm to apply migrations.');
  process.exit(0);
}

try {
  console.log('Running migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('Migrations completed successfully.');
} catch (error) {
  console.error('Migration failed. Consider rollback.');
  process.exit(1);
}
