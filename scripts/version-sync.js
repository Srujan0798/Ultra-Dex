#!/usr/bin/env node
/**
 * version-sync.js
 * Single source of truth for version across all packages
 * Usage:
 *   node scripts/version-sync.js --set 0.3.0
 *   node scripts/version-sync.js --check
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function getPackageFiles() {
  const files = [path.join(ROOT, 'package.json')];
  const dirs = ['apps', 'packages'];
  for (const dir of dirs) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;
    for (const sub of fs.readdirSync(fullDir)) {
      const pkgFile = path.join(fullDir, sub, 'package.json');
      if (fs.existsSync(pkgFile)) files.push(pkgFile);
    }
  }
  return files;
}

const args = process.argv.slice(2);
const setIdx = args.indexOf('--set');
const check = args.includes('--check');

if (setIdx !== -1) {
  const version = args[setIdx + 1];
  if (!version) { console.error('Usage: --set <version>'); process.exit(1); }

  const files = getPackageFiles();
  for (const file of files) {
    const pkg = readJSON(file);
    pkg.version = version;
    writeJSON(file, pkg);
    console.log(`✓ ${path.relative(ROOT, file)} → ${version}`);
  }

  // Update CLAUDE.md status line
  const claudeMd = path.join(ROOT, 'CLAUDE.md');
  if (fs.existsSync(claudeMd)) {
    let content = fs.readFileSync(claudeMd, 'utf8');
    content = content.replace(
      /> \*\*PROJECT STATUS:.*\*\*/,
      `> **PROJECT STATUS: v${version}**`
    );
    fs.writeFileSync(claudeMd, content);
    console.log(`✓ CLAUDE.md → v${version}`);
  }

  console.log(`\n✅ All packages set to v${version}`);

} else if (check) {
  const files = getPackageFiles();
  const rootPkg = readJSON(path.join(ROOT, 'package.json'));
  const expected = rootPkg.version;
  let drift = false;

  for (const file of files) {
    const pkg = readJSON(file);
    if (pkg.version !== expected) {
      console.error(`✗ ${path.relative(ROOT, file)}: ${pkg.version} ≠ ${expected}`);
      drift = true;
    }
  }

  if (drift) {
    console.error(`\nRun: node scripts/version-sync.js --set ${expected}`);
    process.exit(1);
  } else {
    console.log(`✓ All packages at v${expected}`);
  }
} else {
  console.log('Usage:');
  console.log('  node scripts/version-sync.js --set <version>');
  console.log('  node scripts/version-sync.js --check');
}
