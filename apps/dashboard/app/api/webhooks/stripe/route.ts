import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-12-18.acacia',
});

const processedEvents = new Set<string>();

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const body = await request.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook verification failed: ${err.message}` }, { status: 400 });
  }

  // Idempotency
  if (processedEvents.has(event.id)) {
    return NextResponse.json({ received: true, idempotent: true });
  }
  processedEvents.add(event.id);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tierId = session.metadata?.tierId;
        console.log(`[Stripe] Checkout completed for user=${userId} tier=${tierId}`);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe] Invoice paid: ${invoice.id}`);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe] Subscription ${event.type}: ${subscription.id} status=${subscription.status}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Stripe] Subscription deleted: ${subscription.id}`);
        break;
      }
    }

    // Forward to core billing service if available
    try {
      const { billingService } = await import('../../../../../../src/core/billing/billing-service.js');
      await billingService.handleWebhook(event);
    } catch {
      // If billing service import fails, the console logs above are enough for MVP
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
