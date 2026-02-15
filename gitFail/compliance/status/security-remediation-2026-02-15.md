# Security Remediation Report — 2026-02-15

## Objective

Restore strict enterprise push gate (`gate:push:full`) by removing high/critical dependency vulnerabilities while preserving project behavior.

## Changes Applied

1. Removed unused risky dependency from core API workspace:
   - Removed `bcrypt` from `apps/core-api/package.json`.
2. Updated website stack to patched releases:
   - `next` -> `^15.5.10` (resolved to 15.5.12)
   - `eslint-config-next` -> `^15.5.10`
   - `react` / `react-dom` -> `^19.2.0`
   - `@types/react` / `@types/react-dom` -> `^19.2.3`
3. Added root override for vulnerable transitive package:
   - `@mapbox/node-pre-gyp` -> `2.0.3`
   - retained `tar` override at `7.5.7`
4. Regenerated lockfile with:
   - `npm install --ignore-scripts --legacy-peer-deps`

## Verification Results

- Before remediation:
  - `npm audit`: 52 total vulnerabilities
  - high/critical: 28 (20 high, 8 critical)
- After remediation:
  - `npm audit`: 17 total vulnerabilities
  - high/critical: 0 (13 low, 4 moderate)
- `npm run security:audit`: PASS (`--audit-level high`)
- `npm run build -w apps/website`: PASS
- `npm run gate:push:full`: PASS

## Notes

- Remaining vulnerabilities are low/moderate and require semver-major upgrades or have no upstream fix yet.
- Governance and policy guard checks continue to pass in full gate mode.
