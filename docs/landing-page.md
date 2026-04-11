# Ultra-Dex

## The Model-Agnostic AI Workforce Platform

**Claude plugins for the enterprise. Any provider. Any scale. Your data.**

---

## The Problem

Claude's Engineering & Data plugins are **amazing** — but they're **locked to Claude**.

- ❌ Can't use GPT-4o for cost-sensitive tasks
- ❌ Can't use DeepSeek for offline workloads
- ❌ Can't self-host for compliance
- ❌ No vendor flexibility
- ❌ Single point of failure

**What if you need choice?**

---

## The Solution

**Ultra-Dex** brings Claude's plugin ecosystem to **any AI provider**.

✅ **20 Production-Grade Skills**  
✅ **10 AI Providers** (Claude, GPT-4o, DeepSeek, Groq, etc.)  
✅ **18 MCP Connectors** (GitHub, Slack, Snowflake, etc.)  
✅ **Self-Hosted** or **SaaS**  
✅ **Enterprise Governance**

---

## Comparison

| Feature                | Claude Plugins | Ultra-Dex                                           |
| ---------------------- | -------------- | --------------------------------------------------- |
| **AI Provider**        | Anthropic only | Any provider (Claude, OpenAI, DeepSeek, Groq, etc.) |
| **Provider Switching** | ❌ No          | ✅ Auto-fallback on failure                         |
| **Cost Optimization**  | ❌ Fixed       | ✅ Route simple tasks to cheaper models             |
| **Self-Hosting**       | ❌ Cloud only  | ✅ On-premise option                                |
| **Enterprise SSO**     | ❌ Limited     | ✅ Full SAML/OAuth support                          |
| **Data Governance**    | ❌ Basic       | ✅ Audit trails, PII detection                      |
| **Connector Count**    | 18 built-in    | 18 + custom connectors                              |
| **Custom Skills**      | ❌ No          | ✅ Create your own                                  |
| **API Access**         | ❌ Limited     | ✅ Full REST API + SDK                              |
| **Pricing**            | $20-200/mo     | Usage-based + Enterprise tiers                      |

---

## 20 Skills, Any Provider

### Engineering (10)

- `/code-review` — Security, performance, correctness
- `/architecture` — ADR creation and evaluation
- `/debug` — Structured debugging workflows
- `/deploy-checklist` — Pre-deployment verification
- `/documentation` — Technical docs, runbooks
- `/incident-response` — Triage, communication, post-mortem
- `/standup` — Activity summaries
- `/system-design` — API and service design
- `/tech-debt` — Debt identification and prioritization
- `/testing-strategy` — Test plans and coverage

### Data (10)

- `/sql-queries` — SQL across Snowflake, BigQuery, Databricks
- `/explore-data` — Dataset profiling
- `/build-dashboard` — Interactive HTML dashboards
- `/analyze` — Data questions and insights
- `/create-viz` — Python visualizations
- `/statistical-analysis` — Hypothesis testing
- `/validate-data` — QA before sharing
- `/write-query` — Optimized SQL generation
- `/data-context-extractor` — Company data knowledge
- `/data-visualization` — Best practice charts

---

## How It Works

```
User Request → Skill Router → Connector Data → AI Router → Result
                ↓                ↓              ↓
            /code-review    GitHub PR      Claude
                                          GPT-4o
                                          DeepSeek
```

**Example: Code Review with PR URL**

```typescript
const review = await ultraDex.skills.codeReview({
  prUrl: 'https://github.com/acme/app/pull/123',
  focus: ['security', 'performance'],
});

// 1. Fetch PR diff from GitHub
// 2. Route to Claude (high-quality code review)
// 3. Post results as PR comment
// 4. Store in memory for learning
```

**Example: SQL Generation with Schema**

```typescript
const query = await ultraDex.skills.sqlQuery({
  prompt: 'Monthly revenue by product',
  dialect: 'snowflake',
});

// 1. Fetch schema from Snowflake connector
// 2. Route to GPT-4o (best SQL syntax)
// 3. Validate query
// 4. Return optimized SQL
```

---

## Provider Routing

Ultra-Dex intelligently routes to the best provider:

| Task           | Best Provider | Why                |
| -------------- | ------------- | ------------------ |
| Code Review    | Claude Sonnet | Security nuance    |
| SQL Generation | GPT-4o        | Syntax accuracy    |
| Simple Tasks   | DeepSeek V3   | Cost savings       |
| Urgent Queries | Groq          | Latency (800ms)    |
| Architecture   | Claude Sonnet | Trade-off analysis |

