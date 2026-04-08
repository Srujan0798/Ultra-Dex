# Ultra-Dex Billing

Ultra-Dex uses Stripe for subscriptions and metered usage with three plans.

## Pricing

| Plan | Price | Requests / day | Token budget / day | Agent slots | Key features |
|---|---:|---:|---:|---:|---|
| Free | $0 | 100 | 10,000 | 3 | Core orchestration, MCP basics, community support |
| Pro | $29/mo | 10,000 | 1,000,000 | 25 | Priority routing, advanced analytics, faster support |
| Enterprise | $99/mo | Unlimited* | Unlimited* | Unlimited* | Governance suite, SSO/RBAC, audit/compliance tooling |

\* Subject to fair-use and account-level safeguards.

## Stripe setup

1. Install and authenticate Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   stripe login
   ```
2. Run setup script:
   ```bash
   ./scripts/setup-stripe.sh
   ```
3. Copy generated IDs into environment variables:
   - `STRIPE_PRICE_PRO`
   - `STRIPE_PRICE_ENTERPRISE`

## Render webhook configuration

1. In Stripe Dashboard, create webhook endpoint:
   - `https://ultra-dex.onrender.com/api/billing/webhook`
2. Subscribe to events:
   - `invoice.paid`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
3. Set Render env var:
   - `STRIPE_WEBHOOK_SECRET=whsec_...`

## Usage metering

Usage is tracked per user for daily limits:

- Requests
- Tokens
- Subscription tier limits

Billing usage endpoints:

- `GET /api/billing/usage`
- `GET /api/billing/invoices`

## Upgrade flow

1. User selects plan from billing UI.
2. Dashboard calls `POST /api/billing/checkout`.
3. Backend creates Stripe Checkout Session and returns redirect URL.
4. User completes payment in Stripe Checkout.
5. Stripe webhook updates subscription state.
6. Dashboard reflects new plan and limits.
