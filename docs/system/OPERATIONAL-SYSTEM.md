# 🔄 Ultra-Dex Complete Operational System

> **How .kimi → COWRK → Agents cycle works**  
> **Version:** 1.0.0 | **Created:** 2026-04-11

---

## 🎯 The Complete Cycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ULTRA-DEX OPERATIONAL CYCLE                         │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │    .KIMI    │ ───▶ │   COWRK    │ ───▶ │   AGENTS    │ ───▶ │   PROJECT   │
   │  (Planning) │      │  (Claude)  │      │  (Execute)  │      │  (Result)   │
   └─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
        ↑                                                                    │
        └────────────────────── FEEDBACK LOOP ←───────────────────────────────┘
                                    │
                                    ▼
                            docs/skills/SYSTEM.md
                            (Self-improvement)
```

---

## Step 1: .kimi (Planning)

**What happens:**

- You use `.kimi` to plan content/strategy
- `.kimi` helps craft the prompts and context
- Output: Content that goes into COWRK

**What `.kimi` produces:**

- Strategic decisions
- Feature requirements
- Content/response templates
- Planning documents

---

## Step 2: COWRK (Maya Role + .protocol)

**What happens:**

- Give `COWRK-FINAL-PROMPT.txt` to Claude
- Claude acts as **Maya** (orchestrator)
- Uses `.protocol/orchestration.md` format
- Outputs: Dispatch plans in `.protocol/state/`

**Maya's role:**

- Plan, assign, review, validate
- Model-agnostic (uses right tool for task)
- Creates execution windows with fallbacks

**Output files created:**

- `.protocol/state/v20-phase1-dispatches.md`
- `.protocol/state/v20-phase2-dispatches.md`
- `.protocol/state/v20-phase3-dispatches.md`
- `.protocol/state/v20-phase4-dispatches.md`
- `.protocol/state/v20-master-timeline.md`

---

## Step 3: Agents (Execution)

**What happens:**

- You give dispatch plans to your agents
- Agents execute the planned work
- Results: Code, documentation, features

**Agent types (per .protocol):**

- Premium: Claude Code (dense tasks)
- Worker: Gemini CLI (parallel work)
- Labor: Qwen CLI (repetitive tasks)
- Governance: Copilot CLI (review)

---

## Step 4: Project (Result)

**What happens:**

- Code updated
- Tests run
- Features implemented
- Documentation created

---

## Step 5: Feedback Loop (Self-Improvement)

**What happens:**

- Review results
- Update `docs/skills/SYSTEM.md` if needed
- Add new plugins/skills to docs/skills/
- Next cycle starts fresh

---

## 📂 File Responsibilities

| File/Dir                     | Owner         | Purpose               |
| ---------------------------- | ------------- | --------------------- |
| `.kimi/`                     | You           | Planning inputs       |
| `COWRK-FINAL-PROMPT.txt`     | You + `.kimi` | Prompt to give Claude |
| `.protocol/`                 | Maya (Claude) | Dispatch plans        |
| `.protocol/orchestration.md` | System        | Format reference      |
| `docs/skills/`               | You + Agents  | Skill documentation   |
| `docs/skills/SYSTEM.md`      | System        | Lifecycle management  |

---

## 🔄 The Feedback Loop Explained

```
After Agent execution:

1. Review what worked/didn't
2. Need new plugin skill? → Add to docs/skills/
3. Need to update lifecycle? → Update SYSTEM.md
4. Need new COWRK input? → Use .kimi again
5. Loop continues...
```

---

## 🎓 For Future Reference

### To start a new cycle:

1. **Plan** → Use `.kimi` to craft content
2. **Prompt** → COWRK-FINAL-PROMPT.txt ready
3. **Execute** → Give COWRK to Claude (Maya)
4. **Dispatch** → Get dispatch plans
5. **Assign** → Give to agents
6. **Execute** → Agents do work
7. **Review** → Check results
8. **Update** → Update docs/skills/SYSTEM.md if needed
9. **Repeat**

---

## 📌 Current State

| Step               | Status                                     |
| ------------------ | ------------------------------------------ |
| 1. .kimi planning  | You do this                                |
| 2. COWRK prompt    | Ready (updated with docs/skills reference) |
| 3. Dispatch plans  | Ready to be generated                      |
| 4. Agent execution | Will happen after dispatch                 |
| 5. Project update  | Will happen after execution                |
| 6. Feedback loop   | Ready via SYSTEM.md                        |

---

## 🎯 Ready to Execute

**Next action:** Give `COWRK-FINAL-PROMPT.txt` to Claude

After that:

- Claude creates dispatch plans
- You assign to agents
- Agents execute work

---

**System v1.0.0 - Operational and ready!** 🚀
