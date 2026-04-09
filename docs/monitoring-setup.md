# Ultra-Dex Monitoring Setup

## Overview

This document describes the complete monitoring and analytics setup for Ultra-Dex.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Ultra-Dex      │────▶│  Better Stack    │────▶│   Slack     │
│  Server         │     │  (Monitoring)    │     │  (Alerts)   │
└─────────────────┘     └──────────────────┘     └─────────────┘
         │                       │
         │                       ▼
         │              ┌──────────────────┐
         └─────────────▶│  Analytics       │
                        │  Dashboard       │
                        └──────────────────┘
```

## Services

### 1. Better Stack (Primary)

**URL:** https://betterstack.com
**Purpose:** All-in-one monitoring, logging, and analytics

**Features Used:**

- Uptime monitoring (checks every minute)
- Log aggregation (100k logs/month free)
- Event tracking (user signups, AI requests, billing)
- Status page (public)
- Alerting (Slack integration)

**Setup:**

```bash
# Environment variable
BETTER_STACK_SOURCE_TOKEN=xxx
```

### 2. Clerk (Authentication)

**URL:** https://clerk.com
**Purpose:** User authentication and session management

**Features Used:**

- User registration/login
- Session management
- JWT tokens
- Social auth (Google, GitHub)

**Setup:**

```bash
# Environment variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
```

### 3. Sentry (Error Tracking)

**URL:** https://sentry.io
**Purpose:** Detailed error tracking and debugging

**Features Used:**

- Exception capture
- Stack traces
- Error context (userId, path, AI provider)
- Release tracking

**Setup:**

```bash
# Environment variable
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### 4. Stripe (Billing)

**URL:** https://stripe.com
**Purpose:** Payment processing and subscription management

**Features Used:**

- Subscription billing
- Payment processing
- Webhook handling
- Invoice generation

**Setup:**

```bash
# Environment variables
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 5. Slack (Team Notifications)

**URL:** https://slack.com
**Purpose:** Real-time team alerts

**Setup:**

1. Create Slack app at https://api.slack.com/apps
2. Add Incoming Webhooks
3. Copy webhook URL to Better Stack integration

## Events Tracked

### User Events

- `user_signup` - New user registration
- `user_login` - User login
- `user_logout` - User logout
- `user_upgrade` - Plan upgrade

### AI Events

- `ai_request` - AI API call
  - Provider (OpenAI, Anthropic, etc.)
  - Model (gpt-4, claude-3, etc.)
  - Tokens used
  - Cost
  - Latency

### Billing Events

- `subscription_created`
- `payment_succeeded`
- `subscription_cancelled`
- `invoice_generated`

### System Events

- `server_started`
- `request` (all HTTP requests)
- `error` (all errors)

## Alert Configuration

### Critical Alerts (Immediate)

- Server down
- Database connection failed
- Payment processing error
- Auth service error

### Warning Alerts (5 min delay)

- High error rate (>5%)
- High latency (>2s p95)
- Low disk space
- Memory usage >80%

### Info Alerts (Daily digest)

- Daily active users
- Revenue summary
- API usage report

## Dashboard URLs

- **Better Stack:** https://uptime.betterstack.com/team/t524725
- **Status Page:** https://status.ultra-dex.ai (after setup)
- **Sentry:** https://sentry.io/organizations/your-org
- **Stripe:** https://dashboard.stripe.com

## Troubleshooting

### Better Stack not receiving logs

1. Check `BETTER_STACK_SOURCE_TOKEN` is set
2. Verify token is correct in Better Stack dashboard
3. Check server logs for errors

### Clerk auth not working

1. Verify `CLERK_SECRET_KEY` is correct
2. Check Clerk dashboard for active users
3. Verify JWT token format

### Sentry not catching errors

1. Check `SENTRY_DSN` is set correctly
2. Verify DSN includes project ID
3. Check Sentry dashboard for project

### Stripe webhooks failing

1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
2. Check webhook endpoint URL is correct
3. Verify webhook events are selected in Stripe

## Cost Breakdown

| Service      | Free Tier              | When to Pay   | Paid Cost  |
| ------------ | ---------------------- | ------------- | ---------- |
| Better Stack | 10 monitors, 100k logs | Need more     | $25/mo     |
| Clerk        | 10k users              | More users    | $25/mo     |
| Sentry       | 5k errors              | More errors   | $26/mo     |
| Stripe       | No fee                 | Transactions  | 2.9% + 30¢ |
| Slack        | Free                   | More features | $7/user/mo |

**Total Starting:** $0/month
**At Scale (1k users):** ~$85/month

## Support

- Better Stack: hello@betterstack.com
- Clerk: support@clerk.dev
- Sentry: support@sentry.io
- Stripe: support@stripe.com
