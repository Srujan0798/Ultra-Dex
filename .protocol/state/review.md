# Cycle 4 → Cycle 5 Review: Pre-Launch Audit

## What Cycle 4 Delivered (Tech Debt → Production Ready)

| Check | Status | Hard Number |
|-------|--------|-------------|
| TypeScript compilation | ✅ PASS | `tsc --noEmit` → 0 errors, 306 .ts files |
| Build: core | ✅ PASS | ESM modules ready |
| Build: CLI | ✅ PASS | dist/ultra-dex.js built |
| Build: dashboard | ✅ PASS | vite build fixed |
| Unit tests | ✅ PASS | 318 passing |
| Integration tests | ✅ PASS | 33 passing |
| ESLint | ✅ PASS | 0 errors (95 warnings) |
| npm audit | ✅ PASS | 0 high/critical |
| NoopSubsystems | ✅ PASS | 0 remaining |
| Dockerfile.prod | ✅ EXISTS | Multi-stage alpine, node:22 |
| docker-compose.prod.yml | ✅ EXISTS | With Redis mesh |
| config/production.json | ✅ EXISTS | Env var references |
| config/staging.json | ✅ EXISTS | Debug config |
| scripts/deployment/ | ✅ EXISTS | 4 scripts (deploy, staging, rollback, health-check) |
| docs/DEPLOYMENT.md | ✅ EXISTS | 6.8 KB |
| docs/OPERATIONS.md | ✅ EXISTS | 11.3 KB |
| Version | ✅ | 3.0.0 |

**Cycle 4 verdict: COMPLETE. All 16 completion criteria met.**

---

## What Exists But Needs Wiring (Scaffolds from Diamond State)

### Auth Module — src/core/auth/ (470 LOC)

| File | LOC | State | What Needs Doing |
|------|-----|-------|------------------|
| auth-service.ts | 80 | STUB | Uses `Map<string, User>` in-memory. Replace with Clerk SDK calls. |
| user-model.ts | 57 | OK | Interfaces defined. May need Clerk-specific fields (clerkId, publicMetadata). |
| rbac.ts | 123 | STUB | Role definitions exist. Need to read role from Clerk publicMetadata. |
| rbac-manager.ts | 99 | STUB | RBAC enforcement exists. Wire to auth middleware for route protection. |
| sso.ts | 111 | STUB | SSO scaffold. Wire to Clerk SAML for enterprise or leave as TODO. |

**Key observation:** AuthService interface is clean. Can swap internals without breaking consumers.

### Billing Module — src/core/billing/ (750 LOC)

| File | LOC | State | What Needs Doing |
|------|-----|-------|------------------|
| billing-service.ts | 135 | STUB | Has `Stripe` import with dummy key `sk_test_dummy`. Replace with real key from env. |
| billing-manager.ts | 523 | PARTIAL | Orchestration logic exists. Needs checkout session + webhook handler. |
| pricing-tiers.ts | 92 | OK | Free/Pro/Enterprise defined with limits. Need Stripe price IDs. |

**Key observation:** Stripe SDK already imported. pricing-tiers.ts already defines the tiers. Gap is: no checkout flow, no webhooks, no usage metering.

### Analytics Module — src/core/analytics/ (771 LOC)

| File | LOC | State | What Needs Doing |
|------|-----|-------|------------------|
| analytics-service.ts | 69 | STUB | Stores events in local array. Replace with PostHog client. |
| enterprise-analytics.ts | 700 | ADVANCED | Full analytics engine. Wire PostHog as event sink. |
| index.ts | 2 | OK | Just re-exports. |

**Key observation:** enterprise-analytics.ts is 700 LOC of real analytics logic (aggregation, time-series, etc.). Just needs a real event sink instead of local array.

---

## What Does NOT Exist (Must Be Created in Cycle 5)

