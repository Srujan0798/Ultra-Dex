# GitHub Actions for Ultra-Dex

Official GitHub Actions for integrating Ultra-Dex into your CI/CD pipeline.

## Available Actions

### 1. Ultra-Dex Verify Action

Verify implementation plan completeness and alignment score in CI/CD.

```yaml
name: Ultra-Dex Verification
on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Verify Ultra-Dex Plan
        uses: Srujan0798/ultra-dex-action/verify@v1
        with:
          template: './IMPLEMENTATION-PLAN.md'
          fail-on: 'incomplete-p0-sections'
          min-alignment: '70'
```

**Inputs:**
- `template` - Path to implementation plan (default: './IMPLEMENTATION-PLAN.md')
- `fail-on` - Fail condition: 'never', 'incomplete-p0-sections', 'incomplete-all', 'low-alignment' (default: 'incomplete-p0-sections')
- `min-alignment` - Minimum alignment score % (default: '70')
- `context-file` - Path to CONTEXT.md (default: './CONTEXT.md')

### 2. Ultra-Dex Alignment Check Action

Check plan vs code alignment on every PR.

```yaml
name: Alignment Check
on: [pull_request]

jobs:
  alignment:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check Alignment
        uses: Srujan0798/ultra-dex-action/align@v1
        with:
          min-score: '75'
          comment-on-pr: 'true'
```

**Inputs:**
- `min-score` - Minimum alignment score (default: '75')
- `comment-on-pr` - Post results as PR comment: 'true' or 'false' (default: 'true')
- `github-token` - GitHub token for PR comments (default: '${{ github.token }}')

### 3. Ultra-Dex Auto-Fix Action

Automatically fix common issues based on Ultra-Dex rules.

```yaml
name: Auto-Fix
on: 
  push:
    branches: [main]

jobs:
  fix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT }} # For pushing fixes
      
      - name: Auto-Fix Issues
        uses: Srujan0798/ultra-dex-action/fix@v1
        with:
          rules: 'all'
          auto-commit: 'true'
          commit-message: 'chore: auto-fix by ultra-dex'
```

**Inputs:**
- `rules` - Rules to check: 'all', 'cursor-rules', '21-step', 'alignment' (default: 'all')
- `auto-commit` - Commit fixes automatically: 'true' or 'false' (default: 'false')
- `commit-message` - Commit message for auto-fixes (default: 'chore: ultra-dex auto-fixes')

## Complete CI/CD Workflow Example

```yaml
name: Ultra-Dex CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Phase 1: Verification
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Ultra-Dex
        run: npm install -g ultra-dex
      
      - name: Verify Implementation Plan
        uses: Srujan0798/ultra-dex-action/verify@v1
        with:
          fail-on: 'incomplete-p0-sections'
          min-alignment: '70'

  # Phase 2: Alignment Check
  alignment:
    runs-on: ubuntu-latest
    needs: verify
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Ultra-Dex
        run: npm install -g ultra-dex
      
      - name: Check Alignment
        uses: Srujan0798/ultra-dex-action/align@v1
        with:
          min-score: '75'
          comment-on-pr: 'true'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # Phase 3: Auto-Fix
  autofix:
    runs-on: ubuntu-latest
    needs: [verify, alignment]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Ultra-Dex
        run: npm install -g ultra-dex
      
      - name: Apply Auto-Fixes
        uses: Srujan0798/ultra-dex-action/fix@v1
        with:
          rules: 'cursor-rules'
          auto-commit: 'true'
          commit-message: 'chore: auto-fixes by Ultra-Dex 🤖'
        env:
          GITHUB_TOKEN: ${{ secrets.PAT }}

  # Phase 4: Build & Deploy
  deploy:
    runs-on: ubuntu-latest
    needs: [verify, alignment, autofix]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy
        run: |
          echo "Deployment would happen here"
```

## Environment Variables

All actions support these environment variables:

- `ULTRA_DEX_API_KEY` - Optional API key for cloud features
- `OPENAI_API_KEY` - For AI-powered features
- `ANTHROPIC_API_KEY` - For Claude integration
- `GITHUB_TOKEN` - For PR comments and commits

## Troubleshooting

### Action fails with "Command not found"

Make sure to install Ultra-Dex CLI before using the action:

```yaml
- name: Install Ultra-Dex
  run: npm install -g ultra-dex
```

### PR comments not appearing

Ensure `GITHUB_TOKEN` is available:

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Auto-commit not working

For auto-commit, you need a Personal Access Token (PAT) with repo scope:

```yaml
- uses: actions/checkout@v4
  with:
    token: ${{ secrets.PAT }}
```

## License

MIT - Same as Ultra-Dex
