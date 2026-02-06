import { NextResponse } from 'next/server';
import { createCheckoutSession } from '../../../../lib/stripe';

export async function POST() {
  const session = await createCheckoutSession({
    customerId: 'cus_demo',
    priceId: process.env.STRIPE_PRICE_ID || '',
    successUrl: process.env.NEXT_PUBLIC_APP_URL + '/dashboard',
    cancelUrl: process.env.NEXT_PUBLIC_APP_URL + '/',
  });

  return NextResponse.json({ url: session.url });
}
