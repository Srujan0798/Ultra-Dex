# GLOBAL AGENT SKILLS PLAYBOOK

> **Model-agnostic skills installed via `npx skills`**
> **Claude-specific skills** → `docs/skills/` (83 skills, 9 categories)
> **Install new skills** → `npx skills add <owner/repo@skill> -g -y`
> **Browse skills** → https://skills.sh/

---

## INSTALLED SKILLS

### 1. `claude-api` — Anthropic SDK Reference
**Path**: `.agents/skills/claude-api/`
**What**: Full Anthropic SDK docs — streaming, tool use, batches, files API, managed agents, error codes, models
**When to use**: Any time an agent is writing code that calls Claude API directly, or building on top of `@anthropic-ai/sdk`
**Languages covered**: TypeScript, Python, Go, Java, PHP, Ruby, curl

---

### 2. `mcp-builder` — MCP Server Builder
**Path**: `.agents/skills/mcp-builder/`
**What**: How to build Model Context Protocol servers — best practices, Node.js + Python patterns, evaluation
**When to use**: Working on `packages/mcp-server/` or adding new MCP tools/connectors

---

### 3. `webapp-testing` — Web App Testing Patterns
**Path**: `.agents/skills/webapp-testing/`
**What**: End-to-end testing, browser automation, element discovery, static HTML testing
**When to use**: TASK-04 (test reporter), TASK-05 (live e2e tests), dashboard testing

---

### 4. `frontend-design` — Frontend Design System
**Path**: `.agents/skills/frontend-design/`
**What**: UI/UX patterns, component design, accessibility, design systems
**When to use**: Building `apps/dashboard/`, landing page, VS Code extension webviews

---

### 5. `vercel-react-best-practices` — React Performance Patterns
**Path**: `.agents/skills/vercel-react-best-practices/`
**What**: 50+ rules — rendering, re-renders, async, server components, bundle optimization, hydration
**When to use**: Any React/Next.js work in `apps/dashboard/` or `apps/website/`

---

### 6. `vercel-composition-patterns` — React Composition
**Path**: `.agents/skills/vercel-composition-patterns/`
**What**: Component patterns — compound components, context interface, state management, React 19 patterns
**When to use**: Dashboard component architecture

---

### 7. `typescript-advanced-types` — TypeScript Patterns
**Path**: `.agents/skills/typescript-advanced-types/`
**What**: Advanced TypeScript — generics, conditional types, mapped types, type guards, strict mode patterns
**When to use**: TASK-03 (pin versions + type safety), any TypeScript refactor in `src/core/`

---

### 8. `nodejs-backend-patterns` — Node.js Backend
**Path**: `.agents/skills/nodejs-backend-patterns/`
**What**: Node.js best practices — async patterns, error handling, streaming, performance, ESM/CJS
**When to use**: TASK-01 (CLI bundle), TASK-02 (native deps), API server work

---

### 9. `security-best-practices` — Security Audit
**Path**: `.agents/skills/security-best-practices/`
**What**: Security hardening — OWASP, input validation, auth patterns, dependency audit
**When to use**: TASK-10 (dep diet), pre-YC security pass, enterprise compliance

---

### 10. `web-design-guidelines` — Web Design
**Path**: `.agents/skills/web-design-guidelines/`
**What**: CSS, Tailwind, animations, responsive design guidelines
**When to use**: Dashboard styling, landing page

---

### 11. `changelog-generator` — Changelog Writer
**Path**: `.agents/skills/changelog-generator/`
**What**: Generates CHANGELOG.md from git commits
**When to use**: Before each release — run to auto-generate changelog from commits

---

### 12. `deploy-to-vercel` — Vercel Deployment
**Path**: `.agents/skills/deploy-to-vercel/`
**What**: Vercel deployment scripts, CI/CD setup, environment config
**When to use**: When deploying `apps/dashboard/` or `apps/website/` to Vercel

---

### 13. `vercel-cli-with-tokens` — Vercel CLI
**Path**: `.agents/skills/vercel-cli-with-tokens/`
**What**: Vercel CLI usage with auth tokens for CI/CD
**When to use**: Automated Vercel deployments from GitHub Actions

---

### 14. `doc-coauthoring` — Documentation Writer
**Path**: `.agents/skills/doc-coauthoring/`
**What**: Co-authoring docs, technical writing patterns
**When to use**: Writing SDK docs, API reference, README updates

---

## SKILLS BY PROJECT PHASE

| Phase | Skills to use |
|-------|--------------|
| **Now — Fix Foundation (TASK-01–10)** | `nodejs-backend-patterns`, `typescript-advanced-types`, `security-best-practices`, `webapp-testing` |
| **CLI publish** | `nodejs-backend-patterns`, `changelog-generator` |
| **MCP server** | `mcp-builder`, `claude-api` |
| **Dashboard build** | `vercel-react-best-practices`, `vercel-composition-patterns`, `frontend-design`, `web-design-guidelines` |
| **Vercel deploy** | `deploy-to-vercel`, `vercel-cli-with-tokens` |
| **Pre-YC** | `security-best-practices`, `changelog-generator`, `doc-coauthoring` |
| **Claude API integration** | `claude-api` |

---

## QUICK REFERENCE

```bash
# List all installed skills
npx skills list

# Add a new skill
npx skills add <owner/repo@skill> -g -y

# Find a skill
npx skills find [query]

# Update all skills
npx skills update
```

---

## SKILLS NOT INSTALLED (add when needed)

```bash
# E2E testing with Playwright (when dashboard is built)
npx skills add wshobson/agents@e2e-testing-patterns -g -y

# API design (when SDK is being designed)
npx skills add vercel-labs/agent-skills@api-design -g -y

# Performance optimization (when optimizing orchestration engine)
npx skills add vercel-labs/agent-skills@performance-optimization -g -y

# Documentation (before YC demo)
npx skills add vercel-labs/agent-skills@documentation -g -y
```

---

**Total installed**: 14 skills
**Claude skills in docs/skills/**: 83 skills across 9 categories
