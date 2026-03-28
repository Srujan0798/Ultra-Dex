// Copyright (c) 2026 Ultra-Dex

/**
 * Predictive Architecture Engine
 * Suggests refactors, detects tech debt, and plans upgrades.
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { projectGraph } from '../mcp/graph.js';

export async function scanTechDebt(rootDir = process.cwd()) {
  const files = await glob('**/*.{js,ts,tsx,jsx}', {
    cwd: rootDir,
    nodir: true,
    ignore: ['**/node_modules/**', '**/.git/**', '**/.ultra-dex/**'],
  });

  const debtSignals = [];
  for (const file of files.slice(0, 200)) {
    const content = await fs.readFile(path.join(rootDir, file), 'utf8');
    if (content.length > 12000) debtSignals.push({ file, issue: 'Large file size' });
    if (content.includes('TO_DO')) debtSignals.push({ file, issue: 'TO_DO markers present' });
    if ((content.match(/any\b/g) || []).length > 5)
      debtSignals.push({ file, issue: 'Excessive any usage' });
  }

  return debtSignals;
}

export async function suggestRefactors(rootDir = process.cwd()) {
  await projectGraph.scan(rootDir);
  const summary = projectGraph.getSummary();
  const suggestions = [];

  if (summary.edgeCount > summary.nodeCount * 3) {
    suggestions.push('High dependency density: consider modularizing feature domains.');
  }

  if (summary.nodeCount > 500) {
    suggestions.push('Large codebase: enforce domain boundaries and indexing.');
  }

  return suggestions;
}

export async function planUpgrades(rootDir = process.cwd()) {
  const packageJson = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));
  const upgrades = [];

  if (packageJson.dependencies?.next && packageJson.dependencies.next.startsWith('14')) {
    upgrades.push('Upgrade Next.js 14 → 15 (run codemod + update config).');
  }
  if (packageJson.devDependencies?.typescript) {
    upgrades.push('Validate TypeScript config against latest compiler defaults.');
  }
  return upgrades;
}

export async function runPredictiveArchitecture(rootDir = process.cwd()) {
  const [debtSignals, refactors, upgrades] = await Promise.all([
    scanTechDebt(rootDir),
    suggestRefactors(rootDir),
    planUpgrades(rootDir),
  ]);

  return { debtSignals, refactors, upgrades };
}

export default {
  scanTechDebt,
  suggestRefactors,
  planUpgrades,
  runPredictiveArchitecture,
};

/**
 * Safe execution wrapper with error handling for index
 * @param {Function} fn - Async function to execute
 * @param {string} [context='index'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'index') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
