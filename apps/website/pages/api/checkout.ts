import type { NextApiRequest, NextApiResponse } from 'next';

type Plan = 'free' | 'pro' | 'team' | 'enterprise';
type Billing = 'monthly' | 'yearly';

type CheckoutRequest = {
  plan?: Plan;
  billing?: Billing;
};

function envLink(plan: Plan, billing: Billing): string | undefined {
  const key = `STRIPE_CHECKOUT_LINK_${plan.toUpperCase()}_${billing.toUpperCase()}`;
  const value = process.env[key];
  return value && value.trim().length > 0 ? value : undefined;
}

function fallbackLink(plan: Plan): string {
  if (plan === 'free') return '/docs';
  if (plan === 'enterprise') return '/contact';
  return '/contact?source=checkout-missing';
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ url?: string; error?: string }>
): void {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const payload = (req.body || {}) as CheckoutRequest;
  const plan: Plan = payload.plan && ['free', 'pro', 'team', 'enterprise'].includes(payload.plan)
    ? payload.plan
    : 'pro';
  const billing: Billing = payload.billing === 'yearly' ? 'yearly' : 'monthly';

  const url = envLink(plan, billing) || fallbackLink(plan);

  res.status(200).json({ url });
}
