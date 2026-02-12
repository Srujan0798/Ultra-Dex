# GitHub Suspension Recovery Playbook

Last updated: February 12, 2026

This is the project-standard process to handle account suspension in a legal,
ethical, and operationally mature way.

## Principles

- Do not attempt to bypass suspension controls.
- Use one official support ticket thread.
- Provide factual evidence only.
- Keep development moving locally with auditable backups.

## Current Status (This Repo)

- Remote: `git@github.com:Srujan0798/Ultra-Dex.git`
- Verified error: `ERROR: Your account is suspended`
- Push is blocked until GitHub Support reinstates the account.

## Immediate Actions

1. Keep all communication in ticket `#4080230`.
2. Provide requested verification details:
   - username
   - approximate account creation location
   - original email address(es)
3. Add exact command evidence and UTC timestamps.
4. Avoid opening duplicate tickets.

## Support Reply Template

```text
Hi GitHub Support,

Following up on ticket #4080230.

Requested verification details:
1) Username: Srujan0798
2) Approximate location of account creation: <City, State, Country>
3) Original email address(es): <primary + historical emails>

Additional context:
- Account owner contacting from primary account email.
- Suspension observed while accessing/pushing to:
  git@github.com:Srujan0798/Ultra-Dex.git
- Error: "ERROR: Your account is suspended..."

Please continue review and share any additional verification steps required.

Thank you.
```

## Follow-Up Cadence

- Day 0: initial reply with full verification details.
- Day 3 business days: short follow-up in same thread.
- Day 5-7 business days: second follow-up, request escalation.

## Continuity While Suspended

1. Continue local commits and tests.
2. Create periodic git bundle backups:
   `git bundle create backups/ultra-dex-YYYY-MM-DD.bundle --all`
3. Validate backups:
   `git bundle verify backups/ultra-dex-YYYY-MM-DD.bundle`
4. Keep a local incident log in `gitFail/incidents/`.

## How Mature Teams Recover (Pattern)

- Acknowledge the incident quickly.
- Preserve evidence and timeline.
- Use one accountable communication channel.
- Apply temporary operating model (local-first, backups, test gates).
- Resume normal push/deploy only after formal reinstatement.

## Exit Criteria (Recovered)

- `git ls-remote origin` succeeds.
- `git push --dry-run origin main` succeeds.
- Normal CI/CD and release flow restored.
