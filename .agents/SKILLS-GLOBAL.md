# GLOBAL AGENT SKILLS PLAYBOOK

> **Model-agnostic skills from the open ecosystem**  
> **Install via:** `npx skills add <skill>`  
> **Separate from:** `docs/skills/` (Claude-specific)

---

## 🎯 HOW TO INSTALL SKILLS

```bash
# Search for skills
npx skills find [query]

# Install a skill
npx skills add <owner/repo@skill> -g -y

# Check installed skills
npx skills list

# Update skills
npx skills update
```

**Browse all skills:** https://skills.sh/

---

## 🏆 TIER 1: CRITICAL (Install First)

### 1. **vercel-labs/agent-skills@react-best-practices**
**What:** React & Next.js best practices from Vercel Engineering  
**Why:** Ultra-Dex dashboard is React/Next.js  
**Installs:** 185K+  
**Command:**
```bash
npx skills add vercel-labs/agent-skills@react-best-practices -g -y
```
**Use for:** Dashboard V2, frontend optimization, Next.js patterns

---

### 2. **vercel-labs/agent-skills@web-design**
**What:** Web design guidelines, CSS, Tailwind, animations  
**Why:** Need professional UI for YC demo  
**Installs:** 150K+  
**Command:**
```bash
npx skills add vercel-labs/agent-skills@web-design -g -y
```
**Use for:** Dashboard UI, CLI visual design, landing pages

---

### 3. **anthropics/skills@frontend-design**
**What:** Frontend architecture, component design  
**Why:** Professional component library for SDK  
**Installs:** 100K+  
**Command:**
```bash
npx skills add anthropiclabs/skills@frontend-design -g -y
```
**Use for:** Component design system, accessibility, DX

---

### 4. **ComposioHQ/awesome-claude-skills@testing**
**What:** Testing strategies, Jest, Playwright, e2e  
**Why:** V2.0 needs comprehensive testing  
**Installs:** 50K+  
**Command:**
```bash
npx skills add ComposioHQ/awesome-claude-skills@testing -g -y
```
**Use for:** DexGraph testing, 52-window validation, QA

---

### 5. **vercel-labs/agent-skills@typescript-best-practices**
**What:** TypeScript patterns, type safety, best practices  
**Why:** V2.0 is TypeScript-first  
**Installs:** 120K+  
**Command:**
```bash
npx skills add vercel-labs/agent-skills@typescript-best-practices -g -y
```
**Use for:** Type definitions, strict mode, type safety

---

### 6. **anthropics/skills@document-processing**
**What:** Document parsing, markdown, technical writing  
**Why:** Ultra-Dex processes lots of docs/markdown  
**Installs:** 80K+  
**Command:**
```bash
npx skills add anthropiclabs/skills@document-processing -g -y
```
**Use for:** Parser module, workflow DSL, documentation

---

## 🥈 TIER 2: HIGH PRIORITY (Install Before V2.0 Launch)

### 7. **ComposioHQ/awesome-claude-skills@deployment**
**What:** Deployment strategies, Docker, CI/CD  
**Why:** Need production deployment for YC  
**Installs:** 45K+  
**Command:**
```bash
npx skills add ComposioHQ/awesome-claude-skills@deployment -g -y
```
**Use for:** Production deployment, Docker configs, k8s

---

### 8. **vercel-labs/agent-skills@performance-optimization**
**What:** Performance tuning, caching, optimization  
**Why:** Orchestration engine needs to be fast  
**Installs:** 75K+  
**Command:**
```bash
npx skills add vercel-labs/agent-skills@performance-optimization -g -y
```
**Use for:** Scheduler optimization, memory management, caching

---

### 9. **ComposioHQ/awesome-claude-skills@security**
**What:** Security best practices, audit, hardening  
**Why:** Enterprise customers need security  
**Installs:** 40K+  
**Command:**
```bash
npx skills add ComposioHQ/awesome-claude-skills@security -g -y
```
**Use for:** Security audit, sandboxing, enterprise compliance

