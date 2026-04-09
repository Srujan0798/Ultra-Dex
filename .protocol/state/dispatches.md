# Dispatch Sheet — Cycle 6 ETERNAL: COMPLETE PRE-V2.0, SHIP V3.1.0

> Source: Codebase deep audit (review.md) + NOTION/pre v2.0.md (19 phases) + Cycles 1-5 state
> Status: READY FOR EXECUTION
> Thesis: One esbuild rebuild unblocks 55 tests. Then: fix CLI, RBAC, architecture violation. Clean 24 stubs. Create 14 missing files. Prove both execution paths. Ship v3.1.0. Plan v2.0+.

---

## CRITICAL CONTEXT FOR ALL AGENTS

**Pre-v2.0 Protocol Status (from NOTION/pre v2.0.md):**

- 5/19 phases DONE, 3 partial, 6 blocked, 5 not started
- 55 test failures from ONE root cause (esbuild platform mismatch)
- 5 blockers: esbuild, CLI --help, RBAC, architecture violation, dashboard build
- 24 stub files (0-14 LOC each) in src/core/
- 14 missing files that should exist
- Architecture violation: core imports from apps/cli (BACKWARDS)

**Forbidden Actions (from pre-v2.0 protocol):**

- Do NOT treat "syntactically correct" as "working"
- Do NOT push to git before `run` command works end-to-end
- Do NOT do UI work before execution path is proven
- Do NOT mark any phase complete without validation command output

**Success Gate:**

```
npx ultra-dex run planner -t "hello" --provider nvidia → returns real model output
npm test → 0 failures
npm run build → exits 0
npx tsc --noEmit → 0 errors
npm run lint → 0 errors, 0 warnings
```

---

## ═══════════════════════════════════════════════

## PHASE 0 — PLATFORM FIX (Unblock Everything)

## ═══════════════════════════════════════════════

### [WINDOW 0] OWNER — Manual Action

Task ID: W0-ESBUILD
Objective: Fix esbuild platform mismatch — unblock 55 test failures in ONE command
Target Files: node_modules/@esbuild/
Why this lane: Owner must run this locally — platform-specific binary rebuild
Power Tier: N/A
Command:

```bash
npm rebuild esbuild && npm rebuild
```

Expected Output: esbuild binary matches runtime platform (linux-arm64 or darwin-arm64)
Validation:

```bash
npx esbuild --version  # Should output version without error
npm run test:unit 2>&1 | tail -5  # Should show pass count, not TransformError
```

Fallback #1: `npm install @esbuild/linux-arm64 --force && npm rebuild`
Fallback #2: `rm -rf node_modules && npm install`
Fallback #3: `npx esbuild --version || npm install esbuild@latest --force`
Cost Class: FREE

---

## ═══════════════════════════════════════════════

## PHASE 1 — CLI FIX (Pre-v2.0 Phase 1 Redo)

## ═══════════════════════════════════════════════

### [WINDOW 1] CLAUDE — claude-sonnet-4

Task ID: W1-CLI-HELP
Objective: Fix CLI --help crash — registry.js import resolution failure
Target Files: apps/cli/lib/commands/mcp.js, src/core/mcp/registry.ts
Why this lane: Import resolution is architecture-sensitive. Sonnet for safe refactor.
Power Tier: BALANCED
Command:

```bash
claude --model sonnet --effort high -p \
  "Ultra-Dex CLI crashes on --help. Root cause:

   apps/cli/lib/commands/mcp.js line 2 imports 'src/core/mcp/registry.js'
   but the file is 'src/core/mcp/registry.ts'. Node can't resolve .js → .ts
   without tsx loader at CLI runtime.

   Fix options (pick the cleanest):
   A) Add a .js re-export shim at src/core/mcp/registry.js that re-exports from registry.ts
   B) Change the import in mcp.js to use the correct path
   C) Register tsx loader in CLI entry point

   Requirements:
   - ultra-dex --help must work
   - ultra-dex mcp must work
   - npm run typecheck must still pass (0 errors)
   - npm run lint must still pass (0 errors)

   Validate: node apps/cli/bin/ultra-dex.js --help"
```

Expected Output: CLI --help runs without crash, mcp command works
Validation: `node apps/cli/bin/ultra-dex.js --help && node apps/cli/bin/ultra-dex.js mcp --help`
Fallback #1: `claude --model haiku --effort medium -p "Add registry.js shim that re-exports from registry.ts in src/core/mcp/"`
Fallback #2: `gemini -y -p "Fix import in apps/cli/lib/commands/mcp.js — change registry.js to correct path"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Fix apps/cli/lib/commands/mcp.js — imports src/core/mcp/registry.js but file is registry.ts. Add a .js shim or fix the import path. Validate: node apps/cli/bin/ultra-dex.js --help"`
Cost Class: SUBSCRIPTION-INCLUDED

---

## ═══════════════════════════════════════════════

## PHASE 2 — RBAC FIX (Pre-v2.0 Phase 11/17)

## ═══════════════════════════════════════════════

### [WINDOW 2] CLAUDE — claude-sonnet-4

Task ID: W2-RBAC-FIX
Objective: Fix RBAC blocking local execution — default role "viewer" cannot run agents
Target Files: src/core/auth/rbac.ts, src/core/auth/rbac-manager.ts, apps/cli/lib/commands/run.js
Why this lane: Auth/RBAC is security-critical. Sonnet for careful refactor.
Power Tier: BALANCED
Command:

```bash
claude --model sonnet --effort high -p \
  "Ultra-Dex RBAC blocks local execution:
   MOCK_AI=true node apps/cli/bin/ultra-dex.js run planner -t 'hello'
   → [Access]: Role 'viewer' cannot run @planner

   Root cause: Default role is 'viewer' which has no agent execution permission.

   Fix:
   1) In src/core/auth/rbac.ts OR src/core/auth/rbac-manager.ts:
      - When running locally (no auth token / no CLERK_SECRET_KEY), default to 'admin' or 'developer'
      - Keep 'viewer' as default only when running in production with real auth
   2) Environment detection: if NODE_ENV !== 'production' OR no auth configured → admin role
   3) Must NOT weaken production security

   Validate:
   MOCK_AI=true node apps/cli/bin/ultra-dex.js run planner -t 'hello'
   → Should execute without RBAC block
   → Should print agent output (even if mock)

   npm run typecheck → 0 errors
   npm run lint → 0 errors"
```

Expected Output: Local execution unblocked, production RBAC unchanged
Validation: `MOCK_AI=true node apps/cli/bin/ultra-dex.js run planner -t "hello" 2>&1 | grep -v "cannot run"`
Fallback #1: `claude --model haiku --effort medium -p "In src/core/auth/rbac.ts, change default role from viewer to admin when NODE_ENV !== production"`
Fallback #2: `codex --full-auto -m o1 exec "Fix RBAC in src/core/auth/rbac.ts — default to admin when no auth configured"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Fix src/core/auth/rbac.ts — default role is 'viewer' blocking local execution. Change to 'admin' when NODE_ENV !== 'production'. Keep viewer for production with real auth."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## ═══════════════════════════════════════════════

## PHASE 3 — ARCHITECTURE FIX (Pre-v2.0 Phase 13/16)

## ═══════════════════════════════════════════════

### [WINDOW 3] CLAUDE — claude-opus-4

Task ID: W3-ARCH-FIX
Objective: Fix architecture violation — core imports from apps/cli (BACKWARDS dependency)
Target Files: src/core/governance/governance-manager.ts, apps/cli/lib/governance/index.js
Why this lane: Architecture violation requires deep reasoning about module boundaries. Opus for correctness.
Power Tier: HIGH
Command:

```bash
claude --model opus --effort max -p \
  "ARCHITECTURE VIOLATION in Ultra-Dex:

   src/core/governance/governance-manager.ts line 13:
   import { GovernanceEngine } from '../../../apps/cli/lib/governance/index.js';

   This is BACKWARDS. Core (src/core/) must NEVER import from apps/cli/.
   The dependency direction is: apps/cli/ → src/core/ (never reverse).

   Fix options:
   A) Move GovernanceEngine class from apps/cli/lib/governance/ to src/core/governance/
      - Update all imports across codebase
      - apps/cli/lib/governance/index.js becomes a re-export from core
   B) Create an interface in core, implement in CLI
      - src/core/governance/governance-engine.ts (interface/abstract)
      - apps/cli/lib/governance/ implements it
      - governance-manager.ts uses the interface

   Pick the cleanest option. Requirements:
   - Zero imports from apps/ in src/core/ after fix
   - npm run typecheck → 0 errors
   - npm run lint → 0 errors
   - npm test → existing governance tests still pass
   - grep -r 'apps/cli' src/core/ → returns nothing"
```

Expected Output: GovernanceEngine in core, no reverse imports
Validation: `grep -r "apps/cli" src/core/ && echo "FAIL: reverse imports exist" || echo "PASS: no reverse imports"`
Fallback #1: `claude --model sonnet --effort high -p "Move GovernanceEngine from apps/cli/lib/governance/ to src/core/governance/. Update all imports. No core→CLI imports allowed."`
Fallback #2: `codex --full-auto -m o1 exec "Fix architecture: src/core/governance/governance-manager.ts imports from apps/cli/. Move GovernanceEngine to src/core/governance/. Update all references."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Move GovernanceEngine from apps/cli/lib/governance/index.js to src/core/governance/governance-engine.ts. Update governance-manager.ts import. Update apps/cli/lib/governance/index.js to re-export from core. Verify: grep -r 'apps/cli' src/core/ returns nothing."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## ═══════════════════════════════════════════════

## PHASE 4 — MOCK EXECUTION PROOF (Pre-v2.0 Phase 11/17)

## ═══════════════════════════════════════════════

### [WINDOW 4] CODEX — o1

Task ID: W4-MOCK-EXEC
Objective: Prove MOCK_AI execution path works end-to-end after Phase 1-3 fixes
Target Files: apps/cli/lib/commands/run.js, apps/cli/lib/providers/index.js
Why this lane: Execution validation requires strong reasoning about the full pipeline. Codex o1 for verification.
Power Tier: HIGH
Command:

