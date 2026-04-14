import Stripe from 'stripe';
import { PRICING_TIERS, getTierById, PricingTier } from './pricing-tiers.js';
import { initBillingDb, getRow, run, query } from './billing-db.js';
import {
  logSubscriptionCreated,
  logPaymentSucceeded,
  logSubscriptionCancelled,
  logError,
} from '../monitoring/better-stack-logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-12-18.acacia',
});

export interface Subscription {
  id: string;
  userId: string;
  customerId?: string;
  tierId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface UsageRecord {
  userId: string;
  requests: number;
  tokens: number;
  timestamp: Date;
}

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initBillingDb();
    dbInitialized = true;
  }
}

function rowToSubscription(row: any): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    customerId: row.customer_id,
    tierId: row.tier_id,
    status: row.status,
    currentPeriodStart: new Date(row.current_period_start),
    currentPeriodEnd: new Date(row.current_period_end),
    cancelAtPeriodEnd: !!row.cancel_at_period_end,
  };
}

export class BillingService {
  async createCustomer(email: string, name: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { source: 'ultra-dex' },
      });
      return customer.id;
    } catch (error) {
      logError('Failed to create Stripe customer', error as Error, { email });
      throw error;
    }
  }

  private async getOrCreateCustomer(userId: string, email: string, name: string): Promise<string> {
    await ensureDb();
    const existing = await getRow('SELECT customer_id FROM billing_customers WHERE user_id = ?', [userId]);
    if (existing) {
      return existing.customer_id;
    }

    const customerId = await this.createCustomer(email, name);
    await run('INSERT INTO billing_customers (user_id, customer_id, email, name) VALUES (?, ?, ?, ?)', [
      userId,
      customerId,
      email,
      name,
    ]);
    return customerId;
  }

  async createSubscription(userId: string, tierId: string, customerId: string): Promise<Subscription> {
    await ensureDb();
    const tier = getTierById(tierId);
    if (!tier) {
      throw new Error('Invalid tier');
    }

    try {
      if (tierId === 'free') {
        const id = `sub_free_${userId}`;
        const now = new Date();
        const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await run(
          `INSERT INTO billing_subscriptions (id, user_id, customer_id, tier_id, status, current_period_start, current_period_end, cancel_at_period_end)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             id = excluded.id,
             tier_id = excluded.tier_id,
             status = excluded.status,
             current_period_start = excluded.current_period_start,
             current_period_end = excluded.current_period_end,
             cancel_at_period_end = excluded.cancel_at_period_end`,
          [id, userId, customerId, tierId, 'active', now.toISOString(), end.toISOString(), 0]
        );

        logSubscriptionCreated(userId, tierId, id, { tier: tier.name });
        return {
          id,
          userId,
          customerId,
          tierId,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: end,
          cancelAtPeriodEnd: false,
        };
      }

      const priceId = this.getStripePriceId(tierId);
      if (!priceId) {
        throw new Error('Stripe price ID not configured for tier: ' + tierId);
      }

      const stripeSubscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: { userId, tierId, source: 'ultra-dex' },
      });

      await run(
        `INSERT INTO billing_subscriptions (id, user_id, customer_id, tier_id, status, current_period_start, current_period_end, cancel_at_period_end)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           id = excluded.id,
           customer_id = excluded.customer_id,
           tier_id = excluded.tier_id,
           status = excluded.status,
           current_period_start = excluded.current_period_start,
           current_period_end = excluded.current_period_end,
           cancel_at_period_end = excluded.cancel_at_period_end`,
        [
          stripeSubscription.id,
          userId,
          customerId,
          tierId,
          stripeSubscription.status,
          new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          stripeSubscription.cancel_at_period_end ? 1 : 0,
        ]
      );

      const subscription: Subscription = {
        id: stripeSubscription.id,
        userId,
        customerId,
        tierId,
        status: stripeSubscription.status as any,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      };

      logSubscriptionCreated(userId, tierId, subscription.id, { tier: tier.name, price: tier.price });
      return subscription;
    } catch (error) {
      logError('Failed to create subscription', error as Error, { userId, tierId });
      throw error;
    }
  }

  private getStripePriceId(tierId: string): string | null {
    const priceMap: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_PRO || '',
      dexgraph: process.env.STRIPE_PRICE_DEXGRAPH || '',
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
    };
    return priceMap[tierId] || null;
  }

  async getSubscription(userId: string): Promise<Subscription | null> {
    await ensureDb();
    const row = await getRow('SELECT * FROM billing_subscriptions WHERE user_id = ?', [userId]);
    return row ? rowToSubscription(row) : null;
  }

  async createCheckoutSession(
    userId: string,
    tierId: string,
    email: string,
    name: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ url: string }> {
    const tier = getTierById(tierId);
    if (!tier || tierId === 'free') {
      throw new Error('Invalid or free tier selected');
    }

    const priceId = this.getStripePriceId(tierId);
    if (!priceId) {
      throw new Error('Stripe price ID not configured for tier: ' + tierId);
    }

    const customerId = await this.getOrCreateCustomer(userId, email, name);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, tierId },
      subscription_data: { metadata: { userId, tierId } },
    });

    if (!session.url) {
      throw new Error('Stripe checkout session URL missing');
    }

    return { url: session.url };
  }

  async createPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
    await ensureDb();
    const row = await getRow('SELECT customer_id FROM billing_customers WHERE user_id = ?', [userId]);
    const customerId = row?.customer_id;

    if (!customerId) {
      throw new Error('Customer not found for user');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async listInvoices(
    userId: string
  ): Promise<Array<{ date: string; amount: number; status: string; pdfUrl?: string }>> {
    await ensureDb();
    const row = await getRow('SELECT customer_id FROM billing_customers WHERE user_id = ?', [userId]);
    const customerId = row?.customer_id;

    if (!customerId) {
      return [];
    }

    const invoices = await stripe.invoices.list({ customer: customerId, limit: 10 });
    return invoices.data.map((invoice) => ({
      date: new Date(invoice.created * 1000).toISOString(),
      amount: invoice.amount_paid || invoice.amount_due,
      status: invoice.status || 'unknown',
      pdfUrl: invoice.invoice_pdf || invoice.hosted_invoice_url || undefined,
    }));
  }

  async cancelSubscription(userId: string): Promise<void> {
    try {
      const sub = await this.getSubscription(userId);
      if (!sub) {
        throw new Error('Subscription not found');
      }

      if (sub.tierId !== 'free' && !sub.id.startsWith('sub_free_')) {
        await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
      }

      await run('UPDATE billing_subscriptions SET status = ?, cancel_at_period_end = ? WHERE user_id = ?', [
        'canceled',
        1,
        userId,
      ]);

      logSubscriptionCancelled(userId, sub.id, 'user_requested');
    } catch (error) {
      logError('Failed to cancel subscription', error as Error, { userId });
      throw error;
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          const userId = invoice.metadata?.userId;
          const subscriptionId = invoice.subscription as string;
          if (userId) {
            logPaymentSucceeded(userId, (invoice.amount_paid || 0) / 100, subscriptionId, {
              invoiceId: invoice.id,
              currency: invoice.currency,
            });
          }
          break;
        }

        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          const tierId = subscription.metadata?.tierId;
          if (userId && tierId) {
            logSubscriptionCreated(userId, tierId, subscription.id, { status: subscription.status });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          if (userId) {
            await run('UPDATE billing_subscriptions SET status = ? WHERE user_id = ?', ['canceled', userId]);
            logSubscriptionCancelled(userId, subscription.id, 'stripe_webhook');
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          if (userId) {
            await run(
              'UPDATE billing_subscriptions SET status = ?, cancel_at_period_end = ?, current_period_end = ? WHERE user_id = ?',
              [
                subscription.status,
                subscription.cancel_at_period_end ? 1 : 0,
                new Date(subscription.current_period_end * 1000).toISOString(),
                userId,
              ]
            );
          }
          break;
        }
      }
    } catch (error) {
      logError('Webhook processing failed', error as Error, { eventType: event.type, eventId: event.id });
      throw error;
    }
  }

  async recordUsage(userId: string, requests: number, tokens: number): Promise<void> {
    await ensureDb();
    await run('INSERT INTO billing_usage (user_id, requests, tokens) VALUES (?, ?, ?)', [
      userId,
      requests,
      tokens,
    ]);

    // Clean up old records (keep last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await run('DELETE FROM billing_usage WHERE timestamp < ?', [thirtyDaysAgo]);
  }

  async getUsageForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ totalRequests: number; totalTokens: number }> {
    await ensureDb();
    const row = await getRow(
      'SELECT COALESCE(SUM(requests), 0) as total_requests, COALESCE(SUM(tokens), 0) as total_tokens FROM billing_usage WHERE user_id = ? AND timestamp >= ? AND timestamp <= ?',
      [userId, startDate.toISOString(), endDate.toISOString()]
    );
    return {
      totalRequests: Number(row?.total_requests || 0),
      totalTokens: Number(row?.total_tokens || 0),
    };
  }

  async getCurrentMonthUsage(userId: string): Promise<{
    requests: number;
    tokens: number;
    tier: PricingTier;
    withinLimits: boolean;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usage = await this.getUsageForPeriod(userId, startOfMonth, now);
    const subscription = await this.getSubscription(userId);
    const tier = subscription ? getTierById(subscription.tierId)! : PRICING_TIERS[0];

    return {
      requests: usage.totalRequests,
      tokens: usage.totalTokens,
      tier,
      withinLimits:
        tier.limits.requestsPerMonth < 0 || usage.totalRequests <= tier.limits.requestsPerMonth,
    };
  }

  getPricingTiers(): PricingTier[] {
    return PRICING_TIERS;
  }
}

export const billingService = new BillingService();