| Component | Files Needed | Complexity |
|-----------|-------------|------------|
| Clerk client wrapper | src/core/auth/clerk-client.ts | Medium — SDK wrapper + dev fallback |
| Auth middleware | src/core/auth/middleware.ts | Medium — verify token, attach context, RBAC check |
| PostHog client | src/core/analytics/posthog-client.ts | Low — SDK wrapper + event batching |
| Sentry client | src/core/analytics/sentry-client.ts | Low — SDK init + captureException |
| Stripe client wrapper | src/core/billing/stripe-client.ts | Medium — typed helpers for Stripe operations |
| Webhook handler | src/core/billing/webhook-handler.ts | High — signature verification, event handling, idempotency |
| Usage meter | src/core/billing/usage-meter.ts | Medium — per-user tracking, limit enforcement |
| Structured logger | src/core/system/structured-logger.ts | Low — JSON format wrapper around winston |
| Monitoring service | src/core/system/monitoring.ts | Medium — request counting, latency tracking, /metrics |
| Onboarding flow | apps/dashboard/src/pages/Onboarding.tsx | Medium — 5-step wizard |
| Analytics dashboard | apps/dashboard/src/pages/Analytics.tsx | Medium — charts + tables |
| Billing dashboard | apps/dashboard/src/pages/Billing.tsx | Medium — plan + usage + invoices |
| Landing page | apps/dashboard/src/pages/Landing.tsx | Low — hero + features + pricing |
| Railway config | railway.json, Procfile | Low — deployment config |
| Stripe setup script | scripts/setup-stripe.sh | Low — CLI commands |
| Billing docs | docs/BILLING.md | Low — setup + usage guide |
| CLI login command | apps/cli/lib/commands/login.ts | Medium — browser auth + local token |

**Total new files: ~17. Total estimated new LOC: ~3,000-4,000.**

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Clerk SDK breaking existing auth interface | HIGH | Keep AuthService interface, swap internals. Dev-mode fallback to in-memory. |
| Stripe webhook reliability | HIGH | Idempotent handlers. Log all events. Retry on failure. Test with stripe CLI trigger. |
| PostHog batching delays | LOW | 30s flush interval. Local logging as backup. |
| Usage metering accuracy | MEDIUM | Count at middleware level before AI call. Atomic increment. |
| Dashboard build breaks from new pages | MEDIUM | Type-check after each page. Build after each phase. |
| Env vars not set on deploy | HIGH | Startup validation: check all required vars, fail fast with clear error. |
| Test regressions from service rewrites | MEDIUM | Mock all external services in tests. Run full suite after each window. |

---

## Cycle 5 Mission

**"Deploy. Get users. Iterate. Scale. Win."**

No new architecture. No new core modules. Wire existing scaffolds to real SaaS services (Clerk, PostHog, Sentry, Stripe). Deploy to Railway. Create onboarding flow. Launch publicly.

After Cycle 5: Ultra-Dex is a live product with paying users.

---

## How to Use These Dispatches

```bash
# 1. View the dispatch sheet
cat .protocol/state/dispatches.md

# 2. Complete OWNER pre-requisites first (35 min)
#    - Create Railway, Clerk, PostHog, Sentry, Stripe accounts
#    - Get all API keys
#    - Set env vars in Railway

# 3. Execute Phase 0 first (deployment)
#    Copy W1 command → run with Claude
#    After W1: copy W2 command → run with Codex

# 4. Execute Parallel Group 1 (auth + analytics + billing)
#    Copy W3 command → run with Claude Opus
#    Copy W5 command → run with Codex o3
#    Copy W7 command → run with Claude Sonnet
#    (all 3 can run simultaneously)

# 5. Execute Parallel Group 2 (wiring + dashboards)
#    Copy W4, W6, W8, W9 → run simultaneously

# 6. Execute Group 3 (onboarding + landing)
#    Copy W10, W11 → run simultaneously

# 7. Final verification
#    Copy W12 → run with Gemini

# Example — running W1:
claude --model sonnet --effort high \
  "Deploy Ultra-Dex v3.0.0 to production..."
```

---

*Review generated 2026-04-08 from live codebase audit (post-Cycle-4 completion)*
*Next: Cycle 5 — GO LIVE*
