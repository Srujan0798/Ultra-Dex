/**
 * @fileoverview Stripe Billing module
 * @module features/stripe-billing
 */

// Stripe Billing Template (Next.js App Router)
// Copy-paste ready: Checkout + Webhook + Subscription management

import Stripe from 'stripe';
import { headers } from 'next/headers';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

type SubscriptionRecord = {
  id: string;
  customerId: string;
  status: SubscriptionStatus;
  priceId?: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  updatedAt: number;
};

// Minimal storage adapter that works out of the box.
// Swap this with your DB integration (Prisma, Drizzle, Supabase, etc.).
const subscriptionStore = new Map<string, SubscriptionRecord>();

function upsertSubscription(record: SubscriptionRecord) {
  subscriptionStore.set(record.id, record);
  return record;
}

function recordPaymentFailure(subscriptionId: string, customerId: string) {
  const existing = subscriptionStore.get(subscriptionId);
  upsertSubscription({
    id: subscriptionId,
    customerId,
    status: existing?.status ?? 'past_due',
    priceId: existing?.priceId,
    currentPeriodEnd: existing?.currentPeriodEnd,
    cancelAtPeriodEnd: existing?.cancelAtPeriodEnd,
    updatedAt: Date.now(),
  });
}

function normalizeSubscription(subscription: Stripe.Subscription): SubscriptionRecord {
  const priceId =
    subscription.items.data[0]?.price?.id ||
    (subscription.items.data[0]?.price?.product as string) ||
    undefined;

  return {
    id: subscription.id,
    customerId: String(subscription.customer),
    status: subscription.status,
    priceId,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: Date.now(),
  };
}

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!customerId || !priceId) throw new Error('Missing customerId or priceId');

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });
}

export async function handleStripeWebhook(request: Request) {
  const sig = headers().get('stripe-signature');
  if (!sig) throw new Error('Missing Stripe signature');

  const body = await request.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

  switch (event.type) {
    case 'checkout.session.completed':
      {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription;
        if (subscriptionId && typeof subscriptionId === 'string') {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          upsertSubscription(normalizeSubscription(subscription));
        }
      }
      return new Response('ok');
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      upsertSubscription(normalizeSubscription(subscription));
      return new Response('ok');
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription && typeof invoice.subscription === 'string') {
        recordPaymentFailure(invoice.subscription, String(invoice.customer || ''));
      }
      return new Response('ok');
    }
    default:
      break;
  }

  return new Response('ok');
}

export async function changeSubscription({
  subscriptionId,
  newPriceId,
}: {
  subscriptionId: string;
  newPriceId: string;
}) {
  return stripe.subscriptions.update(subscriptionId, {
    items: [{ price: newPriceId }],
    proration_behavior: 'create_prorations',
  });
}

/**
 * Error handler for stripe-billing
 * @param {Error} error - Error to handle
 */
function handleStripebillingError(error) {
  try {
    console.error('[stripe-billing]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
