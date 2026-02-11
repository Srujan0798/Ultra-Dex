# Template Tests

This folder contains unit tests for the template helpers.

## Run

From repo root:

```bash
node --test ${dir}/**/*.test.cjs
```

These tests load TypeScript modules via `ts-node/register/transpile-only`, so ensure `ts-node` is installed in the repo.
