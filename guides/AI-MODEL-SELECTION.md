# AI Model Selection Guide

> When to use which AI model for your SaaS project

---

## Quick Decision Tree

**Need highest quality reasoning?** → Claude Opus 4.5 ($30/MTok)
**Need balanced cost/performance?** → Claude Sonnet 4.5 ($18/MTok) or GPT-5.2 ($15.75/MTok)
**Need speed + low cost?** → Claude Haiku 4.5 ($6/MTok) or GPT-5 mini ($2.25/MTok)
**Need 100% privacy?** → Llama 3.1 (self-hosted, hardware cost)
**Need free option?** → ChatGPT Free, Gemini Free

---

## Cost Comparison (Processing 1M tokens)

| Provider | Model | Input | Output | Total | Best For |
|----------|-------|-------|--------|-------|----------|
| **Anthropic** | Opus 4.5 | $5 | $25 | **$30** | Complex reasoning, architecture |
| **Anthropic** | Sonnet 4.5 | $3 | $15 | **$18** | Balanced quality + cost |
| **Anthropic** | Haiku 4.5 | $1 | $5 | **$6** | Fast responses, simple tasks |
| **OpenAI** | GPT-5.2 | $1.75 | $14 | **$15.75** | Code generation, general tasks |
| **OpenAI** | GPT-5 mini | $0.25 | $2 | **$2.25** | Simple tasks, high volume |
| **Google** | Gemini Pro | Free tier | Free tier | **Free** | Budget-conscious projects |
| **Open Source** | Llama 3.1 | $0 | $0 | **GPU cost** | Privacy-critical, self-hosted |

**Note:** Costs are for processing 1 million tokens (input + output combined). Most features use 10K-50K tokens.

---

## By Use Case

### Architecture & Planning

**Best Choice:** Claude Opus 4.5
**Why:** Best reasoning for complex system design
**Cost:** ~$5-10 per major feature architecture
**Example:** "Design the entire authentication system architecture"

**Alternative:** Claude Sonnet 4.5
**Why:** 40% cheaper, still excellent reasoning
**Cost:** ~$3-6 per major feature

### Code Generation

**Best Choice:** GPT-5.2
**Why:** Optimized for coding tasks
**Cost:** ~$2-4 per implementation
**Example:** "Implement the authentication API endpoints"

**Alternative:** Claude Sonnet 4.5
**Why:** More thoughtful code, better error handling
**Cost:** ~$3-6 per implementation

### Quick Fixes & Simple Tasks

**Best Choice:** Claude Haiku 4.5 or GPT-5 mini
**Why:** Fast, cheap, good enough for straightforward tasks
**Cost:** <$1 per task
**Example:** "Fix this typo", "Add loading spinner", "Update button color"

### Refactoring & Code Review

**Best Choice:** Claude Sonnet 4.5
**Why:** Excellent at understanding code structure
**Cost:** ~$3-8 per major refactoring
**Example:** "Refactor this module to reduce complexity"

**Alternative:** Claude Opus 4.5
**Why:** Even better for very complex refactoring
**Cost:** ~$8-15 per major refactoring

### Research & Planning

**Best Choice:** ChatGPT (Free) with web search
**Why:** Free, has internet access
**Cost:** Free
**Example:** "Compare Next.js vs Remix in 2026"

**Alternative:** Claude Opus 4.5 (for deep analysis)
**Why:** Better reasoning, but no web search
**Cost:** ~$5-10 per research task

### Documentation

**Best Choice:** GPT-5 mini
**Why:** Good writing quality at very low cost
**Cost:** <$1 per doc
**Example:** "Write API documentation for these endpoints"

**Alternative:** Claude Haiku 4.5
**Why:** Slightly better quality
**Cost:** ~$1-2 per doc

### Security Audits

**Best Choice:** Claude Opus 4.5
**Why:** Most thorough analysis
**Cost:** ~$5-10 per audit
**Example:** "Audit this authentication code for security vulnerabilities"

**Alternative:** ChatGPT Free + manual review
**Why:** Free, but needs human verification
**Cost:** Free

---

## Hybrid Strategy (Recommended for SaaS)

Use different models for different tasks to optimize cost and quality:

### Phase 1: Planning & Research
**Tool:** ChatGPT Free
**Tasks:** Research, initial planning, task breakdown
**Cost:** $0

### Phase 2: Architecture Design
**Tool:** Claude Opus 4.5
**Tasks:** System architecture, database schema design, API contract definition
**Cost:** ~$5-10 per major feature

### Phase 3: Implementation
**Tool:** GPT-5.2 or Cursor (built-in)
**Tasks:** Writing code, API endpoints, UI components
**Cost:** ~$2-4 per feature

### Phase 4: Quick Fixes
**Tool:** Claude Haiku or GPT-5 mini
**Tasks:** Bug fixes, small tweaks, simple features
**Cost:** <$1 per fix

### Phase 5: Review & QA
**Tool:** Claude Sonnet 4.5
**Tasks:** Code review, refactoring, quality checks
**Cost:** ~$3-6 per review

### Phase 6: Security Audit
**Tool:** Claude Opus 4.5 or ChatGPT Free
**Tasks:** Security review, penetration testing guidance
**Cost:** ~$5-10 per audit (or free)

**Total Average Cost Per Feature:** $3-8 (vs $50+ using only expensive models)

---

## Real Example: Building User Authentication