```bash
codex --full-auto -m o1 exec \
  "Validate Ultra-Dex MOCK_AI execution path:

   1) Run: MOCK_AI=true node apps/cli/bin/ultra-dex.js run planner -t 'hello'
   2) Expected: Agent executes, returns mock output, NO errors
   3) Check: Execution trace includes run_id, steps[], output

   If it fails:
   - Read the error message
   - Trace through: CLI entry → run.js → provider selection → mock provider → output
   - Fix whatever blocks execution
   - Re-run until it works

   When working, capture the FULL output as proof.

   Also test:
   - MOCK_AI=true node apps/cli/bin/ultra-dex.js run planner -t 'design a REST API'
   - MOCK_AI=true node apps/cli/bin/ultra-dex.js run backend -t 'create user endpoint'

   All three must complete without error."
```

Expected Output: Three successful MOCK_AI runs with captured output
Validation: `MOCK_AI=true node apps/cli/bin/ultra-dex.js run planner -t "hello" 2>&1 | grep -E "(output|result|complete)"`
Fallback #1: `codex --full-auto -m gpt-4 exec "Run MOCK_AI=true ultra-dex run planner, debug any failures"`
Fallback #2: `claude --model sonnet --effort high -p "Run MOCK_AI=true node apps/cli/bin/ultra-dex.js run planner -t hello. Debug and fix any failures until it works."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Run MOCK_AI=true node apps/cli/bin/ultra-dex.js run planner -t hello. Trace any errors through run.js → providers → mock. Fix until execution completes."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## ═══════════════════════════════════════════════

## PHASE 5 — AUTH MIDDLEWARE (Missing File P0)

## ═══════════════════════════════════════════════

### [WINDOW 5] CLAUDE — claude-sonnet-4

Task ID: W5-AUTH-MW
Objective: Create auth middleware — production-server.ts references requireAuth/requireAdmin/enforceUsageLimit but they don't exist as a module
Target Files: src/core/auth/middleware.ts (NEW), src/core/server/production-server.ts
Why this lane: Auth middleware is security-critical. Sonnet for precision.
Power Tier: BALANCED
Command:

```bash
claude --model sonnet --effort high -p \
  "Create src/core/auth/middleware.ts for Ultra-Dex.

   production-server.ts (568 LOC) references:
   - requireAuth — Express middleware, validates session/token
   - requireAdmin — Express middleware, checks admin role
   - enforceUsageLimit — Express middleware, checks billing tier limits

   Create the middleware module:
   1) requireAuth: Validate Clerk session token from Authorization header
      - If CLERK_SECRET_KEY not set (local dev), pass through
      - If set, validate with Clerk SDK
      - Attach user to req.user
   2) requireAdmin: Check req.user.role === 'admin'
   3) enforceUsageLimit: Check user's usage against their billing tier
      - Free: 100 requests/day
      - Pro: 10000 requests/day
      - Enterprise: unlimited

   Import from existing:
   - src/core/auth/clerk-auth-service.ts for Clerk validation
   - src/core/auth/rbac.ts for role checking
   - src/core/billing/pricing-tiers.ts for tier limits

   Wire into production-server.ts routes.

   Validate:
   - npm run typecheck → 0 errors
   - npm run lint → 0 errors
   - File exists: src/core/auth/middleware.ts"
```

Expected Output: middleware.ts with requireAuth, requireAdmin, enforceUsageLimit
Validation: `test -f src/core/auth/middleware.ts && npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `claude --model haiku --effort medium -p "Create src/core/auth/middleware.ts with requireAuth, requireAdmin, enforceUsageLimit Express middleware"`
Fallback #2: `gemini -y -p "Create src/core/auth/middleware.ts — Express middleware for auth (Clerk), admin check (RBAC), usage limits (billing tiers)"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/auth/middleware.ts. Export requireAuth (Clerk token validation, passthrough if no CLERK_SECRET_KEY), requireAdmin (role check), enforceUsageLimit (billing tier limits: Free 100/day, Pro 10000/day, Enterprise unlimited). Use Express middleware pattern."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## ═══════════════════════════════════════════════

## PHASE 6 — USAGE METERING + WEBHOOK HANDLER

## ═══════════════════════════════════════════════

### [WINDOW 6] CLAUDE — claude-sonnet-4

Task ID: W6-USAGE-METER
Objective: Create usage metering service — track and enforce API usage per user/tier
Target Files: src/core/billing/usage-meter.ts (NEW)
Why this lane: Billing logic requires precision. Sonnet for correctness.
Power Tier: BALANCED
Command:

```bash
claude --model sonnet --effort high -p \
  "Create src/core/billing/usage-meter.ts for Ultra-Dex.

   Purpose: Track per-user API usage and enforce tier limits.

   Implementation:
   1) UsageMeter class:
      - trackUsage(userId, action, metadata): Record usage event
      - getUsage(userId, period): Get usage count for period (day/month)
      - checkLimit(userId): Boolean — is user within their tier limit?
      - resetDailyCounters(): Cron-compatible daily reset

   2) Tier limits (from pricing-tiers.ts):
      - Free: 100 AI requests/day, 1000/month
      - Pro: 10000 AI requests/day, 100000/month
      - Enterprise: unlimited

   3) Storage: In-memory Map for now, with interface ready for Redis/DB later

   4) Integration points:
      - Import PricingTiers from src/core/billing/pricing-tiers.ts
      - Export for use in middleware.ts enforceUsageLimit

   Validate:
   - npm run typecheck → 0 errors
   - npm run lint → 0 errors"
```

Expected Output: usage-meter.ts with UsageMeter class
Validation: `test -f src/core/billing/usage-meter.ts && npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `gemini -y -p "Create src/core/billing/usage-meter.ts — UsageMeter class with trackUsage, getUsage, checkLimit, resetDailyCounters. Tier limits: Free 100/day, Pro 10000/day, Enterprise unlimited."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Create src/core/billing/usage-meter.ts with usage tracking per user and tier-based limits"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/billing/usage-meter.ts. UsageMeter class: trackUsage(userId, action, metadata), getUsage(userId, period), checkLimit(userId), resetDailyCounters(). In-memory Map storage. Free: 100/day, Pro: 10000/day, Enterprise: unlimited."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 7] GEMINI — gemini-2.5-pro

Task ID: W7-WEBHOOK
Objective: Extract webhook handler from production-server.ts into dedicated module
Target Files: src/core/billing/webhook-handler.ts (NEW), src/core/server/production-server.ts
Why this lane: Extraction refactor, moderate complexity. Gemini Pro for clean extraction.
Power Tier: BALANCED
Command:

```bash
gemini -y -p \
  "Extract Stripe webhook handling from src/core/server/production-server.ts into src/core/billing/webhook-handler.ts.

   Current: production-server.ts has inline webhook handling at POST /api/billing/webhook.

   Create src/core/billing/webhook-handler.ts:
   1) WebhookHandler class with handleWebhook(req, res) method
   2) Handle events: invoice.paid, subscription.created, subscription.deleted, customer.subscription.updated
   3) Stripe signature verification using STRIPE_WEBHOOK_SECRET
   4) Log events via Better Stack logger
   5) Update user billing status on subscription changes

   Update production-server.ts:
   - Import WebhookHandler
   - Replace inline webhook code with webhookHandler.handleWebhook(req, res)

   Validate:
   - npm run typecheck → 0 errors
   - npm run lint → 0 errors"
```

Expected Output: webhook-handler.ts extracted, production-server.ts simplified
Validation: `test -f src/core/billing/webhook-handler.ts && npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `gemini -p "Create src/core/billing/webhook-handler.ts with Stripe webhook handling — extract from production-server.ts"`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Create src/core/billing/webhook-handler.ts — Stripe webhook handler with signature verification"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/billing/webhook-handler.ts. Extract Stripe webhook handling from production-server.ts. Handle invoice.paid, subscription.created, subscription.deleted. Stripe signature verification. Update production-server.ts to use the new module."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════

## PHASE 7 — ANALYTICS (PostHog + Sentry)

## ═══════════════════════════════════════════════

### [WINDOW 8] CLAUDE — claude-sonnet-4

Task ID: W8-POSTHOG
Objective: Create PostHog analytics client for product analytics
Target Files: src/core/analytics/posthog-client.ts (NEW)
Why this lane: Analytics integration with event typing. Sonnet for clean integration.
Power Tier: BALANCED
Command:

```bash
claude --model sonnet --effort high -p \
  "Create src/core/analytics/posthog-client.ts for Ultra-Dex.

   Implementation:
   1) PostHogClient class wrapping posthog-node SDK
   2) Methods:
      - init(apiKey, host): Initialize PostHog
      - trackEvent(userId, event, properties): Track custom event
      - identifyUser(userId, traits): Identify user with traits
      - trackPageView(userId, url): Track page view
      - trackAIRequest(userId, provider, model, tokens, latency): Track AI usage
      - trackBillingEvent(userId, event, amount): Track billing
      - shutdown(): Flush and close
   3) Graceful degradation: If POSTHOG_API_KEY not set, log to console instead
   4) Env vars: POSTHOG_API_KEY, POSTHOG_HOST (default: https://app.posthog.com)

   npm install posthog-node (add to package.json)

   Validate:
   - npm run typecheck → 0 errors
   - npm run lint → 0 errors"
```

Expected Output: posthog-client.ts with PostHogClient class
Validation: `test -f src/core/analytics/posthog-client.ts && npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `gemini -y -p "Create src/core/analytics/posthog-client.ts — PostHog SDK wrapper with trackEvent, identifyUser, trackAIRequest. Graceful degradation if no API key."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Create PostHog analytics client at src/core/analytics/posthog-client.ts"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/analytics/posthog-client.ts. Wrap posthog-node SDK. Methods: init, trackEvent, identifyUser, trackPageView, trackAIRequest, trackBillingEvent, shutdown. If no POSTHOG_API_KEY, log to console."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 9] GEMINI — gemini-2.5-pro

Task ID: W9-SENTRY
Objective: Create Sentry error tracking client
Target Files: src/core/analytics/sentry-client.ts (NEW)
Why this lane: Error tracking integration, moderate complexity. Gemini Pro for clean implementation.
Power Tier: BALANCED
Command:

```bash
gemini -y -p \
  "Create src/core/analytics/sentry-client.ts for Ultra-Dex.

   Implementation:
   1) SentryClient class wrapping @sentry/node SDK
   2) Methods:
      - init(dsn, environment, release): Initialize Sentry
      - captureException(error, context): Capture error with context
      - captureMessage(message, level): Capture message (info/warning/error)
      - setUser(userId, email): Set user context
      - addBreadcrumb(category, message, data): Add breadcrumb
      - startTransaction(name, op): Start performance transaction
      - shutdown(): Flush and close
   3) Graceful degradation: If SENTRY_DSN not set, log errors to console
   4) Env vars: SENTRY_DSN, SENTRY_ENVIRONMENT (default: development)
   5) Integration: Wire into production-server.ts error handler

   npm install @sentry/node (add to package.json)

   Validate:
   - npm run typecheck → 0 errors
   - npm run lint → 0 errors"
