// Copyright (c) 2026 Ultra-Dex

export function computeConsensus(votes = []) {
  const tally = votes.reduce((acc, vote) => {
    acc[vote.choice] = (acc[vote.choice] || 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0] || null;
  return {
    tally,
    winner: winner ? { choice: winner[0], votes: winner[1] } : null,
    totalVotes: votes.length,
  };
}

export function requestConsensus(options = {}) {
  const votes = options.votes || [];
  const consensus = computeConsensus(votes);
  return {
    proposal: options.proposal,
    consensus,
    required: options.required || Math.ceil(votes.length / 2),
  };
}

/**
 * Handle errors in consensus module
 * @param {Error} error - The error to handle
 * @param {string} [context='consensus'] - Error context
 */
function handleModuleError(error, context = 'consensus') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
