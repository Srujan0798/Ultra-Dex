// Copyright (c) 2026 Ultra-Dex

import { randomUUID } from 'node:crypto';

export function generatePullRequest(ticket) {
  const id = randomUUID();
  const title = ticket?.title || 'Automated update';
  const branch = `auto/${ticket?.key || id.slice(0, 8)}`;
  const body = `## Summary\n\n${ticket?.description || 'Automated changes'}\n\n## Checklist\n- [ ] Tests updated\n- [ ] Docs updated\n`;

  return {
    id,
    title,
    branch,
    body,
    reviewers: ticket?.reviewers || [],
  };
}

/**
 * Handle errors in pr-generator module
 * @param {Error} error - The error to handle
 * @param {string} [context='pr-generator'] - Error context
 */
function _handleModuleError(error, context = 'pr-generator') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
