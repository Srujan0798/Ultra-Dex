/**
 * @fileoverview Stripe module
 * @module lib/stripe
 */

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  STARTER: process.env.STRIPE_PRICE_STARTER,
  PRO: process.env.STRIPE_PRICE_PRO,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
};

export function getPriceId(plan: string) {
  return PLAN_PRICE_IDS[plan.toUpperCase()];
}

export function verifyWebhookSignature(payload: string | Buffer, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET');
  }
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function createCheckoutSession(options: {
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: options.customerId,
    line_items: [{ price: options.priceId, quantity: 1 }],
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: options.metadata,
  });
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
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
