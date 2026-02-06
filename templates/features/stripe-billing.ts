// Stripe Billing Template (Next.js App Router)
// Copy-paste ready: Checkout + Webhook + Subscription management

import Stripe from 'stripe';
import { headers } from 'next/headers';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

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
      // TODO: mark subscription active
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // TODO: update status in DB
      break;
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
