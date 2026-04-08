# Dispatch Sheet — Cycle 5: GO LIVE
> Source: MASTER_HANDOFF_PROMPT.md roadmap + live codebase audit (2026-04-08)
> Gate: Live URL → 200 OK. Clerk auth working. PostHog events flowing. Sentry catching errors. Stripe test checkout completes. 10 beta users onboarded.
> Thesis: Stop building infrastructure. Start serving users. Wire the existing scaffolds to real services and deploy.

---

## CRITICAL CONTEXT FOR ALL AGENTS

**Cycle 4 complete.** v3.0.0 Diamond State production-ready:
- 318 unit + 33 integration tests passing, 0 failures
- 0 ESLint errors, 0 type errors, build green
- Docker, configs, deployment scripts, health checks, docs all in place

**Scaffold modules that exist but need wiring to real services:**
- `src/core/auth/` — 470 LOC: in-memory Map stubs → wire to Clerk SDK
- `src/core/billing/` — 750 LOC: dummy Stripe key → activate real Stripe
- `src/core/analytics/` — 771 LOC: local array → wire to PostHog + Sentry
- `config/production.json` + `docker-compose.prod.yml` + `scripts/deployment/` — all ready

**OWNER provides these env vars BEFORE dispatching agents:**
```
CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
POSTHOG_API_KEY, POSTHOG_HOST
SENTRY_DSN
STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
RENDER_TOKEN (or Render/Fly equivalent)
```
**Owner setup: ~35 min. After that, agents run autonomously.**

---

## P0 — DEPLOY (Live URL First. Everything Else Depends On This.)

---

[WINDOW 1] CLAUDE — claude-sonnet-4
Task ID: P0-W1
Objective: Deploy Ultra-Dex v3.0.0 to Render. Live HTTPS URL. Health checks green.
Target Files: render.json (new), Procfile (new), .env.production.template (new)
Why this lane: Deployment config requires judgment on provider mapping, env var strategy. Sonnet.
Power Tier: HIGH
Command:
```bash
claude --model sonnet --effort high -p \
  "Deploy Ultra-Dex v3.0.0 to Render.

   CURRENT STATE:
   - Dockerfile.prod: multi-stage alpine, node:22
   - docker-compose.prod.yml: with Redis service
   - config/production.json: env var references ready
   - scripts/deployment/deploy-production.sh: exists
   - Health endpoints: /health, /health/ready, /health/deep

   CREATE:
   1) render.json:
      { 'build': { 'builder': 'DOCKERFILE', 'dockerfilePath': 'Dockerfile.prod' },
        'deploy': { 'startCommand': 'node dist/ultra-dex.js serve',
          'healthcheckPath': '/health', 'healthcheckTimeout': 30,
          'restartPolicyType': 'ON_FAILURE' } }

   2) Procfile:
      web: node dist/ultra-dex.js serve

   3) .env.production.template (all required vars with descriptions):
      PORT=3000
      NODE_ENV=production
      REDIS_URL=redis://default:xxx@xxx.render.internal:6379
      AI_DEFAULT_PROVIDER=openai
      OPENAI_API_KEY=sk-xxx
      ANTHROPIC_API_KEY=sk-ant-xxx
      CLERK_SECRET_KEY=sk_live_xxx
      POSTHOG_API_KEY=phc_xxx
      POSTHOG_HOST=https://app.posthog.com
      SENTRY_DSN=https://xxx@sentry.io/xxx
      STRIPE_SECRET_KEY=sk_live_xxx
      STRIPE_PUBLISHABLE_KEY=pk_live_xxx
      STRIPE_WEBHOOK_SECRET=whsec_xxx

   4) Verify deploy script supports Render CLI:
      render up --detach && render domain
      curl -sf https://\$DOMAIN/health || exit 1

   5) Local Docker test:
      docker build -f Dockerfile.prod -t ultra-dex:3.0.0 .
      docker run -p 3000:3000 -e NODE_ENV=production ultra-dex:3.0.0 &
      sleep 3 && curl http://localhost:3000/health

   DELIVERABLES: render.json + Procfile + .env.production.template + Docker test passes"
```
Expected Output: Render config files + local Docker test passes
Validation: `docker build -f Dockerfile.prod .` exits 0. `curl localhost:3000/health` → 200.
Fallback #1: claude --model sonnet --effort high -p "same — target Render instead, create render.yaml"
Fallback #2: codex --full-auto -m o1 exec "same — Render config only, skip Docker test"
Fallback #3: opencode run -p "Create render.json + Procfile + .env.production.template for Ultra-Dex Docker deployment to Render. Use Dockerfile.prod. render.json: builder DOCKERFILE, healthcheckPath /health, startCommand 'node dist/ultra-dex.js serve'."
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 2] CODEX — o1
Task ID: P0-W2
Objective: Structured JSON logging + /metrics endpoint for production observability
Target Files: src/core/system/structured-logger.ts (new), src/core/system/monitoring.ts (new)
Why this lane: Monitoring needs systematic cross-codebase wiring. Codex.
Power Tier: BALANCED
Depends on: W1
Command:
```bash
codex --full-auto -m o1 exec \
  "Add production observability to Ultra-Dex v3.0.0.

   1) Create src/core/system/structured-logger.ts:
      - Wrap existing winston logger
      - JSON format in production, pretty in dev (check NODE_ENV)
      - Base fields: { timestamp, level, service, traceId, userId, durationMs }
      - AI log extras: { provider, model, tokens, cost, latencyMs }
      - Agent log extras: { agentId, taskId, status }
      - Export: logger.info(), logger.error(), logger.warn(), logger.metric()

   2) Create src/core/system/monitoring.ts:
      - Track: requestCount, errorCount, latencyBuckets (p50/p95/p99)
      - Track per-provider: requestCount, errorCount, avgLatencyMs, totalTokens
      - Track per-user: requestCount, tokenCount (feeds usage-meter later)
      - Expose GET /metrics → JSON { uptime, requests, errors, providers }
      - /metrics protected: require admin role (wire auth middleware later)

   3) Wire structured-logger into src/core/ai/ai-meta-layer.ts:
      - After every AI call: logger.metric('ai_request', { provider, model, tokens, latencyMs })
      - On AI error: logger.error('ai_error', { provider, model, error: err.message })

   4) Add SIGTERM handler: flush logger buffers

   5) npx tsc --noEmit → 0 errors
   6) npm test → 0 failures"
```
Expected Output: Structured logger + monitoring module + wired into AI layer
Validation: `npx tsc --noEmit` exits 0. `ls src/core/system/structured-logger.ts src/core/system/monitoring.ts` both exist.
Fallback #1: codex --full-auto -m gpt-4 exec "same — just structured-logger.ts, skip monitoring"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: opencode run -p "Create src/core/system/structured-logger.ts wrapping winston. JSON output in production, pretty in dev. Fields: timestamp, level, service, traceId, userId. Export logger.info/error/warn/metric. Wire into src/core/ai/ai-meta-layer.ts: log ai_request after every call."
Cost Class: SUBSCRIPTION-INCLUDED

