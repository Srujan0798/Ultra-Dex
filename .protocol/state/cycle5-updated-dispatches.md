# Cycle 5: GO LIVE - Better Stack Edition (No PostHog)

## YOUR SETUP
✅ Render: Deployed (fixing build)
✅ Better Stack: Monitoring + Analytics + Logging (all-in-one)
✅ Slack: Alerts

---

## P0 — FIX BUILD & DEPLOY (YOU)

**Fix Render Build Command:**
```
npm ci && npm run build:core && npm run build:cli
```

**Start Command:**
```
npm run start:prod
```

Then: Save → Manual Deploy → Wait 5 min

---

## P1 — BETTER STACK ANALYTICS (Use Built-in Features)

### [WINDOW 1] Setup Better Stack Logging

Better Stack has **built-in analytics** - no PostHog needed!

**Command:**
```bash
claude --model sonnet --effort high \
  "Ultra-Dex is on Render at https://ultra-dex.onrender.com

   Better Stack already monitors uptime. Now use Better Stack for:

   1) LOG AGGREGATION (replaces need for PostHog):
      - Send all logs to Better Stack
      - Track: user_signup, user_login, ai_requests
      - Track: billing events, errors, performance
      
   2) Create src/core/monitoring/better-stack-logger.ts:
      - Send structured logs to Better Stack
      - Include: timestamp, level, userId, event, metadata
      - Use Better Stack ingestion API
      
   3) Update .env.production:
      BETTER_STACK_SOURCE_TOKEN=xxx
      
   4) Log these events:
      - User signup/login
      - AI provider usage (tokens, cost, latency)
      - Billing upgrades
      - Feature usage
      - Errors
      
   5) View in Better Stack dashboard:
      - Daily active users
      - AI usage by provider
      - Revenue events
      - Error rates
      
   6) Create docs/analytics-setup.md

   Better Stack FREE includes:
   - 100,000 logs/month
   - Log search and filtering
   - Dashboards
   - Alerting on log patterns
   
   NO NEED FOR POSTHOG!"
```

---

## P2 — AUTHENTICATION (Clerk)

### [WINDOW 2] Clerk Auth

```bash
claude --model sonnet --effort high \
  "Integrate Clerk auth into Ultra-Dex.
  
  Install: npm install @clerk/clerk-sdk-node
  
  Replace in-memory auth with Clerk:
  - POST /api/auth/register → Create Clerk user
  - POST /api/auth/login → Clerk session
  - GET /api/user/profile → Clerk user data
  
  Add env:
  CLERK_PUBLISHABLE_KEY=pk_live_xxx
  CLERK_SECRET_KEY=sk_live_xxx
  
  Log auth events to Better Stack for analytics."
```

---

## P3 — ERROR TRACKING (Better Stack + Sentry)

### [WINDOW 3] Error Tracking

```bash
claude --model sonnet --effort high \
  "Add error tracking to Ultra-Dex.

   PRIMARY: Better Stack (built-in)
   - Better Stack captures errors from logs
   - Alert on error patterns
   
   SECONDARY: Sentry (for detailed stack traces)
   Install: @sentry/node
   
   Capture:
   - All unhandled exceptions
   - AI provider failures
   - Auth failures
   
   Both send alerts to Slack via Better Stack."
```

---

## P4 — BILLING (Stripe)

### [WINDOW 4] Stripe Integration

```bash
claude --model sonnet --effort high \
  "Connect Stripe to Ultra-Dex billing.
  
  Update billing-service.ts with real Stripe API.
  
  Webhook: POST /api/billing/webhook
  Handle: invoice.paid, subscription.cancelled
  
  Stripe Dashboard:
  - Free: $0
  - Pro: $29/month
  - Enterprise: $99/month
  
  Log billing events to Better Stack:
  - subscription_created
  - payment_succeeded
  - subscription_cancelled
  
  This gives revenue analytics in Better Stack!"
```

---

## ✅ SIMPLIFIED STACK

| Feature | Tool | Cost |
|---------|------|------|
| Uptime Monitoring | Better Stack | FREE |
| Log Aggregation | Better Stack | FREE |
| Analytics | Better Stack | FREE |
| Alerts | Better Stack → Slack | FREE |
| Status Page | Better Stack | FREE |
| Error Tracking | Better Stack + Sentry | FREE |
| Auth | Clerk | FREE tier |
| Billing | Stripe | Pay as you go |

**NO PostHog needed! Better Stack does it all!**

---

## UPDATED EXECUTION ORDER

```
Step 1: YOU fix Render build
   ↓
Step 2: WINDOW 1 - Better Stack logging setup
   ↓
Step 3: WINDOW 2 - Clerk auth
   ↓
Step 4: WINDOW 3 - Error tracking (Better Stack + Sentry)
   ↓
Step 5: WINDOW 4 - Stripe billing
   ↓
🎉 LIVE WITH ANALYTICS
```

---

## ENV VARIABLES (SIMPLIFIED)

```bash
# Core
NODE_ENV=production
PORT=10000
NVIDIA_API_KEY=xxx
BUS_TYPE=memory

# Better Stack (Monitoring + Analytics + Logs)
BETTER_STACK_SOURCE_TOKEN=xxx

# Auth
CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx

# Error Tracking (optional but recommended)
SENTRY_DSN=https://xxx@sentry.io/xxx

# Billing
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Total integrations: 4 (not 5)**
- Better Stack (monitoring + analytics + logs)
- Clerk (auth)
- Sentry (detailed errors - optional)
- Stripe (billing)
