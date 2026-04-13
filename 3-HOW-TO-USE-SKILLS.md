# HOW TO USE SKILLS — Step by Step

> **Use these skills WHILE your agents work on V2.0 dispatches**
> 
> **Time investment:** 30 min/day running skills  
> **Output:** Documentation, analysis, plans for YC + Enterprise

---

## 🎯 QUICK START (Do This Now)

### Step 1: Pick One Skill from Tier 1
Open `SKILLS-PLAYBOOK.md` → Go to "🏆 TIER 1: CRITICAL" → Pick skill #1

### Step 2: Copy the Command
Example:
```
/engineering:architecture "Design DexGraph component boundaries for V2.0"
```

### Step 3: Paste into Claude/Kimi
Run it. Get output (analysis, document, plan).

### Step 4: Save the Output
Add to `docs/skills/[plugin]/[skill]/` or your notes.

### Step 5: Mark as Done in Playbook
Check off in `SKILLS-PLAYBOOK.md` checklist.

---

## 📚 TWO TYPES OF SKILLS

### Type 1: CLAUDE SKILLS (Project-Specific)
**Location:** `docs/skills/`  
**How to use:** Reference in prompts to Claude/Kimi  
**Purpose:** Ultra-Dex specific context, planning, analysis

### Type 2: GLOBAL SKILLS (Model-Agnostic)
**Location:** `.agents/skills/` (install more via npx)  
**How to use:** `npx skills add <skill>` then use with any model  
**Purpose:** Technical capabilities (React, testing, deployment, etc.)

---

## 🔥 TYPE 1: USING CLAUDE SKILLS

### Daily Workflow (30 min)

```bash
# 1. Check which skill to run today
cat SKILLS-PLAYBOOK.md | grep -A 5 "TIER 1"

# 2. Pick one (e.g., /engineering:architecture)

# 3. Run it with Claude/Kimi
```

### Example 1: Engineering Architecture

**Command to run:**
```
/engineering:architecture "Validate DexGraph design for V2.0 deterministic execution"
```

**What you'll get:**
- Architecture Decision Record (ADR)
- Component boundary recommendations
- Design validation against ADR-004

**Save output to:**
```
docs/skills/engineering/architecture/ADR-007-dexgraph-validation.md
```

**Use for:** Phase 0-2 design decisions

---

### Example 2: Risk Assessment

**Command to run:**
```
/operations:risk-assessment "V2.0 Hard Reset execution risks for 52-window plan"
```

**What you'll get:**
- Risk matrix (High/Medium/Low)
- Mitigation strategies
- Contingency plans

**Save output to:**
```
docs/skills/operations/risk-assessment/V20-EXECUTION-RISKS.md
```

**Use for:** Planning fallbacks, knowing what could go wrong

---

### Example 3: Competitive Brief (For YC)

**Command to run:**
```
/marketing:competitive-brief "Ultra-Dex vs LangChain/CrewAI for YC W25 application"
```

**What you'll get:**
- Market analysis
- Competitive positioning
- Differentiation strategy
- TAM/SAM/SOM estimates

**Save output to:**
```
docs/skills/marketing/competitive-brief/YC-POSITIONING.md
```

**Use for:** YC application, investor pitches

---

### Example 4: Testing Strategy

**Command to run:**
```
/engineering:testing-strategy "Test plan for DexGraph parser and scheduler (52 windows)"
```

**What you'll get:**
- Unit test strategy
- Integration test plan
- Validation criteria for each window
- Coverage targets

**Save output to:**
```
docs/skills/engineering/testing-strategy/V20-TEST-PLAN.md
```

**Use for:** Ensuring quality across 52 windows

---

### Example 5: YC Roadmap Update

**Command to run:**
```
/product-management:roadmap-update "8-week V2.0 timeline with YC demo day milestones"
```

**What you'll get:**
- Detailed timeline
- Milestone definitions
- Dependencies mapped
- Risk points identified

**Save output to:**
```
docs/skills/product-management/roadmap-update/V20-YC-ROADMAP.md
```

**Use for:** Staying on track, YC updates

---

## 🌍 TYPE 2: USING GLOBAL SKILLS

### Step 1: Install Skills

