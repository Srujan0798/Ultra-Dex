/**
 * @fileoverview Route module
 * @module stripe/route
 */

import { NextResponse } from 'next/server';
import { handleStripeWebhook } from '../../../../lib/stripe';

export async function POST(req: Request) {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get('stripe-signature') || undefined;

  try {
    const event = await handleStripeWebhook(rawBody, signature);
    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
