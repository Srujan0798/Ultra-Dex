# MAIN AGENT HANDOFF

Date: February 12, 2026  
Repository: Ultra-Dex  
Ticket: GitHub Support `#4080230` (account suspension)

## Purpose

This document is the full operating handoff for the main agent to:

1. Continue project development safely while GitHub push is blocked.
2. Enforce legal, ethical, and policy-compliant workflows.
3. Keep suspension recovery evidence structured and auditable.
4. Maintain engineering quality (tests, build, lint, security checks).

## Hard Reality Statements

- Creating a git bundle backup protects your work. Even if laptop/repo gets corrupted, you still have full git history.
- You still cannot push until suspension is removed. Local commits/tests continue normally; GitHub push remains blocked until reinstatement.

## Core Operating Rules

1. No policy bypasses.
2. No destructive git operations.
3. No secret exposure in code, logs, or commits.
4. No push attempts when `guard:github` reports suspension.
5. All suspension/recovery artifacts belong under `gitFail/`.
6. Every major change must be followed by verification commands.

## Current Known State

- Local branch is ahead of origin (suspension blocks remote sync).
- Enterprise local gate is passing (`gate:local`).
- Guard script confirms account suspension on remote checks.
- Evidence snapshots are being captured under `gitFail/compliance/status/`.
- Bundle backups are stored under `gitFail/backups/` and ignored from git history.

## Completed Work Summary (Recent Commits)

- `8b810df` docs(incident): refresh verification timestamp and backup location
- `25ce2a6` fix(checkpoint): remove duplicate cleanup method override
- `7338ada` chore(git): ignore local gitFail backup bundles
- `ef87816` chore(cli): declare browser globals for lint-safe command modules
- `76dc9b3` chore(apps): normalize tsconfig baselines and clean web entry files
- `b023f7a` test(cli): add plan, serve, and swarm command coverage
- `1c1d77a` fix(cli-runtime): resolve evaluation, self-healing, and tooling defects
- `1f80358` fix(cli): repair command regressions and daemon runtime option handling
- `c34f5f5` docs(incident): refresh suspension verification snapshot
- `2cd81b9` build(web,dashboard): fix frontend dependency and postcss compatibility
- `a770b10` ci: modernize test matrix and add extension build workflow
- `aaf5812` docs(status): add factual local continuity and incident records
- `fec64c8` fix(vscode-extension): stabilize local compile/lint workflow
- `1adc8fb` chore(compliance): fail fast on suspended account in push gate
- `e0cf33c` chore(security): eliminate high audit findings and pass local gate

## Mandatory Daily Command Flow

Run this exact sequence at start of every work cycle:

```bash
git status --short --branch
git --no-pager log --oneline -n 20
npm run gate:local
npm run guard:github || true
sh gitFail/compliance/capture-support-evidence.sh
```

Run this before committing any major batch:

```bash
npm run test
npm --prefix apps/web run build
npm --prefix apps/dashboard run build
npm --prefix packages/extensions/vscode run compile
npm --prefix packages/extensions/vscode run lint
npm --prefix packages/extensions/vscode run test
npm run security:audit
```

## Full Suspension Recovery Runbook

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== ULTRA-DEX SUSPENSION RECOVERY RUNBOOK ==="
echo "UTC: $(date -u +"%Y-%m-%d %H:%M:%S")"

echo "== 1) Baseline state =="
git status --short --branch
git --no-pager log --oneline -n 25

echo "== 2) Governance / local compliance gate =="
node gitFail/compliance/check-governance-files.js
npm run gate:local

echo "== 3) Suspension guard (expected to fail while suspended) =="
set +e
npm run guard:github
GUARD_EXIT=$?
set -e
echo "guard:github exit code = $GUARD_EXIT"

echo "== 4) Capture support evidence snapshot =="
sh gitFail/compliance/capture-support-evidence.sh
LATEST_EVIDENCE="$(ls -t gitFail/compliance/status/support-evidence-*.md | head -1)"
echo "Latest evidence: $LATEST_EVIDENCE"
sed -n '1,220p' "$LATEST_EVIDENCE"

echo "== 5) Build verification =="
npm --prefix apps/web run build
npm --prefix apps/dashboard run build
npm --prefix packages/extensions/vscode run compile
npm --prefix packages/extensions/vscode run lint
npm --prefix packages/extensions/vscode run test