---

### 10. **vercel-labs/agent-skills@api-design**
**What:** API design, REST, GraphQL, best practices  
**Why:** DexGraph exposes APIs to SDK  
**Installs:** 60K+  
**Command:**
```bash
npx skills add vercel-labs/agent-skills@api-design -g -y
```
**Use for:** SDK API design, adapter interfaces, developer experience

---

### 11. **anthropics/skills@database-design**
**What:** Database schema, migrations, optimization  
**Why:** Memory module needs data persistence  
**Installs:** 55K+  
**Command:**
```bash
npx skills add anthropiclabs/skills@database-design -g -y
```
**Use for:** Workflow store schema, state persistence, migrations

---

### 12. **ComposioHQ/awesome-claude-skills@debugging**
**What:** Debugging strategies, troubleshooting  
**Why:** 52 windows will have failures  
**Installs:** 35K+  
**Command:**
```bash
npx skills add ComposioHQ/awesome-claude-skills@debugging -g -y
```
**Use for:** Window failure analysis, root cause, fixes

---

## 🥉 TIER 3: YC & ENTERPRISE PREP

### 13. **vercel-labs/agent-skills@documentation**
**What:** Documentation writing, README, API docs  
**Why:** Need docs for enterprise/developer adoption  
**Installs:** 70K+  
**Command:**
```bash
npx skills add vercel-labs/agent-skills@documentation -g -y
```
**Use for:** SDK docs, API documentation, README

---

### 14. **anthropics/skills@accessibility**
**What:** WCAG, accessibility best practices  
**Why:** Enterprise requires accessibility compliance  
**Installs:** 30K+  
**Command:**
```bash
npx skills add anthropiclabs/skills@accessibility -g -y
```
**Use for:** Dashboard accessibility, WCAG 2.1 AA compliance

---

### 15. **ComposioHQ/awesome-claude-skills@devops**
**What:** DevOps, monitoring, observability  
**Why:** Production operations for YC demo  
**Installs:** 25K+  
**Command:**
```bash
npx skills add ComposioHQ/awesome-claude-skills@devops -g -y
```
**Use for:** Monitoring, logging, observability, alerts

---

### 16. **vercel-labs/agent-skills@git-workflow**
**What:** Git best practices, PR review, branching  
**Why:** Team coordination during V2.0  
**Installs:** 65K+  
**Command:**
```bash
npx skills add vercel-labs/agent-skills@git-workflow -g -y
```
**Use for:** Git strategy, PR reviews, commit conventions

---

## 📋 OPTIONAL TIER: Install As Needed

### 17. **ComposioHQ/awesome-claude-skills@machine-learning**
**What:** ML patterns, model integration  
**When:** Building predictive features  
```bash
npx skills add ComposioHQ/awesome-claude-skills@machine-learning -g -y
```

### 18. **vercel-labs/agent-skills@mobile-design**
**What:** Mobile-responsive design  
**When:** Building mobile dashboard  
```bash
npx skills add vercel-labs/agent-skills@mobile-design -g -y
```

### 19. **anthropics/skills@analytics**
**What:** Analytics integration, tracking  
**When:** Adding product analytics  
```bash
npx skills add anthropiclabs/skills@analytics -g -y
```

### 20. **ComposioHQ/awesome-claude-skills@seo**
**What:** SEO optimization, marketing  
**When:** Launching landing page  
```bash
npx skills add ComposioHQ/awesome-claude-skills@seo -g -y
```

---

## 🚀 QUICK INSTALL (All Tier 1-2)

```bash
# Install ALL critical + high priority skills at once
npx skills add vercel-labs/agent-skills@react-best-practices -g -y
npx skills add vercel-labs/agent-skills@web-design -g -y
npx skills add anthropiclabs/skills@frontend-design -g -y
npx skills add ComposioHQ/awesome-claude-skills@testing -g -y
npx skills add vercel-labs/agent-skills@typescript-best-practices -g -y
npx skills add anthropiclabs/skills@document-processing -g -y
npx skills add ComposioHQ/awesome-claude-skills@deployment -g -y
npx skills add vercel-labs/agent-skills@performance-optimization -g -y
npx skills add ComposioHQ/awesome-claude-skills@security -g -y
npx skills add vercel-labs/agent-skills@api-design -g -y
npx skills add anthropiclabs/skills@database-design -g -y
npx skills add ComposioHQ/awesome-claude-skills@debugging -g -y
```