---

## P1 — AUTH (Replace In-Memory Stubs with Clerk SDK)

---

[WINDOW 3] CLAUDE — claude-opus-4
Task ID: P1-W3
Objective: Replace in-memory auth (Map<string,User>) with Clerk SDK. Full flow: register, login, session, API keys, middleware, RBAC.
Target Files: src/core/auth/clerk-client.ts (new), src/core/auth/auth-service.ts (rewrite), src/core/auth/middleware.ts (new), src/core/auth/rbac.ts (update)
Why this lane: Auth is security-critical. Requires judgment on SDK integration, fallback strategy, RBAC mapping. Opus for security-sensitive work.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Replace Ultra-Dex in-memory auth with Clerk SDK.

   CURRENT STATE:
   - auth-service.ts (80 LOC): uses Map<string,User> + Map<string,UserSession>
   - user-model.ts (57 LOC): User, UserCredentials, UserSession interfaces
   - rbac.ts (123 LOC): role definitions
   - rbac-manager.ts (99 LOC): RBAC enforcement
   - sso.ts (111 LOC): SSO stub

   STEPS:
   1) npm install @clerk/clerk-sdk-node

   2) Create src/core/auth/clerk-client.ts:
      - Init Clerk(process.env.CLERK_SECRET_KEY)
      - If no key: log warning, export null (dev falls back to in-memory)
      - Export: clerkClient (typed Clerk instance)

   3) Rewrite src/core/auth/auth-service.ts:
      - KEEP interface identical — don't break any consumer
      - Prod (CLERK_SECRET_KEY set):
        register() → clerkClient.users.createUser({ emailAddress, password })
        validateSession(token) → clerkClient.verifyToken(token)
        getUserById(id) → clerkClient.users.getUser(id)
        generateApiKey(userId) → JWT signed with CLERK_SECRET_KEY, stored in Clerk metadata
      - Dev (no key): use old in-memory Map fallback (keep as fallbackAuthService)

   4) Create src/core/auth/middleware.ts:
      - requireAuth(roles?: string[]): Express middleware
      - Extract Bearer token from Authorization header
      - Validate via clerkClient.verifyToken()
      - Attach: req.auth = { userId, email, role, plan }
      - 401 on missing/invalid token; 403 on wrong role
      - Dev mode: accept 'dev-token' → mock user { role: 'free' }

   5) Update src/core/auth/rbac.ts:
      - Read role from Clerk publicMetadata.role (free|pro|enterprise|admin)
      - Tier limits:
        free: 100 req/day, 10K tokens/day
        pro: 10,000 req/day, 1M tokens/day
        enterprise: unlimited

   6) TESTS (tests/core/auth.test.js):
      - Mock clerkClient — no real API calls in tests
      - validateSession mock token → returns user context
      - requireAuth middleware → 401 without token, 200 with mock token
      - RBAC → free user blocked from pro-only route
      - All existing tests still pass

   7) npx tsc --noEmit → 0 errors
   8) npm test → 0 failures"
