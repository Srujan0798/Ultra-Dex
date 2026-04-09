import fs from 'fs/promises';
import path from 'path';
import { ESLint } from 'eslint';

const ROOTS = ['apps/cli/lib'];
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
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

      if (EXTENSIONS.has(path.extname(entry.name)) && !entry.name.endsWith('.d.ts')) {
        results.push(fullPath);
      }
    }
  }

  await walk(root);
  return results;
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

  const eslint = new ESLint({ overrideConfigFile: 'eslint.config.js' });
  const results = await eslint.lintFiles(files);
  const formatter = await eslint.loadFormatter('stylish');
  const output = formatter.format(results);
  const errorCount = results.reduce((sum, result) => sum + result.errorCount, 0);
  const warningCount = results.reduce((sum, result) => sum + result.warningCount, 0);

  if (output.trim()) {
    process.stdout.write(output);
  }

  console.log(
    `ESLint completed: ${results.length} files, ${errorCount} errors, ${warningCount} warnings.`
  );

  if (errorCount > 0 || warningCount > 0) {
    process.exitCode = 1;
  }
}

await main();
