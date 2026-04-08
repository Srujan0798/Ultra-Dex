# Dispatch Sheet — Cycle 5: GO LIVE
> Source: MASTER_HANDOFF_PROMPT.md roadmap + live codebase audit (2026-04-08)
> Gate: Live URL at /health → 200. Clerk auth working. PostHog receiving events. Sentry catching errors. Stripe test checkout completes. 10 beta users onboarded.
> Thesis: Stop building infrastructure. Start serving users. Wire the existing scaffolds to real services and deploy.

---

## CRITICAL CONTEXT FOR ALL AGENTS

**Cycle 4 is complete.** v3.0.0 Diamond State is production-ready:
- All tests passing (318 unit + 33 integration)
- 0 ESLint errors, 0 type errors
- Build green (core + CLI + dashboard)
- Docker, configs, deployment scripts, health checks, docs all in place

**What already exists as SCAFFOLDS (need wiring to real services):**
- `src/core/auth/` — 470 LOC: auth-service.ts (in-memory Map), rbac-manager.ts, rbac.ts, sso.ts, user-model.ts
- `src/core/billing/` — 750 LOC: billing-service.ts (dummy Stripe key), billing-manager.ts, pricing-tiers.ts (Free/Pro/Enterprise defined)
- `src/core/analytics/` — 771 LOC: analytics-service.ts (local events), enterprise-analytics.ts, index.ts
- `config/production.json` + `config/staging.json` — env var references ready
- `Dockerfile.prod` + `docker-compose.prod.yml` — multi-stage alpine build ready
- `scripts/deployment/` — deploy-production.sh, deploy-staging.sh, rollback.sh, health-check.sh

**OWNER must provide these env vars BEFORE agents execute:**
- `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `POSTHOG_API_KEY`, `POSTHOG_HOST`
- `SENTRY_DSN`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RAILWAY_TOKEN` (or Render equivalent)

---

## P0 — DEPLOY (Get v3.0.0 Live on the Internet)

Production infra is built. Just needs to be pushed to a cloud provider.

---

[WINDOW 1] CLAUDE — claude-sonnet-4
Task ID: P0-W1
Objective: Deploy Ultra-Dex v3.0.0 to Railway (or Render). Live URL, SSL, health checks passing.
Target Files: railway.json (new), .env.production (template), scripts/deployment/deploy-production.sh (verify)
Why this lane: Deployment strategy requires judgment on provider config, env var mapping, and troubleshooting — Sonnet for reliability.
Power Tier: HIGH
Command:
```bash
claude --model sonnet --effort high \
  "Deploy Ultra-Dex v3.0.0 to production.

   CURRENT STATE:
   - Dockerfile.prod exists (multi-stage alpine, node:22)
   - docker-compose.prod.yml exists (with Redis)
   - config/production.json exists (env var references)
   - scripts/deployment/deploy-production.sh exists
   - Health check endpoints: /health, /health/ready, /health/deep

   MISSION — Railway deployment:
   1) Create railway.json (or railway.toml):
      {
        'build': { 'builder': 'DOCKERFILE', 'dockerfilePath': 'Dockerfile.prod' },
        'deploy': {
          'startCommand': 'node dist/ultra-dex.js serve',
          'healthcheckPath': '/health',
          'healthcheckTimeout': 30,
          'restartPolicyType': 'ON_FAILURE'
        }
      }
   2) Create .env.production.template listing ALL required env vars with descriptions:
      - PORT=3000
      - NODE_ENV=production
      - REDIS_URL=redis://default:xxx@xxx.railway.internal:6379
      - AI_DEFAULT_PROVIDER=openai
      - OPENAI_API_KEY=sk-xxx
      - ANTHROPIC_API_KEY=sk-ant-xxx
      - (list all 17 provider keys as optional)
      - CLERK_SECRET_KEY=sk_live_xxx
      - POSTHOG_API_KEY=phc_xxx
      - SENTRY_DSN=https://xxx@sentry.io/xxx
      - STRIPE_SECRET_KEY=sk_live_xxx
   3) Update deploy-production.sh to support Railway CLI:
      - railway up --detach
      - railway domain (get URL)
      - curl -sf https://\$DOMAIN/health || exit 1
   4) Add Procfile: web: node dist/ultra-dex.js serve
   5) Test locally first: docker build -f Dockerfile.prod -t ultra-dex:3.0.0 .
      If Docker available: docker run -p 3000:3000 ultra-dex:3.0.0
      Verify: curl http://localhost:3000/health

   DELIVERABLES:
   - railway.json (or toml)
   - .env.production.template
   - Procfile
   - Updated deploy script
   - Verification: deployment URL + health check screenshot"
```
Expected Output: Railway config files + successful local Docker test
Validation: `docker build -f Dockerfile.prod .` exits 0. `curl localhost:3000/health` → 200.
Fallback #1: claude --model sonnet --effort high -p "same — target Render instead of Railway. Create render.yaml"
Fallback #2: codex -m o3 --full-auto exec "same task"
Fallback #3: gemini -y -p "Create railway.json + Procfile + .env.production.template for Ultra-Dex"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 2] CODEX — o1
Task ID: P0-W2
Objective: Set up uptime monitoring + structured logging for production
Target Files: src/core/system/monitoring.ts (new or update), src/core/system/structured-logger.ts (new)
Why this lane: Monitoring patterns need careful implementation — Codex for systematic work
Power Tier: BALANCED
Depends on: W1 (deployment must exist to monitor)
Command:
```bash
codex --full-auto -m o1 exec \
  "Set up production monitoring for Ultra-Dex v3.0.0.

   1) UptimeRobot setup instructions (add to docs/OPERATIONS.md):
      - Monitor: https://ultra-dex.{domain}/health (HTTP 200 check, 5min interval)
      - Monitor: https://ultra-dex.{domain}/health/ready (5min)
      - Alert: email + webhook on 2 consecutive failures

   2) Create src/core/system/structured-logger.ts:
      - Wrap existing winston logger
      - JSON format in production, pretty in dev
      - Include: timestamp, level, service, traceId, userId, duration
      - Log all AI requests: provider, model, tokens, latencyMs, cost
      - Log all agent runs: agentId, taskId, status, duration
      - Export: logger.info(), logger.error(), logger.warn(), logger.metric()

   3) Create src/core/system/monitoring.ts:
      - Track request count, error count, latency histogram
      - Expose /metrics endpoint (Prometheus format if easy, JSON otherwise)
      - Track per-provider: requestCount, errorCount, avgLatency, totalTokens, totalCost
      - Track per-user: requestCount, tokenCount (for billing metering)

   4) Wire into existing health-service.ts:
      - /health/deep should now include monitoring stats

   5) npx tsc --noEmit → 0 errors
   6) npm test → still passing"
```
Expected Output: Structured logger + monitoring + updated health checks
Validation: `npx tsc --noEmit` exits 0. `npm test` passes. New files exist.
Fallback #1: codex -m gpt-4 exec "same — just structured-logger.ts"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "same — minimal monitoring.ts with request counting"
Cost Class: SUBSCRIPTION-INCLUDED