```

Expected Output: sentry-client.ts with SentryClient class
Validation: `test -f src/core/analytics/sentry-client.ts && npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `gemini -p "Create src/core/analytics/sentry-client.ts — Sentry SDK wrapper with captureException, captureMessage, graceful degradation"`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Create Sentry error tracking client at src/core/analytics/sentry-client.ts"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create src/core/analytics/sentry-client.ts. Wrap @sentry/node. Methods: init, captureException, captureMessage, setUser, addBreadcrumb, startTransaction, shutdown. If no SENTRY_DSN, log to console."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════

## PHASE 8 — MONITORING (/metrics endpoint)

## ═══════════════════════════════════════════════

### [WINDOW 10] GEMINI — gemini-2.5-flash

Task ID: W10-MONITORING
Objective: Create monitoring service with /metrics endpoint implementation
Target Files: src/core/system/monitoring.ts (NEW), src/core/server/production-server.ts
Why this lane: Metrics collection is structured work. Gemini Flash for speed.
Power Tier: BALANCED
Command:

```bash
gemini -y -p \
  "Create src/core/system/monitoring.ts for Ultra-Dex.

   First ensure the directory exists: mkdir -p src/core/system

   Implementation:
   1) MonitoringService class:
      - collectMetrics(): Gather system metrics
      - getPrometheusFormat(): Return metrics in Prometheus format
      - recordRequest(method, path, statusCode, duration): Track HTTP requests
      - recordAICall(provider, model, tokens, latency, success): Track AI calls
      - recordError(type, message): Track errors
      - getHealthStatus(): Deep health check (DB, external services)

   2) Metrics to collect:
      - http_requests_total (counter, labels: method, path, status)
      - http_request_duration_seconds (histogram)
      - ai_requests_total (counter, labels: provider, model)
      - ai_request_duration_seconds (histogram)
      - ai_tokens_used_total (counter)
      - active_sessions (gauge)
      - memory_usage_bytes (gauge)
      - uptime_seconds (gauge)

   3) Wire into production-server.ts:
      - GET /metrics → monitoringService.getPrometheusFormat()

   Validate:
   - npm run typecheck → 0 errors"
```

Expected Output: monitoring.ts with Prometheus-compatible metrics
Validation: `test -f src/core/system/monitoring.ts && npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Create src/core/system/monitoring.ts with Prometheus metrics collection"`
Fallback #2: `gemini -p "Create monitoring service at src/core/system/monitoring.ts with HTTP and AI request tracking"`
Fallback #3: `opencode run -m opencode/nemotron-3-super-free -p "Create src/core/system/monitoring.ts. MonitoringService class with Prometheus-format metrics. Track HTTP requests, AI calls, tokens, errors, memory, uptime. Export for use in production-server.ts /metrics endpoint."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════

## PHASE 9 — STUB CLEANUP (Pre-v2.0 Phase 12)

## 24 stub files: implement or remove

## ═══════════════════════════════════════════════

### [WINDOW 11] QWEN — qwen-max

Task ID: W11-STUBS-EMPTY
Objective: Remove truly empty files (0-3 LOC) that serve no purpose
Target Files: 8 files
Why this lane: Mechanical deletion task. Qwen for high-volume cheap execution.
Power Tier: LOW
Command:

```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Remove these EMPTY stub files from Ultra-Dex (0-3 lines, no real code):

   1) src/core/mesh/message-bus.ts (0 lines — EMPTY)
   2) src/core/templates/contentstudio/lib/types.ts (0 lines — EMPTY)
   3) src/core/mcp/memory.ts (1 line — just a re-export stub)
   4) src/core/analytics/index.ts (2 lines — re-export)
   5) src/core/streaming/index.ts (3 lines — re-export)

   For each file:
   - Check if ANYTHING imports from it
   - If yes: update the importer to import from the actual source
   - If no: delete the file
   - If the re-export points to a real file, keep the re-export (it's valid)

   Run: npm run typecheck after all changes
   Run: npm run lint after all changes
   Both must pass with 0 errors."
```

Expected Output: Empty stubs removed, imports updated
Validation: `npx tsc --noEmit 2>&1 | tail -3 && npm run lint 2>&1 | tail -3`
Fallback #1: `qwen --auth-type qwen-oauth "Check imports for these 5 empty files, delete safely"`
Fallback #2: `gemini -y -p "Remove empty stub files: src/core/mesh/message-bus.ts, src/core/templates/contentstudio/lib/types.ts, src/core/mcp/memory.ts, src/core/analytics/index.ts, src/core/streaming/index.ts. Update any broken imports."`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Delete empty stub files (0-3 LOC): message-bus.ts, types.ts in contentstudio, mcp/memory.ts, analytics/index.ts, streaming/index.ts. Fix any broken imports. Run typecheck."`
Cost Class: FREE

---

### [WINDOW 12] QWEN — qwen-max

Task ID: W12-STUBS-BROKEN
Objective: Fix broken stub files — files with broken imports or non-functional code
Target Files: 4 files
Why this lane: Mechanical fix task. Qwen for volume.
Power Tier: LOW
Command:

```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Fix these broken stub files in Ultra-Dex:

   1) src/core/commands/agents.ts (4 lines, broken import path)
      - Fix the import or delete if nothing uses it
   2) src/core/utils/logging.js (6 lines, duplicate shim)
      - Delete — logging.ts is the canonical version
   3) src/core/utils/logging.ts (6 lines, duplicate shim)
      - Keep this one but ensure it actually works (imports winston)
   4) src/core/agents/autonomous-agent.ts (6 lines, returns hardcoded 'Goal set')
      - Either implement real autonomous agent or remove
      - Check if anything imports it

   For each:
   - Check if imported anywhere (grep -r 'filename' src/ apps/)
   - Fix or remove based on actual usage
   - npm run typecheck → 0 errors after all changes"
```

Expected Output: Broken stubs fixed or removed
Validation: `npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `qwen --auth-type qwen-oauth "Fix src/core/commands/agents.ts broken import, remove duplicate logging.js"`
Fallback #2: `gemini -y -p "Fix broken stubs: agents.ts (broken import), logging.js (duplicate), autonomous-agent.ts (hardcoded). Check imports, fix or remove."`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Fix broken stubs in src/core/: commands/agents.ts (broken import), utils/logging.js (duplicate of .ts), agents/autonomous-agent.ts (hardcoded return). Grep for imports, fix or delete."`
Cost Class: FREE

---

### [WINDOW 13] GEMINI — gemini-2.5-flash

Task ID: W13-STUBS-MINIMAL
Objective: Implement minimal utility stubs that should be real modules
Target Files: 6 files
Why this lane: Small utility implementations. Gemini Flash for speed.
Power Tier: BALANCED
Command:

```bash
gemini -y -p \
  "Implement these minimal stub files into real working modules in Ultra-Dex:

   1) src/core/multimodal/multimodal-service.ts (6 lines, empty class)
      - Implement: processImage(input), processAudio(input), processDocument(input)
      - Each returns processed data or throws 'not implemented' with clear message
      - Must be a real service class, not empty

   2) src/core/tenant/tenant-service.ts (7 lines, stub factory)
      - Implement: createTenant(name, config), getTenant(id), listTenants(), deleteTenant(id)
      - In-memory Map storage for now
      - Real TypeScript types

   3) src/core/marketplace/plugin-marketplace.ts (10 lines, stub)
      - Implement: listPlugins(), getPlugin(id), installPlugin(id), uninstallPlugin(id)
      - In-memory registry
      - Plugin interface with name, version, description, author

   4) src/core/utils/token-budget.ts (12 lines, minimal)
      - Implement: calculateBudget(model, maxTokens), splitBudget(total, parts), estimateTokens(text)
      - Real token estimation (4 chars ≈ 1 token heuristic)

   5) src/core/utils/smart-errors.ts (13 lines, minimal)
      - Implement: SmartError class extending Error with code, context, suggestion
      - formatError(error): User-friendly error message
      - isRetryable(error): Boolean check for retryable errors

   6) src/core/utils/config.ts (14 lines, minimal)
      - Implement: getConfig(key, defaultValue), setConfig(key, value), loadEnv()
      - Read from process.env with type coercion

   All must pass: npm run typecheck && npm run lint"
```

Expected Output: 6 stub files upgraded to real implementations
Validation: `npx tsc --noEmit 2>&1 | tail -3 && npm run lint 2>&1 | tail -3`
Fallback #1: `gemini -p "Implement real code for these 6 stub files: multimodal-service.ts, tenant-service.ts, plugin-marketplace.ts, token-budget.ts, smart-errors.ts, config.ts"`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Implement 6 minimal stubs into real modules: multimodal-service, tenant-service, plugin-marketplace, token-budget, smart-errors, config"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Implement 6 stub files: src/core/multimodal/multimodal-service.ts (processImage/Audio/Document), src/core/tenant/tenant-service.ts (CRUD with Map), src/core/marketplace/plugin-marketplace.ts (registry), src/core/utils/token-budget.ts (estimation), src/core/utils/smart-errors.ts (SmartError class), src/core/utils/config.ts (env reader)."`
Cost Class: FREE

---

### [WINDOW 14] QWEN — qwen-plus

Task ID: W14-STUBS-REEXPORTS
Objective: Clean up re-export files — ensure they point to real modules
Target Files: 6 files
Why this lane: Mechanical validation. Qwen for cheap throughput.
Power Tier: LOW
Command:

