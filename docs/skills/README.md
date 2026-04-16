# Cowrk Plugins — Skills Registry

> Model-agnostic skill definitions for Ultra-Dex agents.
> Any AI agent (Claude, GPT, Nemotron, Llama, Gemini) can read this file to understand available skills and when to use them.

## Structure

```
docs/skills/              ← Skill DEFINITIONS (you are here)
  engineering/            10 skills, 10 connectors
  product-management/      9 skills, 16 connectors
  design/                  7 skills,  9 connectors
  pdf-viewer/              5 skills,  1 connector
  data/                   10 skills,  8 connectors
  marketing/               8 skills, 13 connectors
  sales/                   9 skills, 14 connectors
  legal/                   9 skills,  8 connectors
  finance/                 8 skills,  7 connectors
  slack-by-salesforce/     7 skills,  1 connector
  productivity/            4 skills, 10 connectors

docs/skills-reports/      ← Skill OUTPUT REPORTS (generated documents)
docs/CONNECTORS.md        ← MCP connector reference
```

**Totals: 11 plugins, 86 skills, 97 connectors**

---

## How to Use This File

- **For AI agents**: Include this file in your system prompt or context window. Use the skill definitions to determine which capabilities to invoke for a given task.
- **For orchestrators**: Parse the blocks below to build a skill routing table.
- **For humans**: Reference this when configuring agent workflows or onboarding new team members.

---

## Skill Priority Tiers

### TIER 1 — Active Now

#### Engineering (10 skills)
Streamline engineering workflows — standups, code review, architecture decisions, incident response, and technical documentation.

| Skill | Description |
|-------|-------------|
| `/architecture` | Create or evaluate an architecture decision record (ADR) |
| `/code-review` | Review code changes for security, performance, and correctness |
| `/debug` | Structured debugging session — reproduce, isolate, diagnose, and fix |
| `/deploy-checklist` | Pre-deployment verification checklist |
| `/documentation` | Write and maintain technical documentation |
| `/incident-response` | Run an incident response workflow — triage, communicate, and write postmortem |
| `/standup` | Generate a standup update from recent activity |
| `/system-design` | Design systems, services, and architectures |
| `/tech-debt` | Identify, categorize, and prioritize technical debt |
| `/testing-strategy` | Design test strategies and test plans |

**Connectors:** slack, linear, asana, atlassian, notion, github, pagerduty, datadog, google-calendar, gmail

---

#### Product Management (9 skills)
Write feature specs, plan roadmaps, and synthesize user research faster. Keep stakeholders updated and stay ahead of the competitive landscape.

| Skill | Description |
|-------|-------------|
| `/competitive-brief` | Create a competitive analysis brief for one or more competitors or a feature area |
| `/metrics-review` | Review and analyze product metrics with trend analysis and actionable insights |
| `/product-brainstorming` | Brainstorm product ideas, explore problem spaces, and challenge assumptions as a thinking partner |
| `/roadmap-update` | Update, create, or reprioritize your product roadmap |
| `/sprint-planning` | Plan a sprint — scope work, estimate capacity, set goals, and draft a sprint plan |
| `/stakeholder-update` | Generate a stakeholder update tailored to audience and cadence |
| `/synthesize-research` | Synthesize user research from interviews, surveys, and feedback into structured insights |
| `/write-spec` | Write a feature spec or PRD from a problem statement or feature idea |
| `/brainstorm` | Brainstorm a product idea, problem space, or strategic question with a sharp thinking partner |

**Connectors:** slack, linear, asana, monday, clickup, atlassian, notion, figma, amplitude, amplitude-eu, pendo, intercom, fireflies, google-calendar, gmail, similarweb

---

#### Design (7 skills)
Accelerate design workflows — critique, design system management, UX writing, accessibility audits, research synthesis, and dev handoff.

| Skill | Description |
|-------|-------------|
| `/accessibility-review` | Run a WCAG 2.1 AA accessibility audit on a design or page |
| `/design-critique` | Get structured design feedback on usability, hierarchy, and consistency |
| `/design-handoff` | Generate developer handoff specs from a design |
| `/design-system` | Audit, document, or extend your design system |
| `/research-synthesis` | Synthesize user research into themes, insights, and recommendations |
| `/user-research` | Plan, conduct, and synthesize user research |
| `/ux-copy` | Write or review UX copy — microcopy, error messages, empty states, CTAs |

**Connectors:** slack, figma, linear, asana, atlassian, notion, intercom, google-calendar, gmail

---

#### PDF Viewer (5 skills)
View, annotate, and sign PDFs in a live interactive viewer.

