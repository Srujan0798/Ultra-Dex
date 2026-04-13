# WORKFLOW-AUTOMATED.md

> **How to use the Ultra Orchestrator for automated execution**
> Use this when you want the system to run windows automatically

---

## Quick Start

```bash
# Start the orchestrator
npm run ultra:start

# Check status anytime
npm run ultra:status

# See live progress
npm run ultra:dashboard
```

---

## What the Orchestrator Does

### Automatically:
1. ✅ Reads dispatch files (v20-phase*.md)
2. ✅ Parses all 52 windows
3. ✅ Assigns agents based on Power Tier
4. ✅ Executes commands
5. ✅ Validates outputs
6. ✅ Retries with fallbacks on failure
7. ✅ Tracks costs
8. ✅ Updates PROGRESS.md
9. ✅ Pauses at gates for your approval

### You Only:
1. Start the orchestrator
2. Approve gate transitions
3. Handle edge cases (if all fallbacks fail)
4. Review daily reports

---

## Commands Reference

| Command | What It Does |
|---------|--------------|
| `npm run ultra:start` | Begin automated execution |
| `npm run ultra:status` | Show current status |
| `npm run ultra:dashboard` | Open live dashboard |
| `npm run ultra:pause` | Pause after current window |
| `npm run ultra:resume` | Resume from pause |
| `npm run ultra:stop` | Stop completely |
| `npm run ultra:skip` | Skip current window (mark failed) |
| `npm run ultra:report` | Generate daily report |

---

## Agent Assignment Logic

The orchestrator assigns agents based on `Power Tier`:

| Tier | Primary Agent | Fallback 1 | Fallback 2 | Fallback 3 |
|------|---------------|------------|------------|------------|
| HIGH | Claude Opus | Claude Sonnet | Codex o1 | OpenCode |
| BALANCED | Claude Sonnet | Gemini Pro | Codex gpt-4o | OpenCode |
| LOW | Gemini Flash | Qwen Max | OpenCode | - |

All assignments respect the dispatch file's fallback chain.

---

## Execution Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. START                                               │
│     Parse all dispatches                                │
│     Build dependency graph                              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  2. FIND NEXT WINDOW                                    │
│     Look for: PENDING + dependencies met                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  3. ASSIGN AGENT                                        │
│     Match Power Tier to available agent                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  4. EXECUTE                                             │
│     Run command                                         │
│     Capture output                                      │
│     Set timeout (from dispatch)                         │
└─────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────────────┐
                    │   Success?    │
                    └───────┬───────┘
                   Yes /    |    \ No
                      /     |     \
                     ↓      |      ↓
        ┌──────────────┐   |   ┌──────────────┐
        │ 5a. VALIDATE │   |   │ 5b. FALLBACK │
        │ Check output │   |   │ Try Fallback │
        └──────┬───────┘   |   └──────┬───────┘
               |          |          |
               ↓          |          ↓
        ┌──────────────┐  |   ┌──────────────┐
        │ Mark DONE    │  |   │ All failed?  │
        │ Update cost  │  |   │ → Mark FAIL  │
        └──────────────┘  |   └──────────────┘
                          |
                          ↓
        ┌───────────────────────────────────────┐
        │ 6. CHECK GATE                         │
        │ Phase complete? → Pause for approval  │
        └───────────────────────────────────────┘
                          |
                          ↓
        ┌───────────────────────────────────────┐
        │ 7. REPEAT                             │
        │ Back to step 2                        │
        └───────────────────────────────────────┘
```

---

## Gate Approvals

When a phase completes, the orchestrator **pauses** and asks:

```
═══════════════════════════════════════════════════════
🚪 GATE 0: CLEAN SLATE
═══════════════════════════════════════════════════════

Validation Criteria:
✅ 10 new top-level dirs exist
✅ Existing code archived to archive/v1/
❌ TypeScript compiles on new dirs (5 errors)
✅ Version: 2.0.0-alpha.0
✅ MIGRATION.md documents all changes

⚠️ 1 validation failed

Options:
[1] Continue anyway → Proceed to Phase 1
[2] Fix manually → Pause, let you fix
[3] Rollback Phase 0 → Reset and retry
[4] Stop → Exit orchestrator