```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Validate and fix these re-export stub files in Ultra-Dex:

   1) src/core/services/index.ts (6 lines) — ensure exports point to real files
   2) src/core/mcp/index.ts (8 lines) — ensure MCP exports are valid
   3) src/core/agents/index.ts (10 lines) — ensure agent exports are valid
   4) src/core/memory/index.ts (13 lines) — ensure memory exports are valid
   5) src/core/auth/clerk-client.ts (7 lines) — ensure Clerk init is real
   6) src/core/interfaces/ITelemetryService.ts (9 lines) — interface only, validate it's correct
   7) src/core/interfaces/IExecutionEngine.ts (13 lines) — interface only, validate it's correct
   8) src/core/templates/contentstudio/lib/prisma.ts (10 lines) — stub, implement or remove
   9) src/core/templates/contentstudio/lib/slugify.ts (12 lines) — minimal util, verify working

   For each:
   - If re-export: verify target exists
   - If interface: verify it's properly typed
   - If stub: implement minimally or remove
   - If broken: fix

   npm run typecheck → 0 errors after all changes"
```

Expected Output: All re-export stubs validated and fixed
Validation: `npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `qwen --auth-type qwen-oauth "Validate re-exports in src/core/ index files point to real modules"`
Fallback #2: `gemini -y -p "Validate and fix all index.ts re-export files in src/core/services, src/core/mcp, src/core/agents, src/core/memory"`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Validate 9 stub/re-export files in src/core/. Ensure re-exports point to real files, interfaces are correct, stubs are implemented. Fix broken ones. Run typecheck."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════

## PHASE 10 — FAKE FEATURE REMOVAL (Pre-v2.0 Phase 9)

## ═══════════════════════════════════════════════

### [WINDOW 15] CODEX — o1

Task ID: W15-FAKE-FEATURES
Objective: Audit and remove fake features — --stream, --cache, SEARCH_CODE that don't actually work
Target Files: apps/cli/lib/commands/run.js, apps/cli/bin/ultra-dex.js
Why this lane: Deep audit of 1632-line run.js requires strong reasoning. Codex o1 for analysis.
Power Tier: HIGH
Command:

```bash
codex --full-auto -m o1 exec \
  "Audit Ultra-Dex CLI for FAKE FEATURES that are advertised but don't work:

   Target: apps/cli/lib/commands/run.js (1632 LOC) and apps/cli/bin/ultra-dex.js

   Check each CLI flag:
   1) --stream: Does it actually stream output? Or just sets a boolean that's never used?
   2) --cache: Does caching actually work? Or is it a no-op flag?
   3) SEARCH_CODE: Is there a search command that works? Or just registered but empty?
   4) --parallel: Does parallel execution work? Or just a flag?
   5) --verbose: Does it change output? Or ignored?

   For each fake feature:
   A) If the flag exists but does nothing → REMOVE IT from Commander options
   B) If the flag partially works → Add a console.warn('Feature not yet implemented')
   C) If the flag works → Leave it alone

   Document every change with clear comments.

   Validate:
   - node apps/cli/bin/ultra-dex.js --help → shows only REAL features
   - npm run typecheck → 0 errors
   - npm run lint → 0 errors"
```

Expected Output: Fake features removed or marked, only real features in --help
Validation: `node apps/cli/bin/ultra-dex.js --help 2>&1`
Fallback #1: `codex --full-auto -m gpt-4 exec "Audit run.js for fake flags, remove non-functional ones"`
Fallback #2: `claude --model sonnet --effort high -p "Audit apps/cli/lib/commands/run.js for fake features (--stream, --cache, SEARCH_CODE). Remove flags that don't work."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Audit apps/cli/lib/commands/run.js (1632 LOC) for fake features. Check --stream, --cache, --parallel, SEARCH_CODE. Remove flags that set booleans never used. Keep working features."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## ═══════════════════════════════════════════════

## PHASE 11 — LOGGING MIGRATION (Pre-v2.0 Phase 8)

## ═══════════════════════════════════════════════

### [WINDOW 16] GEMINI — gemini-2.5-flash

Task ID: W16-LOGGING
Objective: Complete logging migration — ensure Better Stack logger used in all target files
Target Files: apps/cli/lib/commands/run.js, apps/cli/lib/providers/index.js, src/core/server/production-server.ts, src/core/orchestration/index.js
Why this lane: Mechanical search-and-replace with verification. Gemini Flash for speed.
Power Tier: BALANCED
Command:

```bash
gemini -y -p \
  "Complete the Better Stack logging migration in Ultra-Dex.

   Better Stack logger exists at: src/core/monitoring/better-stack-logger.ts
   It exports: logger, logUserSignup, logUserLogin, logAIRequest, logBillingUpgrade

   Check these 4 files and ensure they use Better Stack logger instead of console.log:
   1) apps/cli/lib/commands/run.js — log AI requests, errors, execution traces
   2) apps/cli/lib/providers/index.js — log provider selection, fallbacks
   3) src/core/server/production-server.ts — should already have it (verify)
   4) src/core/orchestration/index.js — log orchestration events

   For each file:
   - Replace console.log/console.error with appropriate logger calls
   - Import logger from better-stack-logger.ts
   - Keep console.log ONLY for CLI user-facing output (not internal logging)

   Validate:
   - grep -r 'console.log' in target files → minimal (only user-facing)
   - npm run typecheck → 0 errors"
```

Expected Output: All 4 files using Better Stack logger
Validation: `grep -c "console.log" apps/cli/lib/commands/run.js apps/cli/lib/providers/index.js src/core/orchestration/index.js`
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Replace console.log with Better Stack logger in run.js and providers/index.js"`
Fallback #2: `gemini -p "Migrate logging in run.js and providers/index.js to use better-stack-logger.ts"`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Import logger from src/core/monitoring/better-stack-logger.ts into apps/cli/lib/commands/run.js and apps/cli/lib/providers/index.js. Replace internal console.log calls with logger.info/error."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════

## PHASE 12 — DASHBOARD PAGES (3 missing pages)

## ═══════════════════════════════════════════════

### [WINDOW 17] CLAUDE — claude-sonnet-4

Task ID: W17-BILLING-PAGE
Objective: Create Billing dashboard page
Target Files: apps/dashboard/src/pages/Billing.tsx (NEW)
Why this lane: React page with Stripe integration needs precision. Sonnet for quality.
Power Tier: BALANCED
Command:

```bash
claude --model sonnet --effort high -p \
  "Create apps/dashboard/src/pages/Billing.tsx for Ultra-Dex dashboard.

   Look at existing pages for patterns:
   - apps/dashboard/src/pages/Analytics.tsx (338 LOC) — reference for layout
   - src/core/billing/pricing-tiers.ts — tier definitions

   Implement:
   1) Current plan display (Free/Pro/Enterprise)
   2) Usage stats: API calls used / limit, storage used
   3) Upgrade/downgrade buttons
   4) Billing history table (date, amount, status, invoice link)
   5) Payment method section (last 4 digits, expiry)
   6) Cancel subscription button with confirmation

   Use React functional component with hooks.
   Use existing dashboard styling patterns (check other pages).
   TypeScript strict mode.

   Validate:
   - npm run typecheck → 0 errors
   - npm run lint → 0 errors"
```

Expected Output: Billing.tsx page component
Validation: `test -f apps/dashboard/src/pages/Billing.tsx && npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `gemini -y -p "Create apps/dashboard/src/pages/Billing.tsx — React page showing current plan, usage, billing history, payment method. Match existing page patterns."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Create Billing.tsx dashboard page at apps/dashboard/src/pages/"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create apps/dashboard/src/pages/Billing.tsx. React functional component. Show: current plan (Free/Pro/Enterprise), usage stats, upgrade buttons, billing history table, payment method, cancel button. Match patterns from Analytics.tsx."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 18] GEMINI — gemini-2.5-pro

Task ID: W18-LANDING-PAGE
Objective: Create Landing page for public-facing dashboard
Target Files: apps/dashboard/src/pages/Landing.tsx (NEW)
Why this lane: Marketing/UI page, Gemini Pro for creative output.
Power Tier: BALANCED
Command:

```bash
gemini -y -p \
  "Create apps/dashboard/src/pages/Landing.tsx for Ultra-Dex dashboard.

   This is the PUBLIC landing page visitors see before logging in.

   Sections:
   1) Hero: 'Ultra-Dex — AI Orchestration Meta-Layer'
      - Tagline: Route tasks across 17 AI providers, coordinate multi-agent swarms
      - CTA: 'Get Started Free' and 'View Documentation'
   2) Features grid (3 columns):
      - Multi-Provider Routing: 17 AI providers, automatic fallback
      - Agent Orchestration: Multi-agent swarms with persistent memory
      - Enterprise Ready: RBAC, billing, monitoring, analytics
   3) Pricing cards: Free ($0), Pro ($29/mo), Enterprise ($99/mo)
      - Feature comparison
   4) Footer: GitHub link, docs link, API status

   React functional component, TypeScript.
   Match existing dashboard styling.

   Validate:
   - npm run typecheck → 0 errors"
```

Expected Output: Landing.tsx with hero, features, pricing
Validation: `test -f apps/dashboard/src/pages/Landing.tsx && npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `gemini -p "Create Landing.tsx at apps/dashboard/src/pages/ with hero section, feature grid, pricing cards"`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Create public landing page at apps/dashboard/src/pages/Landing.tsx"`
Fallback #3: `opencode run -m opencode/nemotron-3-super-free -p "Create apps/dashboard/src/pages/Landing.tsx. React component. Hero (AI Orchestration Meta-Layer), features grid (3 cols), pricing cards (Free/Pro/Enterprise), footer. TypeScript."`
Cost Class: FREE

---

### [WINDOW 19] GEMINI — gemini-2.5-flash

Task ID: W19-ONBOARDING
Objective: Create Onboarding wizard page
Target Files: apps/dashboard/src/pages/Onboarding.tsx (NEW)
Why this lane: Step wizard UI. Gemini Flash for rapid generation.
Power Tier: BALANCED
Command:

