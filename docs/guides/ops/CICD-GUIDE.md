# CI/CD Guide

Ultra‑Dex provides CI/CD templates and checks to enforce quality gates.

---

## GitHub Actions

```bash
ultra-dex cicd init --platform github --advanced
```

This generates:

- `templates/cicd/github-actions.yml`
- Quality checks: lint, tests, verify

---

## GitLab CI

```bash
ultra-dex cicd init --platform gitlab
```

---

## CircleCI

```bash
ultra-dex cicd init --platform circleci
```

---

## Azure DevOps / Jenkins

```bash
ultra-dex cicd init --platform azure
ultra-dex cicd init --platform jenkins
```

---

## Recommended Pipeline Steps

1. **Validate**: `ultra-dex doctor`
2. **Plan**: `ultra-dex check --strict`
3. **Test**: `npm test`
4. **Verify**: `ultra-dex verify --full`

---

## PR Review Workflow

Enable PR review checks:

```bash
ultra-dex cicd init --pr-review
```
