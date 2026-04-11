# V2.0 PHASE 4 DISPATCHES — ECOSYSTEM (Months 7-12)
> Source: V2.0 Strategic Plan + /engineering:architecture + /engineering:tech-debt
> Depends: Phase 3 COMPLETE (VSCode extension, Plugin system, Team/RBAC, Perf optimized)
> Skills Used: /engineering:architecture, /engineering:tech-debt, /engineering:system-design

---

## PHASE OVERVIEW

**Thesis:** Build the ecosystem that makes Ultra-Dex self-sustaining. Web dashboard for non-CLI users. Community marketplace for plugins/agents. Certification program for enterprise credibility. Enterprise sales motion for revenue. This phase transitions Ultra-Dex from a tool to a platform.

**Success Gate:**
```bash
# Web dashboard runs
open http://localhost:3000 → Dashboard with task history, agent metrics, cost analytics
# Marketplace live
ultra-dex marketplace search "security" → community agents found
ultra-dex marketplace publish ./my-plugin → published to registry
# Certification
ultra-dex certify --level practitioner → runs assessment, issues certificate
# Enterprise
ultra-dex enterprise init → SSO config, audit setup, dedicated support channel
```

**Total Windows:** 20 (4 per week × 5 weeks)
**Parallel Safe:** All windows within same week

---

## ═══════════════════════════════════════════════
## WEEK 13: WEB DASHBOARD — CORE
## ═══════════════════════════════════════════════

### Week 13 Parallel: W49, W50, W51, W52
### Gate: Dashboard serves at localhost:3000, shows task history and agent status

---

### [WINDOW 49] CLAUDE — claude-opus-4
Task ID: V20-W49-DASHBOARD-ARCHITECTURE
Objective: Design and scaffold web dashboard — Next.js app with API routes bridging Ultra-Dex core
Target Files: apps/dashboard/app/layout.tsx (NEW), apps/dashboard/app/page.tsx (NEW), apps/dashboard/lib/api.ts (NEW)
Why this lane: Dashboard architecture must correctly bridge CLI core to web. Opus for API design.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Design and scaffold Ultra-Dex web dashboard.

   SCAFFOLD apps/dashboard/ as Next.js 14 app:

   1) app/layout.tsx:
      - Root layout with sidebar navigation
      - Theme: dark mode default, light mode toggle
      - Sidebar: Dashboard, Tasks, Agents, Memory, Plugins, Team, Settings

   2) app/page.tsx — Dashboard home:
      - KPI cards: Total tasks, Success rate, Avg cost, Active agents
      - Recent tasks timeline (last 24h)
      - Provider usage pie chart
      - Cost trend line chart (last 30 days)

   3) lib/api.ts — Ultra-Dex bridge:
      - UltraDexClient class (wraps CLI core as library, not subprocess)
      - getTasks(filters): Task history from memory
      - getAgents(): Available agents with status
      - getProviderStats(): Cost, latency, success per provider
      - getMemoryEntries(query): Semantic search
      - runTask(prompt, options): Execute task, return streaming result
      - Import directly from src/index.js (monorepo co-location)

   4) lib/websocket.ts — Real-time updates:
      - WebSocket server for live task progress
      - Event types: task.started, task.progress, task.completed, task.failed
      - Auto-reconnect on client side

   Use: Next.js 14 App Router, Tailwind CSS, shadcn/ui components.
   Package.json with scripts: dev, build, start."
```
Expected Output: Complete Next.js dashboard scaffold with API bridge
Validation:
```bash
cd apps/dashboard && npm install && npm run build
# Verify: build succeeds, no type errors
```
Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Scaffold Next.js dashboard..."`
Fallback #2: `codex --full-auto -m o1 exec "Create Next.js dashboard for Ultra-Dex..."`
Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Scaffold Next.js 14 dashboard..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 50] CLAUDE — claude-sonnet-4-20250514
Task ID: V20-W50-DASHBOARD-PAGES
Objective: Build dashboard pages — Tasks, Agents, Memory, Cost Analytics
Target Files: apps/dashboard/app/tasks/page.tsx (NEW), apps/dashboard/app/agents/page.tsx (NEW), apps/dashboard/app/memory/page.tsx (NEW), apps/dashboard/app/analytics/page.tsx (NEW)
Why this lane: Page implementation — Sonnet for balanced React component generation.
Power Tier: BALANCED
Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Build Ultra-Dex dashboard pages.

   CREATE apps/dashboard/app/tasks/page.tsx:
   - Task list with filters (status, agent, date range, provider)
   - Task detail view: prompt, output, cost, duration, agent used
   - Real-time status for running tasks (WebSocket)
   - Retry failed tasks button
   - Export task history as CSV

   CREATE apps/dashboard/app/agents/page.tsx:
   - Agent cards: role, model, capabilities, status, total tasks
   - Agent detail: task history, success rate, avg cost
   - Agent configuration: change model, adjust prompt
   - Plugin agents section (from installed plugins)

   CREATE apps/dashboard/app/memory/page.tsx:
   - Semantic search bar with results
   - Memory browser: L1/L2/L3 tier tabs
   - Memory entry detail: content, metadata, embeddings visualization
   - Bulk operations: export, import, clear tier

   CREATE apps/dashboard/app/analytics/page.tsx:
   - Cost breakdown by provider (bar chart)
   - Cost trend over time (line chart)
   - Token usage by model (stacked area)
   - ROI calculator: estimated savings vs single provider
   - Routing decisions heatmap (which provider for which task type)

   Use recharts for charts, shadcn/ui for components, Tailwind for styling."
