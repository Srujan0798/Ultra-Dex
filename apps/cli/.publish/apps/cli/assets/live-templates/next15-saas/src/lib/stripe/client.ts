/**
 * @fileoverview Client module
 * @module stripe/client
 */

import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

/**
 * Error handler for client
 * @param {Error} error - Error to handle
 */
function handleClientError(error) {
  try {
    console.error('[client]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
