import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export async function createCheckoutSession({
  customerId,
  customerEmail,
  userId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  customerId?: string;
  customerEmail?: string;
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  let resolvedCustomerId = customerId;
  if (!resolvedCustomerId && customerEmail) {
    const customer = await stripe.customers.create({ email: customerEmail });
    resolvedCustomerId = customer.id;
  }

  if (!resolvedCustomerId) {
    throw new Error('customerId or customerEmail is required');
  }

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: resolvedCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        userId,
      },
    },
  });
}