| Task | Agent | AI Model | Cost |
|------|-------|----------|------|
| Task breakdown | @Planner | ChatGPT Free | $0 |
| Architecture design | @CTO | Claude Opus 4.5 | ~$8 |
| Database schema | @Database | Cursor (GPT-5.2) | ~$1 |
| API implementation | @Backend | GPT-5.2 | ~$3 |
| UI components | @Frontend | Copilot (GPT-4) | ~$2 |
| Test writing | @Testing | Claude Haiku | ~$1 |
| Security audit | @Security | Claude Opus 4.5 | ~$5 |
| Code review | @Reviewer | Claude Sonnet 4.5 | ~$4 |
| **TOTAL** | | | **~$24** |

**Compare to:** Using only Claude Opus 4.5 for everything = **~$60-80**
**Savings:** 60%+ with hybrid approach, no quality loss

---

## Model Capabilities Comparison

| Capability | Claude Opus | Claude Sonnet | GPT-5.2 | GPT-5 mini | ChatGPT Free | Llama 3.1 |
|------------|-------------|---------------|---------|------------|--------------|-----------|
| **Reasoning** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Code Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Speed** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Cost** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Context Window** | 200K | 200K | 128K | 128K | 128K | 128K |
| **Web Search** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Privacy** | Moderate | Moderate | Moderate | Moderate | Low | High |

---

## When to Self-Host (Llama 3.1)

**Consider self-hosting if:**
- Handling sensitive data (health, finance, legal)
- Processing millions of requests/month (>$1000/mo in API costs)
- Need 100% data privacy
- Have GPU infrastructure available
- Have ML engineering expertise

**Hardware Requirements:**
- **Llama 3.1 8B:** 16GB GPU RAM (RTX 4090, A4000)
- **Llama 3.1 70B:** 80GB GPU RAM (A100, 2x A6000)

**Cost Comparison:**
- **Cloud (GPT-5.2):** $15.75 per 1M tokens
- **Self-hosted:** $0.50-2.00 per 1M tokens (after hardware amortization)
- **Break-even point:** ~$1000-2000/month in API costs

**Trade-offs:**
- ✅ Cost-effective at scale
- ✅ Full data privacy
- ✅ No vendor lock-in
- ❌ Setup complexity
- ❌ Maintenance overhead
- ❌ Lower quality than frontier models

---

## Free Options

### ChatGPT Free
**Best For:** Research, planning, simple coding
**Limitations:**
- Slower response times
- Rate limits (message cap per hour)
- May be unavailable during peak times
- No API access

**Good Use Case:** "Research authentication best practices" ✅
**Bad Use Case:** Real-time chatbot for production app ❌

### Gemini Free Tier
**Best For:** Prototyping, learning, low-volume projects
**Limitations:**
- Rate limits (60 requests/minute)
- Smaller context window
- Less capable than paid models

**Good Use Case:** Personal project, learning to code ✅
**Bad Use Case:** Production SaaS with paying users ❌

---

## Cost Optimization Tips

### 1. Prompt Caching
Use Anthropic's prompt caching to reduce costs by 90% for repeated prompts:

```
User: "Act as @Backend. Read IMPLEMENTATION-PLAN.md..."
[First call: $3]

User: "Now implement the login endpoint"
[Second call: $0.30 (90% cheaper due to caching)]
```

### 2. Shorter Prompts
Be concise. Instead of:

```
❌ "I need you to carefully review this entire codebase and provide a
comprehensive analysis of all potential security vulnerabilities..."
(500 tokens)
```

Use:

```
✅ "Audit for security vulnerabilities: SQL injection, XSS, CSRF"
(20 tokens)
```

### 3. Batch Operations
Group similar tasks:

```
❌ 5 separate API calls: "Fix bug #1", "Fix bug #2", etc.
✅ 1 API call: "Fix these 5 bugs: [list]"
```

### 4. Use Cheaper Models for Simple Tasks

```
❌ Using Claude Opus for "Add a console.log statement"
✅ Using Claude Haiku or GPT-5 mini
```

---

## Quick Reference

```bash
# Research & Planning
ChatGPT Free - $0

# Architecture & Complex Reasoning
Claude Opus 4.5 - $30/MTok

# Balanced Tasks (most common)
Claude Sonnet 4.5 - $18/MTok
GPT-5.2 - $15.75/MTok

# Simple Tasks & High Volume
Claude Haiku - $6/MTok
GPT-5 mini - $2.25/MTok

# Privacy-Critical
Llama 3.1 (self-hosted) - GPU cost
```

---

## Making the Decision

Ask yourself:

1. **How complex is the task?**
   - Very complex (architecture) → Claude Opus
   - Moderate (coding) → Claude Sonnet or GPT-5.2
   - Simple (quick fix) → Haiku or GPT-5 mini

2. **What's your budget?**
   - High budget → Use best models for everything
   - Moderate budget → Hybrid strategy (recommended)
   - Low budget → Free tiers + GPT-5 mini

3. **How sensitive is the data?**
   - Very sensitive → Self-host Llama 3.1
   - Moderate → Claude/GPT with proper contracts
   - Public → Any model fine

4. **What's the volume?**
   - Low (<100K tokens/month) → Use best models, cost negligible
   - Medium (100K-1M tokens/month) → Hybrid strategy
   - High (>1M tokens/month) → Consider self-hosting

---

**Remember:** The best model is the one that delivers the quality you need at a price you can afford. Start with the hybrid strategy and adjust based on your actual usage.

---

**Ultra-Dex: Make smart AI decisions, optimize your costs**
