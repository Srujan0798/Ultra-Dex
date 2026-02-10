/**
 * @fileoverview Route module
 * @module stripe/route
 */

import { NextResponse } from 'next/server';
import { createCheckoutSession } from '../../../lib/stripe.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const session = await createCheckoutSession({
      priceId: body.priceId,
      customerEmail: body.customerEmail,
    });

    return NextResponse.json({ ok: true, sessionId: session.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