```bash
gemini -y -p \
  "Create apps/dashboard/src/pages/Onboarding.tsx for Ultra-Dex dashboard.

   Multi-step onboarding wizard for new users:
   Step 1: Welcome — name, organization
   Step 2: Choose Plan — Free/Pro/Enterprise selection
   Step 3: Configure Provider — select default AI provider, enter API key
   Step 4: First Agent — run a test agent to verify setup
   Step 5: Complete — success message, link to dashboard

   Implementation:
   - useState for current step (1-5)
   - Progress bar showing step N of 5
   - Back/Next buttons
   - Step 4 runs MOCK_AI=true test if no real key
   - Form validation on each step

   React functional component, TypeScript.
   Match existing dashboard styling.

   Validate:
   - npm run typecheck → 0 errors"
```

Expected Output: Onboarding.tsx with 5-step wizard
Validation: `test -f apps/dashboard/src/pages/Onboarding.tsx && npx tsc --noEmit 2>&1 | tail -3`
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Create onboarding wizard at apps/dashboard/src/pages/Onboarding.tsx with 5 steps"`
Fallback #2: `gemini -p "Create apps/dashboard/src/pages/Onboarding.tsx — 5-step wizard: welcome, plan, provider, test, complete"`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Create apps/dashboard/src/pages/Onboarding.tsx. 5-step wizard with useState for currentStep. Steps: Welcome, Choose Plan, Configure Provider, First Agent test, Complete. Progress bar, back/next buttons."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════

## PHASE 13 — CLI LOGIN + DOCS + SCRIPTS

## ═══════════════════════════════════════════════

### [WINDOW 20] CLAUDE — claude-sonnet-4

Task ID: W20-CLI-LOGIN
Objective: Create CLI login command for authentication
Target Files: apps/cli/lib/commands/login.ts (NEW), apps/cli/bin/ultra-dex.js
Why this lane: Auth flow in CLI requires security awareness. Sonnet for precision.
Power Tier: BALANCED
Command:

```bash
claude --model sonnet --effort high -p \
  "Create apps/cli/lib/commands/login.ts for Ultra-Dex CLI.

   Implementation:
   1) 'ultra-dex login' command:
      - Opens browser to Clerk login page
      - Receives auth token via callback
      - Stores token in ~/.ultra-dex/credentials.json
      - Displays: 'Logged in as <email>'

   2) 'ultra-dex logout' command:
      - Clears stored credentials
      - Displays: 'Logged out'

   3) 'ultra-dex whoami' command:
      - Reads stored token
      - Validates with Clerk API
      - Displays: user email, role, plan

   4) Register in apps/cli/bin/ultra-dex.js as new commands

   Use Commander.js pattern matching other commands.

   Validate:
   - node apps/cli/bin/ultra-dex.js login --help
   - npm run typecheck → 0 errors
   - npm run lint → 0 errors"
```

Expected Output: login.ts with login/logout/whoami commands
Validation: `test -f apps/cli/lib/commands/login.ts && node apps/cli/bin/ultra-dex.js --help 2>&1 | grep -E "(login|logout|whoami)"`
Fallback #1: `gemini -y -p "Create apps/cli/lib/commands/login.ts — CLI login/logout/whoami using Clerk auth. Commander.js pattern."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Create CLI login command at apps/cli/lib/commands/login.ts"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create apps/cli/lib/commands/login.ts. Commands: login (opens browser, stores token), logout (clears token), whoami (shows user info). Use Commander.js. Store credentials in ~/.ultra-dex/credentials.json."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 21] GEMINI — gemini-2.5-flash

Task ID: W21-BILLING-DOCS
Objective: Create billing documentation
Target Files: docs/BILLING.md (NEW)
Why this lane: Documentation generation. Gemini Flash for speed.
Power Tier: LOW
Command:

```bash
gemini -p \
  "Create docs/BILLING.md for Ultra-Dex. Read the source files first:
   - src/core/billing/billing-service.ts
   - src/core/billing/billing-manager.ts
   - src/core/billing/pricing-tiers.ts

   Document:
   1) Pricing Tiers:
      - Free: $0/month, 100 AI requests/day, basic features
      - Pro: $29/month, 10000 AI requests/day, priority support
      - Enterprise: $99/month, unlimited, dedicated support, SSO

   2) Stripe Integration:
      - How subscriptions work
      - Webhook events handled
      - Environment variables needed

   3) API Endpoints:
      - GET /api/billing/pricing — list plans
      - POST /api/billing/subscribe — create subscription
      - GET /api/billing/usage — current usage
      - POST /api/billing/webhook — Stripe webhooks

   4) Setup Guide:
      - Create Stripe account
      - Create products/prices
      - Configure webhook URL
      - Set environment variables

   5) Testing:
      - Stripe test mode
      - Test card numbers
      - Webhook testing with Stripe CLI"
```

Expected Output: BILLING.md comprehensive documentation
Validation: `test -f docs/BILLING.md && wc -l docs/BILLING.md`
Fallback #1: `qwen --auth-type qwen-oauth "Create docs/BILLING.md with Stripe integration documentation"`
Fallback #2: `gemini -p "Create BILLING.md documenting pricing tiers (Free/Pro/Enterprise) and Stripe setup"`
Fallback #3: `opencode run -m opencode/nemotron-3-super-free -p "Create docs/BILLING.md. Document pricing tiers (Free $0, Pro $29, Enterprise $99), Stripe integration, API endpoints, setup guide, testing instructions."`
Cost Class: FREE

---

### [WINDOW 22] QWEN — qwen-turbo

Task ID: W22-STRIPE-SCRIPT
Objective: Create Stripe product setup script
Target Files: scripts/setup-stripe.sh (NEW)
Why this lane: Shell script generation. Qwen Turbo for cheap fast execution.
Power Tier: LOW
Command:

```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Create scripts/setup-stripe.sh for Ultra-Dex.

   Bash script that uses Stripe CLI to create products and prices:

   1) Check stripe CLI is installed
   2) Create products:
      - Ultra-Dex Free (free tier)
      - Ultra-Dex Pro ($29/month)
      - Ultra-Dex Enterprise ($99/month)
   3) Create prices for each product
   4) Output the price IDs for .env configuration
   5) Create webhook endpoint pointing to deployment URL

   Include: error handling, colored output, confirmation prompts.
   Make executable: chmod +x scripts/setup-stripe.sh

   Use: stripe products create, stripe prices create, stripe webhook_endpoints create"
```

Expected Output: setup-stripe.sh script
Validation: `test -x scripts/setup-stripe.sh && head -5 scripts/setup-stripe.sh`
Fallback #1: `qwen --auth-type qwen-oauth "Create Stripe setup script at scripts/setup-stripe.sh"`
Fallback #2: `gemini -p "Create scripts/setup-stripe.sh — Stripe CLI script to create products and prices"`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Create scripts/setup-stripe.sh. Bash script using Stripe CLI to create products (Free, Pro $29, Enterprise $99), prices, webhook endpoint. Colored output, error handling, chmod +x."`
Cost Class: FREE

---

### [WINDOW 23] QWEN — qwen-turbo

Task ID: W23-FUNDING
Objective: Create GitHub FUNDING.yml for sponsorship
Target Files: .github/FUNDING.yml (NEW)
Why this lane: Trivial file creation. Qwen Turbo cheapest option.
Power Tier: LOW
Command:

```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Create .github/FUNDING.yml for Ultra-Dex repository.

   mkdir -p .github

   Content:
   github: [srujan-karna]
   custom: ['https://ultra-dex.onrender.com/billing']

   That's it. Simple YAML file."
```

Expected Output: .github/FUNDING.yml
Validation: `test -f .github/FUNDING.yml && cat .github/FUNDING.yml`
Fallback #1: `gemini -p "Create .github/FUNDING.yml with github sponsorship link"`
Fallback #2: `qwen --auth-type qwen-oauth "Create .github/FUNDING.yml"`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Create .github/FUNDING.yml with github: [srujan-karna]"`
Cost Class: FREE

---

## ═══════════════════════════════════════════════

## PHASE 14 — EXECUTION TRACE (Pre-v2.0 Phase 10)

## ═══════════════════════════════════════════════

### [WINDOW 24] CODEX — o1

Task ID: W24-EXEC-TRACE
Objective: Verify execution trace completeness — run_id, steps[], timestamps, output
Target Files: apps/cli/lib/commands/run.js
Why this lane: Execution trace verification requires deep code reading. Codex o1 for reasoning.
Power Tier: HIGH
Command:

```bash
codex --full-auto -m o1 exec \
  "Verify Ultra-Dex execution trace in apps/cli/lib/commands/run.js (1632 LOC).

   The execution trace must include:
   1) run_id: UUID for each execution
   2) steps[]: Array of step objects with:
      - stepIndex, action, input, output, provider, model
      - startTime, endTime, duration
      - tokensUsed, cost (if available)
   3) Final trace output: JSON with all steps

   Check:
   - Is run_id generated? Where?
   - Is steps[] populated during the bounded loop?
   - Is timing recorded (start/end per step)?
   - Is the trace printed/returned at completion?
   - Is it stored in memory (ppmManager)?

   If any of these are MISSING, implement them.
   If all present, document what's working in a comment block at top of file.

   Validate:
   MOCK_AI=true node apps/cli/bin/ultra-dex.js run planner -t 'hello' 2>&1 | grep run_id"
```

Expected Output: Execution trace verified complete or gaps filled
Validation: `MOCK_AI=true node apps/cli/bin/ultra-dex.js run planner -t "hello" 2>&1 | grep -E "(run_id|trace|steps)"`
Fallback #1: `codex --full-auto -m gpt-4 exec "Verify execution trace completeness in run.js"`
Fallback #2: `claude --model sonnet --effort high -p "Audit apps/cli/lib/commands/run.js execution trace — verify run_id, steps[], timing, output are all captured"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Verify execution trace in apps/cli/lib/commands/run.js. Check for run_id UUID, steps[] array with timing, final trace output. Implement any missing pieces."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## ═══════════════════════════════════════════════

## PHASE 15 — FULL TEST SUITE GREEN

## ═══════════════════════════════════════════════

### [WINDOW 25] CLAUDE — claude-opus-4