```
Expected Output: 4 dashboard pages with full functionality
Validation:
```bash
cd apps/dashboard && npm run build
# Verify: all pages build, no hydration errors
```
Fallback #1: `gemini -y -p "Build dashboard pages for Ultra-Dex..."`
Fallback #2: `codex --full-auto -m gpt-4o exec "Create dashboard pages with charts..."`
Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Build Next.js dashboard pages..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 51] GEMINI — gemini-2.5-pro
Task ID: V20-W51-DASHBOARD-TESTS
Objective: Write tests for dashboard components and API routes
Target Files: apps/dashboard/__tests__/api.test.ts (NEW), apps/dashboard/__tests__/pages.test.tsx (NEW)
Why this lane: Test generation — Gemini for comprehensive coverage at free tier.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Write tests for Ultra-Dex web dashboard.

   CREATE apps/dashboard/__tests__/api.test.ts:
   - Test UltraDexClient.getTasks() returns task history
   - Test UltraDexClient.getAgents() returns agent list
   - Test UltraDexClient.runTask() executes and streams
   - Test WebSocket connection and event handling
   - Mock Ultra-Dex core imports

   CREATE apps/dashboard/__tests__/pages.test.tsx:
   - Test Dashboard home renders KPI cards
   - Test Tasks page filters work
   - Test Agents page shows all agents
   - Test Memory page semantic search returns results
   - Test Analytics page renders charts
   - Use @testing-library/react for component tests

   CREATE apps/dashboard/__tests__/e2e.test.ts:
   - Playwright e2e: navigate to each page
   - Verify no JS errors in console
   - Verify API responses mock correctly
   - Test dark/light theme toggle"
```
Expected Output: Unit tests, component tests, e2e tests for dashboard
Validation:
```bash
cd apps/dashboard && npm test
# Verify: all tests pass
```
Fallback #1: `gemini -y --model gemini-2.5-flash -p "Write dashboard tests..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Write dashboard tests..."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Write Next.js dashboard tests..."`
Cost Class: FREE

---

### [WINDOW 52] QWEN — qwen-max
Task ID: V20-W52-DASHBOARD-DEPLOY
Objective: Create Docker deployment config and deployment documentation for dashboard
Target Files: apps/dashboard/Dockerfile (NEW), apps/dashboard/docker-compose.yml (NEW), docs/dashboard/deployment.md (NEW)
Why this lane: Deployment config and docs — Qwen for template generation.
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Create deployment configuration for Ultra-Dex dashboard.

   1) apps/dashboard/Dockerfile:
      - Multi-stage build: install → build → production
      - Base: node:20-alpine
      - Output: standalone Next.js output
      - Expose port 3000

   2) apps/dashboard/docker-compose.yml:
      - dashboard service (port 3000)
      - redis service (for session + cache)
      - postgres service (for persistent data)
      - Environment variables: ULTRA_DEX_HOME, REDIS_URL, DATABASE_URL

   3) docs/dashboard/deployment.md:
      - Local development setup
      - Docker deployment (single command)
      - Cloud deployment (Vercel, Railway, Fly.io)
      - Environment variables reference
      - Reverse proxy config (nginx)
      - SSL/TLS setup
      - Monitoring and health checks"
```
Expected Output: Dockerfile, docker-compose.yml, deployment docs
Validation:
```bash
cd apps/dashboard && docker build -t ultra-dex-dashboard .
# Verify: image builds successfully
```
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Fix dashboard Docker config..."`
Fallback #2: `gemini -y --model gemini-2.5-flash -p "Create Docker deployment for Next.js dashboard..."`
Fallback #3: `opencode run -m opencode/llama-3.1-70b-instruct -p "Create Docker deployment for Next.js app..."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## WEEK 14: COMMUNITY MARKETPLACE
## ═══════════════════════════════════════════════

### Week 14 Parallel: W53, W54, W55, W56
### Gate: `ultra-dex marketplace search` returns results, `ultra-dex marketplace publish` works

---

### [WINDOW 53] CLAUDE — claude-opus-4
Task ID: V20-W53-MARKETPLACE-BACKEND
Objective: Build marketplace backend — plugin registry API, search, versioning, downloads
Target Files: src/core/marketplace/registry-api.ts (NEW), src/core/marketplace/search.ts (NEW), src/core/marketplace/versioning.ts (NEW)
Why this lane: Marketplace backend is the ecosystem foundation. Opus for correct API design and security.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Build Ultra-Dex community marketplace backend.

   CREATE src/core/marketplace/registry-api.ts:
   - MarketplaceAPI class:
     - publish(manifest, tarball): Upload plugin to registry
       - Validate manifest, check name availability
       - Store tarball (S3-compatible or local filesystem)
       - Index metadata for search
     - download(name, version?): Fetch plugin tarball
     - getMetadata(name): Plugin info, versions, downloads, ratings
     - search(query, filters): Full-text search across plugins
     - listCategories(): Predefined categories (coding, testing, devops, etc.)
     - Auth: API key per publisher, rate limiting

   CREATE src/core/marketplace/search.ts:
   - MarketplaceSearch:
     - indexPlugin(metadata): Add to search index
     - search(query, filters): Full-text + faceted search
     - Filters: category, author, minVersion, sortBy (downloads, rating, recent)
     - Backend: SQLite FTS5 for local, Postgres full-text for hosted
     - Ranking: downloads × recency × rating

   CREATE src/core/marketplace/versioning.ts:
   - SemverManager:
     - validateVersion(version): semver validation
     - resolveRange(name, range): Find best matching version
     - checkCompatibility(pluginVersion, ultraDexVersion): Min version check
     - getChangelog(name, from, to): Diff between versions

   Initial registry: self-hosted (filesystem-backed), with migration path to hosted API."
