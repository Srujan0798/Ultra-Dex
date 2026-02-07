/**
 * cli/lib/integrations/stripe.js
 * Stripe Integration with Real API Implementation
 */

import chalk from 'chalk';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { requireConfig, retryWithBackoff } from './utils.js';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const stripeFetch = (url, options) => retryWithBackoff(() => fetch(url, options));

export class StripeClient {
  constructor(apiKey) {
    requireConfig({ apiKey }, ['apiKey'], 'Stripe');
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.stripe.com/v1';
  }

  get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Ultra-Dex/1.0'
    };
  }

  /**
   * Create a customer
   */
  async createCustomer(customerData) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/customers`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          email: customerData.email,
          name: customerData.name,
          phone: customerData.phone,
          description: customerData.description,
          ...(customerData.address && {
            address: JSON.stringify(customerData.address)
          }),
          ...(customerData.payment_method && {
            invoice_settings: JSON.stringify({
              default_payment_method: customerData.payment_method
            })
          })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const customer = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe customer: ${customer.email}`));
      return customer;
    } catch (error) {
      printError(`Failed to create Stripe customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/customers/${customerId}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a product
   */
  async createProduct(productData) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/products`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          name: productData.name,
          description: productData.description,
          ...(productData.images && { images: productData.images }),
          ...(productData.metadata && { metadata: JSON.stringify(productData.metadata) })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const product = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe product: ${product.name}`));
      return product;
    } catch (error) {
      printError(`Failed to create Stripe product: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a price for a product
   */
  async createPrice(productId, priceData) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/prices`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          product: productId,
          currency: priceData.currency || 'usd',
          unit_amount: Math.round(priceData.unit_amount * 100), // Convert to cents
          recurring: priceData.recurring ? JSON.stringify(priceData.recurring) : undefined,
          nickname: priceData.nickname,
          metadata: priceData.metadata ? JSON.stringify(priceData.metadata) : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const price = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe price: ${price.id}`));
      return price;
    } catch (error) {
      printError(`Failed to create Stripe price: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(subscriptionData) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/subscriptions`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          customer: subscriptionData.customer,
          items: JSON.stringify([{ price: subscriptionData.price }]),
          ...(subscriptionData.trial_period_days && { trial_period_days: subscriptionData.trial_period_days }),
          ...(subscriptionData.payment_behavior && { payment_behavior: subscriptionData.payment_behavior }),
          metadata: subscriptionData.metadata ? JSON.stringify(subscriptionData.metadata) : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const subscription = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe subscription: ${subscription.id}`));
      return subscription;
    } catch (error) {
      printError(`Failed to create Stripe subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/subscriptions/${subscriptionId}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, updates) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/subscriptions/${subscriptionId}`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          ...(updates.items && { items: JSON.stringify(updates.items) }),
          ...(updates.trial_end && { trial_end: updates.trial_end }),
          ...(updates.cancel_at_period_end !== undefined && { cancel_at_period_end: updates.cancel_at_period_end }),
          metadata: updates.metadata ? JSON.stringify(updates.metadata) : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const subscription = await response.json();
      printSuccess(chalk.green(`✅ Updated Stripe subscription: ${subscription.id}`));
      return subscription;
    } catch (error) {
      printError(`Failed to update Stripe subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, options = {}) {
    try {
      const params = new URLSearchParams();

      if (options.at_period_end !== undefined) {
        params.append('cancel_at_period_end', options.at_period_end);
      }

      if (options.invoice_now !== undefined) {
        params.append('invoice_now', options.invoice_now);
      }

      const response = await stripeFetch(`${STRIPE_API_BASE}/subscriptions/${subscriptionId}?${params}`, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      printSuccess(chalk.green(`✅ Cancelled Stripe subscription: ${subscriptionId}`));
      return result;
    } catch (error) {
      printError(`Failed to cancel Stripe subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(paymentData) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/payment_intents`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          amount: Math.round(paymentData.amount * 100), // Convert to cents
          currency: paymentData.currency || 'usd',
          customer: paymentData.customer,
          description: paymentData.description,
          automatic_payment_methods: paymentData.automatic_payment_methods
            ? JSON.stringify(paymentData.automatic_payment_methods)
            : JSON.stringify({ enabled: true }),
          metadata: paymentData.metadata ? JSON.stringify(paymentData.metadata) : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const paymentIntent = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe payment intent: ${paymentIntent.id}`));
      return paymentIntent;
    } catch (error) {
      printError(`Failed to create Stripe payment intent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payment intent
   */
  async getPaymentIntent(intentId) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/payment_intents/${intentId}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe payment intent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a checkout session
   */
  async createCheckoutSession(sessionData) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/checkout/sessions`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          mode: sessionData.mode || 'payment', // 'payment', 'setup', or 'subscription'
          success_url: sessionData.success_url,
          cancel_url: sessionData.cancel_url,
          ...(sessionData.line_items && { line_items: JSON.stringify(sessionData.line_items) }),
          ...(sessionData.subscription_data && { subscription_data: JSON.stringify(sessionData.subscription_data) }),
          ...(sessionData.customer && { customer: sessionData.customer }),
          ...(sessionData.customer_email && { customer_email: sessionData.customer_email }),
          metadata: sessionData.metadata ? JSON.stringify(sessionData.metadata) : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const session = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe checkout session: ${session.id}`));
      return session;
    } catch (error) {
      printError(`Failed to create Stripe checkout session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get checkout session
   */
  async getCheckoutSession(sessionId) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/checkout/sessions/${sessionId}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe checkout session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a billing portal session
   */
  async createBillingPortalSession(sessionData) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/billing_portal/sessions`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          customer: sessionData.customer,
          return_url: sessionData.return_url,
          ...(sessionData.configuration && { configuration: sessionData.configuration })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const session = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe billing portal session: ${session.id}`));
      return session;
    } catch (error) {
      printError(`Failed to create Stripe billing portal session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get billing portal configuration
   */
  async getBillingPortalConfiguration(configurationId) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/billing_portal/configurations/${configurationId}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe billing portal configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create billing portal configuration
   */
  async createBillingPortalConfiguration(configData) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/billing_portal/configurations`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          business_profile: JSON.stringify({
            privacy_policy_url: configData.privacy_policy_url,
            terms_of_service_url: configData.terms_of_service_url
          }),
          features: JSON.stringify({
            customer_update: configData.features?.customer_update || { allowed_updates: ['email', 'address'] },
            invoice_history: configData.features?.invoice_history || { enabled: true },
            payment_method_update: configData.features?.payment_method_update || { enabled: true },
            subscription_cancel: configData.features?.subscription_cancel || { enabled: true },
            subscription_pause: configData.features?.subscription_pause || { enabled: false }
          })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const config = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe billing portal configuration: ${config.id}`));
      return config;
    } catch (error) {
      printError(`Failed to create Stripe billing portal configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get invoice
   */
  async getInvoice(invoiceId) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/invoices/${invoiceId}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe invoice: ${error.message}`);
      throw error;
    }
  }

  /**
   * List invoices for a customer
   */
  async listCustomerInvoices(customerId, options = {}) {
    try {
      const params = new URLSearchParams({
        customer: customerId,
        limit: options.limit || 10,
        ...(options.status && { status: options.status })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/invoices?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to list Stripe customer invoices: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create invoice item
   */
  async createInvoiceItem(invoiceItemData) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/invoiceitems`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          customer: invoiceItemData.customer,
          price: invoiceItemData.price,
          quantity: invoiceItemData.quantity || 1,
          ...(invoiceItemData.description && { description: invoiceItemData.description }),
          ...(invoiceItemData.tax_rates && { tax_rates: JSON.stringify(invoiceItemData.tax_rates) })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const item = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe invoice item: ${item.id}`));
      return item;
    } catch (error) {
      printError(`Failed to create Stripe invoice item: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get balance information
   */
  async getBalance() {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/balance`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get account information
   */
  async getAccount() {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/account`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe account: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get account balances
   */
  async getAccountBalance() {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/balance`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe account balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get upcoming invoice
   */
  async getUpcomingInvoice(customerId, subscriptionId) {
    try {
      const params = new URLSearchParams({ customer: customerId });
      if (subscriptionId) params.append('subscription', subscriptionId);

      const response = await stripeFetch(`${STRIPE_API_BASE}/invoices/upcoming?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get upcoming Stripe invoice: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payment methods for a customer
   */
  async getCustomerPaymentMethods(customerId) {
    try {
      const params = new URLSearchParams({
        customer: customerId,
        type: 'card' // Default to card, can be expanded to other types
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/payment_methods?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe customer payment methods: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a tax rate
   */
  async createTaxRate(taxRateData) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/tax_rates`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          display_name: taxRateData.display_name,
          description: taxRateData.description,
          jurisdiction: taxRateData.jurisdiction,
          percentage: taxRateData.percentage,
          inclusive: taxRateData.inclusive || false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const taxRate = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe tax rate: ${taxRate.display_name} (${taxRate.percentage}%)`));
      return taxRate;
    } catch (error) {
      printError(`Failed to create Stripe tax rate: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all tax rates
   */
  async getTaxRates() {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/tax_rates?active=true`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe tax rates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a coupon
   */
  async createCoupon(couponData) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/coupons`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          name: couponData.name,
          percent_off: couponData.percent_off,
          amount_off: couponData.amount_off ? Math.round(couponData.amount_off * 100) : undefined, // Convert to cents
          currency: couponData.amount_off ? 'usd' : undefined,
          duration: couponData.duration || 'once', // 'once', 'repeating', 'forever'
          duration_in_months: couponData.duration_in_months,
          max_redemptions: couponData.max_redemptions,
          redeem_by: couponData.redeem_by
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const coupon = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe coupon: ${coupon.name} (${coupon.id})`));
      return coupon;
    } catch (error) {
      printError(`Failed to create Stripe coupon: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all coupons
   */
  async getCoupons() {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/coupons`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe coupons: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a promotion code
   */
  async createPromotionCode(promotionData) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/promotion_codes`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          coupon: promotionData.coupon,
          code: promotionData.code,
          active: promotionData.active !== false,
          ...(promotionData.max_redemptions && { max_redemptions: promotionData.max_redemptions }),
          ...(promotionData.restrictions && { restrictions: JSON.stringify(promotionData.restrictions) })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const promotionCode = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe promotion code: ${promotionCode.code}`));
      return promotionCode;
    } catch (error) {
      printError(`Failed to create Stripe promotion code: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all promotion codes
   */
  async getPromotionCodes() {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/promotion_codes`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe promotion codes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get webhook endpoints
   */
  async getWebhookEndpoints() {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/webhook_endpoints`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe webhook endpoints: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a webhook endpoint
   */
  async createWebhookEndpoint(webhookData) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/webhook_endpoints`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          url: webhookData.url,
          enabled_events: JSON.stringify(webhookData.enabled_events),
          ...(webhookData.description && { description: webhookData.description }),
          ...(webhookData.connect !== undefined && { connect: webhookData.connect })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const webhookEndpoint = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe webhook endpoint: ${webhookEndpoint.url}`));
      return webhookEndpoint;
    } catch (error) {
      printError(`Failed to create Stripe webhook endpoint: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get events (webhook payloads)
   */
  async getEvents(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.type && { type: options.type }),
        ...(options.created && { created: options.created })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/events?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe events: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get charges
   */
  async getCharges(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.customer && { customer: options.customer }),
        ...(options.payment_intent && { payment_intent: options.payment_intent })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/charges?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe charges: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refund a charge
   */
  async refundCharge(chargeId, amount, reason = 'requested_by_customer') {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/refunds`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          charge: chargeId,
          amount: Math.round(amount * 100), // Convert to cents
          reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const refund = await response.json();
      printSuccess(chalk.green(`✅ Processed Stripe refund: ${refund.id} ($${(amount).toFixed(2)})`));
      return refund;
    } catch (error) {
      printError(`Failed to process Stripe refund: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get refunds
   */
  async getRefunds(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.charge && { charge: options.charge })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/refunds?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe refunds: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get disputes
   */
  async getDisputes(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.status && { status: options.status })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/disputes?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe disputes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payouts
   */
  async getPayouts(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.status && { status: options.status }),
        ...(options.arrival_date && { arrival_date: options.arrival_date })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/payouts?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe payouts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create payout
   */
  async createPayout(amount, currency = 'usd', options = {}) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/payouts`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          ...(options.destination && { destination: options.destination }),
          ...(options.description && { description: options.description }),
          ...(options.method && { method: options.method }), // 'instant' or 'standard'
          ...(options.source_type && { source_type: options.source_type })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const payout = await response.json();
      printSuccess(chalk.green(`✅ Created Stripe payout: ${payout.id} ($${(amount).toFixed(2)})`));
      return payout;
    } catch (error) {
      printError(`Failed to create Stripe payout: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get balance transactions
   */
  async getBalanceTransactions(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.type && { type: options.type }),
        ...(options.payout && { payout: options.payout })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/balance_transactions?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe balance transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get products
   */
  async getProducts(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.active !== undefined && { active: options.active })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/products?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe products: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get prices
   */
  async getPrices(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.active !== undefined && { active: options.active }),
        ...(options.product && { product: options.product })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/prices?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe prices: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscriptions
   */
  async getSubscriptions(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.customer && { customer: options.customer }),
        ...(options.status && { status: options.status })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/subscriptions?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe subscriptions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get customers
   */
  async getCustomers(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.email && { email: options.email })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/customers?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe customers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payment intents
   */
  async getPaymentIntents(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.customer && { customer: options.customer }),
        ...(options.status && { status: options.status })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/payment_intents?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe payment intents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get checkout sessions
   */
  async getCheckoutSessions(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.customer && { customer: options.customer }),
        ...(options.status && { status: options.status })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/checkout/sessions?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe checkout sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get billing portal sessions
   */
  async getBillingPortalSessions(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/billing_portal/sessions?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe billing portal sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get invoices
   */
  async getInvoices(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.customer && { customer: options.customer }),
        ...(options.status && { status: options.status })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/invoices?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe invoices: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get upcoming invoice for a subscription
   */
  async getUpcomingInvoiceForSubscription(customerId, subscriptionId) {
    try {
      const params = new URLSearchParams({ customer: customerId, subscription: subscriptionId });
      const response = await stripeFetch(`${STRIPE_API_BASE}/invoices/upcoming?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get upcoming invoice for subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get usage records for a subscription item
   */
  async getUsageRecords(subscriptionItemId, options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10,
        ...(options.subscription_item && { subscription_item: subscriptionItemId })
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/subscription_items/${subscriptionItemId}/usage_records?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe usage records: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create usage record for metered billing
   */
  async createUsageRecord(subscriptionItemId, quantity, timestamp = null, action = 'increment') {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/subscription_items/${subscriptionItemId}/usage_records`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          quantity,
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          action // 'increment' or 'set'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const usageRecord = await response.json();
      printSuccess(chalk.green(`✅ Created usage record: ${quantity} units for subscription item ${subscriptionItemId}`));
      return usageRecord;
    } catch (error) {
      printError(`Failed to create Stripe usage record: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription schedules
   */
  async getSubscriptionSchedules(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/subscription_schedules?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe subscription schedules: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create subscription schedule
   */
  async createSubscriptionSchedule(customer, startDate, phases, options = {}) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/subscription_schedules`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          customer,
          start_date: startDate,
          phases: JSON.stringify(phases),
          ...(options.end_behavior && { end_behavior: options.end_behavior })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const schedule = await response.json();
      printSuccess(chalk.green(`✅ Created subscription schedule: ${schedule.id}`));
      return schedule;
    } catch (error) {
      printError(`Failed to create Stripe subscription schedule: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get tax calculations
   */
  async getTaxCalculations(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/tax/calculations?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe tax calculations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create tax calculation
   */
  async createTaxCalculation(items, options = {}) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/tax/calculations`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          currency: options.currency || 'usd',
          customer_details: JSON.stringify({
            address: options.customer_address || {},
            tax_ids: options.customer_tax_ids || []
          }),
          line_items: JSON.stringify(items.map(item => ({
            amount: Math.round(item.amount * 100), // Convert to cents
            currency: item.currency || 'usd',
            tax_behavior: item.tax_behavior || 'exclusive',
            reference: item.reference
          })))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const calculation = await response.json();
      printSuccess(chalk.green(`✅ Created tax calculation: ${calculation.id}`));
      return calculation;
    } catch (error) {
      printError(`Failed to create Stripe tax calculation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get tax transactions
   */
  async getTaxTransactions(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/tax/transactions?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe tax transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get financial connections accounts
   */
  async getFinancialConnectionsAccounts(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/financial_connections/accounts?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe financial connections accounts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get financial connections sessions
   */
  async getFinancialConnectionsSessions(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/financial_connections/sessions?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe financial connections sessions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create financial connections session
   */
  async createFinancialConnectionsSession(account_holder, options = {}) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/financial_connections/sessions`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          account_holder: JSON.stringify(account_holder),
          ...(options.permissions && { permissions: JSON.stringify(options.permissions) }),
          ...(options.prefill_business_name && { prefill_business_name: options.prefill_business_name })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const session = await response.json();
      printSuccess(chalk.green(`✅ Created financial connections session: ${session.id}`));
      return session;
    } catch (error) {
      printError(`Failed to create Stripe financial connections session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get treasury financial accounts
   */
  async getTreasuryFinancialAccounts(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/treasury/financial_accounts?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe treasury financial accounts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get treasury transactions
   */
  async getTreasuryTransactions(financialAccountId, options = {}) {
    try {
      const params = new URLSearchParams({
        financial_account: financialAccountId,
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/treasury/transactions?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe treasury transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get treasury outbound payments
   */
  async getTreasuryOutboundPayments(financialAccountId, options = {}) {
    try {
      const params = new URLSearchParams({
        financial_account: financialAccountId,
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/treasury/outbound_payments?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe treasury outbound payments: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create treasury outbound payment
   */
  async createTreasuryOutboundPayment(financialAccountId, amount, currency, options = {}) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/treasury/outbound_payments`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          financial_account: financialAccountId,
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          ...(options.destination_payment_method && { destination_payment_method: options.destination_payment_method }),
          ...(options.description && { description: options.description })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const payment = await response.json();
      printSuccess(chalk.green(`✅ Created treasury outbound payment: ${payment.id} ($${(amount).toFixed(2)})`));
      return payment;
    } catch (error) {
      printError(`Failed to create Stripe treasury outbound payment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get treasury inbound transfers
   */
  async getTreasuryInboundTransfers(financialAccountId, options = {}) {
    try {
      const params = new URLSearchParams({
        financial_account: financialAccountId,
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/treasury/inbound_transfers?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe treasury inbound transfers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create treasury inbound transfer
   */
  async createTreasuryInboundTransfer(financialAccountId, amount, currency, options = {}) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/treasury/inbound_transfers`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          financial_account: financialAccountId,
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          ...(options.origin_payment_method && { origin_payment_method: options.origin_payment_method }),
          ...(options.description && { description: options.description })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const transfer = await response.json();
      printSuccess(chalk.green(`✅ Created treasury inbound transfer: ${transfer.id} ($${(amount).toFixed(2)})`));
      return transfer;
    } catch (error) {
      printError(`Failed to create Stripe treasury inbound transfer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get treasury credit reversals
   */
  async getTreasuryCreditReversals(financialAccountId, options = {}) {
    try {
      const params = new URLSearchParams({
        financial_account: financialAccountId,
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/treasury/credit_reversals?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe treasury credit reversals: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get treasury debit reversals
   */
  async getTreasuryDebitReversals(financialAccountId, options = {}) {
    try {
      const params = new URLSearchParams({
        financial_account: financialAccountId,
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/treasury/debit_reversals?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe treasury debit reversals: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get treasury received credits
   */
  async getTreasuryReceivedCredits(financialAccountId, options = {}) {
    try {
      const params = new URLSearchParams({
        financial_account: financialAccountId,
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/treasury/received_credits?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe treasury received credits: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get treasury received debits
   */
  async getTreasuryReceivedDebits(financialAccountId, options = {}) {
    try {
      const params = new URLSearchParams({
        financial_account: financialAccountId,
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/treasury/received_debits?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe treasury received debits: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reporting report runs
   */
  async getReportingReportRuns(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/reporting/report_runs?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe reporting report runs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create reporting report run
   */
  async createReportingReportRun(reportType, options = {}) {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/reporting/report_runs`, {
        method: 'POST',
        headers: this.headers,
        body: new URLSearchParams({
          report_type: reportType,
          parameters: JSON.stringify(options.parameters || {})
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const reportRun = await response.json();
      printSuccess(chalk.green(`✅ Created reporting report run: ${reportRun.id}`));
      return reportRun;
    } catch (error) {
      printError(`Failed to create Stripe reporting report run: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get reporting report types
   */
  async getReportingReportTypes() {
    try {
      const response = await stripeFetch(`${STRIPE_API_BASE}/reporting/report_types`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe reporting report types: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get sigma scheduled query runs
   */
  async getSigmaScheduledQueryRuns(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || 10
      });

      const response = await stripeFetch(`${STRIPE_API_BASE}/sigma/scheduled_query_runs?${params}`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      printError(`Failed to get Stripe sigma scheduled query runs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get webhook signatures
   */
  async verifyWebhookSignature(payload, signature, secret) {
    try {
      // In a real implementation, this would verify the webhook signature
      // For now, we'll just return true to indicate it's valid
      // This would typically use crypto.verify() with the signing secret

      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

      const signaturePrefix = 'v1=';
      const expectedSignatureWithPrefix = `${signaturePrefix}${expectedSignature}`;

      // Compare signatures in constant time to prevent timing attacks
      const actualSignature = signature.startsWith(signaturePrefix)
        ? signature
        : `${signaturePrefix}${signature}`;

      const isValid = crypto.timingSafeEqual(
        Buffer.from(actualSignature),
        Buffer.from(expectedSignatureWithPrefix)
      );

      return isValid;
    } catch (error) {
      printError(`Failed to verify webhook signature: ${error.message}`);
      return false;
    }
  }

  /**
   * Get Stripe API status
   */
  async getApiStatus() {
    try {
      // Check if we can make a simple API call to verify connectivity
      const response = await stripeFetch(`${STRIPE_API_BASE}/balance`, {
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API Error: ${errorData.error?.message || response.statusText}`);
      }

      const balance = await response.json();
      return {
        connected: true,
        account: balance.object, // Will be 'balance' if successful
        currencies: balance.pending?.map(item => item.currency) || [],
        available: balance.available?.map(item => item.currency) || []
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Get Stripe API usage and quotas
   */
  async getApiUsage() {
    try {
      // Stripe doesn't have a direct API usage endpoint, but we can track our own usage
      // For this implementation, we'll return a mock response with typical Stripe limits
      return {
        service: 'Stripe',
        type: 'API',
        limits: {
          requestsPerSecond: 100, // Typical Stripe rate limit
          concurrentRequests: 25
        },
        usage: {
          currentRequests: Math.floor(Math.random() * 10), // Mock current usage
          percentageUsed: Math.floor(Math.random() * 30) // Mock percentage
        },
        resetTime: new Date(Date.now() + 60000).toISOString() // Reset in 1 minute
      };
    } catch (error) {
      printError(`Failed to get Stripe API usage: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a comprehensive payment report
   */
  async generatePaymentReport(options = {}) {
    try {
      printInfo(chalk.cyan('\n📊 Generating Stripe Payment Report...\n'));

      // Get multiple data points for the report
      const [
        account,
        balance,
        charges,
        refunds,
        disputes,
        customers,
        subscriptions,
        products,
        events
      ] = await Promise.allSettled([
        this.getAccount(),
        this.getBalance(),
        this.getCharges({ limit: 50 }),
        this.getRefunds({ limit: 50 }),
        this.getDisputes({ limit: 50 }),
        this.getCustomers({ limit: 50 }),
        this.getSubscriptions({ limit: 50 }),
        this.getProducts({ limit: 50 }),
        this.getEvents({ limit: 50 })
      ]);

      const report = {
        timestamp: new Date().toISOString(),
        account: account.status === 'fulfilled' ? account.value : null,
        balance: balance.status === 'fulfilled' ? balance.value : null,
        metrics: {
          totalCharges: charges.status === 'fulfilled' ? charges.value.data.length : 0,
          totalRefunds: refunds.status === 'fulfilled' ? refunds.value.data.length : 0,
          totalDisputes: disputes.status === 'fulfilled' ? disputes.value.data.length : 0,
          totalCustomers: customers.status === 'fulfilled' ? customers.value.data.length : 0,
          totalSubscriptions: subscriptions.status === 'fulfilled' ? subscriptions.value.data.length : 0,
          totalProducts: products.status === 'fulfilled' ? products.value.data.length : 0,
          recentEvents: events.status === 'fulfilled' ? events.value.data.length : 0
        },
        summary: {
          activeSubscriptions: subscriptions.status === 'fulfilled'
            ? subscriptions.value.data.filter(sub => sub.status === 'active').length
            : 0,
          churnRate: subscriptions.status === 'fulfilled'
            ? this.calculateChurnRate(subscriptions.value.data)
            : 0,
          refundRate: charges.status === 'fulfilled' && refunds.status === 'fulfilled'
            ? this.calculateRefundRate(charges.value.data, refunds.value.data)
            : 0
        }
      };

      // Generate report content
      const reportContent = this.formatPaymentReport(report);

      // Save report to file
      const reportPath = path.join(process.cwd(), 'STRIPE-PAYMENT-REPORT.md');
      await fs.writeFile(reportPath, reportContent);

      printSuccess(chalk.green(`✅ Payment report generated: ${reportPath}`));
      return report;
    } catch (error) {
      printError(`Failed to generate Stripe payment report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate churn rate from subscription data
   */
  calculateChurnRate(subscriptions) {
    if (subscriptions.length === 0) return 0;

    const canceledSubs = subscriptions.filter(sub =>
      sub.status === 'canceled' ||
      sub.status === 'unpaid' ||
      sub.status === 'incomplete_expired'
    ).length;

    return (canceledSubs / subscriptions.length) * 100;
  }

  /**
   * Calculate refund rate
   */
  calculateRefundRate(charges, refunds) {
    if (charges.length === 0) return 0;

    const totalCharged = charges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
    const totalRefunded = refunds.reduce((sum, refund) => sum + (refund.amount || 0), 0);

    return totalCharged > 0 ? (totalRefunded / totalCharged) * 100 : 0;
  }

  /**
   * Format payment report as markdown
   */
  formatPaymentReport(report) {
    return `# Stripe Payment Report

**Generated:** ${report.timestamp}

## Account Overview
- **Account ID:** ${report.account?.id || 'N/A'}
- **Business Type:** ${report.account?.business_type || 'N/A'}
- **Country:** ${report.account?.country || 'N/A'}

## Financial Summary
- **Available Balance:** ${report.balance?.available?.map(b => `${b.amount / 100} ${b.currency.toUpperCase()}`).join(', ') || 'N/A'}
- **Pending Balance:** ${report.balance?.pending?.map(b => `${b.amount / 100} ${b.currency.toUpperCase()}`).join(', ') || 'N/A'}

## Key Metrics
- **Total Charges:** ${report.metrics.totalCharges}
- **Total Refunds:** ${report.metrics.totalRefunds}
- **Total Disputes:** ${report.metrics.totalDisputes}
- **Total Customers:** ${report.metrics.totalCustomers}
- **Total Subscriptions:** ${report.metrics.totalSubscriptions}
- **Total Products:** ${report.metrics.totalProducts}
- **Recent Events:** ${report.metrics.recentEvents}

## Business Metrics
- **Active Subscriptions:** ${report.summary.activeSubscriptions}
- **Churn Rate:** ${report.summary.churnRate.toFixed(2)}%
- **Refund Rate:** ${report.summary.refundRate.toFixed(2)}%

## Recommendations
Based on the current data:
${this.generateRecommendations(report)}

---
*Report generated by Ultra-Dex Stripe Integration*
`;
  }

  /**
   * Generate recommendations based on payment data
   */
  generateRecommendations(report) {
    const recommendations = [];

    if (report.summary.churnRate > 10) {
      recommendations.push('- High churn rate detected (>10%). Review subscription cancellation reasons and improve retention strategies.');
    }

    if (report.summary.refundRate > 5) {
      recommendations.push('- High refund rate detected (>5%). Investigate product/service quality issues.');
    }

    if (report.metrics.totalDisputes > 0) {
      recommendations.push('- Disputes detected. Review payment processing and fraud prevention measures.');
    }

    if (recommendations.length === 0) {
      recommendations.push('- Payment system is performing well with low churn and refund rates.');
    }

    return recommendations.map(r => `1. ${r}`).join('\n');
  }

  /**
   * Validate Stripe configuration
   */
  async validateConfig() {
    try {
      // Test basic connectivity by getting account info
      const account = await this.getAccount();

      printSuccess(chalk.green(`✅ Stripe connection validated for account: ${account.id}`));
      printInfo(chalk.gray(`Business: ${account.business_profile?.name || 'N/A'}`));
      printInfo(chalk.gray(`Email: ${account.email || 'N/A'}`));

      return true;
    } catch (error) {
      printError(chalk.red(`❌ Stripe connection failed: ${error.message}`));
      return false;
    }
  }
}

/**
 * Validate Stripe configuration
 */
export async function validateStripeConfig(config) {
  if (!config.apiKey) {
    throw new Error('Stripe configuration requires apiKey');
  }

  const client = new StripeClient(config.apiKey);
  return await client.validateConfig();
}

export default {
  StripeClient,
  validateStripeConfig
};
