# gitFail

This folder stores GitHub service incident notes and temporary compliance helpers
related to outage/risk handling work.

## Structure

- `INCIDENT_AUDIT_REPORT.md`: final incident-by-incident audit matrix and prevention plan.
- `incidents/`: incident timeline notes and copied status entries.
- `compliance/`: commit/PR compliance checklist and verification script.
- `compliance/DAILY_SAFETY_RUNBOOK.md`: one-page daily commit/push/incident operating flow.

## Usage

- Run compliance verification:
  `node gitFail/compliance/check-governance-files.js`
- Run GitHub policy/status guard:
  `node gitFail/compliance/github-guard.js`
- Run local-only guard (skip remote access check):
  `SKIP_REMOTE_CHECK=1 node gitFail/compliance/github-guard.js`
- Run enterprise local gate (governance + policy + tests + audit):
  `npm run gate:local`
- Run enterprise push gate (includes remote/account check):
  `npm run gate:push`
- Review checklist before commit/PR:
  `gitFail/compliance/GITHUB_COMPLIANCE_CHECKLIST.md`
- Capture a collaboration snapshot (Codex + Claude tracking):
  `./gitFail/compliance/track-agent-sync.sh`
- Capture snapshot + print only delta vs previous snapshot:
  `./gitFail/compliance/sync-now.sh`
- Snapshot files are written to:
  `gitFail/compliance/status/`
