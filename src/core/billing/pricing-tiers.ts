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
    description: 'Open-source SDK for individuals and teams',
    features: [
      'SmartRouter with 4 strategies',
      'All provider adapters',
      'Circuit breakers & middleware',
      'Local cost tracking',
      'Community support',
    ],
    limits: {
      requestsPerMonth: -1,
      tokensPerMonth: -1,
      agents: -1,
      teamMembers: -1,
    },
  },
  {
    id: 'pro',
    name: 'Pro Dashboard',
    price: 2900, // $29/month
    description: 'Cloud analytics for teams optimizing AI spend',
    features: [
      'Real-time cost breakdown by provider',
      'Savings reports vs single-provider',
      'Provider health (latency, errors, uptime)',
      'Usage trends & email alerts',
      'Priority support',
    ],
    limits: {
      requestsPerMonth: -1,
      tokensPerMonth: -1,
      agents: -1,
      teamMembers: 5,
    },
  },
  {
    id: 'dexgraph',
    name: 'DexGraph Pro',
    price: 9900, // $99/month
    description: 'Workflow orchestration + persistent memory',
    features: [
      'Everything in Pro Dashboard',
      'DexGraph workflow orchestration',
      'Persistent memory & RAG pipeline',
      'Agent coordination layer',
      'YAML workflow DSL',
    ],
    limits: {
      requestsPerMonth: -1,
      tokensPerMonth: -1,
      agents: -1,
      teamMembers: 20,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49900, // $499/month
    description: 'Governance, SSO, and dedicated support',
    features: [
      'Everything in DexGraph Pro',
      'Governance policies & audit trails',
      'SSO/SAML & RBAC',
      'Multi-tenant architecture',
      'Dedicated support & SLA',
    ],
    limits: {
      requestsPerMonth: -1,
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