```
Expected Output: Marketplace backend with registry, search, versioning
Validation:
```bash
npm run typecheck
npm test -- tests/core/marketplace/
# Verify: publish/download cycle works, search returns results
```
Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Build marketplace registry API..."`
Fallback #2: `codex --full-auto -m o1 exec "Implement plugin marketplace backend..."`
Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Build marketplace registry with search and versioning..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 54] CLAUDE — claude-sonnet-4-20250514
Task ID: V20-W54-MARKETPLACE-CLI
Objective: Build marketplace CLI commands — search, install, publish, rate, update
Target Files: apps/cli/lib/commands/marketplace.js (NEW)
Why this lane: CLI integration — Sonnet for balanced Commander.js wiring.
Power Tier: BALANCED
Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Add marketplace CLI commands to Ultra-Dex.

   CREATE apps/cli/lib/commands/marketplace.js:
   - ultra-dex marketplace search <query> [--category] [--sort downloads|rating|recent]
     Output: table of results (name, description, downloads, rating, version)
   - ultra-dex marketplace install <name> [--version]
     Download → validate → install to plugins directory
   - ultra-dex marketplace uninstall <name>
   - ultra-dex marketplace publish <dir>
     Validate manifest → pack tarball → upload to registry
     Requires: ULTRA_DEX_MARKETPLACE_TOKEN env var
   - ultra-dex marketplace rate <name> --stars <1-5> [--review 'text']
   - ultra-dex marketplace info <name>
     Show: description, author, versions, dependencies, install count
   - ultra-dex marketplace update [name|--all]
     Check for updates, install latest compatible versions

   Wire into apps/cli/bin/ultra-dex.js.
   Include interactive confirmations for publish and uninstall."
```
Expected Output: Full marketplace CLI with search, install, publish, rate
Validation:
```bash
npm start -- marketplace --help
npm start -- marketplace search --help
# Verify: all subcommands register correctly
```
Fallback #1: `gemini -y -p "Add marketplace CLI commands..."`
Fallback #2: `codex --full-auto -m gpt-4o exec "Build marketplace CLI..."`
Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Create marketplace CLI commands..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 55] GEMINI — gemini-2.5-pro
Task ID: V20-W55-MARKETPLACE-WEB
Objective: Build marketplace web UI as dashboard page — browse, search, install, publish
Target Files: apps/dashboard/app/marketplace/page.tsx (NEW), apps/dashboard/app/marketplace/[name]/page.tsx (NEW)
Why this lane: Web UI generation — Gemini for multi-component React pages.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Build marketplace web UI for Ultra-Dex dashboard.

   CREATE apps/dashboard/app/marketplace/page.tsx:
   - Hero: 'Ultra-Dex Plugin Marketplace' with search bar
   - Category filter sidebar (coding, testing, devops, security, docs)
   - Plugin cards grid: icon, name, description, downloads, rating, install button
   - Sort: trending, most downloaded, highest rated, newest
   - Pagination (20 per page)

   CREATE apps/dashboard/app/marketplace/[name]/page.tsx:
   - Plugin detail page:
     - Header: name, author, version, install count, rating stars
     - Tabs: Overview (README rendered), Versions, Reviews, Dependencies
     - Install button (triggers CLI install via API)
     - Rating/review form
     - Version history with changelogs

   Use shadcn/ui Card, Badge, Button, Input, Tabs components.
   Server components where possible, client for interactive parts."
```
Expected Output: Marketplace browse and detail pages
Validation:
```bash
cd apps/dashboard && npm run build
# Verify: marketplace pages compile and render
```
Fallback #1: `gemini -y --model gemini-2.5-flash -p "Build marketplace web pages..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Build marketplace UI..."`
Fallback #3: `opencode run -m opencode/llama-3.1-70b-instruct -p "Build marketplace React pages..."`
Cost Class: FREE

---

### [WINDOW 56] QWEN — qwen-max
Task ID: V20-W56-MARKETPLACE-SEED
Objective: Create 10 seed plugins and marketplace documentation
Target Files: plugins/seed/ (NEW, 10 plugin dirs), docs/marketplace/publishing-guide.md (NEW)
Why this lane: Volume content generation — Qwen for repetitive plugin scaffolding.
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Create 10 seed plugins and marketplace docs for Ultra-Dex.

   CREATE plugins/seed/ with 10 plugin directories:
   1) security-auditor — Scans code for vulnerabilities
   2) api-documenter — Auto-generates API docs from code
   3) performance-profiler — Profiles and suggests optimizations
   4) database-migrator — Generates and validates DB migrations
   5) dependency-updater — Checks and updates npm dependencies
   6) code-reviewer — Multi-pass code review agent
   7) test-generator — Generates unit tests from source
   8) changelog-writer — Generates CHANGELOG from git history
   9) i18n-extractor — Extracts strings for internationalization
   10) accessibility-checker — Audits frontend for a11y

   Each plugin: agent.json + prompt.md + README.md (minimal, valid manifest)

   CREATE docs/marketplace/publishing-guide.md:
   - Plugin format specification
   - Step-by-step publishing walkthrough
   - Best practices for plugin design
   - Versioning and compatibility guide
   - Review and moderation policy"
