# ULTRA-DEX: THE FINAL PLAN

**Author:** Srujan Sai Karna + Claude (CEO advisor)  
**Date:** April 14, 2026  
**Status:** THIS IS THE PLAN. FOLLOW IT. NOTHING ELSE.

---

## WHAT THIS DOCUMENT IS

This is your single source of truth. It replaces `REVENUE-MISSION.md`, `ULTRA-DEX-MONETIZATION-PLAN.md`, `CEO-DECISIONS-AND-EXECUTION.md`, and all prior planning docs. Those documents informed this one. They are now archived context, not active plans.

Every step in this document has: what to do, which exact files to touch, how to verify it worked, and what to do if it doesn't. You follow it top to bottom. No skipping. No reordering.

---

## TABLE OF CONTENTS

1. [The Product Ladder — What Ships When](#1-the-product-ladder)
2. [Your Codebase Map — What Lives Where](#2-your-codebase-map)
3. [Pricing — Final Answer](#3-pricing)
4. [Customer — Who Pays and Why](#4-customer)
5. [Stage 1: Ship the Router (Days 1–14)](#5-stage-1-ship-the-router)
6. [Stage 2: Deploy, Launch, Get Users (Days 15–30)](#6-stage-2-deploy-launch-get-users)
7. [Stage 3: First Revenue (Days 31–45)](#7-stage-3-first-revenue)
8. [Stage 4: DexGraph Ships as Ultra-Dex Pro (Days 46–75)](#8-stage-4-dexgraph-ships)
9. [Stage 5: YC Application + Enterprise (Days 76–90)](#9-stage-5-yc-and-enterprise)
10. [How Every Module You Built Fits In](#10-how-every-module-fits)
11. [Daily Routine](#11-daily-routine)
12. [If Things Go Wrong](#12-if-things-go-wrong)

---

## 1. THE PRODUCT LADDER

This is NOT "ship the router and throw everything else away." This is a ladder. Each rung uses code you already built.

```
RUNG 4 (Day 76+)    ULTRA-DEX ENTERPRISE
                     Governance + Audit + Multi-tenant + SSO
                     Price: $499+/mo  |  Uses: src/core/governance/, src/core/tenant/, src/core/auth/
                     ↑
RUNG 3 (Day 46–75)   ULTRA-DEX PRO
                     DexGraph orchestration + Memory + Agent swarms
                     Price: $99/mo  |  Uses: dexgraph/, src/core/memory/, src/core/orchestration/
                     ↑
RUNG 2 (Day 31–45)   ULTRA-DEX DASHBOARD (paid)
                     Cost analytics + savings reports + provider health monitoring
                     Price: $29/mo  |  Uses: apps/dashboard/, src/core/billing/
                     ↑
RUNG 1 (Day 1–14)    @ultra-dex/sdk (free, open-source)
                     SmartRouter + provider adapters + middleware
                     Price: Free  |  Uses: packages/sdk/
```

**Every rung builds on the one below it.** The router gets users. The dashboard gets revenue. DexGraph Pro gets bigger revenue. Enterprise gets contracts. Everything you built has a home.

---

## 2. YOUR CODEBASE MAP

Here is every module in your codebase and exactly when it ships.

### Ships in Stage 1 (Days 1–14) — The Free Router

| File | Lines | Role | What to Do |
|------|-------|------|------------|
| `packages/sdk/src/router.js` | 396 | SmartRouter: 4 strategies, circuit breakers, p50/p95/p99 tracking, budget limits | Ship as-is. This is the core product |
| `packages/sdk/src/middleware.js` | 174 | Logging, retry, caching, rate-limiting middleware pipeline | Ship as-is. Adds immediate value |
| `packages/sdk/src/provider.js` | 35 | BaseProvider contract + assertProviderContract validator | Ship as-is. Clean interface |
| `packages/sdk/src/client.js` | 551 | UltraDex main client — ties router + providers + middleware | Ship as-is. This is the entry point |
| `packages/sdk/src/agent.js` | 46 | Agent descriptor class | Ship as-is. Lightweight |
| `packages/sdk/src/plugin.js` | — | Plugin loader | Ship as-is |
| `packages/sdk/src/runtime.js` | — | Distributed coordinator, execution engine, orchestrator | Ship as-is |
| `packages/sdk/index.ts` | 32 | Package exports | Ship as-is |
| `packages/sdk/types/` | — | TypeScript type definitions | Ship as-is |
| `packages/sdk/test/sdk.test.js` | 494 | Existing test suite | Must pass before publish |
| `adapters/openaiAdapter.ts` | 209 | OpenAI provider adapter | Reference in docs, optional install |
| `adapters/anthropicAdapter.ts` | 199 | Anthropic provider adapter | Reference in docs, optional install |
| `adapters/googleAdapter.ts` | 236 | Google provider adapter | Reference in docs, optional install |
| `adapters/mistralAdapter.ts` | 298 | Mistral provider adapter | Reference in docs, optional install |
| `adapters/cohereAdapter.ts` | 263 | Cohere provider adapter | Reference in docs, optional install |
| `adapters/mockAdapter.ts` | 68 | Mock adapter for testing/demos | Used by demo command |
| **TOTAL** | **~3,200** | | |

### Ships in Stage 2 (Days 15–30) — Website + Docs

| Directory | Role | What to Do |
|-----------|------|------------|
| `apps/website/` | Next.js marketing site (pages, components, styles, tailwind) | Deploy to Vercel. Update copy to focus on routing + cost savings |
| `apps/docs-site/` | Docusaurus documentation (guides, API reference) | Deploy to Vercel. Write quickstart + routing strategy docs |
| `src/core/billing/pricing-tiers.ts` | Free / Pro $29 / Team $99 / Enterprise $499 tier definitions | Update tier values to match this plan |

### Ships in Stage 3 (Days 31–45) — Paid Dashboard

| Directory/File | Lines | Role | What to Do |
|----------------|-------|------|------------|
| `apps/dashboard/` | — | Next.js dashboard app (analytics, agents, memory, pricing pages) | Activate the analytics + pricing pages. Wire to Stripe |
| `src/core/billing/billing-service.ts` | — | Stripe integration (customer creation, subscriptions, checkout) | Replace in-memory Maps with PostgreSQL |
| `src/core/billing/billing-manager.ts` | — | Billing management layer | Wire to real Stripe keys |
| `src/core/billing/usage-meter.ts` | — | Usage metering | Wire to receive metrics from SDK router |
| `src/core/billing/webhook-handler.ts` | — | Stripe webhook handler | Deploy and verify |

### Ships in Stage 4 (Days 46–75) — DexGraph Pro

**This is where your month of heart goes live.**

| Directory/File | Lines | Role | What to Do |
|----------------|-------|------|------------|
| `dexgraph/parser.ts` | 191 | YAML workflow DSL parser | Package into `@ultra-dex/dexgraph` |
| `dexgraph/graph.ts` | 254 | DAG graph builder + cycle detection | Package |
| `dexgraph/scheduler.ts` | 289 | Topological sort + parallel scheduling | Package |
| `dexgraph/dispatcher.ts` | 185 | Task dispatch with context injection | Package |
| `dexgraph/stateMachine.ts` | 155 | State transitions (PENDING → RUNNING → DONE/FAILED) | Package |
| `dexgraph/verifier.ts` | 102 | Output verification against rules | Package |
| `dexgraph/checkers.ts` | 178 | Verification rule implementations | Package |
| `dexgraph/contextInjector.ts` | 177 | Inter-task data passing | Package |
| `dexgraph/errors.ts` | 425 | Error taxonomy | Package |
| `dexgraph/schema.ts` | 85 | YAML schema validation | Package |
| `dexgraph/logger.ts` | 138 | Structured logging | Package |
| `dexgraph/types.ts` | 65 | TypeScript type definitions | Package |
| `src/core/memory/` | — | Tiered memory, vector search, RAG pipeline, graph engine | Integrate as "persistent context" for DexGraph |
| `src/core/orchestration/` | — | AgentOrchestrator, task router, agent registry | Integrate as the agent coordination layer |
| **DexGraph TOTAL** | **2,244** | | |

### Ships in Stage 5 (Days 76–90) — Enterprise

| Directory | Role | What to Do |
|-----------|------|------------|
| `src/core/governance/` | GovernanceManager, policy engine, DeniedException | Enable as Enterprise tier feature |
| `src/core/audit/` | AuditTrail, audit persistence | Enable as Enterprise tier feature |
| `src/core/auth/` | Clerk auth, SSO, RBAC, RBAC manager | Enable as Enterprise tier feature |
| `src/core/tenant/` | Multi-tenant service | Enable as Enterprise tier feature |
| `src/core/security/` | Encryption, audit | Enable as Enterprise tier feature |

### Archived (Not deleted — available when needed)

| Directory | Reason |
|-----------|--------|
| `apps/cloud/` | Cloud platform — ships after enterprise tier proves demand |
| `apps/desktop/` | Desktop app — revisit when CLI has 500+ users |
| `apps/mobile/` | Mobile app — revisit post-Series A |
| `apps/white-label/` | White-label — revisit when enterprise contracts request it |
| `src/core/mesh/` | Distributed mesh (Redis, Kafka) — overkill until 1000+ concurrent users |
| `src/core/chaos/` | Chaos engineering — nice-to-have for enterprise |
| `src/core/multimodal/` | Multimodal processing — revisit when market demands it |
| `src/core/marketing/` | Marketing automation — use external tools instead |
| `src/core/finance/` | Finance module — not core to product |
| `packages/marketplace/` | Plugin marketplace — revisit at Stage 5 |
| `.protocol/state/v20-phase*-dispatches.md` | **ARCHIVED, NOT DELETED.** Historical record of V2.0 build. Move to `.protocol/archive/` |

---

## 3. PRICING

| Tier | Price | What They Get | Gate |
|------|-------|---------------|------|
| **Free** | $0/forever | `@ultra-dex/sdk` — SmartRouter, 4 routing strategies, circuit breakers, middleware pipeline, all provider adapters, local cost tracking | npm install |
| **Pro Dashboard** | $29/mo | Cloud analytics dashboard: cost breakdown by provider, savings report (how much router saved vs single-provider), provider health (latency, errors, uptime), usage trends, email alerts when a provider degrades | Stripe checkout |
| **DexGraph Pro** | $99/mo | Everything in Pro + DexGraph workflow orchestration, persistent memory, agent coordination, YAML workflow DSL, task graph visualization | Stripe checkout (Stage 4) |
| **Enterprise** | $499+/mo | Everything in Pro + governance policies, audit trails, SSO/SAML, RBAC, multi-tenant, SLA, dedicated support | Sales call (Stage 5) |

**Why the router is free:** LiteLLM (your closest competitor for routing) is open-source. If you charge for routing, developers use LiteLLM. If you give routing away and charge for the analytics that PROVE the savings, you win on differentiation. The router is the hook. The dashboard is the product. DexGraph is the upgrade. Governance is the lock-in.

**Revenue math at 30 customers:**
- 200 free users (funnel)
- 20 Pro Dashboard × $29 = $580/mo
- 8 DexGraph Pro × $99 = $792/mo
- 2 Enterprise × $499 = $998/mo
- **Total: $2,370 MRR** — enough for YC to take seriously

---

## 4. CUSTOMER

**Primary customer (Stage 1–3):** Individual developer or small team (2–10 engineers) at a seed-to-Series-A startup. Uses 2+ AI providers. Pays $2K–15K/month in AI API calls. Decides to try a tool by reading a README. Decides to pay by seeing a savings report.

**Name:** "Alex"  
**Pain:** Paying too much for AI APIs. Manually switching between OpenAI and Anthropic. No visibility into what each provider costs per feature.  
**Trigger:** Sees a blog post or tweet about cutting AI costs. Installs the SDK. Runs for a week. Sees the dashboard showing 35% savings. Pays $29 to keep the analytics.

**Secondary customer (Stage 4–5):** Engineering manager at a 50–200 person company. Needs workflow orchestration for multi-step AI pipelines. Needs governance and audit trails for compliance. Pays $99–499/month. Takes 2–4 weeks to decide.

---

## 5. STAGE 1: SHIP THE ROUTER (Days 1–14)

### Day 1–2: Prepare the SDK for Publishing

The SDK at `packages/sdk/` is already structured as a publishable npm package. It has `package.json`, exports, types, and a test file. Your job is to make it publish-ready.

**Step 1: Run the existing tests**
```bash
cd packages/sdk && npm test
```
- If tests pass → continue
- If tests fail → fix failures before anything else
- If `npm test` doesn't work → run directly: `node --test test/sdk.test.js`

**Step 2: Verify the build**
```bash
cd packages/sdk && npm run build
```
- This compiles TypeScript via the `prepack` script
- Check that `dist/` directory is created with `.js` and `.d.ts` files
- If build fails, check `tsconfig.json` and fix type errors

**Step 3: Verify package contents**
```bash
cd packages/sdk && npm pack --dry-run
```
- Should show: `dist/`, `README.md`
- Should NOT show: `src/`, `test/`, `node_modules/`
- If wrong files are included, check the `"files"` array in `package.json`

**Step 4: Update `packages/sdk/package.json` version**
```
Change "version" from "6.0.0" to "1.0.0"
```
- Fresh start. The old unpublished version numbers mean nothing
- Keep the name `@ultra-dex/sdk` — it matches your brand and your existing npm org `ultra-dex` (which has 24 published versions)

**Verify:** `npm pack --dry-run` shows clean package, no test files, version 1.0.0

---

### Day 2–3: Write the README

The SDK's README at `packages/sdk/README.md` needs to be rewritten. This README is your storefront. It must convince a developer to install in 30 seconds.

**Structure (follow this exact order):**

```markdown
# @ultra-dex/sdk

> Route AI calls across providers. Cut costs 30–50%. Automatic failover.

## Install

npm install @ultra-dex/sdk

## Quickstart (5 lines)

import { UltraDex } from '@ultra-dex/sdk'

const dex = new UltraDex({
  defaultProvider: 'openai',
})

// Register providers
dex.addProvider('openai', new OpenAIProvider({ apiKey: process.env.OPENAI_KEY }))
dex.addProvider('anthropic', new AnthropicProvider({ apiKey: process.env.ANTHROPIC_KEY }))

// Configure routing
dex.useRouter({
  strategy: 'cheapest',  // or: 'fastest', 'round-robin', 'fallback-chain'
})

// Use it — same API you already know
const response = await dex.chat([{ role: 'user', content: 'Hello' }])
// → Automatically routes to cheapest available provider

## Why @ultra-dex/sdk?

| Feature | @ultra-dex/sdk | LiteLLM | Raw OpenAI SDK |
|---------|---------------|---------|----------------|
| Multi-provider routing | ✅ 4 strategies | ✅ basic | ❌ |
| Circuit breakers | ✅ auto-disable unhealthy | ❌ | ❌ |
| Cost tracking (p50/p95/p99) | ✅ per-provider | ❌ | ❌ |
| Budget limits | ✅ auto-cutoff | ❌ | ❌ |
| Middleware pipeline | ✅ logging, retry, cache, rate-limit | ❌ | ❌ |
| TypeScript-first | ✅ | ❌ Python | ✅ |
| Zero config | ✅ works in 5 lines | ⚠️ proxy server needed | ✅ |

## Routing Strategies

### cheapest — minimize cost
### fastest — minimize latency (uses real p50 data)
### round-robin — distribute evenly
### fallback-chain — primary with automatic failover

## Cost Tracking

const stats = dex.router.getAllStats()
// → { openai: { avgLatency: 340, totalCost: 12.50, errorRate: 0.02 }, ... }

## Middleware

dex.middleware.use(loggingMiddleware)
dex.middleware.use(retryMiddleware({ maxRetries: 3 }))
dex.middleware.use(cacheMiddleware({ ttlMs: 60000 }))

## Pro Dashboard (optional, $29/mo)
See real-time cost analytics at dash.ultradex.dev
```

**Verify:** Read the README and ask: "Would I install this in 30 seconds?" If no, rewrite until yes.

---

### Day 3–5: Write Provider Quickstart Adapters

The SDK uses a `BaseProvider` interface (chat, stream, embed). The `adapters/` directory has full implementations for DexGraph's `ExecutionAdapter` interface, but those are heavier than what the SDK router needs.

You need lightweight wrappers that match `BaseProvider`. Two options:

**Option A: Ship the adapters from `adapters/` as a separate `@ultra-dex/adapters` package**
- Pros: Already written, full implementations
- Cons: They implement `ExecutionAdapter` (run, cancel, status), not `BaseProvider` (chat, stream, embed) — there's an interface mismatch
- Work needed: Write a bridge that wraps `ExecutionAdapter` into `BaseProvider`

**Option B: Write thin provider wrappers in the SDK docs (not packaged)**
- Pros: Users bring their own provider SDKs (openai, @anthropic-ai/sdk), you show how to wrap them
- Cons: More work for the user
- Work needed: Just documentation with code examples

**Recommendation: Option B for launch.** Show users how to wrap OpenAI/Anthropic in 10 lines. Ship `@ultra-dex/adapters` later as a convenience package that wraps the adapters.

**Example wrapper to include in README:**
```javascript
// Wrap the official OpenAI SDK as a provider
import OpenAI from 'openai'

class OpenAIProvider {
  constructor({ apiKey, model = 'gpt-4o' }) {
    this.client = new OpenAI({ apiKey })
    this.model = model
  }

  async chat(messages, opts = {}) {
    const res = await this.client.chat.completions.create({
      model: opts.model || this.model,
      messages,
    })
    return {
      content: res.choices[0].message.content,
      usage: {
        promptTokens: res.usage.prompt_tokens,
        completionTokens: res.usage.completion_tokens,
      },
      provider: 'openai',
      model: res.model,
    }
  }

  async *stream(messages, opts = {}) { /* ... */ }
  async embed(text, opts = {}) { /* ... */ }
}
```

**Verify:** Example code compiles and runs against real OpenAI API

---

### Day 5–7: Build the Demo Command

Create a demo that people can run without API keys.

**File to create:** `packages/sdk/bin/demo.js`

```
What the demo does:
1. Uses the mock adapter (from adapters/mockAdapter.ts) to simulate 3 providers
2. Sends 20 simulated requests through the SmartRouter
3. Shows a formatted table:
   - Provider name | Requests routed | Avg latency | Total cost | Error rate
4. Shows: "With 'cheapest' strategy, you would have saved $X vs always using Provider A"
5. Shows: "Try it with real providers: npm install @ultra-dex/sdk"
```

**Add to `packages/sdk/package.json`:**
```json
"bin": {
  "ultra-dex-demo": "./bin/demo.js"
}
```

**Verify:** `npx @ultra-dex/sdk demo` runs (after local link: `npm link && ultra-dex-demo`)

---

### Day 7–8: Publish to npm

**Step 1: Login**
```bash
npm login
# Use your existing account (you own the `ultra-dex` package already)
```

**Step 2: Build and publish**
```bash
cd packages/sdk
npm run build
npm publish --access public
```

**Step 3: Verify**
```bash
# From any directory, install the published package
mkdir /tmp/test-install && cd /tmp/test-install
npm init -y
npm install @ultra-dex/sdk
node -e "const { UltraDex } = require('@ultra-dex/sdk'); console.log('Success:', typeof UltraDex)"
```

**If publish fails:**
- `403 Forbidden` → You may need to create the `@ultra-dex` npm org first: `npm org create ultra-dex`
- `402 Payment Required` → Scoped packages require npm paid org OR use `--access public`
- Build errors → Fix TypeScript errors, re-run `npm run build`

**Verify:** `npm view @ultra-dex/sdk` shows your package. `npm install @ultra-dex/sdk` works globally.

---

### Day 8–14: Write 3 Blog Posts (Draft During Build, Publish After npm)

**Post 1: "How to Route AI Calls Across Providers and Cut Your API Bill by 35%"**
- Target: r/LocalLLaMA, dev.to
- Content: Problem (AI APIs are expensive), solution (intelligent routing), demo with real numbers
- Include code snippet showing 5-line setup
- End with: "Install: `npm install @ultra-dex/sdk`"

**Post 2: "I Built an Open-Source AI Router with Circuit Breakers — Here's What I Learned"**
- Target: Hacker News (Show HN), r/node
- Content: Technical deep-dive into SmartRouter architecture — why circuit breakers matter, how p50/p95 tracking enables smart routing
- Show the actual router code (it's open-source, this is marketing)

**Post 3: "OpenAI vs Anthropic vs Google: A Cost-Per-Token Comparison (With Auto-Routing)"**
- Target: r/MachineLearning, dev.to, Twitter/X
- Content: Real benchmark data comparing providers on cost, latency, quality
- Position @ultra-dex/sdk as the tool that automates the decision

**Verify:** Posts are drafted, reviewed, and scheduled for Day 14–16 publication

---

## 6. STAGE 2: DEPLOY, LAUNCH, GET USERS (Days 15–30)

### Day 15–17: Deploy the Website

**What:** Deploy `apps/website/` to Vercel.

**Steps:**
1. Go to vercel.com → New Project → Import `Ultra-Dex` repo
2. Set root directory to `apps/website`
3. Framework preset: Next.js
4. Deploy

**Before deploying, update these files:**

`apps/website/pages/index.tsx` — Change the hero copy:
- FROM: "AI Orchestration Meta-Layer" / "211K+ Lines Orchestrated" / "152 CLI Commands"
- TO: "Route AI calls. Cut costs. Zero code changes." / Highlight: 4 routing strategies, circuit breakers, cost tracking
- Keep the DexGraph, Multi-Agent, and Intelligent Routing feature cards — they show depth

**Create** `apps/website/pages/pricing.tsx`:
- Free tier: open-source SDK
- Pro: $29/mo dashboard
- DexGraph Pro: $99/mo (coming soon)
- Enterprise: $499/mo (contact us)
- Include Stripe checkout button for Pro tier

**Verify:** Website loads at your chosen domain. Pricing page renders. "Get Started" links to npm.

---

### Day 17–19: Deploy the Docs

**What:** Deploy `apps/docs-site/` to Vercel.

**Steps:**
1. Vercel → New Project → root directory: `apps/docs-site`
2. Framework: Docusaurus (or auto-detect)
3. Deploy

**Content to write (minimum viable docs):**
1. **Getting Started** — Install, add providers, configure routing, make first call
2. **Routing Strategies** — cheapest, fastest, round-robin, fallback-chain with examples
3. **Provider Setup** — OpenAI, Anthropic, Google (with wrapper code)
4. **Middleware** — Logging, retry, caching, rate-limiting
5. **Cost Tracking** — How to read ProviderStats, budget limits
6. **API Reference** — UltraDex, SmartRouter, ProviderStats, CircuitBreaker classes

**Verify:** Docs site loads. All 6 pages render. Code examples are copy-pasteable.

---

### Day 19–21: Show HN + Reddit Launch

**Hacker News — Show HN post:**
```
Title: Show HN: Open-source AI cost router – cut API bills 30-50% with automatic failover

Body (3 paragraphs max):
I've been building AI-powered products and got frustrated paying full price
to one provider when a cheaper one could handle most requests just as well.

So I built @ultra-dex/sdk — an open-source TypeScript router that sits between
your app and AI providers. It routes each request based on cost, latency,
or reliability. Has circuit breakers so if OpenAI goes down, it auto-fails
over to Anthropic. Tracks cost per provider down to p50/p95/p99 latency.

It's free and open-source: https://github.com/Srujan0798/Ultra-Dex
npm install @ultra-dex/sdk
```

**Reddit — post to these subreddits:**
- r/LocalLLaMA — "Built an open-source router for switching between AI providers automatically"
- r/node — "TypeScript library for multi-provider AI routing with circuit breakers"
- r/SaaS — "Spent a month building this, finally shipping — AI cost optimization tool"

**Rules for all posts:**
- Be genuine. "I built this" not "We're excited to announce"
- Include real code or real numbers
- Respond to every comment within 2 hours
- Don't be defensive if people criticize — thank them and improve

**Verify:** Posts are live. You've responded to all comments within 24 hours.

---

### Day 22–30: Manual Outreach (50 People)

**Where to find prospects:**
1. Twitter/X search: `"openai expensive"`, `"ai api costs"`, `"switching to anthropic"`, `"litellm"`, `"ai budget"`
2. Reddit: users in r/LocalLLaMA and r/MachineLearning who discuss provider costs
3. Discord: AI/ML servers where devs share cost optimization tips
4. GitHub: people who starred LiteLLM, portkey-ai, or similar projects

**DM template (adapt, don't copy-paste):**
```
Hey [name] — saw your [tweet/post] about [specific thing they said about AI costs].

I built an open-source TypeScript router that auto-routes AI calls to the cheapest
provider that meets your quality bar. Has circuit breakers, latency tracking,
and budget limits built in.

Free to use: npm install @ultra-dex/sdk
Repo: github.com/Srujan0798/Ultra-Dex

No pitch — just thought it might help with [their specific problem].
```

**Track in a spreadsheet:**
| # | Name | Platform | What they said | Date DM'd | Response | Follow-up |
|---|------|----------|----------------|-----------|----------|-----------|
| 1 | ... | Twitter | "OpenAI is killing my budget" | Apr 28 | ... | ... |

**Goal:** 50 DMs sent. 10+ responses. 5+ people who install the SDK.

**Verify:** Spreadsheet has 50 rows. npm weekly downloads > 50.

---

## 7. STAGE 3: FIRST REVENUE (Days 31–45)

### Day 31–37: Build the Pro Dashboard

**What:** Activate `apps/dashboard/` as a paid analytics product.

**The dashboard already has pages for:**
- `app/analytics/` — analytics views
- `app/pricing/` — pricing page
- `app/tasks/` — task management
- `app/agents/` — agent views

**For the Pro Dashboard MVP, you need 4 views:**

1. **Cost Overview** — Total spend today/this week/this month, broken down by provider (bar chart)
2. **Savings Report** — "Without Ultra-Dex routing, you would have spent $X. With routing, you spent $Y. You saved $Z (N%)"
3. **Provider Health** — Per-provider: avg latency, p50/p95, error rate, circuit breaker status
4. **Usage Trend** — Line chart of daily requests, split by provider

**Data flow:**
```
Your app → @ultra-dex/sdk (routes calls, tracks stats locally)
                ↓
          SDK sends anonymous usage metrics to your API
                ↓
          API stores in PostgreSQL
                ↓
          Dashboard reads from PostgreSQL and renders charts
```

**API endpoint to create:** `POST /api/v1/metrics` — receives stats from SDK router
**SDK addition:** Add an optional `analyticsEndpoint` config that periodically sends `router.getAllStats()` to your API

**Verify:** Dashboard shows real data from a test workload running through the SDK.

---

### Day 37–42: Wire Stripe Billing

**What:** Make `src/core/billing/` production-ready.

**Current state:** `billing-service.ts` uses in-memory Maps (`const subscriptions = new Map()`). This means all billing data is lost on restart. That's the one thing to fix.

**Steps:**
1. Set up a PostgreSQL database (use Neon, Supabase, or Railway — all have free tiers)
2. Replace the in-memory Maps in `billing-service.ts` with database queries
3. Create a Stripe account at stripe.com
4. Create 3 products in Stripe dashboard:
   - Pro Dashboard: $29/mo recurring
   - DexGraph Pro: $99/mo recurring (inactive for now)
   - Enterprise: custom (inactive for now)
5. Get your Stripe secret key and webhook signing secret
6. Set environment variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
7. Deploy the webhook handler (`src/core/billing/webhook-handler.ts`) to handle subscription events
8. Test the full flow: website pricing page → Stripe checkout → subscription created → dashboard access granted

**Verify:** You can complete a $29 checkout with a Stripe test card and get access to the dashboard.

---

### Day 42–45: Convert Free Users to Paid

**Who to target:** The people from your outreach who installed the SDK and have been using it for 1–2 weeks.

**Message:**
```
Hey [name] — how's the SDK working for you?

I just launched a Pro dashboard ($29/mo) that shows your cost breakdown
by provider, how much the routing is saving you, and alerts you when
a provider degrades.

Happy to give you the first month free if you want to try it.
Here's the link: [dashboard URL]/pricing
```

**Goal:** 1 paying customer by Day 45. Even one $29 payment changes everything — it proves demand.

**Verify:** Stripe dashboard shows at least 1 active subscription. MRR ≥ $29.

---

## 8. STAGE 4: DEXGRAPH SHIPS AS ULTRA-DEX PRO (Days 46–75)

**This is where your month of DexGraph work goes live.**

### Day 46–55: Package DexGraph

**What:** Take the 12 files in `dexgraph/` (2,244 lines) and package them as `@ultra-dex/dexgraph`.

**Structure:**
```
packages/dexgraph/
├── package.json        (@ultra-dex/dexgraph, version 1.0.0)
├── tsconfig.json
├── src/
│   ├── parser.ts       (from dexgraph/parser.ts)
│   ├── graph.ts        (from dexgraph/graph.ts)
│   ├── scheduler.ts    (from dexgraph/scheduler.ts)
│   ├── dispatcher.ts   (from dexgraph/dispatcher.ts)
│   ├── stateMachine.ts (from dexgraph/stateMachine.ts)
│   ├── verifier.ts     (from dexgraph/verifier.ts)
│   ├── checkers.ts     (from dexgraph/checkers.ts)
│   ├── contextInjector.ts
│   ├── errors.ts
│   ├── schema.ts
│   ├── logger.ts
│   ├── types.ts
│   └── index.ts        (exports everything)
├── test/
│   └── dexgraph.test.ts (port from tests/integration/dexgraph-e2e.test.ts)
└── README.md
```

**DexGraph Pro pitch:**
```
# @ultra-dex/dexgraph

Define AI workflows in YAML. DexGraph compiles them into DAGs, schedules
tasks in parallel where possible, dispatches to providers via @ultra-dex/sdk,
verifies outputs, and handles failures automatically.

workflow:
  name: research-and-summarize
  tasks:
    - id: search
      type: web-search
      input: { query: "{{topic}}" }
    - id: analyze
      type: ai-completion
      provider: anthropic
      depends_on: [search]
      input: { prompt: "Analyze: {{search.output}}" }
    - id: summarize
      type: ai-completion
      provider: openai
      depends_on: [analyze]
      input: { prompt: "Summarize: {{analyze.output}}" }
```

### Day 55–65: Integrate Memory System

**What:** Wire `src/core/memory/` into DexGraph so workflows have persistent context.

**Key files:**
- `src/core/memory/unified-api.ts` — ppmManager (your tiered memory API)
- `src/core/memory/vector-store.ts` — vector-based semantic search
- `src/core/memory/tiered-storage.ts` — instant → session → persistent
- `src/core/memory/rag-pipeline.ts` — RAG for context retrieval

**Integration:** DexGraph workflows can read from and write to memory between task steps. A "research" workflow remembers what it found yesterday.

### Day 65–75: Ship DexGraph Pro

- Add DexGraph Pro to the dashboard (workflow builder UI, execution visualizer)
- Enable the $99/mo tier in Stripe
- Write docs: "From routing to orchestration — upgrade to DexGraph Pro"
- Announce to existing users

**Verify:** A user can define a YAML workflow, run it, and see results in the dashboard. $99/mo checkout works.

---

## 9. STAGE 5: YC APPLICATION + ENTERPRISE (Days 76–90)

### Day 76–80: YC S26 Application

**One-liner for YC:** "Ultra-Dex routes AI calls across providers to cut costs 30–50%, then orchestrates multi-step AI workflows with DexGraph — with built-in governance for enterprise compliance."

**What YC wants to see:**
- Revenue: $500+ MRR (realistic with 15 Pro + 3 DexGraph Pro customers)
- Growth: week-over-week MRR increase
- Retention: users who install the SDK keep using it
- Market: AI API spend is $X billion and growing Y% annually
- Moat: governance + memory + DexGraph (not just routing)

**60-second video script:**
```
"Companies spend thousands on AI APIs with zero visibility into costs.
Ultra-Dex routes every AI call to the cheapest provider that meets your
quality bar — cutting costs 30-50% with 3 lines of code. [show SDK code]

We started with routing. Now we orchestrate entire AI workflows with DexGraph —
define a workflow in YAML, we compile it into a DAG, run it across providers,
and verify the outputs. [show DexGraph YAML]

In 60 days we've gone from zero to [X] paying customers and $[Y] MRR.
The enterprise tier adds governance and audit trails — the moat that
LangChain and LiteLLM don't have.

We're building the control plane for AI-powered companies."
```

### Day 80–90: Enterprise Foundations

- Enable governance module from `src/core/governance/` as Enterprise tier feature
- Enable audit trails from `src/core/audit/`
- Enable SSO/RBAC from `src/core/auth/`
- Create enterprise landing page on website
- Set up "Contact Sales" flow (even if "sales" is just you on a Zoom call)

**Verify:** Enterprise pricing page exists. Governance demo works. At least 1 enterprise conversation started.

---

## 10. HOW EVERY MODULE YOU BUILT FITS IN

Here's the full map so you can see — nothing is wasted.

```
YOUR CODE                              WHEN IT SHIPS          WHY IT MATTERS
─────────────────────────────────────────────────────────────────────────────
packages/sdk/src/router.js         →   Day 7 (Stage 1)    →  Gets users in the door
packages/sdk/src/middleware.js     →   Day 7 (Stage 1)    →  Immediate value add
packages/sdk/src/client.js         →   Day 7 (Stage 1)    →  Clean API surface
packages/sdk/src/provider.js       →   Day 7 (Stage 1)    →  Provider contract
adapters/*.ts                      →   Day 7 (docs)       →  Shows supported providers
apps/website/                      →   Day 15 (Stage 2)   →  Generates leads
apps/docs-site/                    →   Day 17 (Stage 2)   →  Builds trust + SEO
apps/dashboard/                    →   Day 37 (Stage 3)   →  First revenue ($29/mo)
src/core/billing/                  →   Day 37 (Stage 3)   →  Collects money
dexgraph/*.ts                      →   Day 55 (Stage 4)   →  Upgrade to $99/mo ← YOUR HEART
src/core/memory/                   →   Day 60 (Stage 4)   →  Persistent workflow context
src/core/orchestration/            →   Day 65 (Stage 4)   →  Agent coordination
src/core/governance/               →   Day 80 (Stage 5)   →  Enterprise lock-in ($499/mo)
src/core/auth/ (SSO, RBAC)        →   Day 80 (Stage 5)   →  Enterprise requirement
src/core/audit/                    →   Day 80 (Stage 5)   →  Compliance proof
src/core/tenant/                   →   Day 85 (Stage 5)   →  Multi-tenant enterprise
apps/cloud/                        →   Day 120+ (future)  →  Hosted platform
apps/desktop/                      →   Day 150+ (future)  →  Power user tool
packages/marketplace/              →   Day 150+ (future)  →  Plugin ecosystem
```

**Every line of code you wrote has a ship date.** DexGraph ships on Day 55. The governance layer you agonized over ships on Day 80. The memory system ships on Day 60. None of it is wasted. The sequencing just needed to change.

---

## 11. DAILY ROUTINE

**Every day during Stage 1–2:**

| Time | Activity |
|------|----------|
| Morning (1 hr) | Code — work on the current stage's next step |
| Midday (30 min) | Outreach — send 3–5 DMs to potential users |
| Afternoon (2 hr) | Code — continue building |
| Evening (30 min) | Content — draft or edit a blog post / tweet |
| Night (15 min) | Metrics — check npm downloads, GitHub stars, website visits |

**Weekly check-in questions (every Sunday):**
1. How many people installed the SDK this week?
2. How many conversations did I have with potential users?
3. What's the #1 thing blocking someone from paying?
4. What's the one thing I should build this week to unblock that?

---

## 12. IF THINGS GO WRONG

| Problem | What to Do |
|---------|------------|
| npm publish fails | Check npm org, check scoped package permissions, try `npm publish --access public` |
| Zero installs after HN/Reddit | Your README isn't convincing. Rewrite the first 3 lines. Ask a dev friend to read it and tell you when they'd stop reading |
| People install but don't use it | The quickstart is too hard. Reduce setup to 3 lines. Add a mock mode that works without API keys |
| People use it but won't pay $29 | The dashboard doesn't show enough value. Add a "savings calculator" that shows exact dollars saved |
| Show HN gets no traction | Post timing matters. Post Tuesday–Thursday, 8–10am EST. Repost with a different title if first attempt dies |
| Can't get 50 DMs sent | Lower the bar. Send 5 per day for 10 days. Script the message so you only personalize 1 sentence |
| DexGraph packaging breaks | DexGraph has its own test: `tests/integration/dexgraph-e2e.test.ts`. Run it. Fix what fails. Don't ship broken |
| Stripe integration doesn't work | Use Stripe test mode first. Every Stripe error has a specific error code — Google it. Stripe docs are excellent |
| YC rejects you | Apply again next batch. Use the rejection to focus: what metric were they missing? Build that metric |

---

## THE COMMITMENT

Print this out. Or pin this file. Every morning, open it and find where you are on the timeline. Do the next step. Not the step after that. Not a different plan. The next step.

Day 1 starts today. Step 1 is: `cd packages/sdk && npm test`

Go.