```
Expected Output: Clerk auth with middleware, RBAC, dev fallback, tests passing
Validation: `npx tsc --noEmit` exits 0. `npm test` passes. `grep 'clerkClient' src/core/auth/clerk-client.ts` found.
Fallback #1: claude --model sonnet --effort high -p "same — skip SSO, focus on clerk-client.ts + middleware.ts only"
Fallback #2: codex --full-auto -m o3 exec "same task — Clerk auth integration, keep AuthService interface"
Fallback #3: opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/auth/clerk-client.ts: init Clerk with CLERK_SECRET_KEY env var, export clerkClient (null if no key). Create src/core/auth/middleware.ts: requireAuth() extracts Bearer token, validates via clerkClient.verifyToken(), attaches req.auth = { userId, email, role }. 401 on failure. Dev mode: 'dev-token' → mock free user."
Cost Class: API-KEY-USAGE

---

[WINDOW 4] QWEN — qwen-turbo
Task ID: P1-W4
Objective: Wire auth middleware into all API routes. CLI login command.
Target Files: apps/cli/lib/commands/login.ts (new), apps/dashboard/src/ (route protection), src/core/mcp/ (endpoint protection)
Why this lane: Mechanical route wiring. Qwen labor.
Power Tier: LOW
Depends on: W3
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "W3 created Clerk auth at src/core/auth/middleware.ts. Wire requireAuth into every route.

   1) Create apps/cli/lib/commands/login.ts:
      ultra-dex login   → print Clerk login URL, store token at ~/.ultra-dex/session.json (chmod 600)
      ultra-dex logout  → delete ~/.ultra-dex/session.json
      ultra-dex whoami  → read session.json, print email + role + plan
      ultra-dex apikey generate → POST /api/auth/apikey, print result

   2) Protect dashboard routes (apps/dashboard/src/):
      Wrap App.tsx with Clerk provider
      Redirect unauthenticated users to /login
      Show email + plan badge in navbar

   3) Protect API endpoints:
      src/core/mcp/: requireAuth() on all tool execution routes
      AI request routes: requireAuth(), attach userId to context
      Public (no auth): GET /health, /health/ready, /health/deep
      Admin only: GET /metrics

   4) npx tsc --noEmit → 0 errors
   5) npm test → 0 failures
   6) npm run build → exits 0"
```
Expected Output: Auth wired into routes + CLI login/logout/whoami
Validation: `grep -r 'requireAuth' src/ apps/ | wc -l` → 5+. Build passes.
Fallback #1: qwen --auth-type qwen-oauth --approval-mode yolo "same — just CLI login.ts, skip dashboard wiring"
Fallback #2: gemini -y -p "same task — wire requireAuth into 3 routes + create login.ts"
Fallback #3: opencode run -p "Create apps/cli/lib/commands/login.ts with: login (store token to ~/.ultra-dex/session.json chmod 600), logout (delete it), whoami (print email+role), apikey generate (POST /api/auth/apikey). Add requireAuth to src/core/mcp/ tool routes."
Cost Class: FREE

---

## P2 — ANALYTICS + OBSERVABILITY (PostHog + Sentry)

---

[WINDOW 5] CODEX — o3
Task ID: P2-W5
Objective: Wire PostHog for analytics and Sentry for errors. Track all AI requests + agent runs.
Target Files: src/core/analytics/posthog-client.ts (new), src/core/analytics/sentry-client.ts (new), src/core/analytics/analytics-service.ts (rewrite)
Why this lane: Analytics touches many surfaces across codebase. Codex o3 for breadth + reasoning.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o3 exec \
  "Wire real analytics into Ultra-Dex.

   CURRENT STATE:
   - analytics-service.ts (69 LOC): stores events in local array
   - enterprise-analytics.ts (700 LOC): advanced engine (keep, just wire event sink)

   1) npm install posthog-node @sentry/node

   2) Create src/core/analytics/posthog-client.ts:
      - Init PostHog(POSTHOG_API_KEY, { host: POSTHOG_HOST })
      - No-op + console.log if keys not set (dev mode)
      - Batch: flush every 30s or 100 events
      - Export: track(event, properties, userId), identify(userId, traits), flush()
      - Key events:
        user_signup, user_login
        ai_request { provider, model, tokens, latencyMs, costUsd }
        agent_run { agentId, taskType, status, durationMs }
        swarm_execution { agentCount, taskCount, durationMs }
        mcp_tool_call { tool, status, durationMs }
        billing_event { type, plan, amount }

   3) Create src/core/analytics/sentry-client.ts:
      - Init Sentry({ dsn: SENTRY_DSN }); no-op if no DSN
      - Tags: version (package.json), environment, nodeVersion
      - tracesSampleRate: 0.1 prod, 1.0 dev
      - Export: captureException(error, context), setUser(userId), addBreadcrumb()

   4) Rewrite src/core/analytics/analytics-service.ts:
      - Keep interface identical
      - Delegate to PostHog client
      - On error events: also call sentry.captureException()
      - Dev mode: console.log only

   5) Wire into src/core/ai/ai-meta-layer.ts:
      After every AI call: analytics.track('ai_request', { provider, model, tokens, latencyMs })
      On AI error: sentry.captureException(error, { provider, model })

   6) Wire into src/core/orchestration/index.ts:
      After every agent run: analytics.track('agent_run', { agentId, status, durationMs })
      On failure: sentry.captureException(error)

   7) SIGTERM: analytics.flush() + sentry.flush()

   8) npx tsc --noEmit → 0 errors
   9) npm test → 0 failures (mock PostHog + Sentry)"
