# Launch Evidence Report - 2026-02-15

## Scope

This report captures post-merge hardening and verification from `main` after branch consolidation.

## Baseline Control

- Created and pushed baseline tag: `v6.0.0-main-clean`

## Dashboard Bundle Risk (Hologram)

### Changes applied

- Reduced 3D page runtime weight by removing `@react-three/drei` usage in `apps/dashboard/src/pages/Hologram.tsx`.
- Replaced `Text`/`Stars`/`OrbitControls` with lighter primitives and a small camera drift component.
- Added safer manual chunk function in `apps/dashboard/vite.config.ts`.

### Measured impact

- Before optimization: `dist/assets/Hologram-*.js` = **986.88 kB** (gzip 278.27 kB)
- After pass 1: `dist/assets/Hologram-*.js` = **865.74 kB** (gzip 233.72 kB)
- After pass 2: `dist/assets/Hologram-*.js` = **846.22 kB** (gzip 228.06 kB)

Result: chunk risk reduced ~14.2% from the initial baseline, but still above ideal threshold.

## Validation Results

### Passed

- `npm run build -w apps/dashboard`
- `npm run test -w apps/dashboard`
- `npm run test:a11y -w apps/dashboard`
- `npm run build -w apps/website`
- `npm run test:e2e` (after fixing test format + onboarding dismissal)

### Executed with expected failure / operational blocker

- `npm run test:load`
  - Ran successfully, but all requests failed with `ECONNREFUSED` because target API endpoint (`localhost:3000`) was not running during test.
- `npm run gate:push:full`
  - Completed test stage and now exits deterministically (no hang).
  - Fails at dependency security audit due known vulnerabilities in current dependency tree.

## E2E Stabilization Work

File: `tests/e2e/dashboard.spec.js`

- Migrated to ESM imports (`playwright/test`).
- Added controlled dashboard dev server boot in `beforeAll`.
- Added onboarding dismissal (`Skip Tour`) so navigation assertions are not blocked by modal overlay.

## Gate Stability Work

File: `package.json`

- Added `--test-force-exit` to:
  - `test`
  - `test:unit`
  - `test:integration`
  - `test:cli`
  - `test:push:smoke`

Result: full gate no longer stalls with lingering test handles.

## Remaining Launch Blockers (P0)

1. Full security audit fails (`npm audit --audit-level high`).
2. Load test requires controlled API environment startup (`apps/core-api` on expected host/port).
3. Hologram chunk still large; further split/defer strategy is needed if strict bundle ceiling is enforced.

## Immediate Next Actions

1. Security remediation wave:
   - Triage audit findings by exploitable surface and runtime path.
   - Patch direct deps first, isolate/no-fix transitive legacy deps behind runtime boundaries.
2. Load-test harness:
   - Add pre-load startup script for API target and health-check wait.
3. Hologram phase-2 split:
   - Move 3D runtime behind explicit feature toggle + secondary lazy boundary.
   - Optional: extract 3D route into standalone micro-frontend or separate entry.
