/**
 * @fileoverview Stripe module
 * @module lib/stripe
 */

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Initialize Stripe only if the secret key is available
export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

export async function createCheckoutSession({ priceId, customerEmail }) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

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