---

## P1 — AUTH (Replace In-Memory Stubs with Clerk)

src/core/auth/auth-service.ts currently uses `Map<string, User>`. Replace with Clerk SDK.

---

[WINDOW 3] CLAUDE — claude-opus-4
Task ID: P1-W3
Objective: Replace in-memory auth with Clerk SDK. Full auth flow: register, login, logout, session validation, API key management.
Target Files: src/core/auth/auth-service.ts (rewrite), src/core/auth/clerk-client.ts (new), src/core/auth/middleware.ts (new), src/core/auth/user-model.ts (update)
Why this lane: Auth is security-critical. Requires understanding Clerk SDK, middleware patterns, session management. Opus for judgment.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max \
  "Replace Ultra-Dex in-memory auth with Clerk SDK.

   CURRENT STATE:
   - src/core/auth/auth-service.ts: 80 LOC, uses Map<string, User> and Map<string, UserSession>
   - src/core/auth/user-model.ts: 57 LOC, defines User, UserCredentials, UserSession interfaces
   - src/core/auth/rbac.ts: 123 LOC, role-based access control
   - src/core/auth/rbac-manager.ts: 99 LOC, RBAC manager
   - src/core/auth/sso.ts: 111 LOC, SSO stub
   - All use .js import extensions (TS codebase with bundler resolution)

   MISSION:
   1) npm install @clerk/clerk-sdk-node @clerk/express

   2) Create src/core/auth/clerk-client.ts:
      - Initialize Clerk with CLERK_SECRET_KEY from env
      - Export: clerkClient instance
      - Graceful fallback if CLERK_SECRET_KEY not set (dev mode → use mock auth)

   3) Rewrite src/core/auth/auth-service.ts:
      - Replace Map<string, User> with Clerk API calls:
        - register() → clerkClient.users.createUser()
        - login() → Clerk handles this client-side, verify session server-side
        - validateSession() → clerkClient.verifyToken() or requireAuth middleware
        - getUserById() → clerkClient.users.getUser()
        - generateApiKey() → create Clerk API key or custom token with JWT
      - Keep the AuthService interface identical so nothing downstream breaks
      - In dev mode (no CLERK_SECRET_KEY): fall back to in-memory auth (keep old code as fallback)

   4) Create src/core/auth/middleware.ts:
      - Express-compatible middleware: requireAuth(roles?: string[])
      - Verify Clerk session token from Authorization header
      - Attach user to request context: req.auth = { userId, email, role, plan }
      - Role check against RBAC if roles specified
      - 401 on missing/invalid token, 403 on insufficient role

   5) Update src/core/auth/rbac.ts:
      - Map Clerk user metadata to Ultra-Dex roles (free/pro/enterprise/admin)
      - Read role from Clerk publicMetadata.role
      - Enforce tier limits: free=100 req/day, pro=10000, enterprise=unlimited

   6) Update src/core/auth/sso.ts:
      - Wire to Clerk's SAML/SSO if available, or stub with TODO for enterprise

   7) Add to config/production.json under 'auth':
      { 'provider': 'clerk', 'fallback': 'memory', 'sessionTtl': 86400 }

   8) TESTS — update or create tests/core/auth.test.js:
      - Test with MOCK auth (no real Clerk calls in tests)
      - Test: register → returns user with id
      - Test: validateSession → returns user context
      - Test: requireAuth middleware → 401 without token, 200 with valid mock token
      - Test: RBAC → free user blocked from enterprise endpoint
      - All existing tests must still pass

   9) npx tsc --noEmit → 0 errors
   10) npm test → 0 failures"
