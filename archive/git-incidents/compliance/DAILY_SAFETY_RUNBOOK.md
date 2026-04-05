# Daily Safety Runbook (Ultra-Dex)

Use this flow every day to stay compliant, legal, and push-ready.

## Fast Path (Recommended)

```bash
npm run safety:daily
```

This generates a timestamped report in `gitFail/compliance/status/`.

## A) Start-of-Day Verification

```bash
git status --short --branch
git --no-pager log --oneline -n 10
node gitFail/compliance/check-governance-files.js
npm run gate:local
```

Pass criteria:

- Governance check passes.
- Local enterprise gate passes.

## B) Before Every Commit

```bash
# Hooks should be active
git config --get core.hooksPath

# Stage changes and commit (pre-commit runs automatically)
git add -A
git commit -m "your message"
```

Automatic protections from `.husky/pre-commit`:

- Secret leak scanning on staged diff.
- Governance file validation.
- Compliance reminder.

## C) Before Every Push

```bash
npm run gate:push
git push --dry-run origin main
git push origin main
```

`gate:push` enforces:

- Governance checks
- GitHub status + policy guard
- Secret scan in push diff
- Policy-risk automation checks
- Remote account access check (suspension check)
- Smoke test suite for push safety
- Security audit when dependency manifests changed

For full verification before major releases:

```bash
npm run gate:push:full
```

## D) If GitHub Is Degraded (Yellow/Red)

1. Freeze push/release operations.
2. Continue local development only.
3. Re-run after status recovers:

```bash
npm run gate:local
npm run gate:push
```

## E) If Account Suspension Is Detected

1. Do not retry push loops.
2. Capture evidence:

```bash
sh gitFail/compliance/capture-support-evidence.sh
```

3. Update support ticket with concise facts and latest evidence file.
4. Keep coding locally with:

```bash
npm run gate:local
```

## F) Weekly Hardening

```bash
npm run security:audit
node gitFail/compliance/check-governance-files.js
```

Also verify policy docs remain present and current:

- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `gitFail/compliance/GITHUB_COMPLIANCE_CHECKLIST.md`