```
Expected Output: 10 seed plugins + publishing guide
Validation:
```bash
ls plugins/seed/ | wc -l
# Verify: 10 plugin directories, each with valid agent.json
```
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Recreate seed plugins..."`
Fallback #2: `gemini -y --model gemini-2.5-flash -p "Create 10 seed plugins..."`
Fallback #3: `opencode run -m opencode/llama-3.3-70b-instruct -p "Create 10 seed plugin scaffolds..."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## WEEK 15: CERTIFICATION & ENTERPRISE SALES
## ═══════════════════════════════════════════════

### Week 15 Parallel: W57, W58, W59, W60
### Gate: Certification CLI works, Enterprise init creates config, pricing page renders

---

### [WINDOW 57] CLAUDE — claude-opus-4
Task ID: V20-W57-CERTIFICATION-ENGINE
Objective: Build certification assessment engine — skill evaluation, scoring, certificate generation
Target Files: src/core/certification/engine.ts (NEW), src/core/certification/assessments.ts (NEW), src/core/certification/certificate.ts (NEW)
Why this lane: Assessment design requires careful rubric creation. Opus for correctness.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Build Ultra-Dex certification engine.

   CREATE src/core/certification/engine.ts:
   - CertificationEngine class:
     - startAssessment(level): Begin timed assessment
     - evaluateResponse(questionId, response): Score using rubric
     - calculateResult(): Final score, pass/fail, breakdown
     - Levels: practitioner, architect, expert
     - Time limits: 30min, 60min, 90min respectively

   CREATE src/core/certification/assessments.ts:
   - Question bank per level:
     Practitioner (20 questions):
       - CLI usage, agent selection, basic routing, memory basics
     Architect (30 questions):
       - Multi-agent orchestration, provider optimization, plugin design
       - Scenario: design a swarm for X, optimize routing for Y
     Expert (40 questions):
       - Custom provider integration, governance policies, enterprise setup
       - Live coding: write a plugin, configure team workspace
   - Scoring rubrics per question type (multiple choice, code, scenario)

   CREATE src/core/certification/certificate.ts:
   - generateCertificate(userId, level, score): Create signed certificate
     - PDF output with: name, level, date, score, UUID
     - Digital signature (ed25519 key pair)
     - Verification URL: ultra-dex.dev/verify/{uuid}
   - verifyCertificate(uuid): Check validity"
```
Expected Output: Certification engine with assessments, scoring, certificate generation
Validation:
```bash
npm run typecheck
npm test -- tests/core/certification/
# Verify: assessment flow works, scoring correct, certificate generates
```
Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Build certification engine..."`
Fallback #2: `codex --full-auto -m o1 exec "Implement certification assessment system..."`
Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Build certification assessment engine with scoring..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 58] CLAUDE — claude-sonnet-4-20250514
Task ID: V20-W58-ENTERPRISE-INIT
Objective: Build enterprise initialization — SSO config, dedicated support, SLA management
Target Files: src/core/enterprise/init.ts (NEW), src/core/enterprise/sso.ts (NEW), src/core/enterprise/sla.ts (NEW)
Why this lane: Enterprise features — Sonnet for balanced implementation.
Power Tier: BALANCED
Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Build Ultra-Dex enterprise initialization system.

   CREATE src/core/enterprise/init.ts:
   - EnterpriseInit class:
     - initialize(config): Set up enterprise workspace
       - Validate license key
       - Configure SSO provider
       - Set up audit trail with compliance level
       - Initialize dedicated support channel
       - Apply enterprise governance policies
     - getStatus(): Current enterprise config status
     - upgrade(tier): Free → Pro → Enterprise tier migration

   CREATE src/core/enterprise/sso.ts:
   - SSOProvider interface:
     - authenticate(token): Validate SSO token
     - getUser(token): Extract user info
     - refreshToken(token): Refresh expired token
   - Implementations:
     - OktaSSO: Okta SAML/OIDC
     - AzureADSSO: Azure AD integration
     - Auth0SSO: Auth0 integration
     - GenericOIDC: Any OIDC provider

   CREATE src/core/enterprise/sla.ts:
   - SLAManager:
     - tiers: { free: {}, pro: { uptime: 99.5 }, enterprise: { uptime: 99.9 } }
     - checkCompliance(): Verify current SLA metrics
     - getMetrics(): Uptime, response time, resolution time
     - alertOnBreach(callback): Notify when SLA at risk"
