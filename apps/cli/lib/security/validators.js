// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const FORBIDDEN_PATHS = ['.git', 'node_modules', '.env', 'package-lock.json'];
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/g, // OpenAI-like
  /AIza[0-9A-Za-z_-]{35}/g, // Google API key
  /AKIA[0-9A-Z]{16}/g, // AWS Access Key
  /-----BEGIN PRIVATE KEY-----/g,
  /xoxb-[0-9A-Za-z-]{10,}/g, // Slack
];

export function validateSafePath(inputPath) {
  if (inputPath.includes('..')) return false;
  const fullPath = path.resolve(process.cwd(), inputPath);
  return fullPath.startsWith(process.cwd());
}

export function hasForbiddenPath(inputPath) {
  return FORBIDDEN_PATHS.some((p) => inputPath.includes(p));
}

export async function scanForSecrets(rootDir) {
  const files = await glob('**/*.{js,ts,tsx,jsx,md,json,yml,yaml,env}', {
    cwd: rootDir,
    nodir: true,
    ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
  });

  const findings = [];

  for (const file of files) {
    const fullPath = path.join(rootDir, file);
    const content = await fs.readFile(fullPath, 'utf8');
    for (const pattern of SECRET_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        findings.push({ file, pattern: pattern.toString(), matches: match.slice(0, 3) });
      }
    }
  }

  return findings;
}

export function listForbiddenPaths() {
  return [...FORBIDDEN_PATHS];
}

/**
 * Safe execution wrapper with error handling for validators
 * @param {Function} fn - Async function to execute
 * @param {string} [context='validators'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'validators') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
