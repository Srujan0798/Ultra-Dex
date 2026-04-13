# ULTRA-DEX SKILLS PLAYBOOK

> **Complete reference for all 68 skills — prioritized for YC + Enterprise + Production**
> 
> **Use this:** While agents work on dispatches, YOU run these skills to validate, plan, and prepare.

---

## 🎯 HOW TO USE THIS PLAYBOOK

1. **Pick a skill** from the priority tier you're in
2. **Copy the command** (the `/plugin:skill "prompt"` line)
3. **Paste into Claude/Kimi** and run it
4. **Get output** — documentation, analysis, plan, etc.
5. **Save output** — add to `docs/skills/` or your notes

---

## 🏆 TIER 1: CRITICAL (Run These First)

> **Use during:** Phase 0-2 (Foundation)
> **Purpose:** V2.0 architecture, risk assessment, specs

---

### 1. `/engineering:architecture`
**What:** 6 Architecture Decision Records (ADRs), design patterns  
**When:** Designing DexGraph components, making tech decisions  
**Use for:**
- Validate DexGraph design against ADR-004 (3-tier memory)
- Component boundary decisions
- Technology selection (TypeScript, ESM, etc.)

**Command:**
```
/engineering:architecture "Design DexGraph component boundaries for V2.0"
```

**Output:** `docs/skills/engineering/architecture/ADR-XXX.md`

---

### 2. `/engineering:system-design`
**What:** Scalable system design documentation  
**When:** Designing scheduler, dispatcher, state machine  
**Use for:**
- DexGraph engine design
- Scheduler architecture
- API interface design

**Command:**
```
/engineering:system-design "Design deterministic scheduler for AI workflows"
```

**Output:** `docs/skills/engineering/system-design/SYSTEM-DESIGN.md`

---

### 3. `/engineering:tech-debt`
**What:** 156 technical debt items catalogued  
**When:** Phase 0 W2 — deciding what to archive vs migrate  
**Use for:**
- Audit src/core/ for cleanup
- Identify what to archive
- Plan migration strategy

**Command:**
```
/engineering:tech-debt "Catalog src/core/ for V2.0 Phase 0 archive decision"
```

**Output:** Updated `TECH-DEBT-BACKLOG.md` with V2.0 priorities

---

### 4. `/product-management:write-spec`
**What:** Feature specifications, API contracts  
**When:** Defining DexGraph interfaces  
**Use for:**
- Execution adapter interface spec
- Scheduler API specification
- Parser input/output contracts

**Command:**
```
/product-management:write-spec "DexGraph execution adapter interface specification"
```

**Output:** `docs/skills/product-management/write-spec/FEATURE-SPEC.md`

---

### 5. `/operations:risk-assessment`
**What:** Risk matrix, mitigation plans  
**When:** Before Phase 0 execution  
**Use for:**
- Hard reset execution risks
- 52-window completion risks
- YC timeline risks

**Command:**
```
/operations:risk-assessment "V2.0 Hard Reset execution risks and mitigations"
```

**Output:** `docs/skills/operations/risk-assessment/V20-LAUNCH-RISKS.md`

---

### 6. `/product-management:roadmap-update`
**What:** Timeline, milestones, dependencies  
**When:** Planning 8-week V2.0 execution  
**Use for:**
- 52-window timeline
- Phase dependencies
- Demo day milestones

**Command:**
```
/product-management:roadmap-update "V2.0 8-week execution timeline with milestones"
```

**Output:** `docs/skills/product-management/roadmap-update/ROADMAP.md`

---

## 🥈 TIER 2: HIGH PRIORITY (Run During Build)

> **Use during:** Phase 3-6 (Core Build)  
> **Purpose:** Testing, security, UI, deployment prep

---

### 7. `/engineering:testing-strategy`
**What:** Test frameworks, coverage plans  
**When:** Phase 1-2 (Parser, Graph builder)  
**Use for:**
- Unit test strategy for DexGraph
- Integration test plan
- 52-window validation testing

**Command:**
```
/engineering:testing-strategy "Test plan for DexGraph parser and scheduler"
```

