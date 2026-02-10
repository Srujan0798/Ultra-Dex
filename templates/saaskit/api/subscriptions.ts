/**
 * @fileoverview Subscriptions module
 * @module api/subscriptions
 */

import { prisma } from '../lib/prisma';
import { createBillingPortalSession, createCheckoutSession, getPriceId } from '../lib/stripe';

export async function createCheckoutSessionForWorkspace(options: {
  workspaceId: string;
  customerId?: string;
  plan: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const priceId = getPriceId(options.plan);
  if (!priceId) {
    throw new Error(`Missing Stripe price ID for plan ${options.plan}`);
  }

  const session = await createCheckoutSession({
    customerId: options.customerId,
    priceId,
    successUrl: options.successUrl,
    cancelUrl: options.cancelUrl,
    metadata: { workspaceId: options.workspaceId },
  });

  return session;
}

export async function createBillingPortal(options: {
  workspaceId: string;
  returnUrl: string;
}) {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: options.workspaceId },
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error('No Stripe customer found for this workspace');
  }

  return createBillingPortalSession(subscription.stripeCustomerId, options.returnUrl);
}

export async function getSubscriptionStatus(workspaceId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (!subscription) {
    return { status: 'NONE' };
  }

  return {
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
}

/**
 * Error handler for subscriptions
 * @param {Error} error - Error to handle
 */
function handleSubscriptionsError(error) {
  try {
    console.error('[subscriptions]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