| Skill | Description |
|-------|-------------|
| `/view-pdf` | Interactive PDF viewer for visual collaboration |
| `/annotate` | Collaboratively annotate a PDF — propose markup, review together, iterate |
| `/fill-form` | Fill PDF form fields interactively with live visual feedback |
| `/open` | Open a PDF in the interactive viewer |
| `/sign` | Place a signature or initials image on a PDF |

**Connectors:** pdf

---

#### Data (10 skills)
Write SQL, explore datasets, and generate insights faster. Build visualizations and dashboards, and turn raw data into clear stories for stakeholders.

| Skill | Description |
|-------|-------------|
| `/analyze` | Answer data questions — from quick lookups to full analyses |
| `/build-dashboard` | Build an interactive HTML dashboard with charts, filters, and tables |
| `/create-viz` | Create publication-quality visualizations with Python |
| `/data-context-extractor` | Generate or improve a company-specific data analysis skill by extracting tribal knowledge |
| `/data-visualization` | Create effective data visualizations with Python (matplotlib, seaborn, plotly) |
| `/explore-data` | Profile and explore a dataset to understand its shape, quality, and patterns |
| `/sql-queries` | Write correct, performant SQL across all major data warehouse dialects |
| `/statistical-analysis` | Apply statistical methods including descriptive stats, trend analysis, outlier detection, and hypothesis testing |
| `/validate-data` | QA an analysis before sharing — methodology, accuracy, and bias checks |
| `/write-query` | Write optimized SQL for your dialect with best practices |

**Connectors:** snowflake, databricks, bigquery, hex, amplitude, amplitude-eu, atlassian, definite

---

### TIER 2 — Next Stage (Install at Milestone)

#### Marketing (8 skills)
Create content, plan campaigns, and analyze performance across marketing channels.

| Skill | Description |
|-------|-------------|
| `/brand-review` | Review content against your brand voice, style guide, and messaging pillars |
| `/campaign-plan` | Generate a full campaign brief with objectives, audience, messaging, channel strategy |
| `/competitive-brief` | Research competitors and generate a positioning and messaging comparison |
| `/content-creation` | Draft marketing content across channels |
| `/draft-content` | Draft blog posts, social media, email newsletters, landing pages, press releases, and case studies |
| `/email-sequence` | Design and draft multi-email sequences with full copy, timing, branching logic |
| `/performance-report` | Build a marketing performance report with key metrics, trend analysis, and recommendations |
| `/seo-audit` | Run a comprehensive SEO audit — keyword research, on-page analysis, content gaps |

**Connectors:** slack, canva, figma, hubspot, amplitude, amplitude-eu, notion, ahrefs, similarweb, klaviyo, supermetrics, google-calendar, gmail
**Install when:** Public launch or content marketing begins

---

#### Sales (9 skills)
Prospect, craft outreach, and build deal strategy faster.

| Skill | Description |
|-------|-------------|
| `/account-research` | Research a company or person and get actionable sales intel |
| `/call-prep` | Prepare for a sales call with account context, attendee research, and suggested agenda |
| `/call-summary` | Process call notes or a transcript — extract action items, draft follow-up email |
| `/competitive-intelligence` | Research your competitors and build an interactive battlecard |
| `/create-an-asset` | Generate tailored sales assets (landing pages, decks, one-pagers, workflow demos) |
| `/daily-briefing` | Start your day with a prioritized sales briefing |
| `/draft-outreach` | Research a prospect then draft personalized outreach |
| `/forecast` | Generate a weighted sales forecast with best/likely/worst scenarios |
| `/pipeline-review` | Analyze pipeline health — prioritize deals, flag risks, get a weekly action plan |

**Connectors:** slack, hubspot, close, clay, zoominfo, notion, atlassian, fireflies, ms365, apollo, outreach, google-calendar, gmail, similarweb
**Install when:** First paying customers or enterprise leads

---

#### Legal (9 skills)
Speed up contract review, NDA triage, and compliance workflows for in-house legal teams.

| Skill | Description |
|-------|-------------|
| `/brief` | Generate contextual briefings for legal work — daily summary, topic research, or incident response |
| `/compliance-check` | Run a compliance check on a proposed action, product feature, or business initiative |
| `/legal-response` | Generate a response to a common legal inquiry using configured templates |
| `/legal-risk-assessment` | Assess and classify legal risks using a severity-by-likelihood framework |
| `/meeting-briefing` | Prepare structured briefings for meetings with legal relevance |
| `/review-contract` | Review a contract against your organization's negotiation playbook |
| `/signature-request` | Prepare and route a document for e-signature |
| `/triage-nda` | Rapidly triage an incoming NDA and classify it as GREEN/YELLOW/RED |
| `/vendor-check` | Check the status of existing agreements with a vendor across all connected systems |