```
Expected Output: Enterprise init, SSO integrations, SLA management
Validation:
```bash
npm run typecheck
npm start -- enterprise --help
# Verify: enterprise commands register, SSO interfaces compile
```
Fallback #1: `gemini -y -p "Build enterprise initialization system..."`
Fallback #2: `codex --full-auto -m gpt-4o exec "Implement enterprise SSO and SLA..."`
Fallback #3: `opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Build enterprise SSO and SLA system..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 59] GEMINI — gemini-2.5-pro
Task ID: V20-W59-PRICING-LANDING
Objective: Build pricing page and landing page for Ultra-Dex website
Target Files: apps/dashboard/app/pricing/page.tsx (NEW), apps/dashboard/app/landing/page.tsx (NEW)
Why this lane: Marketing page generation — Gemini for structured content at free tier.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Build pricing and landing pages for Ultra-Dex.

   CREATE apps/dashboard/app/pricing/page.tsx:
   - Three-tier pricing:
     Free: CLI + 3 providers + basic memory + community support
     Pro (\$29/mo): All providers + advanced routing + team (5 seats) + plugins + email support
     Enterprise (custom): SSO + audit + SLA + unlimited seats + dedicated support + certification
   - Feature comparison table
   - FAQ section
   - CTA buttons per tier
   - Annual discount toggle (20% off)

   CREATE apps/dashboard/app/landing/page.tsx:
   - Hero: 'The AI Orchestration Platform' with terminal animation
   - Features grid: Multi-provider routing, Persistent memory, Agent marketplace, Team collaboration
   - Social proof: GitHub stars, npm downloads, testimonials
   - Code example: 3-line Ultra-Dex usage
   - Provider logos: OpenAI, Anthropic, Google, NVIDIA, Mistral, etc.
   - Footer: links, GitHub, Discord, docs

   Use Tailwind CSS, animations (framer-motion optional), responsive design."
```
Expected Output: Pricing page with 3 tiers, landing page with hero
Validation:
```bash
cd apps/dashboard && npm run build
# Verify: pages render, responsive on mobile/desktop
```
Fallback #1: `gemini -y --model gemini-2.5-flash -p "Build pricing and landing pages..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Build pricing page..."`
Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Create pricing and landing pages..."`
Cost Class: FREE

---

### [WINDOW 60] QWEN — qwen-max
Task ID: V20-W60-ENTERPRISE-DOCS
Objective: Write enterprise documentation — setup guide, SSO integration, compliance, SLA
Target Files: docs/enterprise/setup-guide.md (NEW), docs/enterprise/sso-integration.md (NEW), docs/enterprise/compliance.md (NEW)
Why this lane: Documentation volume — Qwen for free-tier doc generation.
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Write enterprise documentation for Ultra-Dex.

   1) docs/enterprise/setup-guide.md:
      - Enterprise initialization walkthrough
      - License key activation
      - Team workspace setup
      - Migration from free/pro to enterprise

   2) docs/enterprise/sso-integration.md:
      - Okta SAML setup (step-by-step with screenshots placeholders)
      - Azure AD OIDC setup
      - Auth0 configuration
      - Generic OIDC provider
      - Troubleshooting SSO issues

   3) docs/enterprise/compliance.md:
      - SOC2 compliance features
      - Audit trail configuration
      - Data retention policies
      - GDPR considerations
      - Export formats for auditors
      - SLA tiers and metrics"
