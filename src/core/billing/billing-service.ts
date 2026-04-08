import Stripe from 'stripe';
import { PRICING_TIERS, getTierById, PricingTier } from './pricing-tiers.js';
import { 
  logSubscriptionCreated, 
  logPaymentSucceeded, 
  logSubscriptionCancelled,
  logError 
} from '../monitoring/better-stack-logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-12-18.acacia'
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

// In-memory stores (replace with database in production)
const subscriptions = new Map<string, Subscription>();
const customerIds = new Map<string, string>();
const usageRecords: UsageRecord[] = [];

export class BillingService {
  async createCustomer(email: string, name: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          source: 'ultra-dex'
        }
      });
      return customer.id;
    } catch (error) {
      logError('Failed to create Stripe customer', error as Error, { email });
      throw error;
    }
  }

  private async getOrCreateCustomer(userId: string, email: string, name: string): Promise<string> {
    const existing = customerIds.get(userId);
    if (existing) {
      return existing;
    }

    const customerId = await this.createCustomer(email, name);
    customerIds.set(userId, customerId);
    return customerId;
  }
  
  async createSubscription(userId: string, tierId: string, customerId: string): Promise<Subscription> {
    const tier = getTierById(tierId);
    if (!tier) {
      throw new Error('Invalid tier');
    }
    
    try {
      let stripeSubscription: Stripe.Subscription;
      
      if (tierId === 'free') {
        // Free tier - no Stripe subscription needed
        const subscription: Subscription = {
          id: `sub_free_${userId}`,
          userId,
          customerId,
          tierId,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false
        };
        subscriptions.set(userId, subscription);
        customerIds.set(userId, customerId);
        
        logSubscriptionCreated(userId, tierId, subscription.id, { tier: tier.name });
        return subscription;
      }
      
      // Create Stripe subscription for paid tiers
      const priceId = this.getStripePriceId(tierId);
      if (!priceId) {
        throw new Error('Stripe price ID not configured for tier: ' + tierId);
      }
      
      stripeSubscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          userId,
          tierId,
          source: 'ultra-dex'
        }
      });
      
      const subscription: Subscription = {
        id: stripeSubscription.id,
        userId,
        customerId,
        tierId,
        status: stripeSubscription.status as any,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
      };
      
      subscriptions.set(userId, subscription);
      customerIds.set(userId, customerId);
      
      logSubscriptionCreated(userId, tierId, subscription.id, { 
        tier: tier.name,
        price: tier.price 
      });
      
      return subscription;
    } catch (error) {
      logError('Failed to create subscription', error as Error, { userId, tierId });
      throw error;
    }
  }
  
  private getStripePriceId(tierId: string): string | null {
    // Map tier IDs to Stripe Price IDs
    // These should be set as environment variables in production
    const priceMap: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_PRO || '',
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE || ''
    };
    return priceMap[tierId] || null;
  }
  
  async getSubscription(userId: string): Promise<Subscription | null> {
    return subscriptions.get(userId) || null;
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
    customerIds.set(userId, customerId);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, tierId },
      subscription_data: {
        metadata: { userId, tierId }
      }
    });

    if (!session.url) {
      throw new Error('Stripe checkout session URL missing');
    }

    return { url: session.url };
  }

  async createPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
    const subscription = subscriptions.get(userId);
    const customerId = subscription?.customerId || customerIds.get(userId);

    if (!customerId) {
      throw new Error('Customer not found for user');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });

    return { url: session.url };
  }

  async listInvoices(userId: string): Promise<Array<{ date: string; amount: number; status: string; pdfUrl?: string }>> {
    const subscription = subscriptions.get(userId);
    const customerId = subscription?.customerId || customerIds.get(userId);

    if (!customerId) {
      return [];
    }

    const invoices = await stripe.invoices.list({ customer: customerId, limit: 10 });
    return invoices.data.map((invoice) => ({
      date: new Date(invoice.created * 1000).toISOString(),
      amount: invoice.amount_paid || invoice.amount_due,
      status: invoice.status || 'unknown',
      pdfUrl: invoice.invoice_pdf || invoice.hosted_invoice_url || undefined
    }));
  }
  
  async cancelSubscription(userId: string): Promise<void> {
    try {
      const sub = subscriptions.get(userId);
      if (!sub) {
        throw new Error('Subscription not found');
      }
      
      // Cancel Stripe subscription if it's a paid tier
      if (sub.tierId !== 'free' && !sub.id.startsWith('sub_free_')) {
        await stripe.subscriptions.update(sub.id, {
          cancel_at_period_end: true
        });
      }
      
      sub.cancelAtPeriodEnd = true;
      sub.status = 'canceled';
      
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
              currency: invoice.currency
            });
          }
          break;
        }
        
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          const tierId = subscription.metadata?.tierId;
          
          if (userId && tierId) {
            logSubscriptionCreated(userId, tierId, subscription.id, {
              status: subscription.status
            });
          }
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          
          if (userId) {
            const localSub = subscriptions.get(userId);
            if (localSub) {
              localSub.status = 'canceled';
            }
            
            logSubscriptionCancelled(userId, subscription.id, 'stripe_webhook');
          }
          break;
        }
        
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          
          if (userId) {
            const localSub = subscriptions.get(userId);
            if (localSub) {
              localSub.status = subscription.status as any;
              localSub.cancelAtPeriodEnd = subscription.cancel_at_period_end;
              localSub.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
            }
          }
          break;
        }
      }
    } catch (error) {
      logError('Webhook processing failed', error as Error, { 
        eventType: event.type,
        eventId: event.id 
      });
      throw error;
    }
  }
  
  async recordUsage(userId: string, requests: number, tokens: number): Promise<void> {
    usageRecords.push({
      userId,
      requests,
      tokens,
      timestamp: new Date()
    });
    
    // Clean up old records (keep last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const index = usageRecords.findIndex(r => r.timestamp > thirtyDaysAgo);
    if (index > 0) {
      usageRecords.splice(0, index);
    }
  }
  
  async getUsageForPeriod(userId: string, startDate: Date, endDate: Date): Promise<{
    totalRequests: number;
    totalTokens: number;
  }> {
    const records = usageRecords.filter(r => 
      r.userId === userId &&
      r.timestamp >= startDate &&
      r.timestamp <= endDate
    );
    
    return {
      totalRequests: records.reduce((sum, r) => sum + r.requests, 0),
      totalTokens: records.reduce((sum, r) => sum + r.tokens, 0)
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
      withinLimits: tier.limits.requestsPerMonth < 0 || usage.totalRequests <= tier.limits.requestsPerMonth
    };
  }
  
  getPricingTiers(): PricingTier[] {
    return PRICING_TIERS;
  }
}

export const billingService = new BillingService();
