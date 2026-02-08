import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
});

export async function createCheckoutSession({ priceId, customerEmail }) {
  if (!priceId) {
    throw new Error('priceId is required');
  }

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: customerEmail,
    success_url: process.env.STRIPE_SUCCESS_URL || 'https://ultra-dex.ai/billing/success',
    cancel_url: process.env.STRIPE_CANCEL_URL || 'https://ultra-dex.ai/billing',
  });
}
