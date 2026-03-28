// Copyright (c) 2026 Ultra-Dex

export function createReviewResponse(comments = []) {
  const unresolved = comments.filter((comment) => !comment.resolved);
  return {
    resolvedCount: comments.length - unresolved.length,
    unresolvedCount: unresolved.length,
    unresolved,
  };
}

export function applyReviewFixes(ticket, review) {
  return {
    ticket,
    fixesApplied: review.unresolvedCount === 0,
    notes: review.unresolvedCount ? 'Pending reviewer changes.' : 'All feedback addressed.',
  };
}

/**
 * Handle errors in reviewer module
 * @param {Error} error - The error to handle
 * @param {string} [context='reviewer'] - Error context
 */
function handleModuleError(error, context = 'reviewer') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