```bash
# Install critical skills first
npx skills add vercel-labs/agent-skills@typescript-best-practices -g -y
npx skills add ComposioHQ/awesome-claude-skills@testing -g -y
npx skills add ComposioHQ/awesome-claude-skills@debugging -g -y
```

### Step 2: Use Installed Skills

After install, reference them in prompts:

```
Using typescript-best-practices skill:
"Review dexgraph/parser.ts for TypeScript best practices and type safety"
```

```
Using testing skill:
"Design unit tests for scheduler.ts using best practices from testing skill"
```

```
Using debugging skill:
"Analyze this window failure and provide debugging strategy"
```

---

## 📅 RECOMMENDED DAILY SCHEDULE

### Morning (15 min):
```bash
# Run 1 Tier 1 skill while agents work
cat SKILLS-PLAYBOOK.md → Pick 1 skill → Run with Claude
```

### Mid-Day (15 min):
```bash
# Install or use 1 global skill
npx skills add <skill> → Use in prompt
```

### Weekly Review (30 min):
```bash
# Review all skill outputs
# Update PROGRESS.md
# Plan next week's skills
```

---

## 🎯 SKILLS BY CURRENT NEED

### Right Now (Phase 0 Foundation):
```
/engineering:architecture "DexGraph component design"
/operations:risk-assessment "Phase 0 execution risks"
/engineering:tech-debt "Catalog src/core/ for archive"
```

### Next Week (Phase 1-2 Build):
```
/product-management:write-spec "Parser API specification"
/engineering:testing-strategy "DexGraph test framework"
/marketing:competitive-brief "Positioning for YC"
```

### Before Demo Day (Phase 9-12):
```
/operations:compliance-tracking "SOC 2 readiness"
/design:accessibility-review "WCAG compliance"
/marketing:brand-review "YC messaging"
/engineering:deploy-checklist "Production readiness"
```

---

## 💾 WHERE TO SAVE OUTPUTS

### Claude Skill Outputs:
```
docs/skills/[plugin]/[skill-name]/

Examples:
docs/skills/engineering/architecture/ADR-007-dexgraph.md
docs/skills/marketing/competitive-brief/POSITIONING.md
docs/skills/operations/risk-assessment/RISKS.md
```

### Global Skill Outputs:
```
.agents/skills/[skill-name]/outputs/

Examples:
.agents/skills/typescript-best-practices/notes/
.agents/skills/testing/test-plans/
```

---

## ✅ WEEKLY CHECKLIST

### Week 1 (Now):
- [ ] Run `/engineering:architecture`
- [ ] Run `/operations:risk-assessment`
- [ ] Install `typescript-best-practices` global skill
- [ ] Install `testing` global skill

### Week 2:
- [ ] Run `/product-management:write-spec`
- [ ] Run `/engineering:testing-strategy`
- [ ] Install `debugging` global skill

### Week 3:
- [ ] Run `/marketing:competitive-brief`
- [ ] Run `/product-management:roadmap-update`
- [ ] Install `deployment` global skill

### Week 4:
- [ ] Run `/design:frontend-design`
- [ ] Run `/operations:runbook`
- [ ] Install `security` global skill

---

## 🔥 PRO TIPS

1. **Stack Skills** — Run multiple skills on same topic for comprehensive analysis
2. **Save Everything** — Every skill output becomes documentation
3. **Use for Decisions** — Skill outputs help you decide on architecture, timeline, etc.
4. **Share with Agents** — Feed skill outputs to your agents for better execution
5. **YC Prep** — Many skill outputs become YC application materials

---

## 🚀 START NOW

### In Next 10 Minutes:

1. **Open:** `SKILLS-PLAYBOOK.md`
2. **Copy this command:**
   ```
   /engineering:architecture "Validate DexGraph design for deterministic AI execution"
   ```
3. **Paste into Claude/Kimi**
4. **Get output**
5. **Save to:** `docs/skills/engineering/architecture/DEXGRAPH-VALIDATION.md`
6. **Check off in playbook**

---

## 📊 TRACKING

**Skills Completed This Week:** ___ / 5  
**Global Skills Installed:** ___ / 6  
**Outputs Generated:** ___  
**Time Invested:** ___ min/day  

---

**Start with ONE skill. Run it now. Build momentum!** 🚀