**Automatic Fallback:**

- Claude down? → GPT-4o
- GPT-4o down? → DeepSeek
- All down? → Queue + retry

---

## Connectors (18)

### Engineering

- **GitHub** — PRs, issues, repo context
- **Slack** — Notifications, incident channels
- **Linear** — Issue tracking
- **Notion** — Documentation, ADRs
- **PagerDuty** — Incident management
- **Datadog** — Metrics, logs, alerts
- **Asana** — Project management
- **Atlassian** — Jira, Confluence

### Data

- **Snowflake** — Data warehouse
- **BigQuery** — Google Cloud analytics
- **Databricks** — Lakehouse platform
- **Hex** — Analytics notebooks
- **Amplitude** — Product analytics
- **Definite** — Metrics platform

---

## Pricing

### Starter

- **$49/mo**
- 5 team members
- 10,000 skill executions
- All 20 skills
- GitHub, Slack, Notion connectors

### Professional

- **$199/mo**
- 25 team members
- 100,000 skill executions
- All providers
- All connectors
- Custom skills

### Enterprise

- **Custom pricing**
- Unlimited team
- Unlimited executions
- Self-hosted option
- SAML SSO
- Audit logs
- Dedicated support
- Custom connectors

---

## Use Cases

### For Engineering Teams

- **Code Review:** Auto-review PRs for security issues
- **Architecture:** Document decisions in Notion
- **Incident Response:** Post-mortems in Slack
- **Standup:** Daily summaries from GitHub activity

### For Data Teams

- **SQL:** Natural language to optimized queries
- **Dashboards:** Executive KPIs from Snowflake
- **Analysis:** Statistical insights for stakeholders
- **Validation:** QA before sharing results

### For Startups

- **Ship Faster:** Code review in minutes, not hours
- **Reduce Costs:** 90% cheaper than senior engineers
- **Scale Knowledge:** Document tribal knowledge
- **Stay Compliant:** Audit trails for SOC 2

---

## Why Teams Choose Ultra-Dex

> "We were using Claude plugins but hit scaling issues. Ultra-Dex gives us the same experience with provider choice and enterprise governance."
> **— CTO, Series B SaaS**

> "The automatic fallback saved us during the OpenAI outage. Our team didn't even notice."
> **— VP Engineering, Fintech**

> "Self-hosting was non-negotiable for SOC 2. Ultra-Dex was the only solution that checked all boxes."
> **— Head of Data, Healthcare**

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SKILL LAYER (20 Skills)                  │
│  /code-review  /sql-queries  /architecture  /build-dashboard  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              CONNECTOR LAYER (18 Connectors)                 │
│  GitHub  Slack  Notion  Snowflake  PagerDuty  Datadog        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              AI ROUTER (10+ Providers)                       │
│  Claude  GPT-4o  DeepSeek  Groq  Llama  Gemini             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              CORE SERVICES                                   │
│  Memory  Governance  Observability  Billing                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Getting Started

```bash
# Install
npm install -g ultra-dex

# Configure connectors
ultra-dex connect github --token $GITHUB_TOKEN
ultra-dex connect slack --token $SLACK_TOKEN
ultra-dex connect snowflake --account $SF_ACCOUNT

# Run a skill
ultra-dex skill /code-review --pr https://github.com/acme/app/pull/123

# Or use the API
curl -X POST https://api.ultra-dex.io/v1/skills/code-review \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"prUrl": "...", "focus": ["security"]}'
```

---

## FAQ

**Q: How is this different from Claude plugins?**
A: Same 20 skills, but works with any AI provider. Plus enterprise features like SSO, audit logs, and self-hosting.

**Q: Can I use my own API keys?**
A: Yes. Bring your own Claude, OpenAI, DeepSeek keys.

**Q: Is my data used to train models?**
A: No. Self-hosted option means your data never leaves your infrastructure.

**Q: Can I create custom skills?**
A: Yes. Use our SDK to define skills, agents, and connectors.

**Q: What about HIPAA/GDPR compliance?**
A: Self-hosted option + audit trails + data classification = compliance ready.

---

## Backed By

[YC Logo] [Sequoia Logo] [Andreessen Logo]

_"The future of AI is model-agnostic. Ultra-Dex is building the platform that makes it possible."_
**— Partner, Sequoia Capital**

---

## Ready to Scale Your AI Workforce?

[Start Free Trial] [Schedule Demo] [View Documentation]

_14-day free trial. No credit card required._

---

**Ultra-Dex** — Model-agnostic AI for the enterprise.
