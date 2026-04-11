# 🎯 Ultra-Dex - Complete System Architecture

> **Understanding how .kimi → COWRK → .protocol → Agents work together**  
> **Created:** 2026-04-11

---

## 🔄 The Complete Cycle Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           YOUR OPERATIONAL FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
    │    .KIMI     │        │    COWRK     │        │   .PROTOCOL  │
    │  (Planning)  │───────▶│   (Claude)   │───────▶│   (Format)   │
    └──────────────┘        └──────────────┘        └──────────────┘
           │                        │                        │
           │                        │                        │
           ▼                        ▼                        ▼
    ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
    │  You create  │        │ Maya creates │        │  Dispatch    │
    │   content    │        │ dispatches   │        │    plans     │
    └──────────────┘        └──────────────┘        └──────────────┘
                                                                         │
           ┌─────────────────────────────────────────────────────────────┘
           ▼
    ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
    │    AGENTS    │──────▶│   EXECUTE    │──────▶│   PROJECT    │
    │  (Workers)   │        │   (Work)     │        │  (Result)   │
    └──────────────┘        └──────────────┘        └──────────────┘
```

---

## 📁 What Each Component Does

### 1. `.kimi/` — Your Planning Folder

**What it is:** You plan and craft content here

**What goes in:**

- Strategic decisions
- Feature requirements
- Content to include in prompts
- Memory/reference for AI systems

**Files you create here:** (examples)

- Planning documents
- Content drafts
- Context notes

---

### 2. `COWRK-FINAL-PROMPT.txt` — The Trigger

**What it is:** The prompt you give to Claude

**What it does:**

- Tells Claude to act as **Maya** (orchestrator)
- Uses Engineering + Data plugins
- Creates dispatch plans in `.protocol/` format

**Key thing:** This prompt now references `docs/skills/` for context

---

### 3. `.protocol/` — Dispatch Format System

**What it is:** The standardized format for execution plans

**Key files:**
| File | Purpose |
|------|---------|
| `.protocol/orchestration.md` | Command hierarchy, dispatch format, fallback rules |
| `.protocol/agent-capabilities/` | Exact syntax for each tool |
| `.protocol/state/` | Where dispatch plans go |

**What Maya (Claude) creates:**

- v20-phase1-dispatches.md
- v20-phase2-dispatches.md
- v20-phase3-dispatches.md
- v20-phase4-dispatches.md
- v20-master-timeline.md

---

### 4. `docs/skills/` — Plugin Skills System

**What it is:** Documentation of all Claude plugin skills applied to project

**System files:**
| File | Purpose |
|------|---------|
| `SYSTEM.md` | Lifecycle, self-improvement |
| `USAGE-GUIDE.md` | How to invoke skills |
| `CHANGELOG.md` | Version history |

**What we created:** 54 skills across 8 plugins, 84+ files

**Purpose:**

- Reference for you/team
- Context for future AI interactions
- Self-improving system for updates

---

## 🎯 How They Connect

### Step-by-Step:

| Step | What Happens          | Who Does It        | Output                 |
| ---- | --------------------- | ------------------ | ---------------------- |
| 1    | Plan content          | You (in .kimi)     | Planning docs          |
| 2    | Create prompt         | You + .kimi        | COWRK-FINAL-PROMPT.txt |
| 3    | Give to Claude        | You                | -                      |
| 4    | Maya creates dispatch | Claude (Maya role) | .protocol/state/\*.md  |
| 5    | Agents execute        | Your agents        | Code/features          |
| 6    | Review results        | You                | -                      |
| 7    | Update system         | You                | docs/skills updates    |

---

## 🔗 The Integration Points

### .kimi ↔ COWRK

- `.kimi` provides the planning/content
- COWRK turns it into actionable prompt

### COWRK ↔ .protocol

- COWRK creates output IN .protocol format
- `.protocol/orchestration.md` defines exact format

### .protocol ↔ Agents

- Agents read .protocol dispatch plans
- Execute using exact syntax from `.protocol/agent-capabilities/`

### docs/skills ↔ All

- Provides context for any AI
- Self-improving via SYSTEM.md
- Used by COWRK now (updated)

---

## 📊 Current Files Summary

```
Ultra-Dex/
├── .kimi/                    ← You create planning content here
│
├── COWRK-FINAL-PROMPT.txt    ← Prompt to give Claude (READY)
│
├── .protocol/                ← Dispatch format system
│   ├── orchestration.md     ← Format rules (Maya follows this)
│   ├── agent-capabilities/   ← Exact syntax for agents
│   └── state/                ← Where dispatch plans go (empty now)
│
├── docs/skills/              ← Plugin skills system (self-improving)
│   ├── SYSTEM.md            ← Lifecycle
│   ├── USAGE-GUIDE.md        ← How to use skills
│   ├── 8 plugin folders      ← Skill outputs
│   └── CHANGELOG.md          ← Version tracking
│
└── (rest of project)         ← Your code
```

---

## 🎓 Quick Reference

### To Start a New Cycle:

1. **Plan** → Work in `.kimi/` folder
2. **Prompt** → `COWRK-FINAL-PROMPT.txt` ready
3. **Execute** → Give to Claude
4. **Dispatch** → Get plans in `.protocol/state/`
5. **Assign** → Give to agents
6. **Execute** → Agents work
7. **Review** → Check results
8. **Update** → Update `docs/skills/SYSTEM.md` if needed
9. **Repeat**

---

## ✅ Current Status

| Component                | Status                                         |
| ------------------------ | ---------------------------------------------- |
| `.kimi/` planning        | You do this                                    |
| `COWRK-FINAL-PROMPT.txt` | ✅ Updated with docs/skills reference          |
| `.protocol/`             | ✅ Ready for dispatch plans                    |
| `docs/skills/`           | ✅ 54 skills, 84+ files, self-improving system |

---

## 🚀 Ready to Execute

**Next step:** Give `COWRK-FINAL-PROMPT.txt` to Claude

Claude will:

1. Read project context files
2. Read docs/skills/ for additional context
3. Use Engineering + Data plugins
4. Create 5 dispatch plans in `.protocol/state/`

Then you can assign those to agents for execution!

---

**System complete and operational!** 🚀
