# Security Audit Baseline - 2026-02-12

Generated at: 2026-02-12 (UTC)
Command: `npm run security:audit`

## Current Result

- Status: `PASS` for `--audit-level high` (no high/critical findings)
- Total vulnerabilities: `4`
- Severity split: `4 moderate`

## Resolved In This Session

- Removed unused `ink-box` dependency (eliminated legacy `cross-spawn` chain).
- Removed locked `clinic` dependency; profiling commands now use `npx clinic`.
- Removed unused `nodemailer` dependency.
- Applied a non-breaking `npm audit fix` pass (with `npm_config_ignore_scripts=true`).
- Upgraded desktop toolchain:
  - `electron` -> `^40.4.0`
  - `electron-builder` -> `^26.7.0`
- Upgraded mobile Expo line:
  - `expo` -> `^54.0.33`
- Removed root `mocha` / `sinon` / `chai` dev chain.
- Added root `overrides.tar = 7.5.7` and reinstalled lock graph.
- Audit count reduced from `52` to `4` (all moderate).

## Remaining Findings

1. `@langchain/community` / `langsmith` (moderate)
   - Requires major-version migration to patched SDK lines (`@langchain/community@1.1.15+`).

## Enforcement Status

- `node gitFail/compliance/check-governance-files.js`: PASS
- `npm run guard:github:local`: PASS
- `npm test`: PASS
- `npm run security:audit`: PASS (high threshold)
- `npm run gate:local`: PASS

## Next Remediation Order

1. Upgrade LangChain packages to patched major lines with compatibility test pass.
2. Re-run:
   - `npm run security:audit`
   - `npm run gate:local`
3. Keep full push gate blocked until GitHub account suspension is lifted (`npm run guard:github` still fails on remote account check).
