// Copyright (c) 2026 Ultra-Dex

/**
 * Codebase Time-Travel
 * Visualize history, rollback with AI explanation, diff analysis, branch comparison.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { getProvider } from '../providers/index.js';

const execAsync = promisify(exec);

export async function getHistory(limit = 20) {
  const { stdout } = await execAsync(`git log -n ${limit} --pretty=format:"%h|%an|%ad|%s"`);
  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, author, date, message] = line.split('|');
      return { hash, author, date, message };
    });
}

export async function diffBetween(base, head) {
  const { stdout } = await execAsync(`git diff ${base}..${head}`);
  return stdout;
}

export async function compareBranches(baseBranch, headBranch) {
  const { stdout } = await execAsync(`git log --oneline ${baseBranch}..${headBranch}`);
  return stdout.split('\n').filter(Boolean);
}

export async function rollbackTo(commitHash) {
  await execAsync(`git revert ${commitHash} --no-edit`);
  return { ok: true, commit: commitHash };
}

export async function explainRollback(commitHash) {
  const provider = getProvider();
  if (!provider) {
    return { ok: false, message: 'No provider configured' };
  }
  const diff = await diffBetween(`${commitHash}^`, commitHash);
  const systemPrompt =
    'You are a senior engineer. Explain why rolling back this change is safe and what it impacts.';
  const userPrompt = `Commit ${commitHash} diff:\n${diff}`;
  const response = await provider.generate(systemPrompt, userPrompt);
  return { ok: true, explanation: response.content || '' };
}

export default {
  getHistory,
  diffBetween,
  compareBranches,
  rollbackTo,
  explainRollback,
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
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
