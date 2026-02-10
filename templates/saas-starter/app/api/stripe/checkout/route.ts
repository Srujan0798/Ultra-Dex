/**
 * @fileoverview Route module
 * @module checkout/route
 */

import { NextResponse } from 'next/server';
import { createCheckoutSession } from '../../../../lib/stripe';

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, customerId, email } = body || {};

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const session = await createCheckoutSession({
    userId,
    customerId,
    customerEmail: email,
    priceId: process.env.STRIPE_PRICE_ID || '',
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/`,
  });

  return NextResponse.json({ url: session.url });
}

/**
 * Error handler for route
 * @param {Error} error - Error to handle
 */
function handleRouteError(error) {
  try {
    console.error('[route]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