**Output:** `docs/skills/engineering/testing-strategy/TESTING-STRATEGY.md`

---

### 8. `/engineering:code-review`
**What:** Security audit, performance review  
**When:** After Phase 4 (Scheduler complete)  
**Use for:**
- Security audit of execution adapter
- Performance review of scheduler
- Code quality check

**Command:**
```
/engineering:code-review "Security audit of DexGraph execution engine"
```

**Output:** `docs/skills/engineering/code-review/CODE-REVIEW-REPORT.md`

---

### 9. `/design:frontend-design`
**What:** Production-grade UI/UX generation  
**When:** Phase 11 (CLI Control Plane)  
**Use for:**
- CLI interface design
- Dashboard V2 design
- SDK developer experience

**Command:**
```
/design:frontend-design "Design Ultra-Dex CLI interface for developers"
```

**Output:** `docs/skills/design/frontend-design/FRONTEND-DESIGN.md`

---

### 10. `/operations:runbook`
**What:** Production deployment procedures  
**When:** Phase 11-12 (Before launch)  
**Use for:**
- Deployment checklist
- Rollback procedures
- Production monitoring

**Command:**
```
/operations:runbook "Production deployment runbook for V2.0"
```

**Output:** `docs/skills/operations/runbook/PRODUCTION-DEPLOY.md`

---

### 11. `/engineering:deploy-checklist`
**What:** 49-point deployment verification  
**When:** Gate 4 (Before MVO release)  
**Use for:**
- Pre-launch verification
- Gate 4 validation
- Production readiness

**Command:**
```
/engineering:deploy-checklist "Pre-launch checklist for V2.0 MVO"
```

**Output:** `docs/skills/engineering/deploy-checklist/DEPLOY-CHECKLIST.md`

---

### 12. `/product-management:metrics-review`
**What:** KPIs, success metrics, analytics  
**When:** Phase 7-8 (Memory, Context)  
**Use for:**
- Define orchestration metrics
- Success criteria for V2.0
- YC demo metrics

**Command:**
```
/product-management:metrics-review "KPIs for Ultra-Dex orchestration engine"
```

**Output:** `docs/skills/product-management/metrics-review/METRICS.md`

---

## 🥉 TIER 3: YC & ENTERPRISE PREP (Run Before Demo Day)

> **Use during:** Phase 9-12 (Polish + Launch)  
> **Purpose:** Positioning, compliance, sales prep

---

### 13. `/marketing:competitive-brief`
**What:** Market analysis, competitive positioning  
**When:** 2-3 weeks before YC demo day  
**Use for:**
- Position vs LangChain, CrewAI
- Market size (TAM/SAM/SOM)
- Competitive moat analysis

**Command:**
```
/marketing:competitive-brief "Ultra-Dex vs LangChain/CrewAI for YC W25"
```

**Output:** `docs/skills/marketing/competitive-brief/COMPETITIVE-POSITIONING.md`

---

### 14. `/marketing:brand-review`
**What:** Brand voice, messaging, positioning  
**When:** Preparing YC application/pitch  
**Use for:**
- Brand messaging for investors
- Tagline refinement
- Value proposition clarity

**Command:**
```
/marketing:brand-review "Position Ultra-Dex for YC W25 and enterprise sales"
```

**Output:** `docs/skills/marketing/brand-review/BRAND-AUDIT.md`

---

### 15. `/marketing:campaign-plan`
**What:** Launch campaigns, go-to-market  
**When:** Phase 12 complete (MVO ready)  
**Use for:**
- V2.0 launch campaign
- Developer adoption strategy
- Product Hunt / HN launch

**Command:**
```
/marketing:campaign-plan "V2.0 launch campaign for developers and enterprises"
```

**Output:** `docs/skills/marketing/campaign-plan/V20-LAUNCH-CAMPAIGN.md`

---

### 16. `/operations:compliance-tracking`
**What:** SOC 2, security compliance  
**When:** Before enterprise sales  
**Use for:**
- SOC 2 readiness assessment
- Security compliance gaps
- Enterprise requirements

