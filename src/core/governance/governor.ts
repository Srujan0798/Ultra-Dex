// Copyright (c) 2026 Ultra-Dex

/**
 * Active Governance Implementation (v4.1)
 * Enforces ADRs against project state and file changes
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { loadADRs } from './schema.js';
import { printInfo, printSuccess } from '../utils/output.js';

/**
 * Audit a file or directory against active ADRs
 */
export async function auditGovernance(targetPath = process.cwd()) {
  const adrs = await loadADRs();
  const activeADRs = adrs.filter((a) => a.status === 'active');

  if (activeADRs.length === 0) {
    return { ok: true, message: 'No active ADRs to enforce.' };
  }

  printInfo(`🛡️  @Governor: Auditing against ${activeADRs.length} active ADRs...
`);

  const violations = [];

  // Recursive scan helper
  async function scan(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
        await scan(fullPath);
      } else if (entry.isFile()) {
        const content = await fs.readFile(fullPath, 'utf8');

        for (const adr of activeADRs) {
          for (const pattern of adr.patterns) {
            const regex = new RegExp(pattern, 'g');
            if (regex.test(content)) {
              violations.push({
                file: path.relative(process.cwd(), fullPath),
                adrId: adr.id,
                title: adr.title,
                enforcement: adr.enforcement,
              });
            }
          }
        }
      }
    }
  }

  await scan(targetPath);

  if (violations.length > 0) {
    const strictViolations = violations.filter((v) => v.enforcement === 'strict');

    violations.forEach((v) => {
      const color = v.enforcement === 'strict' ? chalk.red : chalk.yellow;
      const label = v.enforcement === 'strict' ? 'BLOCK' : 'WARNING';
      console.error(color(`  [${label}] ${v.adrId}: ${v.title}`));
      console.error(
        chalk.gray(`           File: ${v.file}
`)
      );
    });

    if (strictViolations.length > 0) {
      return { ok: false, violations };
    }
  }

  printSuccess('✅ Governance audit passed. No strict violations found.');
  return { ok: true, violations };
}

/**
 * Safe execution wrapper with error handling for governor
 * @param {Function} fn - Async function to execute
 * @param {string} [context='governor'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'governor') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
