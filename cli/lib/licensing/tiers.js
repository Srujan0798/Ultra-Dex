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
