import Stripe from 'stripe';
import { PRICING_TIERS, getTierById, PricingTier } from './pricing-tiers.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-12-18.acacia'
});

export interface Subscription {
  id: string;
  userId: string;
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
const usageRecords: UsageRecord[] = [];

export class BillingService {
  async createCustomer(email: string, name: string): Promise<string> {
    if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_live')) {
      // Return dummy customer ID in test mode
      return `cus_test_${Date.now()}`;
    }
    
    const customer = await stripe.customers.create({
      email,
      name
    });
    return customer.id;
  }
  
  async createSubscription(userId: string, tierId: string, customerId: string): Promise<Subscription> {
    const tier = getTierById(tierId);
    if (!tier) {
      throw new Error('Invalid tier');
    }
    
    // In production: create Stripe subscription
    // For now: create local subscription
    const subscription: Subscription = {
      id: `sub_${Date.now()}`,
      userId,
      tierId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false
    };
    
    subscriptions.set(userId, subscription);
    return subscription;
  }
  
  async getSubscription(userId: string): Promise<Subscription | null> {
    return subscriptions.get(userId) || null;
  }
  
  async cancelSubscription(userId: string): Promise<void> {
    const sub = subscriptions.get(userId);
    if (sub) {
      sub.cancelAtPeriodEnd = true;
      sub.status = 'canceled';
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
