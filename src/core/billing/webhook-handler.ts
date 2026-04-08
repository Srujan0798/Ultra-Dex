/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events with verification and idempotency
 */

import Stripe from 'stripe';
import { clerk } from '../auth/clerk-client.js';
import { usageMeter } from './usage-meter.js';
import { getRedisClient } from './redis-client.js';
import { 
  logSubscriptionCreated, 
  logPaymentSucceeded, 
  logSubscriptionCancelled,
  logError,
  logEvent
} from '../monitoring/better-stack-logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-12-18.acacia'
});

// Track processed event IDs for idempotency (in-memory, replace with Redis in production)
const processedEvents = new Set<string>();

// Clean up old processed events after 7 days
setInterval(() => {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const toDelete: string[] = [];
  
  processedEvents.forEach(eventId => {
    // Event IDs contain timestamp, extract and check
    const parts = eventId.split('_');
    if (parts.length >= 3) {
      const timestamp = parseInt(parts[2], 16);
      if (timestamp < cutoff) {
        toDelete.push(eventId);
      }
    }
  });
  
  toDelete.forEach(id => processedEvents.delete(id));
}, 24 * 60 * 60 * 1000); // Run daily

export class WebhookHandler {
  private async updateUserMetadata(userId: string, updates: Record<string, unknown>): Promise<void> {
    const user = await clerk.users.getUser(userId);
    const existingPublicMetadata = (user.publicMetadata || {}) as Record<string, unknown>;

    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...existingPublicMetadata,
        ...updates
      }
    });
  }
  /**
   * Verify webhook signature from Stripe
   */
  verifyWebhook(rawBody: Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    try {
      const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      return event;
    } catch (error) {
      logError('Webhook signature verification failed', error as Error, { signature });
      throw error;
    }
  }

  /**
   * Handle webhook event with idempotency
   */
  async handleEvent(event: Stripe.Event): Promise<void> {
    // In-memory duplicate guard (fallback path)
    if (processedEvents.has(event.id)) {
      logEvent('webhook_duplicate', { eventId: event.id, type: event.type });
      return;
    }

    // Redis duplicate guard (atomic claim when available)
    const redisClient = await getRedisClient();
    const redisKey = `stripe:processed:${event.id}`;
    let redisClaimed = false;
    try {
      if (redisClient) {
        const claim = await redisClient.set(redisKey, 'processing', 'EX', 7 * 24 * 60 * 60, 'NX');
        if (claim === null) {
          logEvent('webhook_duplicate', { eventId: event.id, type: event.type });
          return;
        }
        redisClaimed = true;
      }
    } catch (err) {
      logError('Redis idempotency check failed', err as Error, { eventId: event.id });
    }

    try {
      await this.dispatchEvent(event);

      if (redisClient && redisClaimed) {
        await redisClient.set(redisKey, 'processed', 'EX', 7 * 24 * 60 * 60);
      }
      processedEvents.add(event.id);

      logEvent('webhook_processed', { 
        eventId: event.id, 
        type: event.type,
        created: event.created 
      });
    } catch (error) {
      if (redisClient && redisClaimed) {
        try {
          await redisClient.del(redisKey);
        } catch (cleanupError) {
          logError('Failed to rollback Redis processed event marker', cleanupError as Error, { eventId: event.id });
        }
      }
      logError('Webhook event processing failed', error as Error, { 
        eventId: event.id, 
        type: event.type 
      });
      throw error;
    }
  }

  /**
   * Dispatch event to appropriate handler
   */
  private async dispatchEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event);
        break;

      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;

      default:
        logEvent('webhook_unhandled', { type: event.type, eventId: event.id });
    }
  }

  /**
   * Handle checkout.session.completed
   * Activate subscription when checkout is complete
   */
  private async handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const tierId = session.metadata?.tierId;

    if (!userId || !tierId) {
      logError(
        'Missing metadata in checkout session',
        new Error('userId or tierId not found'),
        { sessionId: session.id }
      );
      return;
    }

    // Reset usage counters on new subscription
    usageMeter.resetUser(userId);

    logSubscriptionCreated(userId, tierId, session.subscription as string, {
      sessionId: session.id,
      customerEmail: session.customer_email,
      mode: session.mode
    });

    logEvent('checkout_completed', {
      userId,
      tierId,
      sessionId: session.id,
      subscriptionId: session.subscription
    });
  }

  /**
   * Handle invoice.paid
   * Reset usage counters on successful payment
   */
  private async handleInvoicePaid(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const userId = invoice.metadata?.userId;
    const subscriptionId = invoice.subscription as string;

    if (!userId) {
      // Try to extract from subscription metadata
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const subUserId = subscription.metadata?.userId;
        
        if (subUserId) {
          await this.processInvoicePaid(subUserId, invoice, subscriptionId);
        }
      }
      return;
    }

    await this.processInvoicePaid(userId, invoice, subscriptionId);
  }

  private async processInvoicePaid(
    userId: string, 
    invoice: Stripe.Invoice, 
    subscriptionId: string
  ): Promise<void> {
    // Reset usage counters on successful payment
    usageMeter.resetUser(userId);

    logPaymentSucceeded(userId, (invoice.amount_paid || 0) / 100, subscriptionId, {
      invoiceId: invoice.id,
      currency: invoice.currency,
      billingReason: invoice.billing_reason
    });

    logEvent('invoice_paid', {
      userId,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      invoiceId: invoice.id,
      subscriptionId
    });
  }

  /**
   * Handle invoice.payment_failed
   * Flag account for review
   */
  private async handlePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const userId = invoice.metadata?.userId;
    const subscriptionId = invoice.subscription as string;

    if (!userId && subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const subUserId = subscription.metadata?.userId;
      
      if (subUserId) {
        await this.processPaymentFailed(subUserId, invoice, subscriptionId);
      }
      return;
    }

    if (userId) {
      await this.processPaymentFailed(userId, invoice, subscriptionId);
    }
  }

  private async processPaymentFailed(
    userId: string,
    invoice: Stripe.Invoice,
    subscriptionId: string
  ): Promise<void> {
    logError(
      'Payment failed for subscription',
      new Error('Invoice payment failed'),
      {
        userId,
        invoiceId: invoice.id,
        subscriptionId,
        attemptCount: invoice.attempt_count,
        nextPaymentAttempt: invoice.next_payment_attempt
      }
    );

    logEvent('payment_failed', {
      userId,
      invoiceId: invoice.id,
      subscriptionId,
      amount: invoice.amount_due,
      attemptCount: invoice.attempt_count
    });

    await this.updateUserMetadata(userId, {
      billingStatus: 'past_due'
    });
  }

  /**
   * Handle customer.subscription.deleted
   * Downgrade to free tier
   */
  private async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;

    if (!userId) {
      logError(
        'Missing userId in subscription metadata',
        new Error('userId not found'),
        { subscriptionId: subscription.id }
      );
      return;
    }

    // Reset to free tier limits
    usageMeter.resetUser(userId);

    logSubscriptionCancelled(userId, subscription.id, 'subscription_deleted');

    logEvent('subscription_deleted', {
      userId,
      subscriptionId: subscription.id,
      canceledAt: subscription.canceled_at,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });

    await this.updateUserMetadata(userId, {
      tier: 'free',
      billingStatus: 'canceled'
    });
  }

  /**
   * Handle customer.subscription.created
   */
  private async handleSubscriptionCreated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    const tierId = subscription.metadata?.tierId;

    if (!userId || !tierId) {
      return;
    }

    logSubscriptionCreated(userId, tierId, subscription.id, {
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end
    });

    await this.updateUserMetadata(userId, {
      tier: tierId,
      billingStatus: subscription.status
    });
  }

  /**
   * Handle customer.subscription.updated
   */
  private async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;

    if (!userId) {
      return;
    }

    logEvent('subscription_updated', {
      userId,
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });

    const tierId = subscription.metadata?.tierId;
    await this.updateUserMetadata(userId, {
      tier: tierId || 'free',
      billingStatus: subscription.status
    });
  }
}

// Singleton instance
export const webhookHandler = new WebhookHandler();
