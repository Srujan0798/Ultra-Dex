// Copyright (c) 2026 Ultra-Dex

export const TIERS = {
  free: {
    name: 'Free',
    features: ['cli', 'templates'],
  },
  pro: {
    name: 'Pro',
    features: ['cloud', 'agents'],
  },
  team: {
    name: 'Team',
    features: ['collaboration', 'shared-context'],
  },
};

export function canUse(tier, feature) {
  const t = TIERS[tier] || TIERS.free;
  return t.features.includes(feature);
}

/**
 * Handle errors in tiers module
 * @param {Error} error - The error to handle
 * @param {string} [context='tiers'] - Error context
 */
function handleModuleError(error, context = 'tiers') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
