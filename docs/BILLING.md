# Billing and Subscriptions

Ultra-Dex uses Stripe for subscription management and metered billing. This document outlines the pricing structure, integration details, and setup guide.

## Pricing Tiers

Ultra-Dex offers three main pricing tiers to accommodate different usage needs:

| Tier           | Price  | Requests   | Tokens    | Key Features                                           |
| -------------- | ------ | ---------- | --------- | ------------------------------------------------------ |
| **Free**       | $0/mo  | 100/day    | 10K/day   | 3 Agents, Community Support                            |
| **Pro**        | $29/mo | 10,000/day | 1M/day    | Unlimited Agents, Priority Support, Advanced Analytics |
| **Enterprise** | $99/mo | Unlimited  | Unlimited | 24/7 Support, SSO & SAML, SLA Guarantee                |

> **Note:** Limits are enforced on a monthly basis based on the daily limits shown above (e.g., Free tier allows 3,000 requests per month).

## Stripe Integration

The billing system is built on top of the Stripe Node.js SDK and handles the following core workflows:

### Subscription Lifecycle

- **Checkout:** Users are redirected to Stripe Checkout to securely enter payment information.
- **Provisioning:** Subscriptions are automatically activated upon successful payment via webhooks.
- **Management:** Users can manage their subscription (upgrade/downgrade/cancel) through the Stripe Customer Portal.
- **Metered Usage:** API requests and token consumption are tracked locally and can be synced to Stripe for usage-based billing.

### Webhook Events Handled

The system listens for the following Stripe webhook events at `/api/billing/webhook`:

- `invoice.paid`: Records successful payments and resets usage counters.
- `customer.subscription.created`: Provisions new access levels.
- `customer.subscription.updated`: Handles upgrades, downgrades, and cancellations.
- `customer.subscription.deleted`: Reverts the user to the Free tier.

### Environment Variables

The following environment variables are required for Stripe integration:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

## API Endpoints

### Public / Authenticated Endpoints

- `GET /api/billing/pricing`: Lists all available pricing tiers and features.
- `GET /api/billing/usage`: Returns the current user's monthly usage and remaining limits.
- `POST /api/billing/checkout`: Creates a Stripe Checkout session for a selected tier.
- `POST /api/billing/portal`: Generates a link to the Stripe Customer Portal.
- `GET /api/billing/invoices`: Returns a list of past invoices and payment status.
- `POST /api/billing/cancel`: Cancels the current subscription at the end of the period.

### Internal Endpoints

- `POST /api/billing/webhook`: Endpoint for Stripe to send event notifications.

## Setup Guide

To set up billing for your Ultra-Dex instance:

1. **Stripe Account:** Create a [Stripe account](https://stripe.com).
2. **Define Products:** In the Stripe Dashboard, create two products: "Ultra-Dex Pro" and "Ultra-Dex Enterprise".
3. **Create Prices:** Add recurring monthly prices for each product ($29 and $99 respectively).
4. **Configure Webhooks:**
   - Go to Developers > Webhooks.
   - Add an endpoint pointing to `https://your-domain.com/api/billing/webhook`.
   - Select the events listed in the "Webhook Events Handled" section above.
5. **Set Env Vars:** Add the keys and price IDs to your `.env` file.

## Testing

### Stripe Test Mode

Always use your Stripe `test` keys (`sk_test_...`) during development. You can toggle between Test and Live mode in the Stripe Dashboard.

### Test Card Numbers

Use Stripe's [standard test cards](https://stripe.com/docs/testing#cards) to simulate different payment scenarios:

- **Success:** `4242 4242 4242 4242`
- **Declined:** `4000 0000 0000 0002`

### Webhook Testing with Stripe CLI

To test webhooks locally without exposing your local server to the internet:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Run `stripe login` to authenticate.
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```
4. Use the signing secret provided by the CLI as your `STRIPE_WEBHOOK_SECRET`.
