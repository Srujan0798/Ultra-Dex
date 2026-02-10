/**
 * @fileoverview Stripe module
 * @module lib/stripe
 */

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20' as any,
});

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}

export async function handleStripeWebhook(rawBody: Buffer, signature?: string) {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  if (!signature) {
    throw new Error('Missing Stripe signature');
  }

  const event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'checkout.session.completed':
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return event;
    default:
      return event;
  }
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