```
Expected Output: PostHog + Sentry wired, all events tracked, tests passing
Validation: `npx tsc --noEmit` exits 0. `grep 'posthog-node' package.json` found.
Fallback #1: codex --full-auto -m o1 exec "same — PostHog only, skip Sentry"
Fallback #2: claude --model sonnet --effort high -p "same task — analytics integration"
Fallback #3: opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/analytics/posthog-client.ts: npm install posthog-node, init PostHog with POSTHOG_API_KEY+POSTHOG_HOST, export track(event,props,userId)/identify/flush. No-op if no key. Create src/core/analytics/sentry-client.ts: npm install @sentry/node, init with SENTRY_DSN, export captureException. No-op if no DSN."
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 6] GEMINI — gemini-2.5-flash
Task ID: P2-W6
Objective: Analytics dashboard page — request charts, provider breakdown, usage table
Target Files: apps/dashboard/src/pages/Analytics.tsx (new), apps/dashboard/src/components/UsageChart.tsx (new)
Why this lane: Dashboard UI. Gemini at $0.
Power Tier: LOW
Depends on: W5
Command:
```bash
gemini -y -p \
  "Create analytics dashboard page for Ultra-Dex.

   1) Create apps/dashboard/src/pages/Analytics.tsx:
      - Fetch from GET /api/analytics/summary (create endpoint in analytics module)
      - 4 stat cards: Requests (24h), Active Users (24h), Tokens (24h), Avg Latency
      - Line chart: requests over time (24h + 7d tabs) using recharts
      - Pie chart: provider distribution (OpenAI / Anthropic / Gemini / Other)
      - Table: recent requests (time | user | provider | model | tokens | latency | status)
      - Auto-refresh every 60 seconds

   2) Create apps/dashboard/src/components/UsageChart.tsx:
      - Props: type ('line'|'bar'|'pie'), data, title
      - Uses recharts (already in dashboard deps)
      - Responsive, dark-mode safe

   3) Create GET /api/analytics/summary endpoint:
      Returns: { requests24h, activeUsers24h, totalTokens24h, avgLatencyMs, topProviders[], topAgents[] }
      Requires auth (pro or admin role)

   4) Add Analytics link to dashboard navigation

   5) npx tsc --noEmit → 0 errors
   6) npm run build → exits 0"
```
Expected Output: Analytics dashboard page with charts
Validation: `ls apps/dashboard/src/pages/Analytics.tsx` exists. Build passes.
Fallback #1: gemini -y -p "same — 4 stat cards + table only, skip charts"
Fallback #2: qwen --auth-type qwen-oauth --approval-mode yolo "same task"
Fallback #3: opencode run -p "Create apps/dashboard/src/pages/Analytics.tsx with 4 KPI stat cards (requests, users, tokens, latency), a recharts line chart for requests over time, and a table of recent AI requests. Fetch from GET /api/analytics/summary. Add to dashboard nav."
Cost Class: FREE

---

## P3 — BILLING (Activate Stripe, Metering, Subscriptions)

---

[WINDOW 7] CLAUDE — claude-sonnet-4
Task ID: P3-W7
Objective: Activate Stripe. Checkout, webhooks, usage metering. pricing-tiers.ts already defines tiers.
Target Files: src/core/billing/stripe-client.ts (new), src/core/billing/billing-service.ts (rewrite), src/core/billing/webhook-handler.ts (new), src/core/billing/usage-meter.ts (new)
Why this lane: Billing is money-critical. Needs security judgment on webhook verification, idempotency. Sonnet.
Power Tier: HIGH
Command:
```bash
claude --model sonnet --effort high -p \
  "Activate Stripe billing for Ultra-Dex v3.0.0.

   CURRENT STATE:
   - billing-service.ts (135 LOC): Stripe imported, dummy key 'sk_test_dummy'
   - billing-manager.ts (523 LOC): orchestration logic exists
   - pricing-tiers.ts (92 LOC): Free / Pro / Enterprise defined with limits

   STEPS:
   1) Create src/core/billing/stripe-client.ts:
      - Init Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
      - If no key: log warning, return mock client (dev mode returns test URLs)
      - Export typed helpers:
        createCheckoutSession(userId, tierId, successUrl, cancelUrl) → session.url
        createCustomerPortalSession(customerId, returnUrl) → session.url
        getSubscription(customerId) → { plan, status, currentPeriodEnd }
        syncProducts() → create products+prices in Stripe if not found (by metadata.app=ultra-dex)

   2) Rewrite src/core/billing/billing-service.ts:
      - Replace dummy key with stripe-client.ts
      - On startup: syncProducts() — check/create Ultra-Dex products from pricing-tiers.ts
      - Keep BillingService interface identical

   3) Create src/core/billing/webhook-handler.ts:
      - POST /api/billing/webhook
      - Verify: stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
      - Idempotent: check event ID in seen-events Set, skip duplicates
      - Handle:
        checkout.session.completed → activate subscription, update user Clerk metadata.plan
        invoice.paid → log, reset usage counters
        invoice.payment_failed → queue downgrade after 3-day grace, email user
        customer.subscription.deleted → revert to free tier
        customer.subscription.updated → update tier
      - Return 200 immediately; process async

   4) Create src/core/billing/usage-meter.ts:
      - Track per-user: tokenCount, requestCount, agentRunCount (reset daily at midnight UTC)
      - checkLimit(userId, plan) → { allowed: boolean, remaining: number, resetAt: Date }
      - Limits from pricing-tiers.ts:
        free: 100 req/day + 10K tokens/day
        pro: 10,000 req/day + 1M tokens/day
        enterprise: unlimited
      - On limit: throw 429 { error: 'LIMIT_EXCEEDED', remaining: 0, resetAt }

   5) TESTS — mock Stripe in all tests:
      - createCheckoutSession → returns URL string
      - webhook: checkout.session.completed updates Clerk metadata
      - usage-meter: free user blocked at 101st request
      - dev mode: mock client returns test URLs

   6) npx tsc --noEmit → 0 errors
   7) npm test → 0 failures"
