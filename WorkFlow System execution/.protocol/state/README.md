# .protocol/state/ — Active State Directory

> **V2.0 DexGraph Hard Reset In Progress**

---

## Current Status

| Attribute | Value |
|-----------|-------|
| **Project** | Ultra-Dex v2.0 — DexGraph Hard Reset |
| **Version** | 6.0.0 → Resetting to **2.0.0-alpha.0** |
| **Phase** | 0 (Hard Reset) — Day 0-2 |
| **Status** | ⏳ Ready to Execute |
| **Dispatches** | 13 files created (52 windows) |
| **Last Updated** | 2026-04-13 |

---

## Quick Start

### For Manual Execution:
```bash
# See current progress
cat .protocol/state/PROGRESS.md

# See Phase 0 tasks
cat .protocol/state/v20-phase0-dispatches.md

# Run first window (W1)
# Copy command from dispatch file and execute
```

### For Automated Execution:
```bash
# Start orchestrator
npm run ultra:start

# Check status
npm run ultra:status
```

---

## Files in This Directory

| File | Purpose | Status |
|------|---------|--------|
| `PROGRESS.md` | **Live progress tracker** — what's done/pending | ✅ Active |
| `v20-master-timeline.md` | Full 8-week timeline, dependencies | ✅ Ready |
| `v20-phase0-dispatches.md` | Phase 0 (Day 0-2): Hard Reset | ⏳ Ready to execute |
| `v20-phase1-dispatches.md` | Phase 1 (Week 1): Parser | ⏳ Queued |
| `v20-phase2-dispatches.md` | Phase 2 (Week 1): Graph Builder | ⏳ Queued |
| `v20-phase3-dispatches.md` | Phase 3 (Week 1-2): State Machine | ⏳ Queued |
| `v20-phase4-dispatches.md` | Phase 4 (Week 2): Scheduler | ⏳ Queued |
| `v20-phase5-dispatches.md` | Phase 5 (Week 3): Adapter | ⏳ Queued |
| `v20-phase6-dispatches.md` | Phase 6 (Week 3): Dispatcher | ⏳ Queued |
| `v20-phase7-dispatches.md` | Phase 7 (Week 4): Memory | ⏳ Queued |
| `v20-phase8-dispatches.md` | Phase 8 (Week 4): Context | ⏳ Queued |
| `v20-phase9-dispatches.md` | Phase 9 (Week 5): Governance | ⏳ Queued |
| `v20-phase10-dispatches.md` | Phase 10 (Week 6): Verification | ⏳ Queued |
| `v20-phase11-dispatches.md` | Phase 11 (Week 7): CLI | ⏳ Queued |
| `v20-phase12-dispatches.md` | Phase 12 (Week 8): Events | ⏳ Queued |

---

## Previous Cycle (Archived)

- **v3.1.0** — "Diamond State" — COMPLETE (April 9, 2026)
- See `.protocol/archive/cycle-6-eternal/` for details
- See `COMPLETE-ALL-WORK.md` for full completion report

---

## Next Actions

1. **Review Phase 0** → `v20-phase0-dispatches.md`
2. **Start Execution** → Manual OR Automated (see below)
3. **Track Progress** → Updates automatically in `PROGRESS.md`

---

## Execution Modes

### Mode 1: Manual (Recommended for V2.0)
You copy commands from dispatch files and run them. Full control.

```bash
# Read the dispatch
cat .protocol/state/v20-phase0-dispatches.md

# Copy W1 command, paste in terminal
# Check Expected Output
# Mark done in PROGRESS.md
# Move to W2...
```

### Mode 2: Automated (Ultra Orchestrator)
System runs windows automatically with your approval at gates.

```bash
npm run ultra:start    # Start automation
npm run ultra:status   # Check progress
npm run ultra:pause    # Pause anytime
```

---

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| V2.0 Spec | `NOTION/v2.0.MD` | Product specification |
| Hard Reset Prompt | `COWRK-V20-HARD-RESET-PROMPT.txt` | How dispatches were created |
| Manual Workflow | `WORKFLOW-MANUAL.md` | Step-by-step manual guide |
| Orchestrator Guide | `WORKFLOW-AUTOMATED.md` | Automated system guide |
| System Design | `docs/skills/engineering/system-design/` | Architecture decisions |

---

**Status: V2.0 Ready to Execute | Phase 0 Pending | 52 Windows Planned**