```
Expected Output: Clerk-backed auth with middleware, RBAC, mock fallback, tests
Validation: `npx tsc --noEmit` exits 0. `npm test` passes. `grep 'clerkClient' src/core/auth/clerk-client.ts` → found.
Fallback #1: claude --model sonnet --effort high -p "same task — simplified, skip SSO"
Fallback #2: codex -m o3 --full-auto exec "same task"
Fallback #3: gemini -y -p "Just create clerk-client.ts and middleware.ts, leave auth-service.ts as adapter"
Cost Class: API-KEY-USAGE

---

[WINDOW 4] QWEN — qwen-turbo
Task ID: P1-W4
Objective: Wire auth middleware into all API routes. Protect dashboard. Add login/signup CLI commands.
Target Files: apps/cli/lib/commands/login.ts (new), apps/dashboard/src/ (update routes), src/core/mcp/ (protect endpoints)
Why this lane: Mechanical wiring — connect middleware to routes. Qwen labor.
Power Tier: LOW
Depends on: W3
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "W3 created Clerk auth middleware at src/core/auth/middleware.ts.
   Wire it into every API route.

   1) Create apps/cli/lib/commands/login.ts:
      - ultra-dex login → open browser to Clerk login URL
      - ultra-dex logout → clear local session token
      - ultra-dex whoami → show current user email + role + plan
      - ultra-dex apikey generate → generate API key for programmatic use
      - Store session token in ~/.ultra-dex/session.json

   2) Protect dashboard routes:
      - apps/dashboard: wrap app in Clerk provider
      - Redirect unauthenticated users to /login
      - Show user info in navbar (email, plan badge)
      - Add /settings page (API keys, plan info)

   3) Protect API endpoints:
      - src/core/mcp/: require auth for all tool executions
      - AI request endpoints: require auth, track userId
      - Health endpoints: NO auth required (public)
      - /metrics: require admin role

   4) npx tsc --noEmit → 0 errors
   5) npm test → 0 failures
   6) npm run build → exits 0"
```
Expected Output: Auth wired into all routes + CLI login command
Validation: `grep -r 'requireAuth' src/ apps/ | wc -l` → 5+. Tests pass.
Fallback #1: qwen "same — just CLI login command"
Fallback #2: gemini -y -p "same task"
Fallback #3: codex --full-auto exec "same task"
Cost Class: FREE

---

## P2 — ANALYTICS + OBSERVABILITY (PostHog + Sentry)

src/core/analytics/ has 771 LOC scaffold. Replace local event store with real services.

---

