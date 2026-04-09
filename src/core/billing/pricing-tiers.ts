export interface PricingTier {
  id: string;
  name: string;
  price: number; // in cents
  description: string;
  features: string[];
  limits: {
    requestsPerMonth: number;
    tokensPerMonth: number;
    agents: number;
    teamMembers: number;
  };
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out Ultra-Dex',
    features: ['100 requests/day', '10,000 tokens/day', '3 agents', 'Community support'],
    limits: {
      requestsPerMonth: 100,
      tokensPerMonth: 10000,
      agents: 3,
      teamMembers: 1,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 2900, // $29/month
    description: 'For serious developers and teams',
    features: [
      '10,000 requests/day',
      '1M tokens/day',
      'Unlimited agents',
      'Priority support',
      'Advanced analytics',
      'Custom models',
    ],
    limits: {
      requestsPerMonth: 10000,
      tokensPerMonth: 1000000,
      agents: -1, // unlimited
      teamMembers: 5,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 9900, // $99/month
    description: 'For organizations at scale',
    features: [
      'Unlimited requests',
      'Unlimited tokens',
      'Unlimited agents',
      '24/7 dedicated support',
      'SSO & SAML',
      'Custom integrations',
      'SLA guarantee',
    ],
    limits: {
      requestsPerMonth: -1, // unlimited
      tokensPerMonth: -1,
      agents: -1,
      teamMembers: -1,
    },
  },
];

export const getTierById = (id: string): PricingTier | undefined => {
  return PRICING_TIERS.find((t) => t.id === id);
};

export const checkUsageWithinLimits = (
  tier: PricingTier,
  usage: { requests: number; tokens: number }
): boolean => {
  if (tier.limits.requestsPerMonth > 0 && usage.requests > tier.limits.requestsPerMonth) {
    return false;
  }
  if (tier.limits.tokensPerMonth > 0 && usage.tokens > tier.limits.tokensPerMonth) {
    return false;
  }
  return true;
};

export class PricingTiers {
  async getUserTier(_userId: string): Promise<PricingTier> {
    return PRICING_TIERS[0]; // Default to free tier
  }

  async getUsage(_userId: string, _period: 'day' | 'month'): Promise<number> {
    return 0; // Default to no usage
  }
}
