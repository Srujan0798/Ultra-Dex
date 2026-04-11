# V2.0 MASTER TIMELINE — DEPENDENCY GRAPH & CRITICAL PATH
> Source: Phase 1-4 Dispatches + /engineering:architecture + /engineering:system-design
> Covers: 68 windows across 17 weeks (12 months total)
> Generated: 2026-04-11

---

## PHASE MAP

```
PHASE 1: FOUNDATION (Months 1-2)     → W1-W16   → v3.0.0 → v4.0.0
PHASE 2: INTELLIGENCE (Months 3-4)   → W17-W32  → v4.0.0 → v4.1.0
PHASE 3: SCALE (Months 5-6)          → W33-W48  → v5.0.0
PHASE 4: ECOSYSTEM (Months 7-12)     → W49-W68  → v6.0.0
```

---

## DEPENDENCY GRAPH

```
W1 Redis ──────────────┐
W2 Postgres ───────────┤
W3 Audit migration ────┤
W4 Docker compose ─────┴──→ W5-W8 (Migration + Integration) ──→ W9-W12 (npm + CI)
                                                                      │
W9  npm CLI pkg ───────┐                                              │
W10 SDK package ───────┤                                              │
W11 GitHub CI ─────────┤                                              │
W12 Contributing ──────┴──→ W13-W16 (README + E2E + Gate) ──→ PHASE 1 GATE (v4.0.0)
                                                                      │
                                                                      ▼
W17 Bandit router ─────┐   ┌── Depends: Redis (W1) for stats persistence
W18 Health monitor ────┤   │
W19 Routing tests ─────┤◄──┘
W20 Cost dashboard ────┴──→ W21-W24 (RAG + Embeddings + LiteLLM)
                                    │
W21 RAG pipeline ──────┐   ┌── Depends: Memory (W1-W2) for vector store
W22 Embedding service ─┤◄──┘
W23 LiteLLM adapter ──┤
W24 Replay command ────┴──→ W25-W28 (Marketplace v1)
                                    │
W25 Marketplace arch ──┐   ┌── Depends: Plugin types defined here feed Phase 3
W26 Marketplace CLI ───┤◄──┘
W27 Package agents ────┤
W28 Analytics cmd ─────┴──→ W29-W32 (E2E + Version + Gate) ──→ PHASE 2 GATE (v4.1.0)
                                                                      │
                                                                      ▼
W33 VSCode core ───────┐   ┌── Depends: CLI bridge requires stable CLI (Phase 1)
W34 VSCode webview ────┤◄──┘
W35 VSCode tests ──────┤
W36 VSCode docs ───────┴──→ W37-W40 (Plugin system)
                                    │
W37 Plugin arch ───────┐   ┌── Depends: Marketplace types (W25) for manifest format
W38 Plugin CLI ────────┤◄──┘
W39 Built-in plugins ──┤
W40 Plugin docs ───────┴──→ W41-W44 (Team + Enterprise)
                                    │
W41 Team workspace ────┐   ┌── Depends: Memory (W21-W22) for shared memory pool
W42 Audit trail ───────┤◄──┘   Depends: Governance (existing) for RBAC integration
W43 Team CLI ──────────┤
W44 Team tests ────────┴──→ W45-W48 (Perf + Gate) ──→ PHASE 3 GATE (v5.0.0)
                                                              │
                                                              ▼
W49 Dashboard arch ────┐   ┌── Depends: All core APIs stable from Phase 1-3
W50 Dashboard pages ───┤◄──┘
W51 Dashboard tests ───┤
W52 Dashboard deploy ──┴──→ W53-W56 (Marketplace full)
                                    │
W53 Marketplace backend┐   ┌── Depends: Plugin registry (W37) for package format
W54 Marketplace CLI ───┤◄──┘
W55 Marketplace web ───┤
W56 Seed plugins ──────┴──→ W57-W60 (Cert + Enterprise)
                                    │
W57 Certification ─────┐   ┌── Depends: All features exist to create assessment content
W58 Enterprise init ───┤◄──┘
W59 Pricing/landing ───┤
W60 Enterprise docs ───┴──→ W61-W64 (CLI + Tests)
                                    │
W61 Cert CLI ──────────┐
W62 Enterprise CLI ────┤
W63 Phase 4 tests ─────┤
W64 Cert content ──────┴──→ W65-W68 (Integration + Polish + Gate) ──→ PHASE 4 GATE (v6.0.0)
```

---

## CRITICAL PATH

The longest dependency chain determines minimum project duration:

```
W1 (Redis) → W5 (Usage migrate) → W9 (npm pkg) → W13 (README) → W16 (Gate)
    → W17 (Bandit router) → W21 (RAG pipeline) → W25 (Marketplace arch) → W32 (Gate)
    → W33 (VSCode) → W37 (Plugin arch) → W41 (Team workspace) → W48 (Gate)
    → W49 (Dashboard) → W53 (Marketplace full) → W57 (Certification) → W68 (Gate)
```