[WINDOW 5] CODEX — o3
Task ID: P2-W5
Objective: Replace local analytics with PostHog. Wire Sentry for error tracking. Track all AI requests and agent runs.
Target Files: src/core/analytics/analytics-service.ts (rewrite), src/core/analytics/posthog-client.ts (new), src/core/analytics/sentry-client.ts (new)
Why this lane: Analytics integration touches many surfaces — needs systematic approach. Codex o3 for breadth.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o3 exec \
  "Wire real analytics into Ultra-Dex.

   CURRENT STATE:
   - src/core/analytics/analytics-service.ts: 69 LOC, stores events in local array
   - src/core/analytics/enterprise-analytics.ts: 700 LOC, advanced analytics engine
   - Need: PostHog for product analytics, Sentry for errors

   MISSION:
   1) npm install posthog-node @sentry/node

   2) Create src/core/analytics/posthog-client.ts:
      - Init PostHog with POSTHOG_API_KEY + POSTHOG_HOST from env
      - Graceful no-op if keys not set (dev mode)
      - Export: track(event, properties, userId), identify(userId, traits), flush()
      - Key events to track:
        * user_signup, user_login
        * ai_request (provider, model, tokens, latency, cost)
        * agent_run (agentId, taskType, status, duration)
        * swarm_execution (agentCount, taskCount, duration)
        * mcp_tool_call (tool, status, duration)
        * billing_event (plan_change, payment, usage_limit_hit)

   3) Create src/core/analytics/sentry-client.ts:
      - Init Sentry with SENTRY_DSN from env
      - Graceful no-op if DSN not set
      - Export: captureException(error, context), setUser(userId), addBreadcrumb()
      - Set tags: version, environment, nodeVersion
      - Configure: tracesSampleRate 0.1 in prod, 1.0 in dev

   4) Rewrite src/core/analytics/analytics-service.ts:
      - Keep interface identical
      - Internally delegate to PostHog client
      - On error events: also send to Sentry
      - Batch events (flush every 30s or 100 events)
      - In dev mode: log to console instead of sending

   5) Wire into AI meta layer (src/core/ai/ai-meta-layer.ts):
      - After every AI call: analytics.track('ai_request', { provider, model, tokens, latency, cost, userId })
      - On AI error: sentry.captureException(error, { provider, model })

   6) Wire into orchestrator (src/core/orchestration/index.ts):
      - After every agent run: analytics.track('agent_run', { ... })
      - On agent failure: sentry.captureException()

   7) Add shutdown hook: analytics.flush() + sentry.flush() on SIGTERM

   8) npx tsc --noEmit → 0 errors
   9) npm test → 0 failures (mock PostHog/Sentry in tests)"
```
Expected Output: PostHog + Sentry integrated, all AI/agent events tracked
Validation: `npx tsc --noEmit` exits 0. `grep 'posthog' src/core/analytics/posthog-client.ts` found.
Fallback #1: codex -m o1 exec "same — just PostHog, skip Sentry"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: gemini -y -p "same — minimal PostHog wrapper only"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 6] GEMINI — gemini-2.5-flash
Task ID: P2-W6
Objective: Create analytics dashboard page in apps/dashboard showing real-time usage stats
Target Files: apps/dashboard/src/pages/Analytics.tsx (new), apps/dashboard/src/components/UsageChart.tsx (new)
Why this lane: Dashboard UI component — Gemini at $0
Power Tier: LOW
Depends on: W5
Command:
```bash
gemini -y -p \
  "Create an analytics dashboard page for Ultra-Dex.

   1) Create apps/dashboard/src/pages/Analytics.tsx:
      - Fetch from /api/analytics/summary endpoint
      - Show cards: total requests (24h), active users, total tokens, avg latency
      - Show charts: requests over time (line), provider distribution (pie), top agents (bar)
      - Show table: recent AI requests (time, user, provider, model, tokens, latency, status)
      - Auto-refresh every 60 seconds

   2) Create apps/dashboard/src/components/UsageChart.tsx:
      - Reusable chart component using recharts
      - Support: line, bar, pie chart types
      - Responsive, dark-mode compatible

   3) Create /api/analytics/summary endpoint in src/core/analytics/:
      - Returns: { requests24h, activeUsers24h, totalTokens24h, avgLatency, topProviders, topAgents }
      - Require auth (admin or pro plan)

   4) Add route to dashboard navigation
   5) npx tsc --noEmit → 0 errors
   6) npm run build → exits 0"
