/**
 * Ultra-Dex CLI Entry Point
 * Simplified version that always uses the full program
 */

import 'reflect-metadata';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(packageRoot, '..', '..');

const dotenv = require('dotenv');
const shouldLoadDotenv =
  process.env.ULTRA_DEX_LOAD_DOTENV === '1' || process.env.NODE_ENV !== 'test';
if (shouldLoadDotenv) {
  const envCandidates = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
    path.join(packageRoot, '.env.local'),
    path.join(packageRoot, '.env'),
  ];

  const looksLikeMonorepo =
    fs.existsSync(path.join(monorepoRoot, 'package.json')) &&
    fs.existsSync(path.join(monorepoRoot, 'apps', 'cli', 'bin', 'ultra-dex.js'));

  if (looksLikeMonorepo) {
    envCandidates.push(path.join(monorepoRoot, '.env.local'), path.join(monorepoRoot, '.env'));
  }

  for (const candidate of envCandidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate, override: true });
      break;
    }
  }
}

const args = process.argv.slice(2);
const versionFlags = new Set(['-V', '--version']);
const helpFlags = new Set(['-h', '--help']);

const wantsVersion = args.length > 0 && args.every((arg) => versionFlags.has(arg));

if (wantsVersion) {
  const { VERSION } = await import('../lib/utils/version.js');
  console.log(VERSION);
  process.exit(0);
}

// Always use the full program for simplicity
const { registerFullProgram } = await import('./ultra-dex-full.js');
const { Command } = await import('commander');
const { VERSION } = await import('../lib/utils/version.js');

const program = new Command();
program
  .name('ultra-dex')
  .description('AI Orchestration Meta-Layer for SaaS Development')
  .version(VERSION);

await registerFullProgram(program);

const argv = args.length === 0 ? [...process.argv, '--help'] : process.argv;
await program.parseAsync(argv);
process.exit(process.exitCode ?? 0);