**Critical path length: 17 weeks (4 phase gates)**
**Any delay on the critical path delays the entire project.**

### Critical Path Risk Points

| Week | Window | Risk | Impact | Mitigation |
|------|--------|------|--------|------------|
| 1 | W1 Redis | Redis adapter complexity, ioredis edge cases | Blocks all Phase 2 stat persistence | Fallback: in-memory adapter with Redis interface |
| 5 | W17 Bandit router | Thompson sampling correctness | Core differentiator broken | Heavy testing + mathematical verification (W19) |
| 6 | W21 RAG pipeline | Embedding model download (400MB+), vector search perf | Memory feature degraded | Pre-download in Docker, LRU cache for embeddings |
| 7 | W25 Marketplace arch | API design locks in ecosystem format | Plugin compat issues later | Review with 3 example plugins before finalizing |
| 9 | W33 VSCode | VSCode API breaking changes, activation issues | IDE story blocked | Pin @types/vscode version, test on 3 VSCode versions |
| 10 | W37 Plugin arch | Security in plugin sandbox (code execution) | Supply chain attack vector | vm2/isolated-vm sandboxing, manifest permission model |
| 11 | W41 Team workspace | Data isolation between teams | Security vulnerability | Namespace-level isolation in storage + explicit ACL checks |
| 13 | W49 Dashboard | Next.js 14 + monorepo integration | Dashboard can't import core | Shared tsconfig paths, verify import resolution in CI |

---

## RESOURCE ALLOCATION

### Agent Utilization Across All Phases

| Agent | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Total Windows | % of Work |
|-------|---------|---------|---------|---------|---------------|-----------|
| Claude Opus | 4 | 4 | 4 | 4 | **16** | 23.5% |
| Claude Sonnet | 4 | 4 | 3 | 5 | **16** | 23.5% |
| Gemini Pro | 4 | 3 | 3 | 4 | **14** | 20.6% |
| Codex (o1/o3) | 2 | 2 | 2 | 4 | **10** | 14.7% |
| Qwen (Max/Plus) | 2 | 3 | 2 | 3 | **10** | 14.7% |
| Copilot | 0 | 0 | 0 | 0 | **0** | 0% |
| OpenCode/NVIDIA | — | — | — | — | **68 fallbacks** | Fallback only |

### Weekly Agent Schedule

```
Week 1-4 (Phase 1):   Opus×1 + Sonnet×1 + Gemini×1 + Qwen×1 = 4 parallel/week
Week 5-8 (Phase 2):   Opus×1 + Sonnet×1 + Gemini×1 + Qwen/Codex×1 = 4 parallel/week
Week 9-12 (Phase 3):  Opus×1 + Sonnet×1 + Gemini×1 + Qwen/Codex×1 = 4 parallel/week
Week 13-17 (Phase 4): Opus×1 + Sonnet×1 + Gemini×1 + Qwen/Codex×1 = 4 parallel/week
```

### Cost Summary

| Category | Windows | Est. Monthly Cost |
|----------|---------|-------------------|
| SUBSCRIPTION (Claude, Codex, Copilot) | 42 | $20/mo (Pro plans) |
| FREE (Gemini, Qwen) | 24 | $0 |
| API-KEY-USAGE (fallback only) | 0 primary | $0-5/mo (if fallbacks triggered) |
| **TOTAL** | **68** | **~$20-25/mo** |

OpenCode/NVIDIA models serve exclusively as Fallback #3 across all 68 windows — zero primary cost, activated only on failure.

---

## MILESTONE GATES

### Gate 1: Foundation (End of Week 4)
```
□ Redis adapter passes integration tests
□ Postgres schema deployed and migrated
□ npm packages published (@ultra-dex/cli, @ultra-dex/sdk)
□ GitHub CI/CD pipeline green on all branches
□ Public repo with README, CONTRIBUTING, LICENSE
□ Version: 4.0.0 tagged
□ VALIDATION: npm install -g @ultra-dex/cli && ultra-dex --version → 4.0.0
```

### Gate 2: Intelligence (End of Week 8)
```
□ Bandit router saves 30%+ vs static routing (benchmark proof)
□ RAG pipeline retrieves relevant context (cosine similarity >0.7)
□ LiteLLM adapter routes through proxy correctly
□ Marketplace v1: list, install, uninstall working
□ Replay command shows last N task results
□ Version: 4.1.0 tagged
□ VALIDATION: ultra-dex run planner --optimize cost → picks cheapest adequate provider
```

### Gate 3: Scale (End of Week 12)
```
□ VSCode extension installs and shows sidebar
□ Plugin system: install, create, publish lifecycle works
□ 3 built-in plugins functional (@ultra-dex/github, docker, testing)
□ Team workspace: create, join, RBAC enforced
□ Enterprise audit trail: log, export CSV/JSON/SOC2
□ Cold start <2s, warm <500ms, routing <20ms, memory <200MB
□ Version: 5.0.0 tagged
□ VALIDATION: code --install-extension ultra-dex → sidebar active, agents visible
```