```
Expected Output: Analytics dashboard page with charts
Validation: `ls apps/dashboard/src/pages/Analytics.tsx` exists. Build passes.
Fallback #1: gemini -p "same — just the page, skip charts"
Fallback #2: qwen "same task"
Fallback #3: claude --model haiku -p "same task"
Cost Class: FREE

---

## P3 — BILLING (Activate Stripe, Usage Metering, Subscriptions)

src/core/billing/ has 750 LOC with pricing tiers defined. Replace dummy Stripe with live.

---

[WINDOW 7] CLAUDE — claude-sonnet-4
Task ID: P3-W7
Objective: Wire real Stripe SDK. Create products/prices programmatically. Checkout + customer portal.
Target Files: src/core/billing/billing-service.ts (rewrite), src/core/billing/stripe-client.ts (new), src/core/billing/webhook-handler.ts (new)
Why this lane: Billing is money-critical. Needs security judgment. Sonnet for reliability.
Power Tier: HIGH
Command:
```bash
claude --model sonnet --effort high \
  "Activate Stripe billing for Ultra-Dex.

   CURRENT STATE:
   - src/core/billing/billing-service.ts: 135 LOC, has Stripe import but uses dummy key 'sk_test_dummy'
   - src/core/billing/pricing-tiers.ts: 92 LOC, defines Free/Pro/Enterprise tiers
   - src/core/billing/billing-manager.ts: 523 LOC, orchestrates billing logic

   MISSION:
   1) Create src/core/billing/stripe-client.ts:
      - Init Stripe with STRIPE_SECRET_KEY from env
      - If no key: log warning, return mock client (dev mode)
      - Export typed helpers: createCheckoutSession(), createCustomerPortalSession(),
        getSubscription(), getUsage(), cancelSubscription()

   2) Rewrite src/core/billing/billing-service.ts:
      - Replace dummy key with stripe-client.ts
      - Sync products on startup:
        * Check if Ultra-Dex products exist in Stripe (by metadata.app='ultra-dex')
        * If not: create products + prices from pricing-tiers.ts definitions
        * Free: \$0/mo, Pro: \$29/mo, Enterprise: \$99/mo (or custom)
      - createCheckoutSession(userId, tierId):
        * Create Stripe Checkout session
        * Return URL for redirect
        * Set success_url and cancel_url
      - createPortalSession(userId):
        * Stripe Customer Portal for managing subscription
      - getSubscription(userId): current plan + status + usage

   3) Create src/core/billing/webhook-handler.ts:
      - POST /api/billing/webhook → verify Stripe signature
      - Handle events:
        * checkout.session.completed → activate subscription, update user role in Clerk
        * invoice.paid → log payment, update usage reset date
        * invoice.payment_failed → downgrade to free after grace period, notify user
        * customer.subscription.deleted → revert to free tier
        * customer.subscription.updated → update tier if changed
      - Idempotent: check event ID to prevent duplicate processing

   4) Create src/core/billing/usage-meter.ts (new):
      - Track per-user: tokenCount, requestCount, agentRunCount
      - Check limits before AI request: free=100 req/day + 10K tokens, pro=10K req/day + 1M tokens
      - Return { allowed: boolean, remaining: number, resetAt: Date }
      - Integrate with middleware: reject requests over limit with 429

   5) Update pricing-tiers.ts with Stripe price IDs (from env or created on sync)

   6) Wire into config/production.json:
      'billing': { 'provider': 'stripe', 'syncOnStartup': true, 'webhookPath': '/api/billing/webhook' }

   7) TESTS — mock Stripe in all tests:
      - Test: createCheckoutSession returns URL
      - Test: webhook handles subscription events
      - Test: usage meter blocks over-limit requests
      - Test: free tier limits enforced

   8) npx tsc --noEmit → 0 errors
   9) npm test → 0 failures"
```
Expected Output: Real Stripe integration with checkout, webhooks, usage metering
Validation: `npx tsc --noEmit` exits 0. `grep 'stripe' src/core/billing/stripe-client.ts` found. Tests pass.
Fallback #1: claude --model sonnet --effort high -p "same — skip usage-meter, just checkout + webhooks"
Fallback #2: codex -m o3 --full-auto exec "same task"
Fallback #3: gemini -y -p "same — just stripe-client.ts and webhook-handler.ts"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 8] QWEN — qwen-turbo
Task ID: P3-W8
Objective: Create billing dashboard page. User sees: current plan, usage, upgrade/downgrade, invoices.
Target Files: apps/dashboard/src/pages/Billing.tsx (new), apps/dashboard/src/components/PricingCard.tsx (new), apps/dashboard/src/components/UsageBar.tsx (new)
Why this lane: Dashboard UI — mechanical component creation. Qwen labor.
Power Tier: LOW
Depends on: W7
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Create billing dashboard page for Ultra-Dex.

   1) Create apps/dashboard/src/pages/Billing.tsx:
      - Current plan card: plan name, price, renewal date, status badge
      - Usage section: requests (used/limit), tokens (used/limit), agents (used/limit)
        * Progress bars with color (green < 50%, yellow < 80%, red >= 80%)
      - Upgrade button → redirects to Stripe Checkout (POST /api/billing/checkout)
      - Manage subscription → opens Stripe Customer Portal
      - Invoice history table: date, amount, status, download link

   2) Create apps/dashboard/src/components/PricingCard.tsx:
      - Reusable card: tier name, price, feature list, CTA button
      - Highlight current plan
      - Show 3 cards: Free / Pro (\$29/mo) / Enterprise (\$99/mo)

   3) Create apps/dashboard/src/components/UsageBar.tsx:
      - Progress bar with label: '1,234 / 10,000 requests'
      - Color transitions at thresholds

   4) Add billing route to dashboard navigation
   5) npm run build → exits 0"
```
Expected Output: Billing dashboard with plan info, usage bars, pricing cards
Validation: `ls apps/dashboard/src/pages/Billing.tsx` exists. Build passes.
Fallback #1: gemini -y -p "same task"
Fallback #2: codex --full-auto exec "same task"
Fallback #3: claude --model haiku -p "same task"
Cost Class: FREE

