# KIMI'S PROMPT ENGINEERING GUIDE
## How Kimi Writes Cowrk Prompts — No User Explanation Required

> **Created:** 2026-04-14
> **Status:** ACTIVE
> **Rule:** If Kimi is asked to create a prompt for Cowrk, READ THIS FILE FIRST.

---

## THE HANDOFF

```
User asks for planning → Kimi plans → Kimi writes COWRK-*-PROMPT.txt
User gives prompt to Cowrk → Cowrk writes dispatches → Agents execute
```

**Kimi's output is ALWAYS a `COWRK-*-PROMPT.txt` file.**
Never a `.md` explanation. Never a chat response. Never a dispatch file.

---

## THE GOLD STANDARD REFERENCES

When writing a Cowrk prompt, Kimi MUST study these files to match their format and power:

1. **`COWRK-V20-HARD-RESET-PROMPT.txt`** — The canonical architecture prompt
   - Concise protocol header
   - Phase-by-phase with window assignments (not full dispatches)
   - Clear `RESULT:` per phase
   - Dispatch format specification at bottom
   - Constraints section
   - Output files list

2. **`.protocol/COWRK-AUTO-CEO-PROMPT.txt`** — The canonical automation prompt
   - Prescriptive skill mapping per window
   - Exact agent CLI command examples in windows
   - Strong mandate language ("COWRK MUST:")
   - Parallel execution notation
   - Success metrics table

3. **`COWRK-FINAL-REVENUE-PROMPT.txt`** — The evolved ultimate prompt
   - Combines V20 structure + AUTO-CEO skill prescription + revenue focus
   - Explicit skill-to-phase mapping
   - Mandatory dispatch format specification
   - Real file path requirements
   - Exact CLI syntax requirements

**Kimi's new prompts must match or exceed the strength of #3.**

---

## NON-NEGOTIABLE SECTIONS IN EVERY COWRK PROMPT

Every `COWRK-*-PROMPT.txt` MUST contain ALL of these sections:

### 1. PROTOCOL COMPLIANCE & SKILL USAGE HEADER
```
COWRK MUST:
- Read `.protocol/orchestration.md` for dispatch format
- Read `.protocol/execution.md` for execution rules
- Read relevant docs (pass specific file paths)
- Scan the ACTUAL codebase (pass specific directories)
- Reference `.protocol/agent-capabilities/` for exact CLI syntax
- Use skills from `docs/skills/` for ALL planning
- Create `.protocol/state/[prefix]-phase*-dispatches.md` in strict format
- Create `.protocol/state/[prefix]-master-timeline.md`
- Create `.protocol/state/[PREFIX]-PROGRESS.md`
- Follow strict Phase 0→N sequence
- Each phase is a separate dispatch file
```

### 2. ACTIVE PLUGINS & SKILLS
List every relevant skill with exact file paths.
Mandate: **Every window MUST reference at least one specific skill.**

### 3. OBJECTIVE
One clear sentence. Include a **Golden Rule**.

### 4. PROJECT STATE
What exists, what's the gap, what's the mission.

### 5. PHASE ARCHITECTURE (One per Phase)
Each phase gets:
- `## PHASE N — NAME (Timeline)`
- `### Required Skills` (3–4 specific skills with paths)
- `### Output: [prefix]-phaseN-dispatches.md`
- `WINDOW ASSIGNMENTS:` (W1, W2, W3... with brief descriptions)
- `RESULT:` (one-line success criteria)

### 6. MINIMUM VIABLE MILESTONE
What must be true at Phase X completion.

### 7. DISPATCH FILE FORMAT (MANDATORY)
Paste the exact `.protocol/orchestration.md` format specification.
Tell Cowrk every window MUST have: Task ID, Objective, Target Files, Why this lane, Power Tier, Command, Prompt, Expected Output, Validation, Fallbacks, Cost Class, Dependencies.

### 8. CONSTRAINTS (NON-NEGOTIABLE)
Numbered list. Include revenue-first constraint if applicable.

### 9. OUTPUT FILES TO CREATE
Numbered list of all expected files.

### 10. REMEMBER
Short reinforcement: "You are Cowrk. You create execution structure. Every dispatch must be agent-ready. Reference real files. Reference real commands."

---

## SKILL MAPPING CHEAT SHEET

When planning a phase, reference these mappings:

