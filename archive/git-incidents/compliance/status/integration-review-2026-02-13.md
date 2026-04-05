# Integration Review - 2026-02-13

## Scope
Review of currently untracked/experimental additions and modified CLI routing import.

## Findings (Highest Severity First)

1. **Critical** - Missing middleware/routes imports in API server
- File: `apps/core-api/server.js:13`
- File: `apps/core-api/server.js:14`
- File: `apps/core-api/server.js:16`
- File: `apps/core-api/server.js:17`
- File: `apps/core-api/server.js:18`
- File: `apps/core-api/server.js:19`
- File: `apps/core-api/server.js:20`
- Problem: imports reference files that do not exist (`middleware/error-handler.js`, `middleware/logger.js`, `routes/memory.js`, `routes/tasks.js`, `routes/providers.js`, `routes/webhooks.js`).
- Impact: API server cannot start.

2. **Critical** - Missing validation middleware import in agents route
- File: `apps/core-api/routes/agents.js:4`
- Problem: imports `../middleware/validation.js`, file not present.
- Impact: route module fails to load.

3. **High** - New git integration depends on missing package
- File: `src/core/integrations/git.js:10`
- Problem: imports `simple-git`, not present in root or app package dependencies.
- Impact: runtime/module resolution failure when used.

4. **High** - Error translator imports non-existent logger module
- File: `src/core/utils/error-translator.js:6`
- Problem: imports `./logging.js`, file not present under `src/core/utils/`.
- Impact: module load failure.

5. **High** - Composite GitHub action uses unsupported/unsafe secret interpolation pattern
- File: `.github/actions/ultra-dex/action.yml:68`
- Problem: inline expression `secrets.ULTRADEX_API_KEY || ...` in generated JSON config is fragile and non-portable for composite actions.
- Impact: workflow failures or unexpected secret handling.

6. **Medium** - Experimental workflow executes autonomous AI modification steps on push/PR
- File: `.github/workflows/template.yml:1`
- Problem: non-deterministic AI execution pipeline for review/implementation/testing/docs.
- Impact: compliance and reproducibility risk.

7. **Low** - CLI router command import path was incorrect in tracked code and is now fixed
- File: `apps/cli/lib/commands/router-cmd.js:12`
- Fix Applied: changed import from `../../../packages/sdk/src/router.js` to `../../../../packages/sdk/src/router.js`.

## Stabilization Actions Completed

- Reverted incomplete tracked migrations that broke app stack assumptions:
  - `apps/cli/lib/commands/init.js`
  - `apps/dashboard/package.json`
  - `apps/dashboard/tsconfig.json`
  - `apps/docs-site/package.json`
  - `apps/docs-site/tsconfig.json`
- Removed generated verification artifacts:
  - `apps/dashboard/.next/`
  - `apps/docs-site/.next/`
  - `apps/dashboard/next-env.d.ts`
  - `apps/docs-site/next-env.d.ts`
- Preserved valid tracked fix:
  - `apps/cli/lib/commands/router-cmd.js`

## Validation Results After Stabilization

- `NODE_ENV=test node --test apps/cli/test/init.test.js apps/cli/test/production-command-help.test.js` -> pass (3/3)
- `npm run gate:local` -> pass

## Recommended Integration Plan

1. **Phase A (safe)**
- Commit only `apps/cli/lib/commands/router-cmd.js` fix.

2. **Phase B (API hardening before merge)**
- Add missing middleware/route files for `apps/core-api/server.js` or trim imports to existing modules.
- Add dependency `simple-git` where `src/core/integrations/git.js` is consumed.
- Fix `error-translator` logger dependency (create logger module or use existing logger utility).

3. **Phase C (CI policy hardening)**
- Keep `.github/workflows/template.yml` out of main until deterministic, reviewable steps are enforced.
- Refactor `.github/actions/ultra-dex/action.yml` secret handling via explicit inputs/env from workflow call sites.

4. **Phase D (optional UX additions)**
- Integrate new CLI helper modules (`interactive-cli`, `colors`, `spinner`, `charts`, `formatters`, `tutorial`) only after command registration and test coverage are added.