---

[WINDOW 9] GEMINI — gemini-2.5-flash
Task ID: P3-W9
Objective: Create Stripe setup script + billing docs + test the full checkout flow end-to-end
Target Files: scripts/setup-stripe.sh (new), docs/BILLING.md (new)
Why this lane: Docs + scripting — Gemini at $0
Power Tier: LOW
Depends on: W7
Command:
```bash
gemini -y -p \
  "Create Stripe setup tooling and documentation.

   1) Create scripts/setup-stripe.sh:
      - Check STRIPE_SECRET_KEY is set
      - Use stripe CLI to create products:
        stripe products create --name='Ultra-Dex Free' --metadata[app]=ultra-dex --metadata[tier]=free
        stripe products create --name='Ultra-Dex Pro' --metadata[app]=ultra-dex --metadata[tier]=pro
        stripe prices create --product=\$PROD_ID --unit-amount=2900 --currency=usd --recurring[interval]=month
        (similar for Enterprise at 9900)
      - Set up webhook endpoint:
        stripe webhook_endpoints create --url=https://ultra-dex.{domain}/api/billing/webhook --events checkout.session.completed,invoice.paid,invoice.payment_failed,customer.subscription.deleted,customer.subscription.updated
      - Output: product IDs, price IDs, webhook secret

   2) Create docs/BILLING.md:
      - Pricing tiers table: Free/Pro/Enterprise with features and limits
      - Setup guide: Stripe account → API keys → run setup script → verify
      - Webhook configuration
      - Testing: stripe trigger checkout.session.completed
      - Usage metering: how limits are enforced
      - Troubleshooting: common Stripe errors

   3) Add billing section to docs/DEPLOYMENT.md (append)

   4) chmod +x scripts/setup-stripe.sh"
```
Expected Output: Stripe setup script + billing docs
Validation: `ls scripts/setup-stripe.sh docs/BILLING.md` both exist.
Fallback #1: qwen "same task"
Fallback #2: codex --full-auto exec "same task"
Fallback #3: Manual creation
Cost Class: FREE

---

## P4 — ONBOARDING + LAUNCH (First Users, Polish, Ship)

---

