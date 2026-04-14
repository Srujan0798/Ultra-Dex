import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-12-18.acacia',
});

const PRICE_MAP: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_PRO || '',
  dexgraph: process.env.STRIPE_PRICE_DEXGRAPH || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
};

export async function POST(request: NextRequest) {
  try {
    const { tierId, userId, email, name } = await request.json();

    if (!tierId || !userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (tierId === 'free') {
      return NextResponse.json({ error: 'Free tier does not require checkout' }, { status: 400 });
    }

    const priceId = PRICE_MAP[tierId];
    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price ID not configured for tier: ' + tierId }, { status: 500 });
    }

    // Create or reuse customer
    let customerId: string | undefined;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email, name, metadata: { userId, source: 'ultra-dex' } });
      customerId = customer.id;
    }

    const origin = request.headers.get('origin') || 'https://ultradex.vercel.app';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/analytics?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      metadata: { userId, tierId },
      subscription_data: { metadata: { userId, tierId } },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