Your choice: _
```

---

## Configuration

Create `.ultra-dex/orchestrator-config.json`:

```json
{
  "mode": "semi-automated",
  "autoApprove": {
    "gates": false,
    "lowTier": true,
    "balancedTier": false,
    "highTier": false
  },
  "budget": {
    "dailyLimit": 50,
    "totalLimit": 500,
    "alertAt": 400
  },
  "notifications": {
    "onGate": true,
    "onFailure": true,
    "onBudget": true,
    "dailyReport": true
  },
  "retry": {
    "maxAttempts": 3,
    "backoffMs": [1000, 5000, 30000]
  }
}
```

### Modes:
- `manual`: You approve every window
- `semi-automated`: Auto-runs, pauses at gates (recommended)
- `fully-automated`: Runs everything, only stops on budget/failure

---

## Cost Control

The orchestrator tracks costs automatically:

```bash
npm run ultra:cost
```

Output:
```
Daily: $12.40 / $50.00
Total: $45.20 / $500.00
Remaining: $454.80

Projected total: $220.00
Status: ✅ On budget
```

### Budget Alerts:
- At 80% → Warning notification
- At 100% → Auto-pause
- Daily limit exceeded → Auto-pause until tomorrow

---

## Monitoring

### Live Dashboard:
```bash
npm run ultra:dashboard
```

Shows:
- Current window
- Agent status
- Progress bars
- Cost today
- Recent logs

### Status Command:
```bash
npm run ultra:status
```

Output:
```
Ultra-Dex v2.0 Hard Reset
════════════════════════════════════════

Phase: 0 (Hard Reset)
Window: W3 (Consolidate)
Status: 🔄 RUNNING (12 min elapsed)
Agent: Claude Sonnet

Progress:
Phase 0: [██░░] 2/4 windows
Overall: [░░░░] 2/52 windows (4%)

Cost Today: $8.40
Budget Remaining: $491.60

Next: W4 (Validate clean slate)
ETA Phase 0 Complete: 2 hours
```

---

## Daily Reports

Every morning, the orchestrator generates:

```bash
cat .ultra-dex/reports/2026-04-13.md
```

Contents:
- Windows completed yesterday
- Windows started today
- Cost summary
- Any blockers
- Today's planned windows

---

## Troubleshooting

### Orchestrator Won't Start
```bash
# Check if already running
ps aux | grep ultra-orchestrator

# Kill if stuck
pkill -f ultra-orchestrator

# Restart
npm run ultra:start
```

### Window Keeps Failing
```bash
# Skip it and move on
npm run ultra:skip

# Or manually execute and mark done
# Then resume orchestrator
npm run ultra:resume
```

### Cost Too High
```bash
# Check cost breakdown
npm run ultra:cost -- --detail

# Reduce daily limit in config
# Switch to cheaper agents for remaining windows
```

### Want to Stop
```bash
npm run ultra:pause
# Finishes current window, then pauses

npm run ultra:stop
# Stops immediately (may leave window half-done)
```

---

## Switching Between Modes

### Manual → Automated
1. Check PROGRESS.md for current state
2. Start orchestrator: `npm run ultra:start`
3. Orchestrator picks up from where you left off

### Automated → Manual
1. Pause: `npm run ultra:pause`
2. Check PROGRESS.md for next pending window
3. Follow WORKFLOW-MANUAL.md
4. Update PROGRESS.md when done
5. Resume orchestrator: `npm run ultra:resume`

---

## Best Practices

1. **Start with semi-automated** — Auto-run but approve gates
2. **Review daily reports** — Catch issues early
3. **Set realistic budget** — $200-300 for full 52 windows
4. **Don't ignore failures** — If a window fails 3x, investigate
5. **Use gates as checkpoints** — Pause, review, then continue

---

## Full Automation Example

```bash
# 9 AM: Start your day
npm run ultra:start

# Orchestrator runs...
# - W1, W2, W3, W4 (Phase 0)
# - Pauses at Gate 0

# You get notification:
# "Gate 0 ready for approval"

# Review, approve, continue

# 1 PM: Check status
npm run ultra:status
# Phase 1 in progress, W2 running

# 6 PM: Daily report
npm run ultra:report
# 6 windows completed today
# Cost: $45

# Next day: Continue
npm run ultra:resume
```

---

## Support

- **Orchestrator issues?** → Check logs in `.ultra-dex/logs/`
- **Window failing?** → Try manual execution
- **Cost questions?** → Review agent assignment
- **Need to restart?** → PROGRESS.md keeps state

---

**The orchestrator manages 52 windows so you don't have to.**
