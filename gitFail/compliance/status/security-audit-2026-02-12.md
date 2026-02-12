# Security Audit Baseline - 2026-02-12

Generated at: 2026-02-12 (UTC)
Command: `npm run security:audit`

## Current Result

- Status: `FAIL` (expected while vulnerabilities remain)
- Total vulnerabilities: `20`
- Severity split: `10 high`, `5 moderate`, `5 low`

## Resolved In This Session

- Removed unused `ink-box` dependency (eliminated legacy `cross-spawn` chain).
- Removed locked `clinic` dependency; profiling commands now use `npx clinic`.
- Removed unused `nodemailer` dependency.
- Applied a non-breaking `npm audit fix` pass (with `npm_config_ignore_scripts=true`).
- Audit count reduced from `52` to `20`.

## Remaining High-Priority Findings

1. `diff` via `mocha` / `sinon` (high)
   - Requires major update path (`sinon` suggested by audit output).
2. `tar` chain (high)
   - Comes via `sqlite3` / electron build tooling and transitive node-gyp stack.
3. `send` chain in Expo toolchain (high)
   - Requires upgrading Expo to patched range (major upgrade path).

## Moderate Findings Still Open

1. `@langchain/community` / `langsmith`
   - Requires major-version migration to patched SDK lines.
2. `electron` in desktop workspace
   - Requires upgrade to patched line (`>=35.7.5`).

## Enforcement Status

- `node gitFail/compliance/check-governance-files.js`: PASS
- `npm run guard:github:local`: PASS
- `npm test`: PASS
- `npm run security:audit`: FAIL (this is the active policy gate blocker)

## Next Remediation Order

1. Upgrade `apps/desktop` Electron to patched stable line.
2. Plan and execute Expo workspace upgrade in `apps/mobile`.
3. Upgrade LangChain packages to patched major lines with compatibility test pass.
4. Upgrade `sinon`/`mocha` chain to clear `diff` advisory.
5. Re-run:
   - `npm run security:audit`
   - `npm run gate:local`