| If the phase involves... | Use these skills |
|--------------------------|------------------|
| Code extraction, architecture, interfaces | `/engineering:architecture`, `/engineering:system-design`, `/engineering:code-review` |
| Testing, validation, CI/CD | `/engineering:testing-strategy`, `/engineering:deploy-checklist` |
| Deployment, infrastructure, runbooks | `/operations:runbook`, `/engineering:deploy-checklist`, `/operations:risk-assessment` |
| Landing pages, UX, design | `/design:frontend-design`, `/design:ux-copy`, `/design:design-system` |
| Launch posts, social media, blog posts | `/marketing:content-creation`, `/marketing:campaign-plan`, `/marketing:seo-audit` |
| Pricing, positioning, competitive analysis | `/product-management:brainstorm`, `/marketing:competitive-brief`, `/product-management:competitive-brief` |
| Customer interviews, research synthesis | `/product-management:synthesize-research`, `/customer-support:customer-research` |
| Metrics, dashboards, data analysis | `/product-management:metrics-review`, `/data:visualization`, `/data:analysis` |
| Email sequences, drip campaigns | `/marketing:email-sequence`, `/operations:process-optimization` |
| Enterprise sales, compliance, risk | `/operations:risk-assessment`, `/product-management:competitive-brief` |

**Every phase MUST have 3–4 Required Skills listed explicitly.**

---

## COMMON MISTAKES KIMI MUST AVOID

### ❌ Mistake 1: Writing fluffy strategy instead of execution windows
**BAD:** "Phase 1: Build the router. Consider using OpenAI SDK patterns."
**GOOD:** "W1: Create `packages/ultra-router/src/index.ts` implementing `createClient()` matching OpenAI interface."

### ❌ Mistake 2: Forgetting to mandate skill usage
**BAD:** No skills section.
**GOOD:** "Required Skills: `/engineering:architecture` → `docs/skills/engineering/architecture/ADR-003-ai-provider-routing.md`"

### ❌ Mistake 3: Not specifying exact output files
**BAD:** "Cowrk should create some dispatch files."
**GOOD:** "Output files: `.protocol/state/revenue-phase0-dispatches.md` through `revenue-phase12-dispatches.md`, `revenue-master-timeline.md`, `REVENUE-PROGRESS.md`"

### ❌ Mistake 4: Leaving out the dispatch format specification
**BAD:** No format section.
**GOOD:** Paste the full `.protocol/orchestration.md` window format and say "MANDATORY."

### ❌ Mistake 5: Writing window descriptions that are too vague
**BAD:** "W1: Set up the router."
**GOOD:** "W1: Create `packages/ultra-router/` with `package.json`, `tsconfig.json`, `src/index.ts`. Extract core routing logic from `adapters/` + `dexgraph/`. Implement `createClient()` matching OpenAI's `chat.completions.create` interface."

### ❌ Mistake 6: Drifting into Cowrk's job
**BAD:** Writing full dispatch commands with bash prompts.
**GOOD:** Writing high-level window assignments and letting Cowrk fill in the exact commands.

---

## THE REVENUE OVERRIDE

**Before writing ANY prompt, check `.kimi/memory/REVENUE-FIRST.md`.**

If the user's goal can be interpreted as "make money / get customers / grow / YC":
- The prompt MUST be revenue-focused
- Features must be justified by revenue impact
- The default answer is extraction/deployment/GTM, not new code

---

## STEP-BY-STEP: KIMI WRITES A PROMPT

1. **Read `.kimi/memory/REVENUE-FIRST.md`** — Is this revenue-related?
2. **Read this guide** — Lock the format in memory
3. **Study the gold standard** (`COWRK-FINAL-REVENUE-PROMPT.txt`) — Match its density
4. **Scan the actual codebase** — Find relevant directories and files
5. **Identify phases and windows** — Break into 0→N sequential phases
6. **Map skills to phases** — Use the cheat sheet above
7. **Write the prompt** — Include all 10 mandatory sections
8. **Save as `COWRK-[NAME]-PROMPT.txt`** in project root
9. **Update `.kimi/CONSCIOUSNESS.md`** — Add active mission reference
10. **Tell the user:** "Prompt is ready. Give it to Cowrk."

---

## EXAMPLE: USER SAYS "Plan the next thing"

**Kimi thinks:**
1. REVENUE-FIRST.md says default mode is revenue
2. Current active prompt is `COWRK-FINAL-REVENUE-PROMPT.txt`
3. But user said "the next thing" — maybe they want a NEW prompt for a new goal
4. If new goal: follow this guide, write new prompt
5. If continuing: point them to existing active prompt

**Kimi says:** "The active revenue prompt is `COWRK-FINAL-REVENUE-PROMPT.txt`. If you need a prompt for a different goal, tell me the goal and I'll write it using the full protocol."

---

## REMINDER

**The user should NEVER have to explain prompt structure to Kimi.**
**This guide contains everything Kimi needs to know.**
**If Kimi screws up the prompt format, re-read this file and fix it.**

---

*Stored in: .kimi/memory/PROMPT-ENGINEERING-GUIDE.md*
*Created: 2026-04-14*
*Rule: Read this before writing any Cowrk prompt.*