Task ID: W25-TEST-FIX
Objective: Fix ALL remaining test failures — target: 0 failures across unit + integration + CLI
Target Files: tests/core/_.test.js, tests/integration/_.test.js, tests/cli/\*.test.js
Why this lane: Test debugging across full suite requires deepest reasoning. Opus for hardest debugging.
Power Tier: HIGH
Command:

```bash
claude --model opus --effort max -p \
  "Fix ALL failing tests in Ultra-Dex. Target: 0 failures.

   After esbuild rebuild (Phase 0), most tests should pass.
   Run the full suite and fix remaining failures:

   1) npm run test:unit 2>&1 | tee /tmp/unit-results.txt
      - Fix any remaining failures
      - Do NOT skip tests — fix the code or the test

   2) npm run test:integration 2>&1 | tee /tmp/integration-results.txt
      - Fix any failures
      - May need to update tests for new modules (middleware, usage-meter, etc.)

   3) npm run test:cli 2>&1 | tee /tmp/cli-results.txt
      - The 1 REAL failure (not esbuild) — find and fix it
      - CLI tests must work with the fixed --help and login commands

   For each failure:
   - Read the error message
   - Identify root cause (code bug vs test bug vs missing module)
   - Fix the root cause
   - Re-run to verify

   Final validation:
   npm test 2>&1 | tail -20
   Expected: ALL tests passing, 0 failures"
```

Expected Output: All tests passing
Validation: `npm test 2>&1 | grep -E "(pass|fail)" | tail -5`
Fallback #1: `claude --model sonnet --effort high -p "Run npm test, fix all failures until 0 remain"`
Fallback #2: `codex --full-auto -m o1 exec "Run npm test. Fix every failing test. Target: 0 failures."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Run npm test. Fix all failing tests. Do not skip tests. Fix root causes. Target: 0 test failures across unit, integration, CLI suites."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 26] GEMINI — gemini-2.5-pro

Task ID: W26-NEW-TESTS
Objective: Write tests for all new modules created in this cycle
Target Files: tests/core/middleware.test.js, tests/core/usage-meter.test.js, tests/core/monitoring.test.js (ALL NEW)
Why this lane: TDD test generation for new modules. Gemini Pro for thorough coverage.
Power Tier: BALANCED
Command:

```bash
gemini -y -p \
  "Write tests for the new modules created in Ultra-Dex Cycle 6.

   Use Node.js built-in test runner (node --test), NOT Jest/Vitest.
   Pattern: import { describe, it } from 'node:test'; import assert from 'node:assert';

   Create tests for:

   1) tests/core/middleware.test.js
      - Test requireAuth passes when no CLERK_SECRET_KEY (dev mode)
      - Test requireAuth rejects invalid token (production mode)
      - Test requireAdmin allows admin role
      - Test requireAdmin rejects non-admin
      - Test enforceUsageLimit allows within limits
      - Test enforceUsageLimit blocks over limit

   2) tests/core/usage-meter.test.js
      - Test trackUsage records usage
      - Test getUsage returns correct count
      - Test checkLimit returns true within limit
      - Test checkLimit returns false over limit
      - Test resetDailyCounters clears counts

   3) tests/core/monitoring.test.js
      - Test recordRequest tracks HTTP request
      - Test recordAICall tracks AI call
      - Test getPrometheusFormat returns valid format
      - Test getHealthStatus returns status object

   4) tests/core/posthog-client.test.js
      - Test graceful degradation when no API key
      - Test trackEvent calls PostHog

   5) tests/core/sentry-client.test.js
      - Test graceful degradation when no DSN
      - Test captureException logs error

   Run: npm run test:unit → all new tests pass"
```

Expected Output: 5 new test files with comprehensive coverage
Validation: `npm run test:unit 2>&1 | grep -E "(pass|fail)" | tail -5`
Fallback #1: `gemini -p "Write Node.js built-in test runner tests for middleware.ts, usage-meter.ts, monitoring.ts"`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Write tests for new modules: middleware, usage-meter, monitoring, posthog-client, sentry-client"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Write tests using Node.js built-in test runner for: src/core/auth/middleware.ts, src/core/billing/usage-meter.ts, src/core/system/monitoring.ts, src/core/analytics/posthog-client.ts, src/core/analytics/sentry-client.ts. Put in tests/core/."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════

## PHASE 16 — REAL PROVIDER TEST (Pre-v2.0 Phase 5/18)

## ═══════════════════════════════════════════════

### [WINDOW 27] OWNER — Manual + Agent

Task ID: W27-NVIDIA-TEST
Objective: Test real NVIDIA provider execution — prove the full pipeline works with real API
Target Files: apps/cli/lib/providers/nvidia.js
Why this lane: Requires real NVIDIA_API_KEY. Owner must set env var, agent runs test.
Power Tier: HIGH
Command:

```bash
# Owner sets key first:
export NVIDIA_API_KEY=nvapi-xxx

# Then agent tests:
claude --model sonnet --effort high -p \
  "Test Ultra-Dex with REAL NVIDIA provider:

   1) Verify NVIDIA_API_KEY is set
   2) Run: node apps/cli/bin/ultra-dex.js run planner -t 'hello' --provider nvidia
   3) Expected: Real model output from NVIDIA API (Nemotron)
   4) Capture the FULL output

   If it fails:
   - Check providers/nvidia.js wraps OpenAI correctly
   - Check base URL: https://integrate.api.nvidia.com/v1
   - Check model name matches NVIDIA catalog
   - Debug and fix

   Success criteria (from pre-v2.0 protocol):
   npx ultra-dex run planner -t 'hello' --provider nvidia → returns real model output

   Also test with other providers if keys available:
   - OPENAI_API_KEY → test openai provider
   - ANTHROPIC_API_KEY → test claude provider"
```

Expected Output: Real NVIDIA API response captured
Validation: `node apps/cli/bin/ultra-dex.js run planner -t "hello" --provider nvidia 2>&1 | head -20`
Fallback #1: `codex --full-auto -m o1 exec "Test NVIDIA provider: node apps/cli/bin/ultra-dex.js run planner -t hello --provider nvidia. Debug any failures."`
Fallback #2: `gemini -y -p "Test Ultra-Dex NVIDIA provider execution and debug any failures"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Test node apps/cli/bin/ultra-dex.js run planner -t hello --provider nvidia. Debug failures. Check nvidia.js provider wraps OpenAI with base URL https://integrate.api.nvidia.com/v1."`
Cost Class: API-KEY-USAGE

---

## ═══════════════════════════════════════════════

## PHASE 17 — DASHBOARD BUILD FIX

## ═══════════════════════════════════════════════

### [WINDOW 28] GEMINI — gemini-2.5-flash

Task ID: W28-DASHBOARD-BUILD
Objective: Fix dashboard build — rolldown native binding mismatch
Target Files: apps/dashboard/vite.config.ts, apps/dashboard/package.json
Why this lane: Build config fix. Gemini Flash for quick resolution.
Power Tier: BALANCED
Command:

```bash
gemini -y -p \
  "Fix Ultra-Dex dashboard build failure.

   Error: rolldown native binding MODULE_NOT_FOUND
   Same root cause as esbuild: darwin-arm64 binary on linux-arm64 runtime.

   After 'npm rebuild' in Phase 0, this SHOULD be fixed. Verify:

   1) cd apps/dashboard && npm run build
   2) If still failing:
      - Check vite.config.ts for platform-specific settings
      - Run: npm rebuild in apps/dashboard/
      - Check if rolldown version needs update
      - Consider pinning vite version if rolldown issue persists

   3) Verify all 3 new pages are included in build:
      - Billing.tsx, Landing.tsx, Onboarding.tsx
      - Check router config includes new routes

   Validate:
   - npm run build:dashboard → exits 0
   - Build output includes all pages"
```

Expected Output: Dashboard builds successfully
Validation: `cd apps/dashboard && npm run build 2>&1 | tail -5`
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Fix dashboard build: npm rebuild in apps/dashboard/, verify vite config"`
Fallback #2: `gemini -p "Debug dashboard build failure — rolldown native binding issue"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Fix apps/dashboard build failure. Run npm rebuild. Check vite.config.ts. Verify Billing.tsx, Landing.tsx, Onboarding.tsx included in router."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════

## PHASE 18 — FULL BUILD VERIFICATION

## ═══════════════════════════════════════════════

### [WINDOW 29] CODEX — o1

Task ID: W29-FULL-BUILD
Objective: Verify COMPLETE build pipeline — core + CLI + dashboard all build clean
Target Files: All build targets
Why this lane: Full system verification. Codex o1 for comprehensive analysis.
Power Tier: HIGH
Command:

```bash
codex --full-auto -m o1 exec \
  "Run COMPLETE build verification for Ultra-Dex:

   1) npm run typecheck
      → Expected: 0 errors

   2) npm run lint
      → Expected: 0 errors, 0 warnings

   3) npm run build:core
      → Expected: exits 0

   4) npm run build:cli
      → Expected: dist/ultra-dex.js created

   5) npm run build:dashboard
      → Expected: exits 0

   6) npm run build
      → Expected: all three build targets succeed

   7) npm test
      → Expected: 0 failures

   8) npm audit
      → Expected: 0 high/critical vulnerabilities

   For each failure: FIX IT. Do not just report.
   Iterate until ALL 8 checks pass.

   Generate a verification report with pass/fail for each."
```

Expected Output: All 8 checks passing
Validation: `npm run typecheck && npm run lint && npm run build && npm test 2>&1 | tail -10`
Fallback #1: `claude --model opus --effort max -p "Run full build verification: typecheck, lint, build, test. Fix all failures."`
Fallback #2: `claude --model sonnet --effort high -p "Run npm run typecheck && npm run lint && npm run build && npm test. Fix any failures."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Run full Ultra-Dex build verification: typecheck, lint, build:core, build:cli, build:dashboard, test. Fix all failures. Target: 0 errors across all."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## ═══════════════════════════════════════════════

## PHASE 19 — ARCHITECTURE ENFORCEMENT SCAN

## ═══════════════════════════════════════════════

### [WINDOW 30] CLAUDE — claude-opus-4

