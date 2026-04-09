# COMPLETE ALL WORK — Cycle 6 ETERNAL Master Execution Document

## Executive Summary

**Mission:** Complete Ultra-Dex Pre-v2.0, ship v3.1.0, plan v2.0+
**Current Blocker:** ONE esbuild rebuild unblocks 55 tests
**Total Work:** 35 windows, 22 phases, 14 missing files, 24 stubs to clean
**Time Estimate:** 4-8 hours continuous parallel execution

---

## The Five Blockers (Fix These First)

| Blocker | Impact | Fix |
|---------|--------|-----|
| 1. esbuild platform mismatch | 55 tests failing | `npm rebuild esbuild` |
| 2. CLI --help crash | Can't use CLI | Fix registry.js import |
| 3. RBAC default role | Wrong permissions | Change viewer → admin |
| 4. Architecture violation | core imports apps/cli | Move GovernanceEngine |
| 5. Dashboard build fail | Rolldown binding | Fix + add pages |

---

## Phase Map (22 Phases)

```
P0  → npm rebuild esbuild (OWNER, 5 min)
P1  → CLI fix (--help works)
P2  → RBAC fix (default role)
P3  → Architecture fix (core→CLI import)
P4  → MOCK_AI execution proof
P5  → Auth middleware
P6  → Usage metering + webhooks
P7  → Analytics (PostHog + Sentry)
P8  → Monitoring (/metrics)
P9  → Stub cleanup (24 files)
P10 → Fake feature removal
P11 → Logging migration
P12 → Dashboard pages
P13 → CLI + Docs
P14 → Execution trace
P15 → Full test suite green
P16 → Real provider test
P17 → Dashboard build
P18 → Full build verification
P19 → Architecture enforcement
P20 → Version 3.1.0
P21 → Final validation
P22 → v2.0+ planning
```

---

## Pre-v2.0 Phase Status

| Phase | Status | Windows |
|-------|--------|---------|
| P0 Platform Fix | 🔴 BLOCKS ALL | W0 |
| P1 CLI Fix | 🟡 Waiting P0 | W1 |
| P2 RBAC Fix | 🟡 Waiting P0 | W2 |
| P3 Architecture | 🟡 Waiting P0 | W3 |
| P4 MOCK Proof | 🟡 Waiting P1-P3 | W4 |
| P5-P22 | 🟢 Queued | W5-W35 |

---

## Stub File Fate List (24 Files)

| File | Lines | Fate | Owner |
|------|-------|------|-------|
| git.js | 0 | Remove | W11 |
| mcp/index.js | 2 | Implement | W11 |
| memory/prune.js | 1 | Fix or remove | W12 |
| performance/monitor.js | 3 | Implement | W12 |
| ... | ... | ... | ... |

(Complete list in dispatches.md)

---

## All 35 Completion Criteria

### Build & Test
- [ ] npm rebuild esbuild → tests unblocked
- [ ] node apps/cli/bin/ultra-dex.js --help → works
- [ ] MOCK_AI=true execution → works
- [ ] npm run test:unit → 0 failures
- [ ] npm run test:integration → 0 failures
- [ ] npm run test:cli → 0 failures
- [ ] npx tsc --noEmit → 0 errors
- [ ] npm run lint → 0 errors, 0 warnings
- [ ] npm run build → exits 0
- [ ] npm audit → 0 high/critical

### Architecture
- [ ] grep -r 'apps/cli' src/core/ → returns nothing
- [ ] No empty files in src/core/
- [ ] No stub files in src/core/
- [ ] 24 stub files implemented or removed

### Features
- [ ] src/core/auth/middleware.ts exists + wired
- [ ] src/core/billing/usage-meter.ts exists
- [ ] src/core/billing/webhook-handler.ts exists
- [ ] src/core/analytics/posthog-client.ts exists
- [ ] src/core/analytics/sentry-client.ts exists
- [ ] src/core/system/monitoring.ts exists + /metrics live
- [ ] apps/dashboard/src/pages/Billing.tsx exists
- [ ] apps/dashboard/src/pages/Landing.tsx exists
- [ ] apps/dashboard/src/pages/Onboarding.tsx exists
- [ ] apps/cli/lib/commands/login.ts exists
- [ ] docs/BILLING.md exists
- [ ] scripts/setup-stripe.sh exists + executable
- [ ] .github/FUNDING.yml exists
- [ ] Fake features removed (--stream, --cache)
- [ ] Better Stack logging in all 4 target files
- [ ] Execution trace complete (run_id, steps[], timing)

### Release
- [ ] Version 3.1.0 in package.json
- [ ] CHANGELOG.md includes v3.1.0
- [ ] git tag v3.1.0 exists
- [ ] docs/V2.0-SPEC.md exists
- [ ] docs/V2.0-ROADMAP.md exists
- [ ] docs/V2.0-COMPETITIVE.md exists

---

## Manual Actions Required

1. **P0:** `npm rebuild esbuild && npm rebuild` (OWNER, 5 min)
2. **P16:** `export NVIDIA_API_KEY=nvapi-xxx` before W27
3. **Post-P21:** `git push origin main && git push origin v3.1.0`
4. **Post-v2.0:** Create PostHog/Sentry accounts

---

## Post-Ship Plan

After v3.1.0 tagged:
- Phase 2: MCP server completion
- Phase 3: Swarm command + LLM router
- Phase 4: VSCode extension
- Phase 5: Plugin system

---

## Gate

**SHIP ONLY WHEN:**
- All 35 completion criteria pass
- Zero test failures
- Zero build errors
- Zero architecture violations
- Both MOCK_AI and real execution proven
- Version 3.1.0 tagged

**THEN:** Close session. Move to v2.0+ planning.
