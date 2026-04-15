# Ultra-Dex Launch Pack

**Use this when you're ready to post.** Copy-paste and go.

---

## Show HN

**Title:** Show HN: Open-source AI cost router — cut API bills 30-50% with automatic failover

**Body:**

I've been building AI-powered products and got frustrated paying full price to one provider when a cheaper one could handle most requests just as well.

So I built @ultra-dex/sdk — an open-source TypeScript router that sits between your app and AI providers. It routes each request based on cost, latency, or reliability. Has circuit breakers so if OpenAI goes down, it auto-fails over to Anthropic. Tracks cost per provider down to p50/p95/p99 latency.

No proxy server. No Python dependency. Works in 5 lines of code.

- SDK: https://www.npmjs.com/package/@ultra-dex/sdk
- Repo: https://github.com/Srujan0798/Ultra-Dex
- Dashboard: https://ultradex-dashboard.vercel.app/

**Best time to post:** Tuesday–Thursday, 8–10am EST

---

## Reddit — r/LocalLLaMA

**Title:** I built an open-source router for switching between AI providers automatically

**Body:**

Like a lot of you, I run multiple models depending on the task. But switching providers in code is a mess — and when one goes down, everything breaks.

I built @ultra-dex/sdk to solve this. It's a TypeScript router that:
- Automatically picks the cheapest/fastest available provider
- Has built-in circuit breakers (auto-failover when a provider degrades)
- Tracks costs and latency per provider
- Works without a proxy server

It's free and open-source. Also just launched a Pro dashboard for analytics.

- npm: `npm install @ultra-dex/sdk`
- Repo: https://github.com/Srujan0798/Ultra-Dex

Happy to answer any questions.

---

## Reddit — r/node

**Title:** [Showoff Saturday] TypeScript library for multi-provider AI routing with circuit breakers

**Body:**

We built an open-source SDK that handles AI provider routing, failover, and cost tracking — all in TypeScript, zero proxy server needed.

Key features:
- 4 routing strategies: cheapest, fastest, round-robin, fallback-chain
- Circuit breakers with auto-recovery
- p50/p95/p99 latency tracking per provider
- Budget limits with auto-cutoff
- Middleware pipeline (logging, retry, cache, rate-limit)

Live demo command: `npx @ultra-dex/sdk demo`

Repo: https://github.com/Srujan0798/Ultra-Dex

---

## Twitter/X Thread (5 tweets)

**Tweet 1:**
I spent the last few months building an open-source AI router.

It cuts API costs 30-50% by automatically routing each call to the cheapest provider that meets your quality bar.

No proxy. No Python. 5 lines of TypeScript.

Here's how it works 🧵

**Tweet 2:**
The problem: most apps hardcode OpenAI. When Anthropic is cheaper/faster, they miss out. When OpenAI goes down, they go down too.

The solution: a router that decides per-request which provider to use.

**Tweet 3:**
@ultra-dex/sdk includes:
• 4 routing strategies
• Circuit breakers (auto-failover)
• Cost + latency tracking
• Budget limits
• Middleware pipeline

npm install @ultra-dex/sdk

**Tweet 4:**
We also shipped DexGraph Pro — define AI workflows in YAML and we compile them into executable task graphs.

Multi-step pipelines across providers, with output verification at each step.

**Tweet 5:**
Everything is live today:
- SDK: https://npmjs.com/package/@ultra-dex/sdk
- Dashboard: https://ultradex-dashboard.vercel.app
- Repo: https://github.com/Srujan0798/Ultra-Dex

Give it a spin and let me know what you think.

---

## Personal Outreach DM (Twitter/X or Reddit)

Hey [name] — saw your [tweet/post] about [specific thing they said about AI costs / switching providers].

I built an open-source TypeScript router that auto-routes AI calls to the cheapest available provider. Has circuit breakers, latency tracking, and budget limits built in.

Free to use: npm install @ultra-dex/sdk
Repo: github.com/Srujan0798/Ultra-Dex

No pitch — just thought it might help with [their specific problem].

---

## Email to First Users / Waitlist

Subject: Ultra-Dex Pro Dashboard is live

Hey [name],

You signed up for early access to Ultra-Dex — thanks for the interest.

The Pro Dashboard is now live: https://ultradex-dashboard.vercel.app/

It shows:
- Cost breakdown by provider
- How much the router is saving you vs single-provider
- Provider health (latency, errors, uptime)
- Usage trends

Pricing is $29/mo. Happy to give you the first month free if you want to try it — just reply to this email.

Cheers,
Srujan

---

## Calendly / Contact Sales Email

Subject: Let's talk about Ultra-Dex Enterprise

Hi [name],

Thanks for your interest in Ultra-Dex Enterprise.

We work with engineering teams that need:
- Governance policies and audit trails
- SSO/SAML and RBAC
- Multi-tenant deployments
- SLA-backed support

Our Enterprise tier starts at $499/mo.

If that fits what you're looking for, reply here and we'll schedule a 15-minute call.

Best,
Srujan
Founder, Ultra-Dex
