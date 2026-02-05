export function createReviewResponse(comments = []) {
  const unresolved = comments.filter((comment) => !comment.resolved);
  return {
    resolvedCount: comments.length - unresolved.length,
    unresolvedCount: unresolved.length,
    unresolved
  };
}

export function applyReviewFixes(ticket, review) {
  return {
    ticket,
    fixesApplied: review.unresolvedCount === 0,
    notes: review.unresolvedCount ? 'Pending reviewer changes.' : 'All feedback addressed.'
  };
}
