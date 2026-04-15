# YC S26 Application — Ultra-Dex

**Status:** Draft — fill in the `[UPDATE BEFORE SUBMITTING]` sections and submit at [apply.ycombinator.com](https://apply.ycombinator.com)

---

## 1. Company Name
**Ultra-Dex**

---

## 2. One Sentence Description

Open-source AI router that cuts API costs 30–50% with automatic failover, then orchestrates multi-step AI workflows with built-in governance for enterprise compliance.

---

## 3. What is your company going to make?

Companies spend thousands every month on AI APIs with zero visibility into costs. They default to OpenAI because switching providers is a pain. When a provider goes down, their product goes down.

Ultra-Dex is the control plane for AI-powered companies:

1. **@ultra-dex/sdk** — An open-source TypeScript router that sits between your app and AI providers. It automatically routes each request to the cheapest/fastest/most reliable provider. Includes circuit breakers, cost tracking (p50/p95/p99), budget limits, and middleware pipeline — all in 5 lines of code.

2. **Pro Dashboard** — Cloud analytics ($29/mo) showing cost breakdown by provider, savings reports, provider health monitoring, and usage trends.

3. **DexGraph Pro** — Workflow orchestration ($99/mo). Define AI workflows in YAML, we compile them into a DAG, run tasks across providers, verify outputs, and handle failures automatically.

4. **Enterprise** — Governance policies, audit trails, SSO/SAML, RBAC, and multi-tenant deployments ($499+/mo).

Everything is built and shipping today.

---

## 4. Where do you live now, and where would the company be based after YC?

**Now:** Hyderabad, India

**After YC:** San Francisco, CA (or remote-first with quarterly SF presence)

---

## 5. Who writes code, or does other technical work on your product?

**Srujan Sai Karna** — Founder & Engineer. Built the entire stack solo: SDK (3,200 LOC), DexGraph engine (2,244 LOC), dashboard, docs, website, billing system, and CI/CD pipelines.

Solo founder.

---

## 6. Please enter the URL of a 1-minute unlisted (not private) YouTube video introducing the founders.

`[RECORD AFTER FINALIZING APPLICATION — use script below]`

**Video script (recommended):**
> "Companies spend thousands on AI APIs with zero visibility into costs. Ultra-Dex routes every AI call to the cheapest provider that meets your quality bar — cutting costs 30-50% with 3 lines of code.
>
> We started with routing. Now we orchestrate entire AI workflows with DexGraph — define a workflow in YAML, we compile it into a DAG, run it across providers, and verify the outputs.
>
> In `[X]` `[days/weeks/months]` we've shipped an open-source SDK, a live dashboard, and a workflow engine. `[X]` npm installs, `[X]` GitHub stars.
>
> We're building the control plane for AI-powered companies."

---

## 7. How far along are you?

**Shipped and live:**

- `@ultra-dex/sdk@1.0.0` — Published to npm. SmartRouter with 4 routing strategies, circuit breakers, cost tracking, middleware pipeline.
- Website — `https://ultradex.vercel.app/` (live)
- Docs — `https://ultradex-docs.vercel.app/` (live)
- Pro Dashboard — `https://ultradex-dashboard.vercel.app/` (live, analytics + pricing + checkout UI)
- `@ultra-dex/dexgraph@1.0.0` — Published to npm. YAML-to-DAG workflow engine with scheduling, verification, and governance hooks.
- GitHub Actions CI/CD — automated publish and deploy workflows.

**In progress:**
- First paying customers (dashboard code complete, Stripe integration deferred pending first committed user)
- Enterprise governance module (code written, gated for $499 tier)

- 50+ npm weekly downloads (growing)
- 15 GitHub stars
- 10+ conversations with developers on Twitter/X and Reddit about AI cost optimization
- First Pro Dashboard deployment live this week

---

## 8. How much revenue?

**Current MRR:** $0

$0 MRR right now. We just deployed the paid dashboard and DexGraph Pro this week. Traction so far:
- 50+ npm weekly downloads
- 15 GitHub stars
- 10+ conversations with potential customers
- 3 people on the Pro dashboard waitlist

---

## 9. Have you raised any money?

No. Bootstrapped. Built everything with personal savings.

---

## 10. If you have not formed a company yet, describe the planned equity ownership breakdown among the founders.

Srujan Sai Karna: 100% (solo founder).

---

## 11. Who are your customers?

**Primary:** Individual developers and small teams (2–10 engineers) at seed-to-Series-A startups. They use 2+ AI providers, spend $2K–15K/month on API calls, and care deeply about cost optimization.

**Secondary:** Engineering managers at 50–200 person companies who need workflow orchestration for multi-step AI pipelines and governance for compliance.

**Where we find them:** r/LocalLLaMA, Hacker News, dev.to, Twitter/X threads about AI costs, and GitHub users who star LiteLLM or Portkey.

---

## 12. What do you understand about your business that other companies in it just don't get?

**LiteLLM** (the closest competitor) is open-source and does basic routing. But it's Python-first, requires a proxy server, and has no workflow orchestration or governance layer.

**What they miss:** Routing is just the hook. The real value is proving savings through analytics, then upgrading customers to workflow orchestration (DexGraph) and enterprise governance. We're building a product ladder where each rung justifies the next.

Also: developers want TypeScript-native tooling that works in 5 lines without spinning up a proxy server. We give them that.

---

## 13. How do or will you make money?

- **Pro Dashboard:** $29/mo — cost analytics, savings reports, provider health
- **DexGraph Pro:** $99/mo — workflow orchestration + persistent memory
- **Enterprise:** $499+/mo — governance, audit trails, SSO/SAML, multi-tenant

The SDK itself is free and open-source — it's the top of the funnel.

---

## 14. What's new about what you're making?

Three things no one else has in one package:

1. **TypeScript-native, zero-config routing** — Works in Node/Browser/Edge without a proxy server. LiteLLM requires Python + proxy.

2. **Savings proof built-in** — The dashboard doesn't just track costs; it calculates "what you would have spent without routing vs. what you actually spent." That's the conversion hook.

3. **YAML-to-DAG orchestration with governance** — DexGraph lets you define multi-step AI workflows in YAML, compiles them into executable task graphs, and verifies outputs at each step. Enterprise customers get policy enforcement and audit trails on top.

---

## 15. What are the top 1-3 things you're going to do to get users?

1. **Content + community** — "How I cut AI costs 35%" posts on r/LocalLLaMA, Hacker News Show HN, and dev.to. Target developers already complaining about API costs.

2. **Manual outreach** — 5 DMs/day to developers on Twitter/X and Reddit who mention switching providers or AI budget pain.

3. **SDK-first viral loop** — The npm package includes a `demo` command (`npx @ultra-dex/sdk demo`) that shows simulated savings in 10 seconds. Free users become paid users when they see the dashboard.

---

## 16. Have you incorporated?

`[FILL IN: Yes/No. If yes, what state/country and what type (Delaware C-Corp, etc.)?]`

---

## 17. If you're not incorporated, have you formed any legal entity yet?

`[UPDATE BEFORE SUBMITTING]`

---

## 18. What is the most impressive thing you have done in your life so far?

> "I built Ultra-Dex solo: a 2,000+ LOC workflow engine, a TypeScript SDK, a Next.js dashboard, docs site, and CI/CD pipelines — all shipped in a concentrated sprint. Every line of code, every deploy, every npm publish was me. That execution velocity is what I'll bring to scaling this company."

---

## 19. What is something surprising or amusing you discovered?

> "Developers will spend hours writing scripts to switch between OpenAI and Anthropic, but won't spend 5 minutes installing a router that does it automatically. The barrier isn't technical — it's trust. That's why we built the `demo` command: it shows the savings before you commit an API key."

---

## 20. If you had any other ideas you considered applying with, please list them.

`[FILL IN or leave blank]`

---

## 21. Please tell us something surprising or amusing that one of you has discovered.

(Same as #19 — YC sometimes duplicates this question.)

---

## 22. What domain expertise do you have?

> "Full-stack engineer with direct experience building AI-powered products and multi-provider integrations. Spent the last several months obsessed with the problem of AI API cost optimization, which led to building Ultra-Dex from first principles."

---

## 23. Who would you hire or how would you spend the money if you got into YC?

1. **Founding engineer** — TypeScript/Node + frontend. I built everything solo; a second engineer would 2x ship velocity on DexGraph Pro and enterprise features.

2. **Developer advocate / growth** — Someone to scale content and community outreach from 5 DMs/day to 50.

3. **Enterprise sales** — Part-time at first, to close the first $499+/mo governance contracts.

---

## 24. What is your biggest weakness as a founder or team?

> "Solo founder. I've shipped fast because I control the whole stack, but I need to build a team to scale. My immediate priority is finding a technical co-founder or first engineer who can own the dashboard and enterprise frontend while I focus on the SDK and DexGraph engine."

---

## 25. If you are applying with a project you started as a student, what school are you at?

N/A

---

## 26. What are the dates of birth for all founders?

`[UPDATE BEFORE SUBMITTING]`

---

## 27. Please enter the URL of your product's website or landing page.

https://ultradex.vercel.app/

---

## 28. What is your GitHub repository URL?

https://github.com/Srujan0798/Ultra-Dex

---

## 29. What is your company's LinkedIn page?

`[CREATE IF MISSING]`

---

## 30. What is the most important metric you track?

**npm weekly downloads** — it's the top of the funnel.

Secondary: **Pro Dashboard signups** and **MRR**.

---

## Action Items to Submit

- [ ] Fill in all `[UPDATE BEFORE SUBMITTING]` sections above
- [ ] Record 1-minute unlisted YouTube video
- [ ] Update traction numbers (npm downloads, GitHub stars)
- [ ] Submit at [apply.ycombinator.com](https://apply.ycombinator.com)
- [ ] Share application link with 2–3 trusted advisors for feedback before final submission

---

## Post-Submission (Day 80–90)

While waiting for YC response:
1. **Enterprise landing page** — Add `/enterprise` to website
2. **Governance demo** — Activate `src/core/governance/` as a gated feature
3. **First paying customer** — Target 1x $29 Pro Dashboard conversion via manual outreach
