import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { stripe, PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature') || '';

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          const priceId = subscription.items.data[0].price.id;
          const plan = PLANS.find((p) => p.stripePriceId === priceId);

          if (plan) {
            await prisma.user.update({
              where: { stripeCustomerId: session.customer as string },
              data: {
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId,
                stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                plan: plan.id.toUpperCase() as any,
                credits: { increment: plan.credits || 0 },
              },
            });

            // Log credit purchase
            const user = await prisma.user.findFirst({
              where: { stripeCustomerId: session.customer as string },
            });

            if (user) {
              await prisma.creditTransaction.create({
                data: {
                  userId: user.id,
                  amount: plan.credits || 0,
                  type: 'PURCHASE',
                  description: `Subscription to ${plan.name} plan`,
                  metadata: {
                    subscriptionId: subscription.id,
                    priceId: priceId,
                  },
                },
              });
            }
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

          await prisma.user.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.error('Payment failed:', invoice.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
            plan: 'FREE',
          },
        });
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: 'Webhook handler failed' }, { status: 500 });
  }
}
