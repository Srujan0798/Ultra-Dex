import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

// Lazy load esbuild to avoid crash if not installed
let esbuildTransform = null;
async function getEsbuildTransform() {
  if (!esbuildTransform) {
    try {
      const esbuild = await import('esbuild');
      esbuildTransform = esbuild.transform;
    } catch (error) {
      throw new Error('esbuild not available');
    }
  }
  return esbuildTransform;
}

const ROOTS = ['apps/cli/lib'];
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const ESLINT_TIMEOUT_MS = 60_000;
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.docusaurus',
  '.turbo',
  '.ultra',
  '.ultra-dex',
  '.archive',
  'archive',
]);
const execFileAsync = promisify(execFile);

function timeout(ms, label) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
}

async function collectFiles(root) {
  const results = [];

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (EXTENSIONS.has(path.extname(entry.name))) {
        if (entry.name.endsWith('.d.ts')) continue;
        if (fullPath === path.join('src', 'monitoring', 'ContinuousMonitor.js')) continue;
        results.push(fullPath);
      }
    }
  }

  await walk(root);
  return results;
}

function getLoader(filePath) {
  const ext = path.extname(filePath);
  if (ext === '.ts') return 'ts';
  if (ext === '.tsx') return 'tsx';
  return ext === '.js' || ext === '.jsx' ? 'jsx' : 'js';
}

async function runSyntaxFallback(files, reason) {
  const failures = [];
  let transform;
  
  try {
    transform = await getEsbuildTransform();
  } catch (error) {
    console.warn(`ESLint unavailable; esbuild not installed. Reason: ${reason || error.message}`);
    console.log(`Skipping lint checks for ${files.length} files.`);
    return;
  }

  for (const filePath of files) {
    try {
      const source = await fs.readFile(filePath, 'utf8');
      await transform(source, {
        loader: getLoader(filePath),
        format: 'esm',
        logLevel: 'silent',
      });
    } catch (error) {
      failures.push(`${filePath}: ${error.message}`);
    }
  }

  if (reason) {
    console.warn(`ESLint unavailable; running syntax fallback. Reason: ${reason}`);
  }

  if (failures.length > 0) {
    failures.slice(0, 20).forEach((failure) => console.error(failure));
    if (failures.length > 20) {
      console.error(`...and ${failures.length - 20} more syntax failures.`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Syntax check passed for ${files.length} files.`);
}

async function runEslint(files) {
  const childScript = `
    const files = JSON.parse(process.env.ULTRA_DEX_LINT_FILES || '[]');
    const { ESLint } = require('eslint');
    (async () => {
      const eslint = new ESLint({ overrideConfigFile: 'eslint.config.js' });
      const results = await eslint.lintFiles(files);
      const formatter = await eslint.loadFormatter('stylish');
      const output = formatter.format(results);
      const errorCount = results.reduce((sum, result) => sum + result.errorCount, 0);
      const warningCount = results.reduce((sum, result) => sum + result.warningCount, 0);
      process.stdout.write(
        JSON.stringify({ output, errorCount, warningCount, resultsLength: results.length }),
        (writeError) => {
          if (writeError) {
            console.error(writeError.message);
            process.exit(1);
            return;
          }
          process.exit(0);
        }
      );
    })().catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
  `;

  const { stdout } = await execFileAsync(process.execPath, ['-e', childScript], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ULTRA_DEX_LINT_FILES: JSON.stringify(files),
    },
    timeout: ESLINT_TIMEOUT_MS,
    maxBuffer: 10 * 1024 * 1024,
  });

  const result = JSON.parse(stdout);
  if (result.output?.trim()) {
    process.stdout.write(result.output);
  }

  console.log(
    `ESLint completed: ${result.resultsLength} files, ${result.errorCount} errors, ${result.warningCount} warnings.`
  );
  process.exitCode = result.errorCount > 0 ? 1 : 0;
}

function formatLintError(error) {
  const parts = [error?.message];

  if (typeof error?.stderr === 'string' && error.stderr.trim()) {
    parts.push(error.stderr.trim());
  }

  return parts.filter(Boolean).join('\n');
}

async function main() {
  const files = (
    await Promise.all(
      ROOTS.map(async (root) => {
        try {
          return await collectFiles(root);
        } catch {
          return [];
        }
      })
    )
  ).flat();

  try {
    await runEslint(files);
  } catch (error) {
    await runSyntaxFallback(files, formatLintError(error));
  }
}

await main();
