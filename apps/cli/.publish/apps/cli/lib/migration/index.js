// Copyright (c) 2026 Ultra-Dex

/**
 * AI Code Migration
 * Framework upgrades, language migrations, dependency updates.
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { getProvider } from '../providers/index.js';

export async function detectFrameworkUpgrades(rootDir = process.cwd()) {
  const packageJson = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));
  const upgrades = [];

  if (packageJson.dependencies?.next && packageJson.dependencies.next.startsWith('14')) {
    upgrades.push({
      from: 'Next.js 14',
      to: 'Next.js 15',
      action: 'Run codemods and update config',
    });
  }
  if (packageJson.dependencies?.react && packageJson.dependencies.react.startsWith('18')) {
    upgrades.push({ from: 'React 18', to: 'React 19', action: 'Review breaking changes' });
  }

  return upgrades;
}

export async function detectLanguageMigration(rootDir = process.cwd()) {
  const jsFiles = await glob('**/*.js', {
    cwd: rootDir,
    nodir: true,
    ignore: ['**/node_modules/**', '**/.git/**', '**/.ultra-dex/**'],
  });

  return jsFiles.length ? `Found ${jsFiles.length} JS files. Suggest JS → TS migration.` : null;
}

export async function suggestDependencyUpdates(rootDir = process.cwd()) {
  const packageJson = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));
  const deps = Object.keys(packageJson.dependencies || {});
  return deps.slice(0, 10);
}

export async function planMigration(rootDir = process.cwd()) {
  const provider = getProvider();
  const upgrades = await detectFrameworkUpgrades(rootDir);
  const language = await detectLanguageMigration(rootDir);
  const deps = await suggestDependencyUpdates(rootDir);

  if (!provider) {
    return { upgrades, language, deps, plan: null };
  }

  const systemPrompt = 'You are a migration architect. Create a safe upgrade plan.';
  const userPrompt = `Upgrades: ${JSON.stringify(upgrades)}\nLanguage: ${language}\nDeps: ${deps.join(', ')}`;
  const response = await provider.generate(systemPrompt, userPrompt);

  return { upgrades, language, deps, plan: response.content || '' };
}

export default {
  detectFrameworkUpgrades,
  detectLanguageMigration,
  suggestDependencyUpdates,
  planMigration,
};

/**
 * Safe execution wrapper with error handling for index
 * @param {Function} fn - Async function to execute
 * @param {string} [context='index'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'index') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
