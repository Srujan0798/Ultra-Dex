/**
 * @fileoverview Stripe module
 * @module lib/stripe
 */

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out',
    price: 0,
    credits: 50,
    features: ['50 AI credits/month', 'GPT-3.5 access', 'Basic chat history', 'Email support'],
    stripePriceId: null,
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For individuals and small projects',
    price: 9,
    credits: 500,
    features: [
      '500 AI credits/month',
      'GPT-3.5 & GPT-4 access',
      'Unlimited chat history',
      'Priority support',
      'Export conversations',
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_BASIC,
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users and teams',
    price: 29,
    credits: 2000,
    features: [
      '2,000 AI credits/month',
      'All AI models included',
      'Team collaboration',
      'API access',
      'Advanced analytics',
      '24/7 priority support',
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO,
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for organizations',
    price: null,
    credits: null,
    features: [
      'Unlimited credits',
      'Custom AI models',
      'Dedicated support',
      'SSO & advanced security',
      'Custom integrations',
      'SLA guarantee',
    ],
    stripePriceId: process.env.STRIPE_PRICE_ID_ENTERPRISE,
    popular: false,
  },
] as const;

export type Plan = (typeof PLANS)[number];

export const CREDIT_PACKAGES = [
  { id: 'credits-100', credits: 100, price: 5, stripePriceId: '' },
  { id: 'credits-500', credits: 500, price: 20, stripePriceId: '' },
  { id: 'credits-2000', credits: 2000, price: 60, stripePriceId: '' },
];

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 7, // 7-day free trial
    },
  });

  return session;
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

export async function createOrRetrieveCustomer(email: string, userId: string) {
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  return stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });
}

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return PLANS.find((plan) => plan.stripePriceId === priceId);
}

export function getCreditsForPlan(planId: string): number {
  const plan = PLANS.find((p) => p.id === planId);
  return plan?.credits || 0;
}

/**
 * Error handler for stripe
 * @param {Error} error - Error to handle
 */
function handleStripeError(error) {
  try {
    console.error('[stripe]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