```
Expected Output: Real Stripe with checkout, webhooks, usage metering, tests passing
Validation: `npx tsc --noEmit` exits 0. `ls src/core/billing/stripe-client.ts src/core/billing/webhook-handler.ts src/core/billing/usage-meter.ts` all exist.
Fallback #1: claude --model sonnet --effort high -p "same — skip usage-meter, focus on stripe-client.ts + webhook-handler.ts"
Fallback #2: codex --full-auto -m o3 exec "same task — Stripe billing activation"
Fallback #3: opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/billing/stripe-client.ts: init Stripe with STRIPE_SECRET_KEY (mock if missing), export createCheckoutSession/createCustomerPortalSession/getSubscription/syncProducts. Create src/core/billing/webhook-handler.ts: verify Stripe signature, handle checkout.session.completed+invoice.paid+customer.subscription.deleted idempotently."
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 8] QWEN — qwen-turbo
Task ID: P3-W8
Objective: Billing dashboard — current plan, usage bars, pricing cards, invoice table
Target Files: apps/dashboard/src/pages/Billing.tsx (new), apps/dashboard/src/components/PricingCard.tsx (new), apps/dashboard/src/components/UsageBar.tsx (new)
Why this lane: Mechanical UI component creation. Qwen labor.
Power Tier: LOW
Depends on: W7
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Create billing dashboard for Ultra-Dex.

   1) Create apps/dashboard/src/pages/Billing.tsx:
      - Current Plan card: name + price/mo + renewal date + status badge
      - Usage bars (3): Requests (used/limit), Tokens (used/limit), Agents (used/no limit for pro)
      - Buttons:
        Upgrade Plan → POST /api/billing/checkout → redirect to Stripe URL
        Manage Subscription → POST /api/billing/portal → redirect to Stripe Portal
      - Invoice table: date | amount | status | download PDF link

   2) Create apps/dashboard/src/components/PricingCard.tsx:
      - Props: tier, price, features[], isCurrentPlan, onSelect
      - 3 cards: Free / Pro \$29/mo / Enterprise \$99/mo
      - Highlight current plan with colored border

   3) Create apps/dashboard/src/components/UsageBar.tsx:
      - Props: label, used, limit, unit
      - Progress bar: green <50%, yellow <80%, red >=80%
      - Label text: '1,234 / 10,000 requests'

   4) Add Billing link to dashboard nav

   5) npm run build → exits 0"
```
Expected Output: Billing dashboard with plan, usage, pricing, invoices
Validation: `ls apps/dashboard/src/pages/Billing.tsx apps/dashboard/src/components/PricingCard.tsx apps/dashboard/src/components/UsageBar.tsx` all exist. Build passes.
Fallback #1: gemini -y -p "same task — billing page + usage bars + pricing cards"
Fallback #2: codex --full-auto exec "same task"
Fallback #3: opencode run -p "Create apps/dashboard/src/pages/Billing.tsx: current plan card, 3 usage progress bars (green/yellow/red thresholds), Upgrade and Manage Subscription buttons, invoice table. Create UsageBar.tsx and PricingCard.tsx components. Add to dashboard nav."
Cost Class: FREE

---