[WINDOW 10] CLAUDE — claude-sonnet-4
Task ID: P4-W10
Objective: Create user onboarding wizard — guide new users through first AI request in < 2 minutes
Target Files: apps/dashboard/src/pages/Onboarding.tsx (new), apps/dashboard/src/components/OnboardingStep.tsx (new), src/core/auth/onboarding.ts (new)
Why this lane: UX design + implementation — needs judgment. Sonnet.
Power Tier: BALANCED
Command:
```bash
claude --model sonnet --effort high \
  "Create onboarding wizard for Ultra-Dex.

   GOAL: New user → first successful AI request in < 2 minutes.

   FLOW:
   Step 1: Welcome — 'Welcome to Ultra-Dex! Let's get you started.'
   Step 2: API Key — 'Add at least one AI provider key' (OpenAI recommended)
           Input field for OPENAI_API_KEY, validate with test call
   Step 3: First Request — Pre-filled example:
           'Ask Ultra-Dex: Explain quantum computing in 3 sentences'
           Show streaming response in real-time
   Step 4: Explore — Show key features:
           - Multi-provider routing (try switching to Anthropic)
           - Agent swarms (try: 'Build me a REST API')
           - Memory (try: 'Remember that I prefer Python')
   Step 5: Done — 'You are ready! Dashboard → your stats. Docs → go deeper.'

   IMPLEMENTATION:
   1) apps/dashboard/src/pages/Onboarding.tsx:
      - Step-by-step wizard with progress bar
      - Each step: title, description, action, validation
      - Skip button for advanced users
      - Track onboarding completion in user metadata (Clerk publicMetadata.onboarded=true)

   2) src/core/auth/onboarding.ts:
      - isOnboarded(userId) → check Clerk metadata
      - completeOnboarding(userId) → set metadata
      - Redirect to onboarding if not completed (middleware)

   3) After signup: auto-redirect to /onboarding
      After completion: redirect to /dashboard

   4) Track analytics: onboarding_started, onboarding_step_completed, onboarding_finished, onboarding_skipped

   5) npx tsc --noEmit → 0
   6) npm run build → 0"
```
Expected Output: Onboarding wizard with 5 steps
Validation: `ls apps/dashboard/src/pages/Onboarding.tsx` exists. Build passes.
Fallback #1: codex -m o1 exec "same task — simpler 3-step wizard"
Fallback #2: gemini -y -p "same — static HTML wizard, no streaming"
Fallback #3: qwen "just create the page structure, skip API validation step"
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 11] GEMINI — gemini-2.5-pro
Task ID: P4-W11
Objective: Create landing page + update README for public launch. ProductHunt-ready.
Target Files: apps/dashboard/src/pages/Landing.tsx (new), README.md (update)
Why this lane: Marketing-quality content — Gemini Pro for polish at $0
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Create public landing page for Ultra-Dex launch.

   1) apps/dashboard/src/pages/Landing.tsx:
      - Hero: 'AI Orchestration Meta-Layer' + subtitle + CTA ('Get Started Free')
      - Features grid (6 cards):
        * Multi-Provider Routing (17 AI providers, smart routing)
        * Agent Swarms (multi-agent coordination)
        * Persistent Memory (semantic search, knowledge graphs)
        * MCP Ecosystem (plugins, marketplace)
        * Enterprise Governance (audit trails, RBAC)
        * Distributed Mesh (horizontal scaling)
      - Pricing section: Free / Pro \$29/mo / Enterprise \$99/mo
      - Social proof section: 'Built with' logos (Node.js, TypeScript, Redis)
      - Footer: GitHub link, docs link, Discord link

   2) Update README.md:
      - Add 'Live Demo' link at top: https://ultra-dex.{domain}
      - Add 'Quick Start' section for SaaS users (not just developers):
        1. Go to https://ultra-dex.{domain}
        2. Sign up
        3. Add API key
        4. Start orchestrating
      - Keep developer quick start (npm install) below

   3) Create .github/FUNDING.yml:
      github: Srujan0798

   4) npm run build → exits 0"
```
Expected Output: Landing page + updated README
Validation: `ls apps/dashboard/src/pages/Landing.tsx` exists. Build passes.
Fallback #1: gemini -p "same — simpler landing page"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: qwen "same — basic landing page"
Cost Class: FREE

---

[WINDOW 12] GEMINI — gemini-2.5-pro
Task ID: P4-W12
Objective: FINAL VERIFICATION — run every check, update CHANGELOG for v3.1.0, produce launch readiness report
Target Files: CHANGELOG.md, package.json (version bump to 3.1.0)
Why this lane: Comprehensive validation — Gemini Pro for thoroughness at $0
Power Tier: HIGH
Depends on: ALL previous windows
Command:
```bash
gemini -p \
  "FINAL LAUNCH READINESS CHECK for Ultra-Dex v3.1.0.

   STEP 1 — Version bump:
   npm version minor --no-git-tag-version  (3.0.0 → 3.1.0)

   STEP 2 — Update CHANGELOG.md:

   ## [3.1.0] - 2026-04-XX — GO LIVE

   ### Added
   - Production deployment (Railway) with SSL + health monitoring
   - Clerk authentication: register, login, logout, API keys, RBAC
   - PostHog analytics: AI requests, agent runs, user events tracked
   - Sentry error tracking: unhandled exceptions, AI provider errors
   - Stripe billing: checkout, subscriptions, webhooks, usage metering
   - Pricing tiers enforced: Free (100 req/day), Pro (10K), Enterprise (unlimited)
   - User onboarding wizard (5 steps, < 2 min)
   - Analytics dashboard (usage charts, provider stats)
   - Billing dashboard (plan, usage, invoices)
   - Landing page (features, pricing, CTA)
   - Structured JSON logging for production
   - Monitoring endpoint: /metrics

   ### Changed
   - Auth: in-memory stubs → Clerk SDK
   - Analytics: local array → PostHog
   - Billing: dummy Stripe → live Stripe
   - README: added live demo link + SaaS quick start

   STEP 3 — Run ALL checks:
   1) npx tsc --noEmit 2>&1 | tail -3
   2) npm run lint 2>&1 | tail -3
   3) npm run build 2>&1 | tail -5
   4) npm run test:unit 2>&1 | grep -E '# (tests|pass|fail)'
   5) npm run test:integration 2>&1 | grep -E '# (tests|pass|fail)'
   6) npm run test:cli 2>&1 | grep -E '# (tests|pass|fail)'
   7) npm audit --audit-level high 2>&1 | tail -3
   8) curl -sf https://ultra-dex.{domain}/health || echo 'NOT DEPLOYED YET'
   9) grep -l 'clerkClient' src/core/auth/ | wc -l
   10) grep -l 'posthog' src/core/analytics/ | wc -l
   11) grep -l 'stripe' src/core/billing/ | wc -l
   12) ls apps/dashboard/src/pages/{Onboarding,Analytics,Billing,Landing}.tsx 2>&1
   13) cat package.json | grep version
   14) wc -l docs/BILLING.md

   STEP 4 — Produce summary:
   | # | Check | Result | Details |
   ...

   If ALL pass:
   '🚀 Ultra-Dex v3.1.0 GO LIVE — Ready for first users.'

   If any fail:
   'BLOCKERS:' + list"