```
Expected Output: 3 enterprise documentation files
Validation:
```bash
wc -l docs/enterprise/*.md
# Verify: each file >100 lines, covers all topics
```
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Rewrite enterprise docs..."`
Fallback #2: `gemini -y --model gemini-2.5-flash -p "Write enterprise documentation..."`
Fallback #3: `opencode run -m opencode/llama-3.1-70b-instruct -p "Write enterprise setup documentation..."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## WEEK 16: CERTIFICATION CLI & ENTERPRISE CLI
## ═══════════════════════════════════════════════

### Week 16 Parallel: W61, W62, W63, W64
### Gate: `ultra-dex certify` runs assessment, `ultra-dex enterprise init` configures workspace

---

### [WINDOW 61] CLAUDE — claude-sonnet-4-20250514
Task ID: V20-W61-CERTIFICATION-CLI
Objective: Build certification CLI commands and interactive assessment runner
Target Files: apps/cli/lib/commands/certify.js (NEW)
Why this lane: CLI with interactive prompts — Sonnet for balanced implementation.
Power Tier: BALANCED
Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Add certification CLI commands to Ultra-Dex.

   CREATE apps/cli/lib/commands/certify.js:
   - ultra-dex certify start --level practitioner|architect|expert
     Interactive: presents questions one at a time
     Timer display in terminal
     Code questions: open editor (EDITOR env var)
     Progress bar showing questions completed
   - ultra-dex certify status
     Show: current assessment progress, time remaining
   - ultra-dex certify result [assessment-id]
     Show: score breakdown by category, pass/fail, certificate link
   - ultra-dex certify verify <certificate-uuid>
     Verify: check signature, show certificate details
   - ultra-dex certify list
     Show: all certifications earned by current user

   Use inquirer.js for interactive prompts.
   Wire into apps/cli/bin/ultra-dex.js."
```
Expected Output: Certification CLI with interactive assessment
Validation:
```bash
npm start -- certify --help
npm start -- certify start --level practitioner --help
# Verify: commands register, help shows options
```
Fallback #1: `gemini -y -p "Add certification CLI commands..."`
Fallback #2: `codex --full-auto -m gpt-4o exec "Build certification CLI..."`
Fallback #3: `opencode run -m opencode/deepseek-v3.2 -p "Create certification CLI commands..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 62] GEMINI — gemini-2.5-pro
Task ID: V20-W62-ENTERPRISE-CLI
Objective: Build enterprise CLI commands — init, sso, sla, license
Target Files: apps/cli/lib/commands/enterprise.js (NEW)
Why this lane: Structured CLI generation — Gemini for command wiring.
Power Tier: BALANCED
Command:
```bash
gemini -y -p \
  "Add enterprise CLI commands to Ultra-Dex.

   CREATE apps/cli/lib/commands/enterprise.js:
   - ultra-dex enterprise init
     Interactive wizard:
     1) License key input and validation
     2) SSO provider selection (Okta, Azure AD, Auth0, OIDC)
     3) SSO configuration (client ID, secret, domain)
     4) Audit level (basic, standard, comprehensive)
     5) SLA tier display
   - ultra-dex enterprise status
     Show: license, SSO, audit, SLA metrics
   - ultra-dex enterprise sso test
     Test SSO connection, show user info
   - ultra-dex enterprise audit export --format csv|json|soc2 --from <date> --to <date>
   - ultra-dex enterprise sla check
     Show current SLA compliance metrics
   - ultra-dex enterprise license renew
   - ultra-dex enterprise support [message]
     Open support ticket or display support channel info

   Wire into apps/cli/bin/ultra-dex.js."
```
Expected Output: Enterprise CLI commands with init wizard
Validation:
```bash
npm start -- enterprise --help
# Verify: all subcommands listed
```
Fallback #1: `gemini -y --model gemini-2.5-flash -p "Build enterprise CLI commands..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Add enterprise CLI..."`
Fallback #3: `opencode run -m opencode/llama-3.1-70b-instruct -p "Create enterprise CLI commands..."`
Cost Class: FREE

---

### [WINDOW 63] CODEX — o1
Task ID: V20-W63-PHASE4-TESTS
Objective: Write comprehensive tests for marketplace, certification, enterprise, dashboard
Target Files: tests/core/marketplace/registry.test.ts (NEW), tests/core/certification/engine.test.ts (NEW), tests/core/enterprise/init.test.ts (NEW)
Why this lane: Test correctness for ecosystem features. Codex o1 for reasoning about scenarios.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o1 exec \
  "Write comprehensive tests for Ultra-Dex Phase 4 features.

   CREATE tests/core/marketplace/registry.test.ts:
   - Test publish → download cycle
   - Test search ranking (downloads × recency × rating)
   - Test version resolution with semver ranges
   - Test duplicate name rejection
   - Test rate limiting on publish
   - Test marketplace CLI integration

   CREATE tests/core/certification/engine.test.ts:
   - Test assessment start with timer
   - Test question scoring per rubric
   - Test pass/fail threshold per level
   - Test certificate generation with valid signature
   - Test certificate verification
   - Test time expiry fails assessment

   CREATE tests/core/enterprise/init.test.ts:
   - Test enterprise initialization flow
   - Test SSO authentication (mock Okta/Azure)
   - Test license key validation
   - Test SLA metric calculation
   - Test enterprise CLI commands register

   Use Node's built-in test runner (node --test).
   Mock external services (SSO providers, filesystem)."
```
Expected Output: Test suites for marketplace, certification, enterprise
Validation:
```bash
npm test -- tests/core/marketplace/ tests/core/certification/ tests/core/enterprise/
# Verify: all tests pass
```
Fallback #1: `codex --full-auto -m gpt-4o exec "Write Phase 4 tests..."`
Fallback #2: `claude --model claude-sonnet-4-20250514 --effort high -p "Write ecosystem tests..."`
Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Write Phase 4 feature tests..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 64] QWEN — qwen-plus
Task ID: V20-W64-CERTIFICATION-CONTENT
Objective: Write certification question bank — 90 questions across 3 levels with rubrics
Target Files: data/certifications/practitioner.json (NEW), data/certifications/architect.json (NEW), data/certifications/expert.json (NEW)
Why this lane: High-volume structured content — Qwen for repetitive JSON generation.
Power Tier: LOW
Command:
```bash
qwen --auth-type qwen-oauth --approval-mode yolo \
  "Create Ultra-Dex certification question bank.

   CREATE data/certifications/practitioner.json (20 questions):
   - 10 multiple choice (CLI usage, agent roles, provider basics)
   - 5 short answer (explain routing, describe memory tiers)
   - 5 code exercises (write ultra-dex commands for scenarios)
   - Each: { id, type, question, options?, correctAnswer, rubric, points, category }

   CREATE data/certifications/architect.json (30 questions):
   - 12 multiple choice (orchestration patterns, optimization strategies)
   - 8 scenario questions (design a swarm for X, optimize cost for Y)
   - 10 code exercises (write plugin manifest, configure team workspace)

   CREATE data/certifications/expert.json (40 questions):
   - 15 multiple choice (advanced routing, enterprise features)
   - 10 scenario questions (design enterprise deployment, incident response)
   - 10 code exercises (custom provider, governance policy, audit export)
   - 5 live coding (build a plugin from scratch, implement custom agent)

   Passing: practitioner 70%, architect 75%, expert 80%"
```
Expected Output: 90 certification questions in 3 JSON files
Validation:
```bash
node -e "const q=require('./data/certifications/practitioner.json'); console.log(q.length, 'questions')"
# Verify: 20 practitioner, 30 architect, 40 expert questions
```
Fallback #1: `qwen --auth-type qwen-oauth --approval-mode yolo "Regenerate certification questions..."`
Fallback #2: `gemini -y --model gemini-2.5-flash -p "Create certification question bank..."`
Fallback #3: `opencode run -m opencode/llama-3.3-70b-instruct -p "Generate certification assessment questions..."`
Cost Class: FREE

---

## ═══════════════════════════════════════════════
## WEEK 17: FINAL INTEGRATION & v6.0.0 RELEASE
## ═══════════════════════════════════════════════

### Week 17 Parallel: W65, W66, W67, W68
### Gate: All tests pass, full build clean, version 6.0.0 tagged, all ecosystem features working

---

### [WINDOW 65] CODEX — o1
Task ID: V20-W65-PHASE4-INTEGRATION
Objective: End-to-end integration test for entire Phase 4 — marketplace + certification + enterprise + dashboard
Target Files: tests/integration/phase4-e2e.test.ts (NEW)
Why this lane: Complex integration scenario reasoning. Codex o1 for multi-system test design.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o1 exec \
  "Write Phase 4 end-to-end integration test for Ultra-Dex.

   CREATE tests/integration/phase4-e2e.test.ts:

   SCENARIO 1: Marketplace Lifecycle
   - Publish a plugin to marketplace
   - Search for it, verify found
   - Install from marketplace
   - Run task using marketplace plugin
   - Rate the plugin
   - Uninstall, verify cleanup

   SCENARIO 2: Certification Flow
   - Start practitioner assessment
   - Answer all questions (use correct answers from bank)
   - Verify pass result
   - Generate certificate
   - Verify certificate signature

   SCENARIO 3: Enterprise Setup
   - Initialize enterprise workspace
   - Configure mock SSO
   - Create team with RBAC
   - Run task as team member
   - Export audit log
   - Check SLA metrics

   SCENARIO 4: Full Platform
   - Enterprise init → Team create → Install marketplace plugin →
     Run task → Verify memory → Check audit → Export compliance →
     Start certification → Verify all systems integrated

   Use MOCK_AI=true. Use Node's built-in test runner."
```
Expected Output: Comprehensive Phase 4 integration test
Validation:
```bash
MOCK_AI=true npm test -- tests/integration/phase4-e2e.test.ts
# Verify: all 4 scenarios pass
```
Fallback #1: `codex --full-auto -m gpt-4o exec "Write Phase 4 e2e test..."`
Fallback #2: `claude --model opus --effort max -p "Write Phase 4 integration test..."`
Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Write Phase 4 e2e integration tests..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 66] CLAUDE — claude-opus-4
Task ID: V20-W66-FINAL-POLISH
Objective: Final code review, dead code removal, dependency audit, security scan
Target Files: Multiple (cleanup across codebase)
Why this lane: Final review requires highest reasoning for catching issues. Opus for comprehensive audit.
Power Tier: HIGH
Command:
```bash
claude --model opus --effort max -p \
  "Final polish and audit for Ultra-Dex v6.0.0 release.

   1) Dead code removal:
      - Find and remove unused exports
      - Remove commented-out code blocks
      - Remove unused dependencies from package.json
      - Remove empty/stub files that were never implemented

   2) Dependency audit:
      - npm audit → fix all vulnerabilities
      - Check for outdated critical deps
      - Verify all peer dependencies satisfied
      - Remove duplicate/overlapping packages

   3) Security scan:
      - No hardcoded secrets or API keys
      - No eval() or unsafe dynamic code
      - All user input sanitized
      - File path traversal prevention
      - Rate limiting on all external-facing APIs

   4) Code consistency:
      - All files have consistent header comments
      - All exports follow naming conventions
      - All async functions have error handling
      - No floating promises

   5) Final lint + format:
      npm run lint:fix
      npm run format"
```
Expected Output: Clean codebase, no vulnerabilities, consistent code
Validation:
```bash
npm audit
npm run lint
npm run format:check
npm run typecheck
# Verify: 0 vulnerabilities, 0 lint errors, 0 format issues, 0 type errors
```
Fallback #1: `claude --model claude-sonnet-4-20250514 --effort high -p "Final codebase audit..."`
Fallback #2: `copilot --allow-all -p "Run security and code quality audit on Ultra-Dex..."`
Fallback #3: `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "Final code audit and cleanup..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 67] CLAUDE — claude-sonnet-4-20250514
Task ID: V20-W67-RELEASE-PREP
Objective: Version bump to 6.0.0, CHANGELOG, release notes, npm publish prep
Target Files: package.json (MODIFY), CHANGELOG.md (MODIFY), docs/releases/v6.0.0.md (NEW)
Why this lane: Release preparation — Sonnet for structured content generation.
Power Tier: BALANCED
Command:
```bash
claude --model claude-sonnet-4-20250514 --effort high -p \
  "Prepare Ultra-Dex v6.0.0 release.

   1) Update package.json version to 6.0.0

   2) Update CHANGELOG.md:
      ## [6.0.0] - 2026-MM-DD
      ### Added
      - Web dashboard with task management, agent monitoring, cost analytics
      - Community plugin marketplace with search, install, publish, ratings
      - Certification program (Practitioner, Architect, Expert levels)
      - Enterprise initialization with SSO (Okta, Azure AD, Auth0)
      - Enterprise audit trail with SOC2 compliance export
      - SLA management and monitoring
      - Pricing tiers (Free, Pro, Enterprise)
      - Landing page and documentation site
      ### Changed
      - Dashboard moved to Next.js 14 App Router
      - Marketplace replaces manual plugin installation
      ### Fixed
      - [List any bugs fixed during Phase 4]

   3) CREATE docs/releases/v6.0.0.md:
      - Release highlights
      - Migration guide from v5.0.0
      - Breaking changes (if any)
      - Known issues
      - Contributors"
```
Expected Output: Version bumped, CHANGELOG updated, release notes written
Validation:
```bash
node -e "console.log(require('./package.json').version)"
# Must output: 6.0.0
```
Fallback #1: `gemini -y -p "Prepare v6.0.0 release..."`
Fallback #2: `qwen --auth-type qwen-oauth --approval-mode yolo "Write v6.0.0 release notes..."`
Fallback #3: `opencode run -m opencode/llama-3.1-70b-instruct -p "Prepare v6.0.0 release..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

### [WINDOW 68] CODEX — o3
Task ID: V20-W68-FINAL-GATE
Objective: Final gate — full test suite, full build, tag v6.0.0
Target Files: None (validation only)
Why this lane: Final gate requires highest reasoning for comprehensive verification. Codex o3.
Power Tier: HIGH
Command:
```bash
codex --full-auto -m o3 exec \
  "Final v6.0.0 gate validation for Ultra-Dex.

   STEP 1: Full test suite
   npm test
   # All unit + integration tests must pass

   STEP 2: Performance benchmarks
   npm run test:perf
   # All thresholds met

   STEP 3: Type check
   npm run typecheck
   # Zero errors

   STEP 4: Lint
   npm run lint
   # Zero errors

   STEP 5: Security audit
   npm audit
   # Zero high/critical vulnerabilities

   STEP 6: Full build
   npm run build
   # Clean build, no warnings

   STEP 7: Dashboard build
   cd apps/dashboard && npm run build
   # Next.js build succeeds

   STEP 8: Smoke test all CLI commands
   npm start -- --version
   npm start -- run --help
   npm start -- plugin --help
   npm start -- marketplace --help
   npm start -- team --help
   npm start -- audit --help
   npm start -- certify --help
   npm start -- enterprise --help
   npm start -- perf --help

   STEP 9: Tag release
   git add -A
   git commit -m 'feat: v6.0.0 — Ecosystem phase complete, Ultra-Dex platform launch'
   git tag v6.0.0

   STEP 10: Generate release summary
   echo 'v6.0.0 GATE: PASSED' > .protocol/state/v6-gate-result.txt"
```
Expected Output: All gates pass, v6.0.0 tagged
Validation:
```bash
git tag -l 'v6*'
# Must show: v6.0.0
cat .protocol/state/v6-gate-result.txt
# Must show: v6.0.0 GATE: PASSED
```
Fallback #1: `codex --full-auto -m o1 exec "Run v6.0.0 final gate..."`
Fallback #2: `claude --model opus --effort max -p "Validate v6.0.0 release gate..."`
Fallback #3: `opencode run -m opencode/deepseek-r1-0528 -p "Run full test suite and tag v6.0.0..."`
Cost Class: SUBSCRIPTION-INCLUDED

---

## WINDOW SUMMARY

| Window | Agent | Task | Week | Cost |
|--------|-------|------|------|------|
| W49 | Claude Opus | Dashboard architecture | 13 | SUBSCRIPTION |
| W50 | Claude Sonnet | Dashboard pages | 13 | SUBSCRIPTION |
| W51 | Gemini Pro | Dashboard tests | 13 | FREE |
| W52 | Qwen Max | Dashboard deploy | 13 | FREE |
| W53 | Claude Opus | Marketplace backend | 14 | SUBSCRIPTION |
| W54 | Claude Sonnet | Marketplace CLI | 14 | SUBSCRIPTION |
| W55 | Gemini Pro | Marketplace web UI | 14 | FREE |
| W56 | Qwen Max | Seed plugins + docs | 14 | FREE |
| W57 | Claude Opus | Certification engine | 15 | SUBSCRIPTION |
| W58 | Claude Sonnet | Enterprise init + SSO | 15 | SUBSCRIPTION |
| W59 | Gemini Pro | Pricing + landing | 15 | FREE |
| W60 | Qwen Max | Enterprise docs | 15 | FREE |
| W61 | Claude Sonnet | Certification CLI | 16 | SUBSCRIPTION |
| W62 | Gemini Pro | Enterprise CLI | 16 | FREE |
| W63 | Codex o1 | Phase 4 tests | 16 | SUBSCRIPTION |
| W64 | Qwen Plus | Certification content | 16 | FREE |
| W65 | Codex o1 | Phase 4 integration | 17 | SUBSCRIPTION |
| W66 | Claude Opus | Final polish + audit | 17 | SUBSCRIPTION |
| W67 | Claude Sonnet | Release prep v6.0.0 | 17 | SUBSCRIPTION |
| W68 | Codex o3 | Final gate v6.0.0 | 17 | SUBSCRIPTION |

**Total: 20 windows, 5 weeks | 12 SUBSCRIPTION, 8 FREE**

---

*Phase 4 dispatches generated 2026-04-11 | V2.0 Ecosystem | 20 windows | Weeks 13-17*