[WINDOW 9] GEMINI — gemini-2.5-flash
Task ID: P3-W9
Objective: Stripe setup script + billing docs
Target Files: scripts/setup-stripe.sh (new), docs/BILLING.md (new)
Why this lane: Script + docs generation. Gemini at $0.
Power Tier: LOW
Depends on: W7
Command:
```bash
gemini -y -p \
  "Create Stripe setup tooling for Ultra-Dex.

   1) Create scripts/setup-stripe.sh (use stripe CLI):
      #!/usr/bin/env bash
      set -euo pipefail
      command -v stripe || { echo 'Install: brew install stripe/stripe-cli/stripe'; exit 1; }
      [ -z \${STRIPE_SECRET_KEY:-} ] && { echo 'Set STRIPE_SECRET_KEY first'; exit 1; }

      # Create products
      PRO_ID=\$(stripe products create --name='Ultra-Dex Pro' --metadata[app]=ultra-dex --metadata[tier]=pro --format=json | jq -r '.id')
      PRO_PRICE=\$(stripe prices create --product=\$PRO_ID --unit-amount=2900 --currency=usd --recurring[interval]=month --format=json | jq -r '.id')

      ENT_ID=\$(stripe products create --name='Ultra-Dex Enterprise' --metadata[app]=ultra-dex --metadata[tier]=enterprise --format=json | jq -r '.id')
      ENT_PRICE=\$(stripe prices create --product=\$ENT_ID --unit-amount=9900 --currency=usd --recurring[interval]=month --format=json | jq -r '.id')

      echo '=== ADD THESE TO ENV VARS ==='
      echo \"STRIPE_PRO_PRICE_ID=\$PRO_PRICE\"
      echo \"STRIPE_ENTERPRISE_PRICE_ID=\$ENT_PRICE\"

   2) chmod +x scripts/setup-stripe.sh

   3) Create docs/BILLING.md:
      Pricing table: Free / Pro \$29/mo / Enterprise \$99/mo with limits + features
      Setup guide: Stripe account → API keys → run setup-stripe.sh → add IDs to env vars → configure webhook
      Webhook guide: Render webhook URL, how to test with 'stripe trigger checkout.session.completed'
      Usage metering: what happens at 80% and 100% of limit
      Upgrade flow: click Upgrade → Stripe Checkout → webhook → role updated automatically
      Troubleshooting: signature verification failure, duplicate events, failed payments

   4) Append billing section to docs/DEPLOYMENT.md"
```
Expected Output: Stripe setup script + billing docs
Validation: `ls scripts/setup-stripe.sh docs/BILLING.md` both exist. `bash -n scripts/setup-stripe.sh` passes.
Fallback #1: gemini -y -p "same — just docs/BILLING.md, skip script"
Fallback #2: qwen --auth-type qwen-oauth --approval-mode yolo "same task"
Fallback #3: opencode run -p "Create scripts/setup-stripe.sh using stripe CLI to create Ultra-Dex Pro(\$29/mo) and Enterprise(\$99/mo) products + monthly prices, output price IDs. Create docs/BILLING.md with pricing table, setup guide, and webhook configuration."
Cost Class: FREE

---

## P4 — ONBOARDING + LAUNCH

---

[WINDOW 10] CLAUDE — claude-sonnet-4
Task ID: P4-W10
Objective: User onboarding wizard — 5 steps, new user → first AI request in < 2 minutes
Target Files: apps/dashboard/src/pages/Onboarding.tsx (new), apps/dashboard/src/components/OnboardingStep.tsx (new), src/core/auth/onboarding.ts (new)
Why this lane: Multi-step UX + Clerk metadata + analytics integration. Judgment needed. Sonnet.
Power Tier: BALANCED
Command:
```bash
claude --model sonnet --effort high -p \
  "Create user onboarding wizard for Ultra-Dex.

   GOAL: New signup → first successful AI request in under 2 minutes.

   STEPS:
   1: Welcome — 'Welcome to Ultra-Dex. First AI request in 2 minutes.'
   2: API Key — input OPENAI_API_KEY → validate with test call → green checkmark
   3: First Request — pre-filled 'Explain quantum computing in 3 sentences' → streaming response
   4: Explore — 3 feature cards (switch providers / agent swarm / memory)
   5: Done — confetti → 'Go to Dashboard' button

   IMPLEMENTATION:
   1) apps/dashboard/src/pages/Onboarding.tsx:
      - Progress bar (1/5 → 5/5)
      - Skip button always visible
      - On Step 5 complete: POST /api/auth/onboarding/complete
        sets Clerk publicMetadata.onboarded = true + onboardedAt = ISO timestamp

   2) apps/dashboard/src/components/OnboardingStep.tsx:
      - Props: step, total, title, description, children, onNext, onSkip

   3) Create src/core/auth/onboarding.ts:
      - isOnboarded(userId) → check Clerk publicMetadata.onboarded === true
      - completeOnboarding(userId) → set Clerk metadata
      - Middleware: redirectToOnboarding — if !isOnboarded redirect /onboarding

   4) After signup: redirect to /onboarding
      After Step 5: redirect to /dashboard

   5) Track: onboarding_started, onboarding_step_N_completed, onboarding_finished, onboarding_skipped

   6) npx tsc --noEmit → 0 errors
   7) npm run build → exits 0"
```
Expected Output: 5-step onboarding wizard + Clerk metadata + analytics tracking
Validation: `ls apps/dashboard/src/pages/Onboarding.tsx` exists. Build passes.
Fallback #1: codex --full-auto -m o1 exec "same — simpler 3-step (API key + first request + done)"
Fallback #2: gemini -y -p "same — static 5-step wizard, no live streaming step"
Fallback #3: opencode run -p "Create apps/dashboard/src/pages/Onboarding.tsx: 5-step wizard with progress bar. Step 1 welcome, Step 2 API key input+validate, Step 3 first AI request with streaming, Step 4 feature cards, Step 5 done+redirect. Save onboarded=true to Clerk metadata on complete."
Cost Class: SUBSCRIPTION-INCLUDED