**Command:**
```
/operations:compliance-tracking "SOC 2 readiness for Ultra-Dex V2.0"
```

**Output:** `docs/skills/operations/compliance-tracking/SOC2-TRACKING.md`

---

### 17. `/design:accessibility-review`
**What:** WCAG audit, accessibility compliance  
**When:** Before enterprise pilot  
**Use for:**
- WCAG 2.1 AA compliance
- Enterprise accessibility requirements
- Dashboard audit

**Command:**
```
/design:accessibility-review "Audit dashboard for WCAG 2.1 AA compliance"
```

**Output:** `docs/skills/design/accessibility-review/DASHBOARD-AUDIT.md`

---

### 18. `/data:visualization`
**What:** Metrics dashboards, charts  
**When:** Building YC demo dashboard  
**Use for:**
- Metrics dashboard design
- YC demo visuals
- Usage analytics display

**Command:**
```
/data:visualization "Create metrics dashboard for YC demo and users"
```

**Output:** `docs/skills/data/visualization/DASHBOARD-VIZ.md`

---

### 19. `/customer-support:ticket-triage`
**What:** Support workflow, SLAs  
**When:** Preparing for paid customers  
**Use for:**
- Enterprise support SLAs
- Ticket prioritization
- Escalation procedures

**Command:**
```
/customer-support:ticket-triage "Enterprise support workflow for V2.0"
```

**Output:** `docs/skills/customer-support/ticket-triage/TRIAGE-FRAMEWORK.md`

---

### 20. `/product-management:stakeholder-update`
**What:** Executive briefs, investor updates  
**When:** Weekly YC updates, investor reports  
**Use for:**
- YC partner updates
- Investor briefings
- Board updates

**Command:**
```
/product-management:stakeholder-update "Weekly progress update for YC partners"
```

**Output:** `docs/skills/product-management/stakeholder-update/EXECUTIVE-BRIEF.md`

---

## 📊 TIER 4: SUPPORTING SKILLS (Use As Needed)

> **Use when:** Specific situations arise  
> **Purpose:** Specialized tasks, debugging, optimization

---

### 21. `/engineering:debug`
**When:** Windows failing, need root cause analysis  
**Command:** `/engineering:debug "Debug Phase X window failures"`

### 22. `/engineering:incident-response`
**When:** Production incidents during V2.0 testing  
**Command:** `/engineering:incident-response "Incident response for V2.0 deployment"`

### 23. `/engineering:standup`
**When:** Daily progress tracking across agents  
**Command:** `/engineering:standup "Summarize V2.0 progress this week"`

### 24. `/engineering:documentation`
**When:** Writing operational docs, runbooks  
**Command:** `/engineering:documentation "Document DexGraph API for developers"`

### 25. `/data:analysis`
**When:** Analyzing test results, usage data  
**Command:** `/data:analysis "Analyze test pass rates for V2.0"`

### 26. `/data:explore-data`
**When:** Exploring dataset characteristics  
**Command:** `/data:explore-data "Profile Ultra-Dex usage data"`

### 27. `/product-management:brainstorm`
**When:** Pricing strategy, feature brainstorming  
**Command:** `/product-management:brainstorm "Pricing strategy for Ultra-Dex enterprise"`

### 28. `/product-management:synthesize-research`
**When:** Synthesizing user interviews, feedback  
**Command:** `/product-management:synthesize-research "Synthesize user feedback on V2.0 beta"`

### 29. `/operations:capacity-plan`
**When:** Planning infrastructure scaling  
**Command:** `/operations:capacity-plan "Q2-Q4 capacity planning for YC scale"`

### 30. `/operations:process-optimization`
**When:** Optimizing development workflow  
**Command:** `/operations:process-optimization "Optimize 52-window execution workflow"`

### 31. `/operations:vendor-review`
**When:** Evaluating infrastructure vendors  
**Command:** `/operations:vendor-review "Review Render.com vs Vercel for V2.0"`

### 32. `/marketing:content-creation`
**When:** Writing blog posts, documentation  
**Command:** `/marketing:content-creation "Create launch blog post for V2.0"`

