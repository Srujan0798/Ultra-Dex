# Ultra-Dex: COMPLETE ALL REMAINING WORK
> Generated: 2026-04-08 | From: Live codebase audit
> Status: v3.0.0 deployed on Render | Better Stack + Clerk + Stripe integrated
> Mission: Fix ALL failures, build ALL missing pieces, ship v3.1.0

---

## GROUND TRUTH (What the codebase actually says right now)

```
Version:       3.0.0
Deployed:      https://ultra-dex.onrender.com (Render)
TypeScript:    0 errors (tsc --noEmit clean)
Lint:          0 errors, 0 warnings (611 files)
Build:         ✅ passes (build:core + build:cli)
Unit tests:    13 pass / 50 FAIL  ← ALL from esbuild platform mismatch
Integration:   39 pass / 2 FAIL   ← same esbuild error
CLI tests:     21 pass / 4 FAIL   ← same esbuild error (+ some real failures)
npm audit:     0 high/critical (3 low)
```

### What's Integrated (DONE)
```
✅ Better Stack (Logtail) logging — src/core/monitoring/better-stack-logger.ts
✅ Clerk auth — src/core/auth/clerk-auth-service.ts + clerk-client.ts
✅ Stripe billing — src/core/billing/billing-service.ts (283 LOC, real Stripe)
✅ Production server — src/core/server/production-server.ts (348 LOC, webhooks)
✅ Docker — Dockerfile.prod + docker-compose.prod.yml
✅ Configs — config/production.json + config/staging.json
✅ Deployment scripts — 4 scripts in scripts/deployment/
✅ Docs — DEPLOYMENT.md + OPERATIONS.md + INTEGRATIONS.md + PRODUCTION-SUMMARY.md
✅ Dashboard pages — Analytics.tsx + 12 other pages exist
```

### What's Missing (TODO)
```
❌ 56 tests failing (ALL from esbuild platform mismatch — ONE fix)
❌ src/core/auth/middleware.ts — route protection middleware
❌ src/core/auth/onboarding.ts — onboarding flow logic
❌ src/core/billing/usage-meter.ts — per-user usage limits
❌ src/core/billing/stripe-client.ts — typed Stripe wrapper (billing-service.ts does some)
❌ src/core/billing/webhook-handler.ts — separate webhook module
❌ src/core/analytics/posthog-client.ts — PostHog analytics
❌ src/core/analytics/sentry-client.ts — error tracking
❌ src/core/system/monitoring.ts — /metrics endpoint
❌ apps/dashboard/src/pages/Billing.tsx — billing UI
❌ apps/dashboard/src/pages/Landing.tsx — public landing page
❌ apps/dashboard/src/pages/Onboarding.tsx — onboarding wizard
❌ apps/cli/lib/commands/login.ts — CLI auth commands
❌ docs/BILLING.md — billing documentation
❌ scripts/setup-stripe.sh — Stripe product setup
❌ .github/FUNDING.yml — GitHub sponsorship
❌ Version bump 3.0.0 → 3.1.0
```

---

## PART 1: DEPLOY CHECKLIST

### Pre-Deploy ✅ (Already Done)
- [x] Dockerfile.prod exists (multi-stage alpine)
- [x] docker-compose.prod.yml exists (with Redis)
- [x] config/production.json exists (env var references)
- [x] Deployment scripts (deploy, staging, rollback, health-check)
- [x] .env.production configured
- [x] SSL via Render (auto HTTPS)
- [x] Better Stack uptime monitoring configured

### Deploy Blockers ❌
- [ ] **56 tests failing** — must be 0 before any release
- [ ] Auth middleware not protecting routes — anyone can hit any endpoint
- [ ] Usage metering not enforcing limits — free users unlimited
- [ ] No /metrics endpoint for production monitoring
- [ ] Version still 3.0.0

### Post-Deploy TODO
- [ ] Configure Stripe webhook URL in Stripe Dashboard → `https://ultra-dex.onrender.com/api/billing/webhook`
- [ ] Verify health checks: `curl https://ultra-dex.onrender.com/health`
- [ ] Run scripts/test-integrations.sh against production
- [ ] Set up UptimeRobot for /health/ready (redundancy to Better Stack)
- [ ] Verify Clerk user registration end-to-end
- [ ] Test Stripe checkout flow (test mode)

