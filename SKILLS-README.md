# SKILLS STRUCTURE — SIMPLIFIED

> **No more confusion. Three separate things.**

---

## 📁 THE THREE THINGS

### 1️⃣ CLAUDE SKILLS (Planning)
**Where:** `docs/skills/`  
**What:** 68 skills for planning/analysis  
**Use:** `/skill:command` with Claude/Kimi  
**Example:** `/engineering:architecture "design DexGraph"`

**Guide:** `SKILLS-PLAYBOOK.md`

---

### 2️⃣ GLOBAL SKILLS (Technical)
**Where:** `.agents/skills/`  
**What:** Installable technical skills  
**Use:** `npx skills add <skill>`  
**Example:** `npx skills add typescript-best-practices`

**Guide:** `.agents/SKILLS-GLOBAL.md`

---

### 3️⃣ AGENT ROLES (NOT Skills)
**Where:** `agents/` (NOT `.agents/`)  
**What:** Agent role definitions (planner, coder, etc.)  
**Use:** Agents read these to know their job  
**Note:** These are NOT skills — just agent descriptions

**Files:** `planner.md`, `coder.md`, `backend.md`, etc.

---

## 🎯 QUICK RULE

| Want to... | Go to... | Command |
|------------|----------|---------|
| Plan V2.0 | `docs/skills/` | `/skill:command` |
| Install tech skill | `.agents/skills/` | `npx skills add` |
| See agent roles | `agents/` | Just read the files |

---

## ✅ CLEAN STRUCTURE NOW

```
Ultra-Dex/
├── agents/                    ← Agent roles (planner, coder, etc.)
│   ├── planner.md
│   ├── coder.md
│   └── ...
│
├── .agents/                   ← Global skills
│   ├── skills/find-skills/    ← 1 installed skill
│   └── SKILLS-GLOBAL.md       ← Guide to install more
│
└── docs/skills/               ← Claude planning skills
    ├── engineering/
    ├── marketing/
    └── ... (68 skills)
```

---

**That's it. No duplicates. No confusion.**

Focus on: **`.protocol/state/v20-phase*.md`** for V2.0 execution 🚀