### 33. `/marketing:seo-audit`
**When:** Optimizing for search traffic  
**Command:** `/marketing:seo-audit "SEO optimization for Ultra-Dex website"`

### 34. `/design:design-system`
**When:** Creating component library  
**Command:** `/design:design-system "Design system for Ultra-Dex SDK"`

### 35. `/design:design-handsoff`
**When:** Specs for implementation  
**Command:** `/design:design-handsoff "Component specs for dashboard V2"`

### 36. `/design:ux-copy`
**When:** Writing interface text  
**Command:** `/design:ux-copy "Write error messages for CLI"`

### 37. `/customer-support:kb-article`
**When:** Creating documentation  
**Command:** `/customer-support:kb-article "Create KB article for common issues"`

### 38. `/customer-support:customer-escalation`
**When:** Enterprise escalation procedures  
**Command:** `/customer-support:customer-escalation "Enterprise escalation brief"`

### 39. `/enterprise-search:search`
**When:** Implementing documentation search  
**Command:** `/enterprise-search:search "Documentation search for SDK"`

### 40. `/enterprise-search:knowledge-synthesis`
**When:** Synthesizing architecture decisions  
**Command:** `/enterprise-search:knowledge-synthesis "Synthesize V2.0 architecture decisions"`

---

## 🎯 QUICK REFERENCE: Skills by Phase

| Phase | Skills to Run |
|-------|---------------|
| **0 (Hard Reset)** | `/engineering:architecture`, `/engineering:tech-debt`, `/operations:risk-assessment` |
| **1-2 (Parser/Graph)** | `/engineering:system-design`, `/product-management:write-spec` |
| **3-4 (State/Scheduler)** | `/engineering:testing-strategy`, `/product-management:roadmap-update` |
| **5-6 (Adapter/Dispatcher)** | `/engineering:code-review`, `/operations:runbook` |
| **7-8 (Memory/Context)** | `/product-management:metrics-review`, `/data:analysis` |
| **9-10 (Governance/Verify)** | `/engineering:deploy-checklist`, `/design:accessibility-review` |
| **11-12 (CLI/Events)** | `/design:frontend-design`, `/marketing:brand-review` |
| **Pre-YC Demo** | `/marketing:competitive-brief`, `/marketing:campaign-plan`, `/operations:compliance-tracking` |

---

## 💡 PRO TIPS

1. **Run 1 skill per day** while agents work on windows
2. **Save outputs** — they become part of your YC application
3. **Stack skills** — combine multiple for comprehensive analysis
4. **Update regularly** — re-run skills as V2.0 evolves
5. **Use for decisions** — skills provide data-driven recommendations

---

## 📁 Where Outputs Go

All skill outputs are saved to:
```
docs/skills/[plugin]/[skill-name]/
```

Example:
```
docs/skills/engineering/architecture/ADR-007-dexgraph-design.md
docs/skills/marketing/competitive-brief/COMPETITIVE-POSITIONING.md
docs/skills/operations/risk-assessment/V20-LAUNCH-RISKS.md
```

---

## ✅ CHECKLIST: Skills to Run Before V2.0 Launch

### Foundation (Do Now)
- [ ] `/engineering:architecture` — Validate DexGraph design
- [ ] `/engineering:tech-debt` — Audit src/core/
- [ ] `/operations:risk-assessment` — Phase 0-2 risks
- [ ] `/product-management:roadmap-update` — 8-week timeline

### Build (Do During)
- [ ] `/product-management:write-spec` — API contracts
- [ ] `/engineering:testing-strategy` — Test plan
- [ ] `/engineering:code-review` — Security audit

### Launch Prep (Do Before Demo Day)
- [ ] `/marketing:competitive-brief` — Positioning
- [ ] `/marketing:brand-review` — Messaging
- [ ] `/operations:compliance-tracking` — SOC 2
- [ ] `/engineering:deploy-checklist` — Launch readiness

---

**Total Skills in Playbook: 40 prioritized of 68 available**

**Start with Tier 1 (Skills 1-6) while agents work on Phase 0 windows!** 🚀
