# SKILLS STRUCTURE GUIDE

> **CLEAR explanation of all "skills" in Ultra-Dex — no more confusion**

---

## 📁 THREE TYPES OF "SKILLS" (Clarified)

### 1️⃣ CLAUDE PLUGIN SKILLS (Project Context)
**Location:** `docs/skills/`  
**What:** 68 skills for Claude (Kimi) to understand Ultra-Dex  
**Use:** Planning, analysis, architecture decisions  
**How:** `/plugin:skill "prompt"`  
**Example:** `/engineering:architecture "Design DexGraph"`

```
docs/skills/
├── engineering/     ← 10 skills (architecture, testing, etc.)
├── marketing/       ← 8 skills (brand, campaigns, etc.)
├── operations/      ← 9 skills (runbooks, compliance, etc.)
├── product-management/ ← 9 skills (specs, roadmaps, etc.)
├── data/           ← 10 skills (analysis, visualization, etc.)
├── design/         ← 8 skills (UI/UX, accessibility, etc.)
├── customer-support/ ← 5 skills (tickets, KB, etc.)
├── enterprise-search/ ← 5 skills (search, synthesis, etc.)
├── productivity/   ← 4 skills (tasks, memory, etc.)
├── SYSTEM.md       ← How the skill system works
├── USAGE-GUIDE.md  ← How to invoke skills
└── README.md       ← Master index
```

**Status:** ✅ 68/68 skills complete  
**Use for:** Planning V2.0, YC prep, Enterprise readiness

---

### 2️⃣ GLOBAL AGENT SKILLS (Technical Capabilities)
**Location:** `.agents/skills/`  
**What:** Installable skills from skills.sh ecosystem  
**Use:** Technical tasks (React, testing, deployment)  
**How:** `npx skills add <skill>`  
**Example:** `npx skills add vercel-labs/agent-skills@react-best-practices`

```
.agents/
├── skills/
│   └── find-skills/     ← 1 skill (search for more)
├── SKILLS-GLOBAL.md     ← Guide to install 20 more
└── roles/               ← Agent role definitions (moved from agents/)
```

**Currently Installed:** 1 skill (`find-skills`)  
**Recommended:** 20 more (TypeScript, testing, deployment, etc.)  
**Status:** ⏳ Install as needed

---

### 3️⃣ AGENT ROLE DEFINITIONS (NOT Skills)
**Location:** `.agents/roles/`  
**What:** Definitions for Ultra-Dex agents (planner, coder, etc.)  
**Use:** Agent swarm execution  
**How:** Agents read these to know their job  
**Example:** `planner.md`, `coder.md`, `backend.md`

```
.agents/roles/
├── 00-AGENT_INDEX.md    ← Master index of all agents
├── README.md            ← How agents work
├── planner.md           ← Strategic architect agent
├── cto.md               ← Technical director agent
├── backend.md           ← Backend engineer agent
├── frontend.md          ← Frontend engineer agent
├── database.md          ← Data architect agent
├── testing.md           ← QA engineer agent
├── reviewer.md          ← Code reviewer agent
├── devops.md            ← Infrastructure agent
├── security.md          ← Security analyst agent
└── ... (15 total roles)
```

**Status:** ✅ 15 roles defined  
**Note:** These are NOT skills — they're agent personalities/capabilities

---

## 🎯 QUICK REFERENCE

| Directory | What It Is | How to Use | Count |
|-----------|-----------|------------|-------|
| `docs/skills/` | Claude plugin skills | `/skill:command` | 68 |
| `.agents/skills/` | Global installable skills | `npx skills add` | 1+ |
| `.agents/roles/` | Agent role definitions | Agents read these | 15 |

---

## ✅ WHAT'S WHAT (No Confusion)

### If you want PLANNING help:
→ Use `docs/skills/` (Claude skills)  
→ Run: `/engineering:architecture "question"`

### If you want TECHNICAL capabilities:
→ Use `.agents/skills/` (Global skills)  
→ Install: `npx skills add <skill>`

### If you want AGENT definitions:
→ Use `.agents/roles/` (NOT skills)  
→ Read: `planner.md`, `coder.md`, etc.

---

## 📋 ARCHIVED (Old Stuff)

Old skill-related files moved to:
```
archive/v1/
├── src/core/skills/          ← Old v1 skills implementation
├── docs/claude-skills-integration.md
├── docs/skills-implementation-summary.md
└── docs/skills-usage.md
```

**Don't touch these — they're historical.**

---

## 🚀 START HERE

### For Planning (Use Claude Skills):
```bash
# Read this
cat docs/skills/USAGE-GUIDE.md

# Run a skill
/engineering:architecture "Design DexGraph"
```

### For Technical Tasks (Install Global Skills):
```bash
# Read this
cat .agents/SKILLS-GLOBAL.md

# Install a skill
npx skills add vercel-labs/agent-skills@react-best-practices -g -y
```

### For Agent Roles (Just Reference):
```bash
# Read this
cat .agents/roles/00-AGENT_INDEX.md

# See what each agent does
cat .agents/roles/planner.md
```

---

## 🎓 SIMPLE RULE

- **Planning/decision-making** → `docs/skills/` (Claude)
- **Technical implementation** → `.agents/skills/` (Global)
- **Agent behavior** → `.agents/roles/` (NOT skills)

**That's it. No more confusion.**

---

**Last Updated:** 2026-04-13  
**Status:** Structure cleaned and clarified