### Rollback Plan
- Render auto-deploys from `main` branch
- Rollback: `git revert HEAD && git push` OR use Render dashboard to deploy previous commit
- Trigger: error rate > 5% OR /health fails for 2 consecutive checks

---

## PART 2: TESTING STRATEGY

### Current State
| Suite | Pass | Fail | Total | Root Cause |
|-------|------|------|-------|------------|
| Unit | 13 | 50 | 63 | esbuild platform mismatch (darwin-arm64 vs linux-arm64) |
| Integration | 39 | 2 | 41 | Same esbuild error |
| CLI | 21 | 4 | 25 | Same esbuild error (3) + real failures (1) |
| **Total** | **73** | **56** | **129** | **ONE root cause for 55/56 failures** |

### The Fix (P0 — Unblocks Everything)
```bash
# Fix esbuild platform mismatch — installs correct binary for current platform
npm rebuild esbuild
# OR if that doesn't work:
npm install @esbuild/linux-arm64 --save-dev --force
# VERIFY:
npm run test:unit 2>&1 | grep '# fail'
```

### Test Gaps (After Fix)
| Area | Current Coverage | Gap | Priority |
|------|-----------------|-----|----------|
| Auth middleware | NONE | Need: requireAuth(), 401/403 tests, role checks | P0 |
| Clerk integration | NONE (real API calls only) | Need: mocked Clerk tests | P1 |
| Stripe webhooks | NONE | Need: signature verification, event handling tests | P0 |
| Usage metering | NONE (doesn't exist yet) | Need: limit enforcement, reset logic tests | P1 |
| PostHog/Sentry | NONE (don't exist yet) | Need: mock client tests | P2 |
| Dashboard pages | NONE | Need: React component tests | P3 |
| CLI login | NONE (doesn't exist yet) | Need: token storage/deletion tests | P2 |

### Testing Strategy
```
PYRAMID:
  Unit (target: 200+ tests): business logic, auth, billing, metering
  Integration (target: 50+ tests): API routes, webhook handling, provider routing
  CLI (target: 30+ tests): command execution, session management
  E2E (future): Playwright for dashboard flows
```

---

## PART 3: TECH DEBT AUDIT

| ID | Item | Category | Impact | Risk | Effort | Score | Fix |
|----|------|----------|--------|------|--------|-------|-----|
| TD-01 | esbuild platform mismatch (56 test failures) | Test debt | 5 | 5 | 1 | **50** | `npm rebuild esbuild` |
| TD-02 | No auth middleware — all routes unprotected | Architecture | 5 | 5 | 2 | **40** | Create middleware.ts, wire to routes |
| TD-03 | No usage metering — free users unlimited | Architecture | 4 | 5 | 3 | **27** | Create usage-meter.ts |
| TD-04 | No PostHog/Sentry — flying blind on prod usage | Infrastructure | 4 | 4 | 2 | **32** | Create posthog-client.ts + sentry-client.ts |
| TD-05 | No /metrics endpoint | Infrastructure | 3 | 3 | 2 | **24** | Create monitoring.ts |
| TD-06 | Billing UI missing — users can't see their plan | Code debt | 4 | 3 | 3 | **21** | Create Billing.tsx + components |
| TD-07 | No onboarding wizard — friction for new users | Code debt | 3 | 2 | 3 | **15** | Create Onboarding.tsx |
| TD-08 | No landing page — no public face | Code debt | 3 | 2 | 3 | **15** | Create Landing.tsx |
| TD-09 | No CLI login — can't auth from terminal | Code debt | 2 | 1 | 3 | **9** | Create login.ts |
| TD-10 | Version not bumped (still 3.0.0) | Process debt | 1 | 1 | 1 | **10** | `npm version minor` |
| TD-11 | 3 low npm audit vulns | Dependency | 1 | 1 | 1 | **10** | `npm audit fix` |
| TD-12 | No billing docs | Documentation | 2 | 1 | 2 | **12** | Create BILLING.md |

**Score formula**: (Impact + Risk) × (6 - Effort). Higher = fix first.

---

## EXECUTION PLAN — ALL REMAINING WORK

### Phase 0: UNBLOCK TESTS (5 minutes)
> This is the #1 blocker. 56 tests fail from ONE cause. Fix it first.

```bash
# Run this yourself OR give to any agent:
cd /path/to/Ultra-Dex
npm rebuild esbuild
npm run test:unit 2>&1 | grep '# fail'
# Expected: # fail 0 (or close to 0)
# If still failing: npm install @esbuild/linux-arm64 --save-dev --force && npm rebuild esbuild
npm run test:integration 2>&1 | grep '# fail'
npm run test:cli 2>&1 | grep '# fail'
```

**Agent command (if you want to delegate):**
```bash
claude --model sonnet --effort high -p \
  "Fix esbuild platform mismatch in Ultra-Dex.

   ERROR: @esbuild/darwin-arm64 installed but linux-arm64 needed.
   tsx uses esbuild internally — 56 tests fail with TransformError.

   FIX:
   1) npm rebuild esbuild
   2) If that fails: npm install @esbuild/linux-arm64 --save-dev --force && npm rebuild esbuild
   3) npm run test:unit 2>&1 | grep '# fail' → target 0
   4) npm run test:integration 2>&1 | grep '# fail' → target 0
   5) npm run test:cli 2>&1 | grep '# fail' → target 0
   6) If any tests STILL fail after esbuild fix — those are REAL failures, fix them individually"
```

---

### Phase 1: AUTH MIDDLEWARE + ROUTE PROTECTION (TD-02)
> Without this, every endpoint is publicly accessible. Security-critical.

```bash
claude --model opus --effort max -p \
  "Create auth middleware for Ultra-Dex and wire into all routes.

   EXISTING:
   - src/core/auth/clerk-client.ts (7 LOC — exports Clerk instance)
   - src/core/auth/clerk-auth-service.ts (124 LOC — Clerk-backed auth)
   - src/core/auth/auth-service.ts (134 LOC — original with in-memory fallback)
   - src/core/auth/rbac.ts (123 LOC — role definitions)
   - src/core/server/production-server.ts (348 LOC — Express server with routes)

   CREATE:
   1) src/core/auth/middleware.ts:
      - requireAuth(roles?: string[]): Express middleware
      - Extract Bearer token from Authorization header
      - Validate via Clerk (import from clerk-client.ts)
      - Attach to request: req.auth = { userId, email, role, plan }
      - 401 on missing/invalid token, 403 on wrong role
      - Dev mode (no CLERK_SECRET_KEY): accept 'dev-token' → mock free user

   2) Wire into src/core/server/production-server.ts:
      - Public (no auth): GET /health, /health/ready, /health/deep
      - Auth required: all /api/* routes
      - Admin only: GET /metrics (when it exists)

   3) Tests (tests/core/auth-middleware.test.js):
      - Mock Clerk client
      - 401 without token, 200 with valid token, 403 with wrong role
      - Dev mode fallback works

   4) npx tsc --noEmit → 0 errors
   5) npm test → 0 failures"
```

---

### Phase 2: USAGE METERING + STRIPE WEBHOOK HANDLER (TD-03)
> Free users must have limits. Stripe events must be handled.

```bash
claude --model sonnet --effort high -p \
  "Create usage metering and Stripe webhook handler for Ultra-Dex.

   EXISTING:
   - src/core/billing/billing-service.ts (283 LOC — real Stripe integration)
   - src/core/billing/pricing-tiers.ts (92 LOC — Free/Pro/Enterprise defined)
   - src/core/billing/billing-manager.ts (523 LOC — orchestration)
   - src/core/server/production-server.ts has POST /api/billing/webhook endpoint
   - Stripe webhooks already being received via production-server.ts

   CREATE:
   1) src/core/billing/usage-meter.ts:
      - In-memory Map per-user tracking (Redis later): tokenCount, requestCount, agentRunCount
      - Reset daily at midnight UTC (setInterval or cron)
      - checkLimit(userId, plan) → { allowed: boolean, remaining: number, resetAt: Date }
      - Limits from pricing-tiers.ts:
        free: 100 req/day, 10K tokens/day
        pro: 10,000 req/day, 1M tokens/day
        enterprise: unlimited
      - increment(userId, { requests, tokens }) → updates counters
      - On limit exceeded: return { allowed: false, remaining: 0 }
      - Wire into auth middleware: check limits BEFORE processing AI request
      - Return 429 { error: 'LIMIT_EXCEEDED', plan, remaining: 0, resetAt }

   2) src/core/billing/webhook-handler.ts:
      - Extract webhook handling from production-server.ts into dedicated module
      - verifyWebhook(rawBody, signature) → uses STRIPE_WEBHOOK_SECRET
      - handleEvent(event) → dispatch by type:
        checkout.session.completed → activate subscription, log to Better Stack
        invoice.paid → reset usage counters, log
        invoice.payment_failed → flag account, log
        customer.subscription.deleted → downgrade to free, update Clerk metadata
      - Idempotent: Set of processed event IDs (skip duplicates)

   3) Tests:
      - usage-meter: 101st free request returns { allowed: false }
      - usage-meter: pro user allowed 10,000 requests
      - usage-meter: reset at midnight
      - webhook-handler: valid signature passes, invalid returns 400
      - webhook-handler: checkout.session.completed activates subscription

   4) npx tsc --noEmit → 0 errors
   5) npm test → 0 failures"
```

---

### Phase 3: POSTHOG + SENTRY (TD-04)
> Need product analytics and error tracking. Flying blind without these.

```bash
codex --full-auto -m o3 exec \
  "Add PostHog analytics and Sentry error tracking to Ultra-Dex.

   EXISTING:
   - src/core/analytics/analytics-service.ts (69 LOC — local array, unused)
   - src/core/analytics/enterprise-analytics.ts (700 LOC — advanced engine)
   - src/core/monitoring/better-stack-logger.ts (187 LOC — logging already works)

   CREATE:
   1) npm install posthog-node @sentry/node

   2) src/core/analytics/posthog-client.ts:
      - Init PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST })
      - No-op + console.log if no key (dev mode)
      - Batch: flush every 30s or 100 events
      - Export: track(event, properties, userId), identify(userId, traits), flush()

   3) src/core/analytics/sentry-client.ts:
      - Init Sentry({ dsn: SENTRY_DSN }); no-op if missing
      - tracesSampleRate: 0.1 prod, 1.0 dev
      - Export: captureException(error, context), setUser(userId)

   4) Rewrite src/core/analytics/analytics-service.ts:
      - Keep interface, delegate to PostHog + Sentry internally
      - Error events → both PostHog + Sentry

   5) Wire into production-server.ts:
      - After AI request: track('ai_request', { provider, model, tokens, latencyMs })
      - On error: captureException(error)
      - On SIGTERM: flush() both

   6) Tests (mock PostHog + Sentry):
      - track() calls PostHog.capture()
      - captureException() calls Sentry.captureException()
      - Dev mode: no API calls

   7) npx tsc --noEmit → 0 errors
   8) npm test → 0 failures"
```

---

### Phase 4: /METRICS ENDPOINT (TD-05)

```bash
codex --full-auto -m o1 exec \
  "Create /metrics endpoint for Ultra-Dex production monitoring.

   CREATE src/core/system/monitoring.ts:
   - Track: requestCount, errorCount, latency (p50/p95/p99)
   - Track per-provider: calls, errors, avgLatency, tokens, cost
   - Track per-user: requests, tokens (feeds usage-meter)
   - GET /metrics → JSON { uptime, version, requests, errors, providers, memory }
   - Wire into production-server.ts
   - Require admin role (import from auth middleware)
   - npx tsc --noEmit → 0
   - npm test → 0 failures"
```

---

### Phase 5: DASHBOARD PAGES (TD-06, TD-07, TD-08)
> Run these 3 in PARALLEL — they're independent.

**Billing page:**
```bash
gemini -y -p \
  "Create apps/dashboard/src/pages/Billing.tsx for Ultra-Dex.

   - Current Plan card: name, price/mo, renewal date, status badge
   - 3 usage bars: requests (used/limit), tokens (used/limit), agents
   - Progress color: green <50%, yellow <80%, red >=80%
   - Upgrade button → POST /api/billing/checkout → redirect Stripe URL
   - Manage subscription → Stripe Customer Portal
   - Invoice table: date | amount | status | PDF link
   - Fetch from GET /api/billing/usage and GET /api/billing/invoices
   - Add to dashboard navigation
   - npm run build → exits 0"
```

**Landing page:**
```bash
gemini -y -p \
  "Create apps/dashboard/src/pages/Landing.tsx for Ultra-Dex public launch.

   - Hero: H1='AI Orchestration. Done Right.' + subheading + CTAs (Get Started Free, View GitHub)
   - Features 2x3 grid: Multi-Provider Routing, Agent Swarms, Persistent Memory, MCP Ecosystem, Governance, Distributed Mesh
   - Pricing: Free \$0 / Pro \$29/mo / Enterprise \$99/mo
   - Footer: GitHub | Docs
   - npm run build → exits 0"
```

**Onboarding wizard:**
```bash
claude --model sonnet --effort high -p \
  "Create apps/dashboard/src/pages/Onboarding.tsx for Ultra-Dex.

   5-step wizard:
   1) Welcome
   2) API Key input (validate with test call)
   3) First AI request (streaming response)
   4) Feature exploration cards
   5) Done (confetti → dashboard redirect)

   Also create src/core/auth/onboarding.ts:
   - isOnboarded(userId) → check Clerk publicMetadata.onboarded
   - completeOnboarding(userId) → set metadata
   - npm run build → exits 0"
```

---

### Phase 6: CLI LOGIN + BILLING DOCS (TD-09, TD-12)

```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Create CLI login command and billing docs for Ultra-Dex.

   1) Create apps/cli/lib/commands/login.ts:
      ultra-dex login → print Clerk login URL + store token at ~/.ultra-dex/session.json
      ultra-dex logout → delete ~/.ultra-dex/session.json
      ultra-dex whoami → print email + role + plan
      ultra-dex apikey generate → POST /api/auth/apikey
      chmod 600 on session.json

   2) Create docs/BILLING.md:
      Pricing table: Free / Pro \$29/mo / Enterprise \$99/mo with features and limits
      Stripe setup guide
      Webhook configuration for Render
      Usage metering explanation
      Upgrade flow walkthrough

   3) Create scripts/setup-stripe.sh:
      Use stripe CLI to create products + prices
      Output price IDs to add to env vars
      chmod +x

   4) Create .github/FUNDING.yml:
      github: [Srujan0798]

   5) npx tsc --noEmit → 0 errors
   6) npm run build → exits 0"
```

---

### Phase 7: VERSION BUMP + FINAL VERIFICATION (TD-10)

```bash
gemini -p \
  "FINAL VERIFICATION — Ultra-Dex v3.1.0.

   1) npm version minor --no-git-tag-version

   2) Prepend to CHANGELOG.md:
      ## [3.1.0] - 2026-04-XX — PRODUCTION LIVE
      ### Added
      - Better Stack logging (Logtail + Winston)
      - Clerk authentication (register/login/session)
      - Stripe billing (checkout/webhooks/subscriptions)
      - Auth middleware: requireAuth() on all /api/* routes
      - Usage metering: free/pro/enterprise limits enforced
      - PostHog analytics: AI + agent + billing events tracked
      - Sentry error tracking
      - /metrics endpoint (admin only)
      - Billing dashboard (plan/usage/invoices)
      - Landing page (hero/features/pricing)
      - Onboarding wizard (5 steps)
      - CLI: login/logout/whoami/apikey
      - docs/BILLING.md
      - scripts/setup-stripe.sh
      ### Changed
      - Auth: in-memory Map → Clerk SDK
      - Analytics: local array → PostHog
      - Billing: dummy key → real Stripe

   3) Run ALL checks:
      npx tsc --noEmit → 0 errors
      npm run lint → 0 errors
      npm run build → exits 0
      npm run test:unit → 0 failures
      npm run test:integration → 0 failures
      npm run test:cli → 0 failures
      npm audit --audit-level high → 0
      ls all expected files → exist

   4) git add -A && git commit -m 'feat: v3.1.0 production launch'
   5) git tag v3.1.0
   6) git push origin main --tags"
```

---

## EXECUTION ORDER (Copy-Paste Ready)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 0 — FIX ESBUILD (5 min, unblocks everything)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  npm rebuild esbuild
  npm run test:unit → verify 0 failures
  (DO THIS FIRST — nothing else works without it)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — AUTH MIDDLEWARE (Claude Opus) ← security critical
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Creates: middleware.ts
  Wires into: production-server.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — USAGE METERING + WEBHOOKS (Claude Sonnet)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Creates: usage-meter.ts, webhook-handler.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 — ANALYTICS (Codex o3) ← can run parallel with Phase 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Creates: posthog-client.ts, sentry-client.ts
  Rewrites: analytics-service.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4 — /METRICS (Codex o1) ← after Phase 1 (needs auth middleware)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Creates: monitoring.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5 — DASHBOARD PAGES (Gemini + Claude, parallel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Billing.tsx     (Gemini)   ┐
  Landing.tsx     (Gemini)   ├─ all 3 parallel
  Onboarding.tsx  (Claude)   ┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 6 — CLI + DOCS (Qwen)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Creates: login.ts, BILLING.md, setup-stripe.sh, FUNDING.yml

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 7 — SEAL (Gemini)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Version bump → CHANGELOG → full verification → tag → push
```

---

## FILE CREATION CHECKLIST

| # | File | Phase | Agent | LOC Est |
|---|------|-------|-------|---------|
| 1 | src/core/auth/middleware.ts | 1 | Opus | ~80 |
| 2 | src/core/billing/usage-meter.ts | 2 | Sonnet | ~120 |
| 3 | src/core/billing/webhook-handler.ts | 2 | Sonnet | ~100 |
| 4 | src/core/analytics/posthog-client.ts | 3 | Codex o3 | ~80 |
| 5 | src/core/analytics/sentry-client.ts | 3 | Codex o3 | ~60 |
| 6 | src/core/system/monitoring.ts | 4 | Codex o1 | ~100 |
| 7 | apps/dashboard/src/pages/Billing.tsx | 5 | Gemini | ~200 |
| 8 | apps/dashboard/src/pages/Landing.tsx | 5 | Gemini | ~200 |
| 9 | apps/dashboard/src/pages/Onboarding.tsx | 5 | Sonnet | ~250 |
| 10 | src/core/auth/onboarding.ts | 5 | Sonnet | ~40 |
| 11 | apps/cli/lib/commands/login.ts | 6 | Qwen | ~120 |
| 12 | docs/BILLING.md | 6 | Qwen | ~150 |
| 13 | scripts/setup-stripe.sh | 6 | Qwen | ~50 |
| 14 | .github/FUNDING.yml | 6 | Qwen | ~2 |
| | **TOTAL NEW CODE** | | | **~1,550 LOC** |

---

## COST SUMMARY

| Phase | Agent | Cost Class |
|-------|-------|------------|
| 0 (esbuild fix) | Self or any | FREE |
| 1 (auth middleware) | Claude Opus | API-KEY |
| 2 (metering + webhooks) | Claude Sonnet | SUBSCRIPTION |
| 3 (PostHog + Sentry) | Codex o3 | SUBSCRIPTION |
| 4 (/metrics) | Codex o1 | SUBSCRIPTION |
| 5 (dashboard pages) | Gemini + Sonnet | FREE + SUBSCRIPTION |
| 6 (CLI + docs) | Qwen | FREE |
| 7 (seal + ship) | Gemini | FREE |

---

## AFTER ALL THIS IS DONE

v3.1.0 is a **live, authenticated, metered, billed, monitored, onboarded product.**

Next: MASTER_HANDOFF_PROMPT.md Sprint 4-6 (performance, enterprise features, community ecosystem).

---

*Generated 2026-04-08 from live codebase audit*
*Combines: /engineering:deploy-checklist + /engineering:testing-strategy + /engineering:tech-debt*