```
Expected Output: Version bump + CHANGELOG + full verification report
Validation: All checks pass. `grep '3.1.0' package.json` matches.
Fallback #1: gemini -p "Run checks 1-7 only, report"
Fallback #2: Manual execution
Fallback #3: claude --model haiku -p "same verification"
Cost Class: FREE

---

## Execution Order & Parallelism

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 0 — DEPLOY (DO FIRST — need live URL for everything)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  W1 (Claude Sonnet: Railway deployment + config)
    ↓
  W2 (Codex o1: monitoring + structured logging) ← needs W1 for URL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARALLEL GROUP 1 (after deployment live)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  W3 (Claude Opus: Clerk auth rewrite)     ← P1
  W5 (Codex o3: PostHog + Sentry)          ← P2
  W7 (Claude Sonnet: Stripe billing)       ← P3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARALLEL GROUP 2 (after Group 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  W4 (Qwen: wire auth into routes)         ← depends on W3
  W6 (Gemini: analytics dashboard)         ← depends on W5
  W8 (Qwen: billing dashboard)             ← depends on W7
  W9 (Gemini: Stripe setup + billing docs) ← depends on W7

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARALLEL GROUP 3 (after Groups 1+2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  W10 (Claude Sonnet: onboarding wizard)   ← P4
  W11 (Gemini: landing page + README)      ← P4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL (after everything)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  W12 (Gemini: version bump + changelog + final verification)
```

---

## Cost Profile

| Cost Class | Windows | Count |
|------------|---------|-------|
| FREE | W4, W6, W8, W9, W11, W12 | 6 |
| SUBSCRIPTION-INCLUDED | W1, W2, W5, W7, W10 | 5 |
| API-KEY-USAGE | W3 (Opus — auth is security-critical) | 1 |
| **Total** | | **12 windows** |

---

## Owner Pre-Requisites (BEFORE dispatching)

Before ANY agent touches this cycle, **Srujan must**:

| # | Action | Time | Output |
|---|--------|------|--------|
| 1 | Create Railway account | 2 min | RAILWAY_TOKEN |
| 2 | Create Clerk app | 5 min | CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY |
| 3 | Create PostHog project | 3 min | POSTHOG_API_KEY, POSTHOG_HOST |
| 4 | Create Sentry project | 3 min | SENTRY_DSN |
| 5 | Create Stripe account (test mode) | 5 min | STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY |
| 6 | Register domain (optional) | 10 min | Domain name |
| 7 | Add all keys to Railway env vars | 5 min | Verified in Railway dashboard |

**Total: ~35 minutes of owner time. Then agents can run autonomously.**

---

## Cycle 5 Completion Checklist (THE LAUNCH GATE)

- [ ] Live URL responds 200 at /health (HTTPS)
- [ ] UptimeRobot monitoring active (5min interval)
- [ ] Clerk: register → login → logout → API key works
- [ ] RBAC: free user blocked from pro-only features
- [ ] PostHog: events visible (ai_request, agent_run)
- [ ] Sentry: test error captured
- [ ] Stripe: test checkout → subscription active
- [ ] Stripe webhooks: invoice.paid handled
- [ ] Usage metering: free tier limit enforced (100 req/day)
- [ ] Billing dashboard: shows plan + usage + invoices
- [ ] Analytics dashboard: shows request charts + provider stats
- [ ] Onboarding: new user → first AI request < 2 min
- [ ] Landing page: features + pricing + CTA
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → exits 0
- [ ] `npm test` → 0 failures
- [ ] Version: 3.1.0
- [ ] CHANGELOG includes v3.1.0

When ALL checks pass:

**🚀 Ultra-Dex v3.1.0 is LIVE. Open for users. Start selling.**

---

*Cycle 5 dispatches generated from MASTER_HANDOFF_PROMPT.md roadmap — 2026-04-08*
*Protocol: .protocol/orchestration.md + execution.md*
*"Deploy. Get users. Iterate. Scale. Win."*