### Gate 4: Ecosystem / Platform Launch (End of Week 17)
```
□ Web dashboard serves at localhost:3000 with all pages
□ Community marketplace: search, install, publish, rate
□ 10 seed plugins available in marketplace
□ Certification: start assessment, score, generate certificate
□ Enterprise: SSO (Okta/Azure/Auth0), SLA monitoring, compliance export
□ Pricing page with 3 tiers
□ Landing page live
□ All tests pass (unit + integration + e2e + perf)
□ npm audit: 0 high/critical vulnerabilities
□ Version: 6.0.0 tagged
□ VALIDATION: full platform smoke test — every CLI command, every dashboard page, every API endpoint
```

---

## RISK MATRIX

| Risk | Probability | Impact | Phase | Mitigation |
|------|-------------|--------|-------|------------|
| Redis connection failures in CI | Medium | High | 1 | In-memory fallback adapter, Docker redis in CI |
| Embedding model too large for CI | Medium | Medium | 2 | Use smaller model (all-MiniLM-L6-v2, 80MB) for tests |
| VSCode API deprecation | Low | High | 3 | Pin API version, abstract behind adapter layer |
| Plugin sandbox escape | Low | Critical | 3 | Use isolated-vm (not vm2), restrict fs/net access |
| Next.js monorepo import resolution | Medium | Medium | 4 | Shared tsconfig paths, pre-build core before dashboard |
| Marketplace spam/malware | Medium | High | 4 | Manifest validation, automated security scan on publish |
| SSO integration complexity | High | Medium | 4 | Start with generic OIDC, add provider-specific later |
| Scope creep in Phase 4 | High | High | 4 | Strict gate criteria, cut non-essential features |
| Context window limits during long windows | Medium | Medium | All | /compact aggressively, split prompts if >100K tokens |
| Fallback cascade failure | Low | Medium | All | OpenCode/NVIDIA as ultimate fallback, never 0 options |

---

## PARALLEL EXECUTION MAP

```
MONTH 1 ─── Week 1: W1║W2║W3║W4    Week 2: W5║W6║W7║W8
MONTH 2 ─── Week 3: W9║W10║W11║W12  Week 4: W13║W14║W15║W16  ←── GATE 1 (v4.0.0)
MONTH 3 ─── Week 5: W17║W18║W19║W20 Week 6: W21║W22║W23║W24
MONTH 4 ─── Week 7: W25║W26║W27║W28 Week 8: W29║W30║W31║W32  ←── GATE 2 (v4.1.0)
MONTH 5 ─── Week 9: W33║W34║W35║W36 Week 10: W37║W38║W39║W40
MONTH 6 ─── Week 11: W41║W42║W43║W44 Week 12: W45║W46║W47║W48 ←── GATE 3 (v5.0.0)
MONTH 7 ─── Week 13: W49║W50║W51║W52 Week 14: W53║W54║W55║W56
MONTH 8 ─── Week 15: W57║W58║W59║W60 Week 16: W61║W62║W63║W64
MONTH 9 ─── Week 17: W65║W66║W67║W68                          ←── GATE 4 (v6.0.0)
            ║ = parallel execution within week
```

**Effective parallelism: 4 windows/week → 68 windows in 17 calendar weeks**
**With buffer (holidays, blockers, rework): 20-22 weeks realistic**

---

## VERSION PROGRESSION

```
Current:  v3.1.0 (Cycle 6 ETERNAL complete)
          ↓
Phase 1:  v4.0.0 (Foundation — Redis, Postgres, npm, Docker, CI)
          ↓
Phase 2:  v4.1.0 (Intelligence — Bandit router, RAG, Marketplace v1, LiteLLM)
          ↓
Phase 3:  v5.0.0 (Scale — VSCode, Plugins, Team/RBAC, Enterprise audit, Perf)
          ↓
Phase 4:  v6.0.0 (Ecosystem — Dashboard, Marketplace full, Certification, Enterprise, Launch)
```

---

## ETERNAL QUESTIONS ANSWERED

**Q: Can users ship with Ultra-Dex after Phase 1?**
A: Yes. Stable CLI, published npm, production infra (Redis/Postgres/Docker).

**Q: Can users ship after Phase 2?**
A: Yes, and cheaper. Bandit router optimizes cost. Memory makes agents smarter. Marketplace provides community agents.

**Q: Can users ship after Phase 3?**
A: Yes, in their IDE. VSCode extension. Plugin ecosystem. Team features for orgs.

**Q: Can users ship after Phase 4?**
A: Yes, as a platform. Dashboard for non-CLI users. Marketplace for community. Enterprise for large orgs. Revenue for sustainability.

---

## EXECUTION RECOVERY PROMPT

```
Read .protocol/state/v20-master-timeline.md
Identify current phase and week.
Check: which gate are we approaching?
Run: the next uncompleted window's command.
Validate: per window's validation criteria.
If blocked → check fallbacks → escalate to next priority lane.
```

---

*Master timeline generated 2026-04-11 | V2.0 Full Roadmap | 68 windows | 17 weeks | 4 gates*