---

[WINDOW 11] GEMINI — gemini-2.5-pro
Task ID: P4-W11
Objective: Public landing page + README update. ProductHunt-ready.
Target Files: apps/dashboard/src/pages/Landing.tsx (new), README.md (update), .github/FUNDING.yml (new)
Why this lane: Marketing-quality content. Gemini Pro for polish at $0.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Create public landing page for Ultra-Dex launch.

   1) apps/dashboard/src/pages/Landing.tsx:
      Hero: H1='AI Orchestration. Done Right.' + subhead + 2 CTAs ('Get Started Free' → /signup, 'View on GitHub' → repo)
      Features (2x3 grid):
        Multi-Provider Routing (17 AI providers)
        Agent Swarms (self-healing coordination)
        Persistent Memory (semantic search)
        MCP Ecosystem (plugins + marketplace)
        Enterprise Governance (audit + RBAC)
        Distributed Mesh (Redis + Kafka scaling)
      Pricing (3 cards): Free \$0 / Pro \$29/mo / Enterprise \$99/mo
      Footer: GitHub | Docs | Discord

   2) Update README.md (read first, preserve good content):
      Add at top: Live demo link + badges
      Add SaaS Quick Start section (before dev section):
        1. Go to https://ultra-dex.{domain}
        2. Sign up (free, no card)
        3. Add AI provider key
        4. Start orchestrating

   3) Create .github/FUNDING.yml:
      github: [Srujan0798]

   4) npm run build → exits 0"
```
Expected Output: Landing page + updated README + FUNDING.yml
Validation: `ls apps/dashboard/src/pages/Landing.tsx .github/FUNDING.yml` both exist. Build passes.
Fallback #1: gemini -p "same — hero + features only, skip pricing"
Fallback #2: claude --model sonnet --effort high -p "same task"
Fallback #3: opencode run -p "Create apps/dashboard/src/pages/Landing.tsx: hero with H1 'AI Orchestration. Done Right.', 6-card features grid, pricing section (Free/Pro\$29/Enterprise\$99). Update README.md top with live URL + SaaS quick start. Create .github/FUNDING.yml with github: [Srujan0798]."
Cost Class: FREE

---

[WINDOW 12] GEMINI — gemini-2.5-pro
Task ID: P4-W12
Objective: Version bump 3.0.0 → 3.1.0. Update CHANGELOG. Run all checks. Final launch report.
Target Files: package.json, CHANGELOG.md
Why this lane: Final verification + changelog. Gemini Pro for thoroughness at $0.
Power Tier: HIGH
Depends on: ALL previous windows
Command:
```bash
gemini -p \
  "FINAL LAUNCH READINESS CHECK — Ultra-Dex v3.1.0.

   STEP 1: npm version minor --no-git-tag-version

   STEP 2: Prepend to CHANGELOG.md:

   ## [3.1.0] - 2026-04-XX — GO LIVE
   ### Cycle 5: Live Product
   #### Added
   - Render deployment: render.json + Procfile + .env.production.template
   - Structured JSON logging: src/core/system/structured-logger.ts
   - Monitoring: /metrics endpoint, per-provider + per-user tracking
   - Clerk auth: register, login, session, API keys, middleware, RBAC
   - Route protection: requireAuth on all AI + MCP endpoints
   - CLI: ultra-dex login / logout / whoami / apikey generate
   - PostHog analytics: ai_request, agent_run, swarm_execution tracked
   - Sentry error tracking: exceptions + AI provider errors
   - Analytics dashboard: request charts, provider breakdown, usage table
   - Stripe billing: checkout, webhooks, subscription management
   - Usage metering: free(100/day) / pro(10K/day) / enterprise(unlimited)
   - Billing dashboard: plan + usage bars + pricing cards + invoices
   - Stripe setup script: scripts/setup-stripe.sh
   - docs/BILLING.md
   - Onboarding wizard: 5 steps, < 2 min to first AI request
   - Landing page: hero + features + pricing
   - .github/FUNDING.yml
   #### Changed
   - Auth: in-memory Map → Clerk SDK (in-memory fallback in dev)
   - Analytics: local array → PostHog (console fallback in dev)
   - Billing: dummy Stripe key → live Stripe SDK

   STEP 3: Run all checks and report:

   1)  npx tsc --noEmit 2>&1 | tail -3
   2)  npm run lint 2>&1 | tail -3
   3)  npm run build 2>&1 | tail -5
   4)  npm run test:unit 2>&1 | grep -E '# (tests|pass|fail)'
   5)  npm run test:integration 2>&1 | grep -E '# (tests|pass|fail)'
   6)  npm run test:cli 2>&1 | grep -E '# (tests|pass|fail)'
   7)  npm audit --audit-level high 2>&1 | tail -3
   8)  curl -sf https://ultra-dex.{domain}/health 2>&1 || echo 'NOT DEPLOYED — skip'
   9)  grep 'clerkClient' src/core/auth/clerk-client.ts | wc -l
   10) grep 'posthog-node' package.json | wc -l
   11) grep '\"stripe\"' package.json | wc -l
   12) ls apps/dashboard/src/pages/{Onboarding,Analytics,Billing,Landing}.tsx 2>&1
   13) ls src/core/auth/clerk-client.ts src/core/auth/middleware.ts 2>&1
   14) ls src/core/billing/stripe-client.ts src/core/billing/webhook-handler.ts src/core/billing/usage-meter.ts 2>&1
   15) ls scripts/setup-stripe.sh docs/BILLING.md 2>&1
   16) cat package.json | grep '\"version\"'

   Report as table: | # | Check | Result | Notes |

   ALL pass: '🚀 Ultra-Dex v3.1.0 GO LIVE — Ready for first users.'
   Any fail: 'BLOCKERS:' + list + fix suggestion"
