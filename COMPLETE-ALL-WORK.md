# ULTRA-DEX PRE-V2.0 — COMPLETE ALL WORK

> Master execution document | Cycle 6 ETERNAL | Generated 2026-04-09
> Source: Codebase deep audit + NOTION/pre v2.0.md + Cycles 1-5 state

---

## EXECUTIVE SUMMARY

Ultra-Dex v3.0.0 is deployed at https://ultra-dex.onrender.com. Cycles 1-5 delivered: production server, Better Stack logging, Clerk auth, Stripe billing, 6 AI providers, 1632-LOC run command with bounded loop. **But it doesn't actually work end-to-end.** 55 tests fail from one esbuild mismatch. CLI crashes on --help. RBAC blocks execution. Core imports from CLI (architecture violation). 24 stub files pretend to be real. 14 files that should exist don't.

**Cycle 6 ETERNAL fixes everything and ships v3.1.0.**

---

## THE FIVE BLOCKERS

| #   | Blocker                | Root Cause                                  | Fix                           | Time   |
| --- | ---------------------- | ------------------------------------------- | ----------------------------- | ------ |
| 1   | 55 test failures       | esbuild darwin-arm64 on linux-arm64         | `npm rebuild esbuild`         | 5 min  |
| 2   | CLI --help crashes     | mcp.js imports registry.js but file is .ts  | Add .js shim or fix import    | 15 min |
| 3   | RBAC blocks execution  | Default role "viewer" can't run agents      | Default to admin when local   | 15 min |
| 4   | Architecture violation | governance-manager.ts imports from apps/cli | Move GovernanceEngine to core | 30 min |
| 5   | Dashboard build fails  | rolldown native binding mismatch            | npm rebuild (same as #1)      | 5 min  |

**Blockers 1 and 5 share root cause. One `npm rebuild` fixes both.**

---

## THE 22 PHASES

### Critical Path (Phases 0-4): UNBLOCK EXECUTION

- **P0**: npm rebuild esbuild (OWNER — blocks everything)
- **P1**: Fix CLI --help (registry.js import)
- **P2**: Fix RBAC (default role for local)
- **P3**: Fix architecture (move GovernanceEngine to core)
- **P4**: Prove MOCK_AI execution works end-to-end

### Build Phase (Phases 5-11): CREATE MISSING PIECES

- **P5**: Auth middleware (requireAuth, requireAdmin, enforceUsageLimit)
- **P6**: Usage meter + webhook handler
- **P7**: PostHog + Sentry analytics
- **P8**: Monitoring service (/metrics)
- **P9**: Stub cleanup (24 files)
- **P10**: Fake feature removal (--stream, --cache)
- **P11**: Logging migration (Better Stack in all targets)

### Feature Phase (Phases 12-14): COMPLETE THE PRODUCT

- **P12**: Dashboard pages (Billing, Landing, Onboarding)
- **P13**: CLI login + docs + scripts
- **P14**: Execution trace verification

### Validation Phase (Phases 15-19): PROVE IT WORKS

- **P15**: All tests green (unit + integration + CLI + new)
- **P16**: Real provider test (NVIDIA API key)
- **P17**: Dashboard build fix
- **P18**: Full build verification (typecheck + lint + build + test + audit)
- **P19**: Architecture enforcement scan

### Ship Phase (Phases 20-22): RELEASE AND PLAN

- **P20**: Version 3.1.0 + CHANGELOG + git tag
- **P21**: Final validation (every criteria checked)
- **P22**: v2.0+ planning (spec + roadmap + competitive)

---

## THE 35 WINDOWS

See `.protocol/state/dispatches.md` for full dispatch commands.

**Agent allocation:**

- Claude Opus: 4 windows (architecture fix, test fix, architecture scan, v2.0 spec)
- Claude Sonnet: 10 windows (CLI, RBAC, middleware, usage, posthog, billing page, login, version, roadmap)
- Codex o1/o3: 5 windows (mock exec, fake features, exec trace, full build, final validation)
- Gemini Pro/Flash: 9 windows (webhook, sentry, monitoring, stubs, logging, pages, docs, dashboard, competitive)
- Qwen Max/Plus/Turbo: 5 windows (stubs, re-exports, stripe script, funding)
- OWNER: 2 manual actions (esbuild rebuild, NVIDIA key)

**Cost: 17 FREE + 16 SUBSCRIPTION + 2 API-KEY**

---

## PRE-V2.0 PHASE MAPPING

| Pre-v2.0 Phase                | Status Before | Cycle 6 Window | Status After |
| ----------------------------- | ------------- | -------------- | ------------ |
| 1. Dependency Repair          | ⚠️ REDO       | W0             | ✅           |
| 2. NVIDIA Registration        | ✅ DONE       | —              | ✅           |
| 3. NVIDIA Implementation      | ✅ DONE       | —              | ✅           |
| 4. Connect to run.js          | ✅ DONE       | —              | ✅           |
| 5. Direct Provider Test       | ❌ BLOCKED    | W27            | ✅           |
| 6. Agent Loop Control         | ✅ DONE       | —              | ✅           |
| 7. Output Fix                 | ✅ DONE       | —              | ✅           |
| 8. Logging Migration          | ⚠️ PARTIAL    | W16            | ✅           |
| 9. Remove Fake Features       | ❌ NOT DONE   | W15            | ✅           |
| 10. Execution Trace           | ✅ DONE       | W24 (verify)   | ✅           |
| 11. Final Execution Test      | ❌ BLOCKED    | W4             | ✅           |
| 12. Fake Module Detection     | ❌ NOT DONE   | W11-W14        | ✅           |
| 13. Wave6 Unification         | ❌ NOT DONE   | W3             | ✅           |
| 14. False Completion Override | N/A           | —              | N/A          |
| 15. Test Integrity Rules      | N/A           | —              | N/A          |
| 16. Architecture Enforcement  | ❌ VIOLATED   | W3, W30        | ✅           |
| 17. Mock Execution            | ⚠️ PARTIAL    | W2, W4         | ✅           |
| 18. 401/Auth Failure Fix      | ⚠️ UNKNOWN    | W5, W27        | ✅           |
| 19. Full System Flow          | ❌ BLOCKED    | W29, W32       | ✅           |

**Before Cycle 6: 5/19 done, 3 partial, 6 blocked, 5 not started**
**After Cycle 6: 19/19 done**

---

## 14 MISSING FILES

| File                                    | Window | Purpose           |
| --------------------------------------- | ------ | ----------------- |
| src/core/auth/middleware.ts             | W5     | Route protection  |
| src/core/billing/usage-meter.ts         | W6     | Usage enforcement |
| src/core/billing/webhook-handler.ts     | W7     | Stripe events     |
| src/core/analytics/posthog-client.ts    | W8     | Product analytics |
| src/core/analytics/sentry-client.ts     | W9     | Error tracking    |
| src/core/system/monitoring.ts           | W10    | /metrics endpoint |
| apps/dashboard/src/pages/Billing.tsx    | W17    | Billing UI        |
| apps/dashboard/src/pages/Landing.tsx    | W18    | Public landing    |
| apps/dashboard/src/pages/Onboarding.tsx | W19    | Setup wizard      |
| apps/cli/lib/commands/login.ts          | W20    | CLI auth          |
| docs/BILLING.md                         | W21    | Billing docs      |
| scripts/setup-stripe.sh                 | W22    | Stripe setup      |
| .github/FUNDING.yml                     | W23    | Sponsorship       |
| docs/V2.0-SPEC.md                       | W33    | v2.0 planning     |

---

## 24 STUB FILES

| Fate                  | Files                                                                                                                    | Window   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------- |
| DELETE (empty)        | message-bus.ts, contentstudio/types.ts                                                                                   | W11      |
| VALIDATE (re-exports) | mcp/memory.ts, analytics/index.ts, streaming/index.ts, services/index.ts, mcp/index.ts, agents/index.ts, memory/index.ts | W11, W14 |
| FIX (broken)          | commands/agents.ts, utils/logging.js, autonomous-agent.ts                                                                | W12      |
| IMPLEMENT             | multimodal-service.ts, tenant-service.ts, plugin-marketplace.ts, token-budget.ts, smart-errors.ts, config.ts             | W13      |
| VALIDATE (minimal)    | clerk-client.ts, ITelemetryService.ts, IExecutionEngine.ts, contentstudio/prisma.ts, contentstudio/slugify.ts            | W14      |

---

## COMPLETION CRITERIA (35 checks)

```
BUILD:
[ ] npm rebuild esbuild → tests unblocked
[ ] npx tsc --noEmit → 0 errors
[ ] npm run lint → 0 errors, 0 warnings
[ ] npm run build → exits 0
[ ] npm test → 0 failures
[ ] npm audit → 0 high/critical

EXECUTION:
[ ] node apps/cli/bin/ultra-dex.js --help → works
[ ] MOCK_AI=true ultra-dex run planner -t "hello" → works
[ ] ultra-dex run planner -t "hello" --provider nvidia → real output (API key)

ARCHITECTURE:
[ ] grep -r "apps/cli" src/core/ → nothing
[ ] No empty files in src/core/
[ ] No stubs (< 5 LOC, no logic)
[ ] 24 stub files addressed

FILES (14 new):
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
[ ] docs/V2.0-SPEC.md

FEATURES:
[ ] Fake features removed (--stream, --cache)
[ ] Better Stack logging in 4 target files
[ ] Execution trace complete (run_id, steps[], timing)

RELEASE:
[ ] Version 3.1.0 in package.json
[ ] CHANGELOG.md includes v3.1.0
[ ] git tag v3.1.0
[ ] docs/V2.0-ROADMAP.md
[ ] docs/V2.0-COMPETITIVE.md
```

---

## MANUAL ACTIONS (OWNER)

1. **Before everything**: `npm rebuild esbuild && npm rebuild`
2. **Before W27**: `export NVIDIA_API_KEY=nvapi-xxx`
3. **Before W8**: Create PostHog account → get POSTHOG_API_KEY
4. **Before W9**: Create Sentry project → get SENTRY_DSN
5. **After P21 passes**: `git push origin main && git push origin v3.1.0`
6. **Deploy**: `git push render main` → verify https://ultra-dex.onrender.com/health

---

## AFTER CYCLE 6

**v3.1.0 is shipped. Pre-v2.0 is COMPLETE.**

Next: v2.0 development using:

- `docs/V2.0-SPEC.md` — what to build
- `docs/V2.0-ROADMAP.md` — when to build it
- `docs/V2.0-COMPETITIVE.md` — why it matters

v2.0 focus: production memory (Redis/Postgres), autonomous Ralph Loop, agent marketplace, multi-modal, edge deployment, IDE plugins.

---

_Generated 2026-04-09 | Cycle 6 ETERNAL | 35 windows | 22 phases | Ship v3.1.0_
