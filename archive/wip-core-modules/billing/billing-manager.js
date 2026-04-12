/**
 * Ultra-Dex Billing System
 * Enterprise-grade billing with Stripe integration
 */

import Stripe from 'stripe';
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

const BILLING_DIR = '.ultra-dex/billing';

class BillingManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      stripeApiKey: options.stripeApiKey || process.env.STRIPE_API_KEY,
      webhookSecret: options.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET,
      billingPeriod: options.billingPeriod || 'monthly', // 'daily', 'weekly', 'monthly', 'yearly'
      ...options,
    };

    this.stripe = this.options.stripeApiKey ? new Stripe(this.options.stripeApiKey) : null;
    this.plans = new Map();
    this.customers = new Map();
    this.subscriptions = new Map();
    this.usageRecords = new Map();

    this.initializePlans();
  }

  initializePlans() {
    // Define pricing tiers
    this.plans.set('free', {
      id: 'free',
      name: 'Free',
      description: 'For individual developers and hobby projects',
      price: 0,
      interval: 'monthly',
      features: [
        '1 agent',
        '100 requests/month',
        'Basic memory system',
        'Community support',
        'Open source license',
      ],
      limits: {
        agents: 1,
        requestsPerMonth: 100,
        memoryEntries: 1000,
        concurrentAgents: 1,
      },
    });

    this.plans.set('pro', {
      id: 'pro',
      name: 'Pro',
      description: 'For professional developers and small teams',
      price: 4900, // $49 in cents
      currency: 'usd',
      interval: 'monthly',
      features: [
        '10 agents',
        'Unlimited requests',
        'Advanced memory system',
        'Priority support',
        'Custom configurations',
      ],
      limits: {
        agents: 10,
        requestsPerMonth: Infinity,
        memoryEntries: 10000,
        concurrentAgents: 5,
      },
    });

    this.plans.set('team', {
      id: 'team',
      name: 'Team',
      description: 'For growing teams and departments',
      price: 19900, // $199 in cents
      currency: 'usd',
      interval: 'monthly',
      features: [
        '50 agents',
        'Unlimited requests',
        'Enterprise memory system',
        'Priority support',
        'Team management',
        'Usage analytics',
        'Custom integrations',
      ],
      limits: {
        agents: 50,
        requestsPerMonth: Infinity,
        memoryEntries: 100000,
        concurrentAgents: 20,
        teamMembers: 10,
      },
    });

    this.plans.set('enterprise', {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations with advanced requirements',
      price: 99900, // $999 in cents
      currency: 'usd',
      interval: 'monthly',
      features: [
        'Unlimited agents',
        'Unlimited requests',
        'All features included',
        'SSO with SAML/OIDC',
        'Advanced RBAC',
        'Compliance controls',
        'Audit logging',
        'Custom agent development',
        'Dedicated support',
        'SLA guarantees',
        'On-premise deployment',
        'Custom integrations',
      ],
      limits: {
        agents: Infinity,
        requestsPerMonth: Infinity,
        memoryEntries: Infinity,
        concurrentAgents: Infinity,
        teamMembers: Infinity,
        customAgents: Infinity,
      },
    });
  }

  /**
   * Create a customer in Stripe
   * @param {object} customerData - Customer information
   * @returns {object} Stripe customer object
   */
  async createCustomer(customerData) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const customer = await this.stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      metadata: {
        userId: customerData.userId,
        organizationId: customerData.organizationId,
      },
    });

    // Store customer locally
    this.customers.set(customer.id, {
      ...customerData,
      stripeCustomerId: customer.id,
      createdAt: new Date().toISOString(),
    });

    this.emit('customer:created', { customerId: customer.id, customerData });

    return customer;
  }

  /**
   * Create a subscription for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {string} planId - Plan ID to subscribe to
   * @param {object} options - Subscription options
   * @returns {object} Stripe subscription object
   */
  async createSubscription(customerId, planId, options = {}) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    // Create subscription in Stripe
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.price,
            recurring: { interval: plan.interval },
          },
        },
      ],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      ...options,
    });

    // Store subscription locally
    this.subscriptions.set(subscription.id, {
      customerId,
      planId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    this.emit('subscription:created', { subscriptionId: subscription.id, customerId, planId });

    return subscription;
  }

  /**
   * Get customer's current plan
   * @param {string} customerId - Customer ID
   * @returns {object} Current plan information
   */
  async getCurrentPlan(customerId) {
    if (!this.stripe) {
      // For development, return a mock plan
      return this.plans.get('free');
    }

    // Get active subscriptions for customer
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return this.plans.get('free'); // Default to free plan
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;

    // Find plan by price ID (in a real implementation, we'd map price IDs to plan IDs)
    for (const [planId, plan] of this.plans) {
      if (plan.stripePriceId === priceId) {
        return plan;
      }
    }

    return this.plans.get('free'); // Fallback to free plan
  }

  /**
   * Track usage for metered billing
   * @param {string} customerId - Customer ID
   * @param {string} usageType - Type of usage to track
   * @param {number} quantity - Quantity used
   * @param {object} metadata - Additional metadata
   */
  async trackUsage(customerId, usageType, quantity, metadata = {}) {
    const usageRecord = {
      id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      usageType,
      quantity,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // Store usage record
    if (!this.usageRecords.has(customerId)) {
      this.usageRecords.set(customerId, []);
    }
    this.usageRecords.get(customerId).push(usageRecord);

    // In production, report usage to Stripe for metered billing
    if (this.stripe) {
      try {
        // Find subscription with usage-based billing
        const subscriptions = await this.stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
        });

        for (const subscription of subscriptions.data) {
          for (const item of subscription.items.data) {
            if (item.price.recurring.usage_type === 'metered') {
              await this.stripe.subscriptionItems.createUsageRecord(item.id, {
                quantity,
                timestamp: Math.floor(Date.now() / 1000),
                action: 'increment',
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to report usage to Stripe:', error.message);
      }
    }

    this.emit('usage:tracked', usageRecord);

    return usageRecord;
  }

  /**
   * Get usage for a customer in the current billing period
   * @param {string} customerId - Customer ID
   * @param {string} usageType - Type of usage to get
   * @returns {number} Total usage for the period
   */
  async getUsageInPeriod(customerId, usageType) {
    const periodStart = new Date();
    periodStart.setDate(1); // Start of current month
    periodStart.setHours(0, 0, 0, 0);

    const records = this.usageRecords.get(customerId) || [];
    const periodUsage = records.filter(
      (record) => record.usageType === usageType && new Date(record.timestamp) >= periodStart
    );

    return periodUsage.reduce((sum, record) => sum + record.quantity, 0);
  }

  /**
   * Check if customer has exceeded their plan limits
   * @param {string} customerId - Customer ID
   * @param {string} limitType - Type of limit to check
   * @param {number} requestedAmount - Amount requested
   * @returns {object} Limit check result
   */
  async checkLimit(customerId, limitType, requestedAmount = 1) {
    const plan = await this.getCurrentPlan(customerId);
    const limit = plan.limits[limitType];

    if (limit === Infinity) {
      return { allowed: true, remaining: Infinity, message: 'Unlimited' };
    }

    // Get current usage for metered limits
    if (limitType === 'requestsPerMonth') {
      const currentUsage = await this.getUsageInPeriod(customerId, 'api_request');
      const remaining = limit - currentUsage;

      return {
        allowed: remaining >= requestedAmount,
        remaining,
        current: currentUsage,
        limit,
        message:
          remaining >= requestedAmount
            ? 'Within limit'
            : `Exceeded limit: ${currentUsage}/${limit}`,
      };
    }

    // For non-metered limits, just check against plan limit
    return {
      allowed: requestedAmount <= limit,
      remaining: limit - requestedAmount,
      current: requestedAmount,
      limit,
      message:
        requestedAmount <= limit ? 'Within limit' : `Exceeded limit: ${requestedAmount}/${limit}`,
    };
  }

  /**
   * Process a Stripe webhook event
   * @param {object} event - Stripe event object
   */
  async processWebhook(event) {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        this.handleSubscriptionChange(subscription);
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        this.handlePaymentSuccess(invoice);
        break;
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        this.handlePaymentFailure(failedInvoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle subscription change
   * @param {object} subscription - Stripe subscription object
   */
  async handleSubscriptionChange(subscription) {
    const customerId = subscription.customer;
    const planId = this.getPlanIdFromPrice(subscription.items.data[0].price.id);

    this.subscriptions.set(subscription.id, {
      customerId,
      planId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.emit('subscription:changed', {
      customerId,
      planId,
      status: subscription.status,
      subscriptionId: subscription.id,
    });
  }

  /**
   * Handle successful payment
   * @param {object} invoice - Stripe invoice object
   */
  async handlePaymentSuccess(invoice) {
    this.emit('payment:success', {
      customerId: invoice.customer,
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
    });
  }

  /**
   * Handle failed payment
   * @param {object} invoice - Stripe invoice object
   */
  async handlePaymentFailure(invoice) {
    this.emit('payment:failure', {
      customerId: invoice.customer,
      invoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      reason: invoice.charge?.failure_message || 'Payment failed',
    });
  }

  /**
   * Get plan ID from Stripe price ID
   * @param {string} priceId - Stripe price ID
   * @returns {string} Plan ID
   */
  getPlanIdFromPrice(priceId) {
    // In a real implementation, we'd have a mapping of price IDs to plan IDs
    // For now, return a default plan
    return 'pro';
  }

  /**
   * Get all available plans
   * @returns {Array<object>} Array of plan objects
   */
  getAvailablePlans() {
    return Array.from(this.plans.values()).map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price / 100, // Convert cents to dollars
      currency: plan.currency,
      interval: plan.interval,
      features: plan.features,
      limits: plan.limits,
    }));
  }

  /**
   * Calculate ROI for a customer
   * @param {object} usageData - Customer usage data
   * @returns {object} ROI calculation
   */
  calculateROI(usageData) {
    // ROI calculation based on time saved, efficiency gains, etc.
    const timeSavedHours = usageData.hoursSaved || 0;
    const avgHourlyRate = usageData.avgHourlyRate || 100; // Default $100/hour
    const costOfUltraDex = usageData.monthlyCost || 0;

    const valueGenerated = timeSavedHours * avgHourlyRate;
    const roiPercentage =
      costOfUltraDex > 0 ? ((valueGenerated - costOfUltraDex) / costOfUltraDex) * 100 : Infinity;

    return {
      timeSavedHours,
      valueGenerated,
      costOfUltraDex,
      roiPercentage,
      paybackPeriodMonths: valueGenerated > 0 ? costOfUltraDex / (valueGenerated / 12) : Infinity,
    };
  }

  /**
   * Get billing dashboard data
   * @param {string} customerId - Customer ID
   * @returns {object} Billing dashboard data
   */
  async getDashboardData(customerId) {
    const plan = await this.getCurrentPlan(customerId);
    const usage = await this.getUsageInPeriod(customerId, 'api_request');

    return {
      currentPlan: plan,
      usage: {
        requests: usage,
        limit: plan.limits.requestsPerMonth,
        percentage:
          plan.limits.requestsPerMonth > 0
            ? Math.min(100, (usage / plan.limits.requestsPerMonth) * 100)
            : 0,
      },
      upcomingInvoice: await this.getUpcomingInvoice(customerId),
      paymentHistory: await this.getPaymentHistory(customerId),
      roi: this.calculateROI({
        hoursSaved: 20, // Example value
        avgHourlyRate: 150,
        monthlyCost: plan.price / 100,
      }),
    };
  }

  /**
   * Get upcoming invoice for a customer
   * @param {string} customerId - Customer ID
   * @returns {object} Upcoming invoice data
   */
  async getUpcomingInvoice(customerId) {
    if (!this.stripe) {
      return { amount: 0, currency: 'usd', nextPaymentDue: new Date().toISOString() };
    }

    try {
      const invoice = await this.stripe.invoices.retrieveUpcoming({
        customer: customerId,
      });

      return {
        amount: invoice.amount_due,
        currency: invoice.currency,
        nextPaymentDue: new Date(invoice.period_end * 1000).toISOString(),
        lines: invoice.lines.data.map((line) => ({
          description: line.description,
          amount: line.amount,
          quantity: line.quantity,
          price: line.price.unit_amount,
        })),
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get payment history for a customer
   * @param {string} customerId - Customer ID
   * @returns {Array<object>} Payment history
   */
  async getPaymentHistory(customerId) {
    if (!this.stripe) {
      return [];
    }

    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: 10,
      });

      return invoices.data.map((invoice) => ({
        id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        periodStart: new Date(invoice.period_start * 1000).toISOString(),
        periodEnd: new Date(invoice.period_end * 1000).toISOString(),
        paidAt:
          invoice.status === 'paid'
            ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
            : null,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get system health information
   * @returns {object} Health information
   */
  getHealth() {
    return {
      status: 'healthy',
      stripeConnected: !!this.stripe,
      customerCount: this.customers.size,
      subscriptionCount: this.subscriptions.size,
      usageRecords: Array.from(this.usageRecords.values()).reduce(
        (sum, records) => sum + records.length,
        0
      ),
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const billingManager = new BillingManager();

// Export class for instantiation with custom options
export default BillingManager;
