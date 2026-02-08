# CI/CD Guide

This guide shows how to integrate Ultra-Dex with CI/CD pipelines. The goal is to enforce plan alignment and quality gates automatically.

## GitHub Actions (Recommended)

Example workflow:

```yaml
name: Ultra-Dex CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npx ultra-dex check --p0-only
      - run: npx ultra-dex verify --full
```

## Pre-Commit Hooks

Install hooks:

```bash
ultra-dex pre-commit --install
```

Typical hooks:

- `ultra-dex validate`
- `ultra-dex align`
- `ultra-dex check --p0-only`

## GitLab CI

```yaml
stages: [validate, test]

validate:
  stage: validate
  script:
    - npm ci
    - npm run lint
    - npx ultra-dex check --p0-only

test:
  stage: test
  script:
    - npm test
    - npx ultra-dex verify --full
```

## Tips

- Use `ultra-dex audit` to detect context drift.
- Use `ultra-dex gate check` for quality gates in CI.
- Upload `CONTEXT.md` and `.ultra/` as artifacts for traceability.