---

## 📊 SKILLS BY V2.0 PHASE

| Phase | Skills to Use |
|-------|---------------|
| **0 (Hard Reset)** | `typescript-best-practices`, `debugging` |
| **1-2 (Parser/Graph)** | `document-processing`, `testing`, `typescript-best-practices` |
| **3-4 (State/Scheduler)** | `performance-optimization`, `database-design`, `testing` |
| **5-6 (Adapter/Dispatcher)** | `api-design`, `security`, `testing` |
| **7-8 (Memory/Context)** | `database-design`, `performance-optimization` |
| **9-10 (Governance/Verify)** | `security`, `testing`, `debugging` |
| **11-12 (CLI/Events)** | `react-best-practices`, `web-design`, `frontend-design` |
| **Pre-YC** | `documentation`, `accessibility`, `deployment`, `devops` |

---

## 🎯 RECOMMENDED INSTALL ORDER

### Right Now (Before Phase 0):
```bash
npx skills add vercel-labs/agent-skills@typescript-best-practices -g -y
npx skills add ComposioHQ/awesome-claude-skills@debugging -g -y
npx skills add ComposioHQ/awesome-claude-skills@testing -g -y
```

### During Phase 1-4 (Core Build):
```bash
npx skills add anthropiclabs/skills@document-processing -g -y
npx skills add vercel-labs/agent-skills@performance-optimization -g -y
npx skills add anthropiclabs/skills@database-design -g -y
```

### During Phase 5-8 (Infrastructure):
```bash
npx skills add vercel-labs/agent-skills@api-design -g -y
npx skills add ComposioHQ/awesome-claude-skills@security -g -y
npx skills add ComposioHQ/awesome-claude-skills@deployment -g -y
```

### During Phase 9-12 (UI/Polish):
```bash
npx skills add vercel-labs/agent-skills@react-best-practices -g -y
npx skills add vercel-labs/agent-skills@web-design -g -y
npx skills add anthropiclabs/skills@frontend-design -g -y
```

### Before YC Demo:
```bash
npx skills add vercel-labs/agent-skills@documentation -g -y
npx skills add anthropiclabs/skills@accessibility -g -y
npx skills add ComposioHQ/awesome-claude-skills@devops -g -y
```

---

## ✅ CHECKLIST: Install Skills

### Critical (Do Now):
- [ ] `typescript-best-practices` - Type safety for V2.0
- [ ] `debugging` - For window failures
- [ ] `testing` - Test framework

### High Priority (This Week):
- [ ] `document-processing` - Parser module
- [ ] `database-design` - Memory store
- [ ] `performance-optimization` - Scheduler

### Before Launch:
- [ ] `react-best-practices` - Dashboard
- [ ] `web-design` - UI/UX
- [ ] `security` - Enterprise readiness
- [ ] `deployment` - Production
- [ ] `api-design` - SDK

### Before YC:
- [ ] `documentation` - Developer docs
- [ ] `accessibility` - Compliance
- [ ] `devops` - Operations

---

## 📝 NOTES

- **Global skills** are installed via `npx skills` and work with ANY model (Claude, GPT, etc.)
- **Claude skills** are in `docs/skills/` and work only with Claude
- **Keep them separate** - Global skills in `.agents/skills/`, Claude skills in `docs/skills/`
- **Use find-skills** to discover more: `npx skills find [query]`

---

**Currently Installed:** 1 skill (`find-skills`)  
**Recommended to Install:** 16-20 skills  
**Priority:** Install Tier 1 (6 skills) immediately

**Start installing now while agents work on Phase 0!** 🚀