**Connectors:** slack, box, egnyte, atlassian, ms365, docusign, google-calendar, gmail
**Install when:** Real contracts, partnerships, or legal filings needed

---

#### Finance (8 skills)
Streamline finance and accounting workflows, from journal entries and reconciliation to financial statements and variance analysis.

| Skill | Description |
|-------|-------------|
| `/audit-support` | Support SOX 404 compliance with control testing methodology, sample selection, and documentation |
| `/close-management` | Manage the month-end close process with task sequencing, dependencies, and status tracking |
| `/financial-statements` | Generate financial statements with period-over-period comparison and variance analysis |
| `/journal-entry` | Prepare journal entries with proper debits, credits, and supporting detail |
| `/journal-entry-prep` | Prepare journal entries with proper debits, credits, and supporting documentation for month-end close |
| `/reconciliation` | Reconcile accounts by comparing GL balances to subledgers, bank statements, or third-party data |
| `/sox-testing` | Generate SOX sample selections, testing workpapers, and control assessments |
| `/variance-analysis` | Decompose financial variances into drivers with narrative explanations and waterfall analysis |

**Connectors:** snowflake, databricks, bigquery, slack, ms365, google-calendar, gmail
**Install when:** Managing actual revenue or preparing fundraising materials

---

#### Slack by Salesforce (7 skills)
Official Slack MCP server for interactive and collaborative workflows.

| Skill | Description |
|-------|-------------|
| `/slack-messaging` | Guidance for composing well-formatted, effective Slack messages using mrkdwn syntax |
| `/slack-search` | Guidance for effectively searching Slack to find messages, files, channels, and people |
| `/channel-digest` | Get a digest of recent activity across multiple Slack channels |
| `/draft-announcement` | Draft a well-formatted Slack announcement and save it as a draft |
| `/find-discussions` | Find discussions about a specific topic across Slack channels |
| `/standup` | Generate a standup update based on your recent Slack activity |
| `/summarize-channel` | Summarize recent activity in a Slack channel |

**Connectors:** slack
**Install when:** Team grows to 3+ people and Slack is the communication hub

---

#### Productivity (4 skills)
Manage tasks, plan your day, and build up memory of important context about your work.

| Skill | Description |
|-------|-------------|
| `/memory-management` | Two-tier memory system that makes Claude a true workplace collaborator |
| `/start` | Initialize the productivity system and open the dashboard |
| `/task-management` | Simple task management using a shared TASKS.md file |
| `/update` | Sync tasks and refresh memory from your current activity |

**Connectors:** slack, notion, asana, linear, atlassian, ms365, monday, clickup, google-calendar, gmail
**Install when:** Calendar/task management overhead becomes a bottleneck

---

### TIER 3 — Not Needed (Do Not Install)

| Skill | Reason to Skip |
|-------|---------------|
| Zoom | Meeting summaries are overhead, not output. Ship code instead. |
| Common Room | Community analytics — no community to analyze yet. |
| Apollo | Sales prospecting — building phase, not cold-emailing phase. |
| Brand Voice | The product IS the brand. Code quality > brand guidelines. |
| Enterprise Search | Internal knowledge base — you are the knowledge base. |
| Customer Support | No customers to support yet. |
| Human Resources | Solo/tiny team — HR tooling is pure overhead. |
| Bio Research | Irrelevant domain entirely. |
| Operations | Process optimization for teams that don't exist yet. |

---

## Skill Routing Rules

For any AI agent or orchestrator consuming this file:

```
IF task involves code/architecture/debugging       → use Engineering
IF task involves planning/roadmap/priorities        → use Product Management
IF task involves UI/UX/visual/frontend              → use Design
IF task involves PDF/document reading               → use PDF Viewer
IF task involves metrics/analytics/data/SQL         → use Data
IF task involves content/campaigns/SEO              → use Marketing
IF task involves prospects/pipeline/outreach         → use Sales
IF task involves contracts/NDA/compliance            → use Legal
IF task involves accounting/journal entries/close    → use Finance
IF task involves Slack messaging/search              → use Slack by Salesforce
IF task involves tasks/memory/daily planning         → use Productivity
IF task matches a Tier 3 skill                       → SKIP, explain why
```

## Integration Points

- **Ultra-Dex AgentOrchestrator**: Read this file to inform agent selection
- **MCP Server**: Expose Tier 1 skills as available tools
- **CLI Commands**: Map skills to `ultra-dex run --agent <skill>` options
- **Dashboard**: Show active skills and their usage stats

---

## Versioning

- **v1.0** — 2026-04-16 — Initial registry, 5 active / 6 staged / 9 excluded
- **v1.1** — 2026-04-17 — Full skill lists added, frontmatter standardized, CONNECTORS.md created, 86 skills documented
