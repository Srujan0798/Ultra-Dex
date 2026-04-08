# Cycle 5: GO LIVE - Render + Better Stack + Slack Edition
> Source: Adapted for Render deployment with Better Stack monitoring

---

## YOUR CURRENT SETUP

✅ **Render**: Service running (but build failing with exit 127)
✅ **Better Stack**: Monitor created (detecting timeout)
✅ **Slack**: Integration ready
❌ **Build**: Failing - needs fix

---

## P0 — FIX BUILD & DEPLOY (Priority: CRITICAL)

### [WINDOW 1] Fix Render Build - YOU (Manual Fix Required)

**Problem:** `Exited with status 127` (command not found)

**Fix Steps:**

1. Go to Render Dashboard → Ultra-Dex → **Settings**

2. Change **Build Command** to:
```
npm ci && npm run build:core && npm run build:cli
```

3. Change **Start Command** to:
```
npm run start:prod
```

4. Click **Save Changes**

5. Click **Manual Deploy** → **Deploy latest commit**

6. Wait 5 minutes

**Verify:** Visit https://ultra-dex.onrender.com/health

---

### [WINDOW 2] CLAUDE — Post-Deploy Setup

**Task:** Connect Better Stack + Slack to production

**Command:**
```bash
claude --model sonnet --effort high \
  "Ultra-Dex is now deployed on Render at https://ultra-dex.onrender.com

   Connect Better Stack monitoring and Slack alerts:

   1) Verify Better Stack monitor is working:
      - Check: https://uptime.betterstack.com/team/t524725/monitors
      - Should show ultra-dex.onrender.com/health
      - Status should turn GREEN when deploy succeeds

   2) Connect Slack for alerts:
      - Go to Better Stack → Integrations → Slack
      - Add webhook URL
      - Test alert: curl to trigger test notification

   3) Update Better Stack status page:
      - Create page: status.ultra-dex.ai
      - Add all monitors (health, api, auth, billing)
      - Make it public

   4) Create docs/monitoring-setup.md:
      - Document Better Stack + Slack integration
      - Include webhook URLs
      - Include incident response steps

   DELIVERABLES:
   - Slack receiving alerts from Better Stack
   - Status page live and public
   - Documentation complete"
```

---

## P1 — AUTHENTICATION (Clerk Integration)

### [WINDOW 3] CLAUDE — Auth Service

**Command:**
```bash
claude --model sonnet --effort high \
  "Integrate Clerk authentication into Ultra-Dex.

   CURRENT: src/core/auth/auth-service.ts uses in-memory Map
   TARGET: Replace with Clerk (https://clerk.com/)

   1) Install Clerk SDK:
      npm install @clerk/clerk-sdk-node

   2) Update src/core/auth/auth-service.ts:
      - Replace in-memory users with Clerk API calls
      - Keep same interface: register(), login(), validateSession()
      - Use Clerk for: user management, sessions, JWT validation

   3) Update production server auth endpoints:
      - POST /api/auth/register → Create Clerk user
      - POST /api/auth/login → Create Clerk session
      - GET /api/user/profile → Get Clerk user data

   4) Add Clerk middleware:
      - src/core/middleware/clerk-auth.ts
      - Protect routes requiring auth

   5) Environment variables:
      CLERK_PUBLISHABLE_KEY=pk_live_xxx
      CLERK_SECRET_KEY=sk_live_xxx

   6) Update .env.production.template

   7) Tests must pass

   Better Stack will alert if auth endpoints fail."
```

---

## P2 — ANALYTICS (PostHog)

### [WINDOW 4] CODEX — Analytics Integration

**Command:**
```bash
codex --full-auto -m o1 exec \
  "Add PostHog analytics to Ultra-Dex.

   1) Install PostHog:
      npm install posthog-node

   2) Update src/core/analytics/analytics-service.ts:
      - Send events to PostHog instead of local storage
      - Track: page views, AI requests, user actions

   3) Environment:
      POSTHOG_API_KEY=phc_xxx
      POSTHOG_HOST=https://app.posthog.com

   4) Track these events:
      - user_signup
      - user_login
      - ai_request (provider, model, tokens, cost)
      - billing_upgrade
      - feature_usage

   5) Dashboard in PostHog showing:
      - Daily active users
      - AI usage by provider
      - Revenue metrics

   6) npx tsc --noEmit → 0 errors"
```

---

## P3 — ERROR TRACKING (Sentry)

### [WINDOW 5] CODEX — Sentry Integration

**Command:**
```bash
codex --full-auto -m o1 exec \
  "Add Sentry error tracking to Ultra-Dex.

   1) Install Sentry:
      npm install @sentry/node

   2) Initialize Sentry in src/core/server/production-server.ts:
      Sentry.init({ dsn: process.env.SENTRY_DSN })

   3) Environment:
      SENTRY_DSN=https://xxx@sentry.io/xxx

   4) Capture errors:
      - All unhandled exceptions
      - AI provider failures
      - Auth failures
      - Billing errors

   5) Add context to errors:
      - userId
      - request path
      - AI provider used

   6) Alert Better Stack on critical errors"
```

---

## P4 — BILLING (Stripe Live)

### [WINDOW 6] CLAUDE — Stripe Integration

**Command:**
```bash
claude --model sonnet --effort high \
  "Connect real Stripe billing to Ultra-Dex.

   CURRENT: src/core/billing/billing-service.ts uses dummy key
   TARGET: Full Stripe integration

   1) Update billing-service.ts:
      - Use real Stripe API calls
      - Create customers on signup
      - Handle subscriptions
      - Process payments

   2) Environment:
      STRIPE_SECRET_KEY=sk_live_xxx
      STRIPE_PUBLISHABLE_KEY=pk_live_xxx
      STRIPE_WEBHOOK_SECRET=whsec_xxx

   3) Stripe webhook endpoint:
      POST /api/billing/webhook
      Handle: invoice.paid, subscription.cancelled, etc.

   4) Update pricing tiers in Stripe Dashboard:
      - Free: $0
      - Pro: $29/month
      - Enterprise: $99/month

   5) Test checkout flow

   6) Better Stack monitors billing endpoints"
```

---

## EXECUTION ORDER

```
YOU (Manual)        → Fix Render build command
  ↓
CLAUDE (Sonnet)     → Better Stack + Slack setup
  ↓
CLAUDE (Sonnet)     → Clerk authentication
  ↓
CODEX (o1)          → PostHog analytics
  ↓
CODEX (o1)          → Sentry error tracking
  ↓
CLAUDE (Sonnet)     → Stripe billing
  ↓
🎉 LIVE & MONITORED
```

---

## SUCCESS CRITERIA

- [ ] Render build succeeds
- [ ] https://ultra-dex.onrender.com/health returns 200
- [ ] Better Stack shows GREEN status
- [ ] Slack receives alert test
- [ ] Clerk auth working (signup/login)
- [ ] PostHog receiving events
- [ ] Sentry catching errors
- [ ] Stripe test checkout works
