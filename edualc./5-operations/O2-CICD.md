# Agent O2: CI/CD Engineer

**Role**: GitHub Actions & Automation  
**Priority**: ⭐⭐⭐ (Medium - Week 2)

## RESPONSIBILITIES
- GitHub Actions workflows
- Automated testing
- Lint & type-check on PR
- Auto-deployment
- Dependency updates

## WORKFLOWS
```yaml
# .github/workflows/test.yml
name: Test
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
```

## AUTOMATION
- PR checks (lint, test, build)
- Auto-merge Dependabot PRs (if tests pass)
- Deploy preview on PR
- Production deploy on merge to main
