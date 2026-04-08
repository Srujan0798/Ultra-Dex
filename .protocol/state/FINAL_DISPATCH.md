# FINAL DISPATCH - Ultra-Dex v3.0.0 Production Deployment

## ✅ CURRENT STATE (Confirmed)

**Deployment Platform:** Render (https://ultra-dex.onrender.com)
**Monitoring:** Better Stack (https://betterstack.com) - includes uptime, logs, analytics
**Alerts:** Slack via Better Stack
**Build Status:** Failing (exit 127) - needs fix

---

## 🔧 P0 - FIX RENDER BUILD (MANUAL - DO FIRST)

**Owner Action Required:**

1. Go to: https://dashboard.render.com/web/srv-d7avn1tm5p6s73aki250
2. Click: **Settings** tab
3. Change **Build Command** to:
   ```
   npm ci && npm run build:core && npm run build:cli
   ```
4. Change **Start Command** to:
   ```
   npm run start:prod
   ```
5. Click: **Save Changes**
6. Click: **Manual Deploy** → **Deploy latest commit**
7. Wait 5 minutes
8. Verify: https://ultra-dex.onrender.com/health returns 200

---

## 🤖 P1 - AGENT TASKS (Run After Build Fixed)

### [WINDOW 1] Better Stack Integration
**Agent:** Claude Sonnet
**Task:** Complete Better Stack setup with logging

```bash
claude --model sonnet --effort high -p \
  "Ultra-Dex deployed at https://ultra-dex.onrender.com

   Better Stack is already monitoring uptime. Now complete the integration:

   1) Create src/core/monitoring/better-stack-logger.ts:
      - Send structured logs to Better Stack
      - Log events: user_signup, user_login, ai_request, billing_upgrade, errors
      - Include: timestamp, level, userId, event, metadata

   2) Add to .env.production:
      BETTER_STACK_SOURCE_TOKEN=xxx (get from Better Stack dashboard)

   3) Update src/core/server/production-server.ts:
      - Use Better Stack logger for all requests
      - Log AI provider calls (provider, model, tokens, cost, latency)

   4) Test: Logs should appear in Better Stack dashboard within 1 minute

   Better Stack FREE includes: 100k logs/month, analytics, alerting"
```

---

### [WINDOW 2] Authentication (Clerk)
**Agent:** Claude Sonnet
**Task:** Replace in-memory auth with Clerk

```bash
claude --model sonnet --effort high -p \
  "Integrate Clerk authentication into Ultra-Dex.

   Current: src/core/auth/auth-service.ts uses in-memory Map
   Target: Clerk (https://clerk.com/)

   Steps:
   1) npm install @clerk/clerk-sdk-node

   2) Update src/core/auth/auth-service.ts:
      - Keep same interface: register(), login(), validateSession()
      - Replace Map with Clerk API calls

   3) Update endpoints:
      POST /api/auth/register → Create Clerk user
      POST /api/auth/login → Create Clerk session  
      GET /api/user/profile → Get Clerk user data

   4) Add env vars:
      CLERK_PUBLISHABLE_KEY=pk_live_xxx
      CLERK_SECRET_KEY=sk_live_xxx

   5) Log auth events via Better Stack logger (from Window 1)

   6) npm test → must pass"
```

---

### [WINDOW 3] Error Tracking
**Agent:** Codex o1
**Task:** Error tracking with Better Stack + Sentry

```bash
codex --full-auto -m o1 exec \
  "Setup error tracking for Ultra-Dex.

   PRIMARY: Better Stack (built-in error detection from logs)
   - Already configured in Window 1
   
   SECONDARY: Sentry (for detailed stack traces)
   1) npm install @sentry/node
   2) Initialize in production-server.ts
   3) Add SENTRY_DSN env var
   4) Capture exceptions with context (userId, path, AI provider)

   Alerts go to Slack via Better Stack integration"
```

---

### [WINDOW 4] Billing (Stripe)
**Agent:** Claude Sonnet
**Task:** Connect real Stripe billing

```bash
claude --model sonnet --effort high \
  "Connect Stripe to Ultra-Dex billing.

   Current: src/core/billing/billing-service.ts uses dummy key
   Target: Real Stripe integration

   Steps:
   1) Update billing-service.ts with Stripe API calls

   2) Create webhook endpoint:
      POST /api/billing/webhook
      Handle: invoice.paid, subscription.created, subscription.cancelled

   3) Add env vars:
      STRIPE_SECRET_KEY=sk_live_xxx
      STRIPE_PUBLISHABLE_KEY=pk_live_xxx
      STRIPE_WEBHOOK_SECRET=whsec_xxx

   4) Stripe Dashboard setup:
      Products: Free ($0), Pro ($29/month), Enterprise ($99/month)

   5) Log billing events via Better Stack:
      subscription_created, payment_succeeded, subscription_cancelled

   6) Test: Complete a test checkout"
```

---

## 📋 ENVIRONMENT VARIABLES

Add these to Render dashboard (Settings → Environment):

```bash
# Core (already set)
NODE_ENV=production
PORT=10000
NVIDIA_API_KEY=your-key
BUS_TYPE=memory

# Better Stack (from Window 1)
BETTER_STACK_SOURCE_TOKEN=xxx

# Clerk (from Window 2)
CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx

# Sentry (from Window 3)
SENTRY_DSN=https://xxx@sentry.io/xxx

# Stripe (from Window 4)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## ✅ SUCCESS CRITERIA

- [ ] Render build succeeds (P0)
- [ ] https://ultra-dex.onrender.com/health returns 200
- [ ] Better Stack shows GREEN status
- [ ] Logs appear in Better Stack dashboard (P1)
- [ ] Clerk auth working (signup/login) (P2)
- [ ] Sentry catching errors (P3)
- [ ] Stripe test checkout completes (P4)

---

## 🎯 TOOL STACK

| Purpose | Tool | Why |
|---------|------|-----|
| Hosting | Render | Already set up |
| Monitoring | Better Stack | Uptime + logs + analytics in one |
| Alerts | Slack (via Better Stack) | Instant notifications |
| Auth | Clerk | Modern, reliable |
| Errors | Better Stack + Sentry | Comprehensive coverage |
| Billing | Stripe | Industry standard |

---

## 🚀 EXECUTION ORDER

```
Step 1: YOU fix Render build (P0)
   ↓
Step 2: WINDOW 1 - Better Stack logging
   ↓
Step 3: WINDOW 2 - Clerk auth  
   ↓
Step 4: WINDOW 3 - Error tracking
   ↓
Step 5: WINDOW 4 - Stripe billing
   ↓
🎉 PRODUCTION READY
```

---

## ❌ OUTDATED (IGNORE)

- ~~Render~~ - Using Render
- ~~PostHog~~ - Using Better Stack for analytics
- ~~UptimeRobot~~ - Using Better Stack
- ~~Hyperping~~ - Using Better Stack status pages

---

## 📁 OUTPUT FILES

- `src/core/monitoring/better-stack-logger.ts` (Window 1)
- `src/core/monitoring/better-stack-heartbeat.ts` (Window 1)
- Updated `src/core/auth/auth-service.ts` (Window 2)
- Sentry integration in `src/core/server/production-server.ts` (Window 3)
- Updated `src/core/billing/billing-service.ts` (Window 4)
- `docs/monitoring-setup.md` (Window 1)