echo "== 6) Test + security verification =="
npm run test
npm run security:audit

echo "== 7) Local backup safety =="
mkdir -p gitFail/backups
STAMP="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
BUNDLE="gitFail/backups/ultra-dex-${STAMP}.bundle"
git bundle create "$BUNDLE" --all
git bundle verify "$BUNDLE"

echo "== 8) Final state =="
git status --short --branch
echo "Runbook completed."
```

## Push Policy Flow

Do not push unless suspension is cleared.

```bash
# Always:
npm run gate:local
npm run guard:github

# Only if guard passes:
npm run gate:push
git push --dry-run origin main
git push origin main
```

## Reinstatement Moment Flow

When GitHub Support confirms reinstatement:

```bash
npm run guard:github
git ls-remote --heads origin
git push --dry-run origin main
git push origin main
```

## GitHub Policy Links (Official)

- Terms of Service: https://docs.github.com/terms-of-service
- Acceptable Use Policies: https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies
- Community Guidelines: https://docs.github.com/en/site-policy/github-terms/github-community-guidelines
- Appeal and Reinstatement: https://docs.github.com/en/site-policy/acceptable-use-policies/github-appeal-and-reinstatement
- Contacting Support: https://docs.github.com/en/support/contacting-github-support
- GitHub Support docs index: https://docs.github.com/en/support
- GitHub Status page: https://www.githubstatus.com/

## Master Prompt For Main Agent

```text
You are taking over the Ultra-Dex repo during a GitHub account suspension recovery.

Context:
- Date context: February 12, 2026
- GitHub account suspension ticket is open: #4080230
- Push to GitHub is blocked until reinstatement.
- We must stay legal, ethical, and policy-compliant with GitHub rules.
- Compliance artifacts are under gitFail/.

Primary objectives:
1. Preserve all project work locally with verifiable backups.
2. Enforce governance and policy checks before commit/push attempts.
3. Keep suspension/evidence/support artifacts in gitFail/ (not mixed with product code).
4. Continue development quality: tests, builds, lint, security audit checks.
5. Prepare immediate push-readiness for the moment account access is restored.

Non-negotiable rules:
- Never bypass policy checks.
- Never commit secrets.
- Never do destructive git operations.
- If guard says suspended, do not push.
- Keep support evidence local and timestamped.
- Record every important check result.

Must-run flow each cycle:
1) git status + recent commits
2) local gate: governance + tests + security
3) suspension guard check
4) capture evidence snapshot
5) update incident status doc
6) continue product work in small verified commits

Deliverables:
- Verification report with command outputs summary.
- List of commits made.
- Remaining risks and exact next actions.
```

## User Intent Archive (Normalized From Conversation)

The user repeatedly asked for:

1. A strict legal/ethical/compliant process with GitHub rules.
2. Zero tolerance for risky or suspicious automation behavior.
3. A repeatable pre-push and pre-run safety system.
4. Full visibility of warnings/errors and how to avoid recurrence.
5. Preservation of project work regardless of account suspension.
6. Professional recovery approach similar to large engineering teams.
7. Clear next steps at each checkpoint.
8. Storage of suspension-specific artifacts in `gitFail/`.

## What Large Engineering Teams Commonly Do In Similar Incidents

1. Freeze risky external actions (push/deploy), continue local development.
2. Keep evidence and timelines centralized and timestamped.
3. Add automated policy gates to reduce human error.
4. Segment commits into small verified batches.
5. Keep support communication concise, factual, and reproducible.
6. Run post-incident hardening: guardrails, testing, and documentation.

## Pending Items To Review Next

- Modified files:
  - `Dockerfile`
  - `README.md`
  - `docs/CHANGELOG.md`
  - `apps/cli/lib/cache/index.js`
- Untracked files:
  - `apps/cli/lib/integrations/neon.js`
  - `apps/cli/lib/integrations/netlify.js`
  - `apps/cli/lib/integrations/railway.js`
  - `packages/EXTENSION-GUIDE.md`
  - `src/services/ai-providers/`

## Final Instruction

Never attempt remote push while suspended.  
Keep building locally, keep evidence clean, keep policy gates strict, and stay fully auditable.