```
Expected Output: Version 3.1.0 + CHANGELOG updated + all 16 checks pass
Validation: All checks pass. `grep '3.1.0' package.json` matches.
Fallback #1: gemini -p "Run checks 1-7 and 16 only, report table"
Fallback #2: Manual execution of each check command
Fallback #3: opencode run -p "Run: npx tsc --noEmit; npm run lint; npm run build; npm run test:unit | grep fail; npm audit --audit-level high; cat package.json | grep version. Report pass/fail table. Bump package.json version to 3.1.0."
Cost Class: FREE

---

## Execution Order

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 0 — DEPLOY FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  W1 (Claude Sonnet: Render + Docker)
    ↓
  W2 (Codex o1: logging + monitoring)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARALLEL GROUP 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  W3 (Claude Opus: Clerk auth)      ┐
  W5 (Codex o3: PostHog + Sentry)   ├─ run simultaneously
  W7 (Claude Sonnet: Stripe)        ┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARALLEL GROUP 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  W4 (Qwen: route wiring)           ┐
  W6 (Gemini: analytics UI)         ├─ run simultaneously
  W8 (Qwen: billing UI)             │
  W9 (Gemini: Stripe setup + docs)  ┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARALLEL GROUP 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  W10 (Claude Sonnet: onboarding)   ┐
  W11 (Gemini: landing + README)    ┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  W12 (Gemini: v3.1.0 + changelog + verification)
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

## Owner Pre-Requisites (~35 min)

| # | Action | Output |
|---|--------|--------|
| 1 | Create Render account, link GitHub repo | RENDER_TOKEN |
| 2 | Create Clerk app at clerk.com | CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY |
| 3 | Create PostHog project at posthog.com | POSTHOG_API_KEY + POSTHOG_HOST |
| 4 | Create Sentry project at sentry.io | SENTRY_DSN |
| 5 | Create Stripe account (test mode) | STRIPE_SECRET_KEY + STRIPE_PUBLISHABLE_KEY |
| 6 | Add all keys to Render env vars | Verified in Render dashboard |

---

## Cycle 5 Launch Gate

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → exits 0
- [ ] `npm test` → 0 failures
- [ ] Live URL /health → 200 HTTPS
- [ ] Clerk: register, login, logout, API key work
- [ ] RBAC: free tier blocked at 101st request
- [ ] PostHog: events visible in dashboard
- [ ] Sentry: test exception captured
- [ ] Stripe test checkout completes
- [ ] Stripe webhook updates user role
- [ ] Usage metering enforced (429 at limit)
- [ ] Analytics dashboard: charts rendering
- [ ] Billing dashboard: plan + usage + invoices
- [ ] Onboarding: new user → first AI response < 2 min
- [ ] Landing page: live and loading
- [ ] Version: 3.1.0

**When ALL pass: 🚀 Ultra-Dex v3.1.0 is live. Open to users. Start selling.**

---

*Cycle 5 dispatches — 2026-04-08*
*Protocol: .protocol/orchestration.md | Fallback #3: opencode run or opencode run -m opencode/devstral-2-123b-instruct-2512*