Task ID: W30-ARCH-SCAN
Objective: Final architecture enforcement — no core→CLI imports, no stubs, no fakes
Target Files: src/core/**, apps/cli/**
Why this lane: Architecture audit requires deepest understanding. Opus for final review.
Power Tier: HIGH
Command:

```bash
claude --model opus --effort max -p \
  "FINAL architecture enforcement scan for Ultra-Dex.

   Check ALL of these rules:

   1) NO reverse imports:
      grep -r 'apps/cli' src/core/ → must return NOTHING
      grep -r 'apps/dashboard' src/core/ → must return NOTHING

   2) NO empty files:
      find src/core/ -name '*.ts' -empty → must return NOTHING
      find src/core/ -name '*.js' -empty → must return NOTHING

   3) NO stub files (< 5 LOC with no real logic):
      For each file in src/core/ with < 10 LOC:
      - Verify it has real logic OR is a valid re-export/interface

   4) NO hardcoded fake returns:
      grep -r 'Goal set' src/core/ → must return NOTHING
      grep -r 'TODO' src/core/ → document remaining TODOs

   5) NO duplicate files:
      Check for .js/.ts pairs in same dir (one should be removed)

   6) Import consistency:
      All imports use correct extensions for ES modules

   Fix any violations found. Document the final clean state."
```

Expected Output: Clean architecture with zero violations
Validation: `grep -r "apps/cli" src/core/ && echo "VIOLATION" || echo "CLEAN"`
Fallback #1: `claude --model sonnet --effort high -p "Scan src/core/ for architecture violations: reverse imports, empty files, stubs, fakes"`
Fallback #2: `codex --full-auto -m o1 exec "Architecture scan: no apps/ imports in src/core/, no empty files, no stubs"`
Fallback #3: `opencode run -m opencode/nemotron-3-super-free -p "Full architecture scan of src/core/. Check: no imports from apps/cli or apps/dashboard, no empty files, no stub files under 5 LOC with no logic, no hardcoded fake returns."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## ═══════════════════════════════════════════════

## PHASE 20 — VERSION BUMP + CHANGELOG + TAG

## ═══════════════════════════════════════════════

### [WINDOW 31] CLAUDE — claude-sonnet-4

Task ID: W31-VERSION
Objective: Bump version to 3.1.0, update CHANGELOG, create git tag
Target Files: package.json, CHANGELOG.md
Why this lane: Version management requires precision. Sonnet for correctness.
Power Tier: BALANCED
Command:

```bash
claude --model sonnet --effort high -p \
  "Bump Ultra-Dex to version 3.1.0 and update CHANGELOG.

   1) Update package.json: version '3.0.0' → '3.1.0'

   2) Update or create CHANGELOG.md:
      ## [3.1.0] - 2026-04-09

      ### Added
      - Auth middleware (requireAuth, requireAdmin, enforceUsageLimit)
      - Usage metering service with tier-based limits
      - Webhook handler for Stripe events (extracted from production-server)
      - PostHog analytics client with graceful degradation
      - Sentry error tracking with graceful degradation
      - Monitoring service with Prometheus-compatible /metrics endpoint
      - Dashboard: Billing page, Landing page, Onboarding wizard
      - CLI: login/logout/whoami commands
      - Billing documentation (docs/BILLING.md)
      - Stripe product setup script
      - GitHub FUNDING.yml

      ### Fixed
      - esbuild platform mismatch (55 test failures resolved)
      - CLI --help crash (registry.js import)
      - RBAC blocking local execution (default role fix)
      - Architecture violation (core→CLI import removed)
      - Dashboard build failure (rolldown native binding)
      - 24 stub files implemented or removed
      - Fake features (--stream, --cache) removed or marked

      ### Changed
      - Better Stack logging migration completed
      - Execution trace verified and hardened
      - All tests passing (unit + integration + CLI)

   3) git add -A && git commit -m 'feat: release v3.1.0 — complete pre-v2.0'
   4) git tag v3.1.0

   DO NOT push yet. Owner will push after review."
```

Expected Output: Version 3.1.0 in package.json, CHANGELOG updated, tag created
Validation: `grep '"version"' package.json && git tag -l 'v3.1.0'`
Fallback #1: `gemini -y -p "Bump Ultra-Dex package.json to 3.1.0, update CHANGELOG.md with all Cycle 6 changes"`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Bump version to 3.1.0 in package.json, create CHANGELOG entry, git tag v3.1.0"`
Fallback #3: `opencode run -m opencode/gpt-5-nano -p "Update package.json version to 3.1.0. Create CHANGELOG.md entry for v3.1.0 with all new features, fixes, changes. Git commit and tag v3.1.0."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## ═══════════════════════════════════════════════

## PHASE 21 — FINAL VALIDATION (Pre-v2.0 Phase 19)

## ═══════════════════════════════════════════════

### [WINDOW 32] CODEX — o3

Task ID: W32-FINAL-VALIDATE
Objective: ULTIMATE final validation — every single completion criteria checked
Target Files: ALL
Why this lane: Final gate requires strongest reasoning. Codex o3 for ultimate verification.
Power Tier: HIGH
Command:

```bash
codex --full-auto -m o3 exec \
  "FINAL VALIDATION for Ultra-Dex v3.1.0 release.

   Check EVERY completion criteria:

   BUILD:
   [ ] npm run typecheck → 0 errors
   [ ] npm run lint → 0 errors, 0 warnings
   [ ] npm run build → exits 0 (core + cli + dashboard)
   [ ] npm test → 0 failures (unit + integration + CLI)
   [ ] npm audit → 0 high/critical

   FILES EXIST:
   [ ] src/core/auth/middleware.ts
   [ ] src/core/billing/usage-meter.ts
   [ ] src/core/billing/webhook-handler.ts
   [ ] src/core/analytics/posthog-client.ts
   [ ] src/core/analytics/sentry-client.ts
   [ ] src/core/system/monitoring.ts
   [ ] apps/dashboard/src/pages/Billing.tsx
   [ ] apps/dashboard/src/pages/Landing.tsx
   [ ] apps/dashboard/src/pages/Onboarding.tsx
   [ ] apps/cli/lib/commands/login.ts
   [ ] docs/BILLING.md
   [ ] scripts/setup-stripe.sh (executable)
   [ ] .github/FUNDING.yml

   EXECUTION:
   [ ] node apps/cli/bin/ultra-dex.js --help → works
   [ ] MOCK_AI=true node apps/cli/bin/ultra-dex.js run planner -t 'hello' → works
   [ ] grep -r 'apps/cli' src/core/ → returns nothing
   [ ] No empty files in src/core/
   [ ] No stub files (< 5 LOC with no logic) in src/core/
   [ ] Version 3.1.0 in package.json
   [ ] CHANGELOG.md includes v3.1.0
   [ ] git tag v3.1.0 exists

   For EACH check: run the command, record pass/fail.
   Generate a FINAL REPORT with all results.

   If ANY check fails: FIX IT and re-check."
```

Expected Output: All checks passing, final report generated
Validation: Every single criteria checked and passed
Fallback #1: `codex --full-auto -m o1 exec "Run all completion criteria checks for Ultra-Dex v3.1.0"`
Fallback #2: `claude --model opus --effort max -p "Run complete validation of Ultra-Dex v3.1.0. Check every file exists, every build passes, every test passes."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Final validation: run typecheck, lint, build, test. Check all 14 new files exist. Check CLI --help works. Check MOCK_AI execution. Check architecture (no core→CLI imports). Check version 3.1.0."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## ═══════════════════════════════════════════════

## PHASE 22 — V2.0+ PLANNING (Product Management)

## ═══════════════════════════════════════════════

### [WINDOW 33] CLAUDE — claude-opus-4

Task ID: W33-V2-SPEC
Objective: Write v2.0 product spec using /product-management:write-spec patterns
Target Files: docs/V2.0-SPEC.md (NEW)
Why this lane: Product spec requires deepest strategic thinking. Opus for architecture.
Power Tier: HIGH
Command:

```bash
claude --model opus --effort max -p \
  "Write the Ultra-Dex v2.0 Product Specification.

   Context: v3.1.0 (pre-v2.0) is complete. Now plan the REAL v2.0.
   Read MASTER_HANDOFF_PROMPT.md for roadmap context.

   Structure (PRD format):
   1) Problem Statement: What v2.0 solves that v3.1.0 doesn't
   2) Goals & Non-Goals
   3) Target Users: Solo devs, teams, enterprises
   4) Features by priority:
      P0: Autonomous agent execution (Ralph Loop production-ready)
      P0: Real multi-provider routing with smart fallback
      P0: Production memory system (Redis/Postgres, not in-memory)
      P1: Multi-modal support (images, audio, documents)
      P1: Agent marketplace (publish/install agents)
      P1: Team collaboration (shared workspaces)
      P2: Edge deployment (Cloudflare Workers)
      P2: AI-native IDE plugin (VS Code, JetBrains)
      P3: Self-improving agents (learning from execution history)
   5) Success Metrics: MAU, agent executions/day, provider uptime
   6) Technical Requirements
   7) Timeline: 3-month sprints
   8) Risks & Mitigations

   Save to docs/V2.0-SPEC.md"
```

Expected Output: Comprehensive v2.0 product specification
Validation: `test -f docs/V2.0-SPEC.md && wc -l docs/V2.0-SPEC.md`
Fallback #1: `claude --model sonnet --effort high -p "Write v2.0 product spec for Ultra-Dex with features, timeline, risks"`
Fallback #2: `codex --full-auto -m o1 exec "Write Ultra-Dex v2.0 PRD at docs/V2.0-SPEC.md"`
Fallback #3: `opencode run -m opencode/nemotron-3-super-free -p "Write Ultra-Dex v2.0 Product Specification. Features: autonomous agents, multi-provider routing, production memory, multi-modal, marketplace, team collab, edge deploy, IDE plugin. Save to docs/V2.0-SPEC.md."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 34] CLAUDE — claude-sonnet-4

Task ID: W34-V2-ROADMAP
Objective: Create v2.0 roadmap with sprint planning
Target Files: docs/V2.0-ROADMAP.md (NEW)
Why this lane: Roadmap needs balanced strategic thinking. Sonnet for planning.
Power Tier: BALANCED
Command:

```bash
claude --model sonnet --effort high -p \
  "Create Ultra-Dex v2.0 Roadmap at docs/V2.0-ROADMAP.md.

   Based on the v2.0 spec (docs/V2.0-SPEC.md), create:

   Sprint 1 (Month 1): Foundation
   - Replace in-memory storage with Redis/Postgres
   - Production-grade Ralph Loop (autonomous execution)
   - Real provider health monitoring and smart routing
   - Comprehensive test suite (>90% coverage)

   Sprint 2 (Month 2): Intelligence
   - Multi-modal support (images, audio via NVIDIA Cosmos)
   - Agent marketplace v1 (publish/install)
   - Execution history and learning
   - Advanced monitoring dashboard

   Sprint 3 (Month 3): Scale
   - Edge deployment (Cloudflare Workers adapter)
   - Team workspaces and collaboration
   - IDE plugins (VS Code extension)
   - Performance optimization (sub-100ms routing)

   Sprint 4 (Month 4): Enterprise
   - SSO/SAML integration
   - Audit logging and compliance
   - Custom model deployment
   - SLA guarantees

   For each sprint: goals, deliverables, dependencies, risks, team allocation.
   Include Now/Next/Later view.

   Save to docs/V2.0-ROADMAP.md"
```

Expected Output: Detailed v2.0 roadmap with sprint breakdowns
Validation: `test -f docs/V2.0-ROADMAP.md && wc -l docs/V2.0-ROADMAP.md`
Fallback #1: `gemini -y -p "Create Ultra-Dex v2.0 roadmap at docs/V2.0-ROADMAP.md with 4 monthly sprints"`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Create v2.0 roadmap at docs/V2.0-ROADMAP.md with sprint planning"`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Create docs/V2.0-ROADMAP.md. 4 sprints: Foundation (Redis/Postgres, Ralph Loop), Intelligence (multi-modal, marketplace), Scale (edge, teams, IDE), Enterprise (SSO, audit, SLA). Now/Next/Later view."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 35] GEMINI — gemini-2.5-pro

Task ID: W35-V2-COMPETITIVE
Objective: Competitive analysis for v2.0 positioning
Target Files: docs/V2.0-COMPETITIVE.md (NEW)
Why this lane: Research and analysis. Gemini Pro for comprehensive web-aware analysis.
Power Tier: BALANCED
Command:

```bash
gemini -y -p \
  "Create competitive analysis for Ultra-Dex v2.0 at docs/V2.0-COMPETITIVE.md.

   Compare Ultra-Dex against:
   1) LangChain / LangGraph — Python-first, limited multi-provider
   2) CrewAI — Multi-agent, but single provider per run
   3) AutoGen (Microsoft) — Enterprise focus, complex setup
   4) Semantic Kernel — Microsoft's orchestration layer
   5) Haystack — RAG-focused, limited agent capabilities
   6) Superagent — Agent marketplace, but closed source
   7) OpenDevin — Code-focused autonomous agent

   For each competitor:
   - Strengths / Weaknesses
   - Pricing model
   - Provider support
   - Agent capabilities
   - Memory system
   - Enterprise readiness

   Ultra-Dex differentiators:
   - 17 AI providers with smart routing (most in market)
   - Multi-agent swarms with persistent memory
   - Built-in billing, auth, monitoring (full SaaS stack)
   - CLI-first with dashboard (dev-friendly)

   Save to docs/V2.0-COMPETITIVE.md"
```

Expected Output: Competitive analysis document
Validation: `test -f docs/V2.0-COMPETITIVE.md && wc -l docs/V2.0-COMPETITIVE.md`
Fallback #1: `gemini -p "Create competitive analysis comparing Ultra-Dex to LangChain, CrewAI, AutoGen"`
Fallback #2: `qwen --auth-type qwen-oauth "Create competitive analysis for Ultra-Dex at docs/V2.0-COMPETITIVE.md"`
Fallback #3: `opencode run -m opencode/nemotron-3-super-free -p "Create docs/V2.0-COMPETITIVE.md. Compare Ultra-Dex to LangChain, CrewAI, AutoGen, Semantic Kernel, Haystack, Superagent, OpenDevin. Analyze strengths, weaknesses, pricing, provider support."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════

## EXECUTION ORDER + DEPENDENCIES

## ═══════════════════════════════════════════════

```
PHASE 0: W0 (OWNER: npm rebuild esbuild)
  ↓ BLOCKS EVERYTHING
PHASE 1-3: W1, W2, W3 (PARALLEL — CLI fix, RBAC fix, Architecture fix)
  ↓
PHASE 4: W4 (MOCK_AI execution proof — depends on W1+W2+W3)
  ↓
PHASE 5-8: W5-W10 (PARALLEL — auth middleware, usage meter, webhook, posthog, sentry, monitoring)
  ↓
PHASE 9-11: W11-W16 (PARALLEL — stub cleanup, fake removal, logging migration)
  ↓
PHASE 12-13: W17-W23 (PARALLEL — dashboard pages, CLI login, docs, scripts)
  ↓
PHASE 14: W24 (execution trace verification)
  ↓
PHASE 15: W25-W26 (test suite green + new tests)
  ↓
PHASE 16: W27 (OWNER: real NVIDIA provider test)
  ↓
PHASE 17-18: W28-W29 (dashboard build + full build verification)
  ↓
PHASE 19: W30 (architecture enforcement scan)
  ↓
PHASE 20: W31 (version bump + changelog + tag)
  ↓
PHASE 21: W32 (FINAL VALIDATION — gate check)
  ↓
PHASE 22: W33-W35 (PARALLEL — v2.0 planning docs)
```

---

## WINDOW SUMMARY

| Window | Agent          | Task                    | Phase | Cost         |
| ------ | -------------- | ----------------------- | ----- | ------------ |
| W0     | OWNER          | esbuild rebuild         | P0    | FREE         |
| W1     | Claude Sonnet  | CLI --help fix          | P1    | SUBSCRIPTION |
| W2     | Claude Sonnet  | RBAC fix                | P2    | SUBSCRIPTION |
| W3     | Claude Opus    | Architecture fix        | P3    | SUBSCRIPTION |
| W4     | Codex o1       | MOCK_AI execution proof | P4    | SUBSCRIPTION |
| W5     | Claude Sonnet  | Auth middleware         | P5    | SUBSCRIPTION |
| W6     | Claude Sonnet  | Usage meter             | P6    | SUBSCRIPTION |
| W7     | Gemini Pro     | Webhook handler         | P6    | FREE         |
| W8     | Claude Sonnet  | PostHog client          | P7    | SUBSCRIPTION |
| W9     | Gemini Pro     | Sentry client           | P7    | FREE         |
| W10    | Gemini Flash   | Monitoring service      | P8    | FREE         |
| W11    | Qwen Max       | Remove empty stubs      | P9    | FREE         |
| W12    | Qwen Max       | Fix broken stubs        | P9    | FREE         |
| W13    | Gemini Flash   | Implement minimal stubs | P9    | FREE         |
| W14    | Qwen Plus      | Validate re-exports     | P9    | FREE         |
| W15    | Codex o1       | Fake feature removal    | P10   | SUBSCRIPTION |
| W16    | Gemini Flash   | Logging migration       | P11   | FREE         |
| W17    | Claude Sonnet  | Billing page            | P12   | SUBSCRIPTION |
| W18    | Gemini Pro     | Landing page            | P12   | FREE         |
| W19    | Gemini Flash   | Onboarding page         | P12   | FREE         |
| W20    | Claude Sonnet  | CLI login command       | P13   | SUBSCRIPTION |
| W21    | Gemini Flash   | Billing docs            | P13   | FREE         |
| W22    | Qwen Turbo     | Stripe setup script     | P13   | FREE         |
| W23    | Qwen Turbo     | FUNDING.yml             | P13   | FREE         |
| W24    | Codex o1       | Execution trace         | P14   | SUBSCRIPTION |
| W25    | Claude Opus    | Fix all tests           | P15   | SUBSCRIPTION |
| W26    | Gemini Pro     | New module tests        | P15   | FREE         |
| W27    | OWNER + Claude | Real provider test      | P16   | API-KEY      |
| W28    | Gemini Flash   | Dashboard build fix     | P17   | FREE         |
| W29    | Codex o1       | Full build verification | P18   | SUBSCRIPTION |
| W30    | Claude Opus    | Architecture scan       | P19   | SUBSCRIPTION |
| W31    | Claude Sonnet  | Version bump + tag      | P20   | SUBSCRIPTION |
| W32    | Codex o3       | FINAL VALIDATION        | P21   | SUBSCRIPTION |
| W33    | Claude Opus    | v2.0 spec               | P22   | SUBSCRIPTION |
| W34    | Claude Sonnet  | v2.0 roadmap            | P22   | SUBSCRIPTION |
| W35    | Gemini Pro     | v2.0 competitive        | P22   | FREE         |

**Total: 35 windows across 22 phases**
**Cost split: 17 FREE, 16 SUBSCRIPTION-INCLUDED, 2 API-KEY-USAGE**

---

## COST SUMMARY

| Lane                  | Windows       | Cost         |
| --------------------- | ------------- | ------------ |
| Claude (Opus/Sonnet)  | 14            | SUBSCRIPTION |
| Codex (o1/o3)         | 5             | SUBSCRIPTION |
| Gemini (Pro/Flash)    | 9             | FREE         |
| Qwen (Max/Plus/Turbo) | 5             | FREE         |
| OpenCode/NVIDIA       | Fallback only | FREE         |
| OWNER                 | 2             | N/A          |

**Estimated runtime: 4-8 hours continuous execution (parallel windows)**
**Estimated cost: $0 direct (subscription tiers) + NVIDIA API key usage for W27**

---

## AFTER CYCLE 6 ETERNAL

When ALL 32 validation checks pass:

1. `git push origin main` — push v3.1.0
2. `git push origin v3.1.0` — push tag
3. Deploy to Render: `git push render main`
4. Verify: `curl https://ultra-dex.onrender.com/health`
5. Begin v2.0 development using docs/V2.0-SPEC.md + docs/V2.0-ROADMAP.md

**Ultra-Dex pre-v2.0 is COMPLETE. Ship it. Plan v2.0.**

---

_Dispatch generated 2026-04-09 | Cycle 6 ETERNAL | 35 windows | 22 phases | Pre-v2.0 FINAL_
