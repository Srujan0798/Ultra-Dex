// Copyright (c) 2026 Ultra-Dex

import { analyzeDiff, formatMarkdownReport } from './analyzer.js';
import { fetchPullRequestDiff } from './github.js';
import { fetchMergeRequestDiff } from './gitlab.js';

export async function reviewGitHubPR({ owner, repo, prNumber, token }) {
  const { diff } = await fetchPullRequestDiff(owner, repo, prNumber, token);
  const issues = analyzeDiff(diff);
  return { issues, report: formatMarkdownReport(issues) };
}

export async function reviewGitLabMR({ projectId, mrIid, token }) {
  const mr = await fetchMergeRequestDiff(projectId, mrIid, token);
  const diff = (mr.changes || []).map((change) => change.diff).join('\n');
  const issues = analyzeDiff(diff);
  return { issues, report: formatMarkdownReport(issues) };
}

export default {
  reviewGitHubPR,
  reviewGitLabMR,
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
