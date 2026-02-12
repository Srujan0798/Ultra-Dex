# GitHub Suspension Recovery Playbook

Last updated: February 12, 2026

This is the project-standard process to handle account suspension in a legal,
ethical, and operationally mature way.

## Principles

- Do not attempt to bypass suspension controls.
- Use one official support ticket thread.
- Provide factual evidence only.
- Keep development moving locally with auditable backups.

## Official Policy References

- Terms of Service:
  https://docs.github.com/en/site-policy/github-terms/github-terms-of-service
- API Terms (rate limits / acceptable API use):
  https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#h-api-terms
- Acceptable Use Policies:
  https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies
- Disrupting Users Policy:
  https://docs.github.com/en/site-policy/acceptable-use-policies/github-disrupting-the-experience-of-other-users
- GitHub Status:
  https://www.githubstatus.com/

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

## Preventive Controls (Always On)

1. Run full local gate before sensitive operations:
   `npm run gate:local`
2. Run manual guard when needed:
   `npm run guard:github`
3. During suspension/local-only operations, run:
   `npm run guard:github:local`
4. Pre-push hook automatically runs full push gate:
   `npm run gate:push`
   - governance file checks
   - GitHub status + remote/account checks
   - secret/risky automation scans
   - tests + security audit

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
