# WORKFLOW-MANUAL.md

> **How to manually execute V2.0 Hard Reset dispatches**
> Use this when you want full control over each window

---

## Quick Reference

| Step | Action | Command/File |
|------|--------|--------------|
| 1 | Check progress | `cat .protocol/state/PROGRESS.md` |
| 2 | Read next window | `cat .protocol/state/v20-phase0-dispatches.md` |
| 3 | Copy command | Find `Command:` section |
| 4 | Execute | Paste in terminal |
| 5 | Validate | Check `Expected Output` |
| 6 | Mark done | Edit `PROGRESS.md` |
| 7 | Repeat | Go to step 1 |

---

## Detailed Walkthrough

### Step 1: See What's Next

```bash
cat .protocol/state/PROGRESS.md
```

Look for the first window with status `⏳ PENDING`.

---

### Step 2: Read the Dispatch

```bash
# For Phase 0, Window 1
cat .protocol/state/v20-phase0-dispatches.md
```

Scroll to find the window section (e.g., `#### W1: Create Target Folder Structure`)

---

### Step 3: Copy the Command

Each window has a `Command:` block like:

```bash
claude --model opus --effort max -p \
  "Create Ultra-Dex v2.0 DexGraph folder structure...
   
   CREATE core/planner/index.ts...
   ..."
```

**Copy the entire command block** (including the `\` line continuations)

---

### Step 4: Execute

Paste into your terminal and run.

**What happens:**
- Claude (or Codex/Gemini/Qwen) receives the prompt
- Agent executes the task
- Output appears in terminal

---

### Step 5: Validate

Check the `Expected Output` section in the dispatch:

```bash
# Example validation from W1
ls -d core/ runtime/ memory/ dexgraph/ adapters/ governance/ tools/ observability/ cli/ sdk/
find dexgraph/ -name '*.ts' | wc -l  # should be 6
```

Run the validation commands. If they pass → ✅ Success

---

### Step 6: Mark as Done

Edit `.protocol/state/PROGRESS.md`:

```bash
# Change this:
| W1 | ⏳ PENDING | - | - | - | - | Create folder structure |

# To this:
| W1 | ✅ DONE | Claude Opus | 2026-04-13 10:00 | 2026-04-13 10:30 | $3.20 | Create folder structure |
```

Also update the progress bar:
```
Phase 0:  [██░░] 1/4 windows   HARD RESET
```

---

### Step 7: Next Window

Return to Step 1. Next window (W2) is now ready.

---

## If Something Goes Wrong

### Agent Fails or Stalls

1. **Check Fallback #1** in the dispatch
2. Copy and run the fallback command
3. If that fails, try Fallback #2
4. If all fail, mark as `❌ FAILED` in PROGRESS.md
5. Investigate manually or skip for now

### Validation Fails

1. Check if partial work was done
2. Run the agent again (sometimes fixes it)
3. Or manually fix what remains
4. Re-run validation

### Not Sure What to Do

1. Re-read the dispatch file
2. Check `.protocol/state/v20-master-timeline.md` for context
3. Ask Kimi (me) for clarification

---

## Window Dependency Rules

| Phase | Windows | Dependencies |
|-------|---------|--------------|
| 0 | W1 ║ W2 → W3 → W4 | W3 needs W1, W4 needs all |
| 1 | W1→W2→W3→W4 | Sequential |
| 2 | W1→W2→W3→W4 | Sequential |
| 3 | W1→W2→W3→W4 | Sequential |
| 4 | W1→W2→W3→W4 | Sequential |

See `v20-master-timeline.md` for full dependency graph.

---

## Cost Tracking

Keep rough track of costs as you go:

| Window | Agent | Estimated | Actual |
|--------|-------|-----------|--------|
| W1 | Claude Opus | $3.00 | $___ |
| W2 | Claude Opus | $4.00 | $___ |

Total budget: ~$200 for all 52 windows

---

## Daily Workflow

### Morning (5 min):
```bash
cat .protocol/state/PROGRESS.md
# See what's pending
```

### Work Session:
1. Pick next pending window
2. Read dispatch
3. Execute command
4. Validate
5. Mark done
6. Repeat while energy lasts

### End of Day (2 min):
```bash
# Update PROGRESS.md with today's completions
# Note any blockers
```

---

## Tips for Success

1. **Don't rush** — Better to do 2 windows well than 4 poorly
2. **Validate immediately** — Don't skip validation steps
3. **Use fallbacks** — If Opus fails, try Sonnet or Codex
4. **Track costs** — Note actual spend vs estimates
5. **Take breaks** — After each phase gate, pause and review

---

## Gate Approvals

At the end of each phase, you'll hit a **Gate**:

- Gate 0: After Phase 0 (Day 2)
- Gate 1: After Phase 4 (Week 2)
- Gate 2: After Phase 6 (Week 3)
- Gate 3: After Phase 8 (Week 4)
- Gate 4: After Phase 11 (Week 7)

**At each gate:**
1. Review all validation criteria
2. Run full test suite
3. Decide: Continue / Pause / Rollback
4. Mark gate as passed in PROGRESS.md
5. Proceed to next phase

---

## Questions?

- **Which window next?** → Check PROGRESS.md
- **How to run this window?** → Check dispatch file
- **What if it fails?** → Use fallbacks in dispatch
- **Where's the architecture?** → `docs/skills/engineering/system-design/`

---

**You're executing V2.0 Hard Reset. 52 windows. 8 weeks. Let's go.**
