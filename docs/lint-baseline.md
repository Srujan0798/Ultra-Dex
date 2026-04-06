# Lint Baseline

Generated: 2026-04-06

## Configuration
- ESLint v9.x with flat config
- Coverage: src/, packages/sdk/, apps/dashboard/src/, apps/cli/lib/

## Rules Enabled

### JavaScript
- `no-unused-vars`: error
- `no-undef`: error
- `no-console`: off
- `no-empty`: warn

### TypeScript
- `@typescript-eslint/no-explicit-any`: warn
- `@typescript-eslint/explicit-function-return-type`: warn

## Baseline Counts

| Directory | Errors | Warnings |
|-----------|--------|----------|
| src/core | TBD | TBD |
| src/services | TBD | TBD |
| packages/sdk | TBD | TBD |
| apps/dashboard | TBD | TBD |
| apps/cli/lib | TBD | TBD |

## Commands

```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

## Notes

- Run `npm run lint 2>&1 > lint-report.txt` to generate full report
- Update this file with actual counts after ESLint module issues resolved
