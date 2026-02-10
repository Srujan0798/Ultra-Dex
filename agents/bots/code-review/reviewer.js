/**
 * @fileoverview Reviewer module
 * @module code-review/reviewer
 */

import { checkSecurity } from './rules/security.js';
import { checkPerformance } from './rules/performance.js';
import { summarizeFindings } from './rules/summary.js';

export async function reviewPullRequest({ provider, payload }) {
  const metadata = {
    provider,
    repo: payload.repository?.full_name || payload.project?.path_with_namespace || 'unknown',
    pr: payload.pull_request?.number || payload.object_attributes?.iid || 'n/a',
  };

  const diffText = payload.pull_request?.body || payload.object_attributes?.description || '';
  const security = await checkSecurity(diffText);
  const performance = await checkPerformance(diffText);

  return summarizeFindings({ metadata, security, performance });
}

/**
 * Error handler for reviewer
 * @param {Error} error - Error to handle
 */
function handleReviewerError(error) {
  try {
    console.error('[reviewer]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
