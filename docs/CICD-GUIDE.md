# Ultra-Dex CI/CD & Automation Guide

> Automate your quality gates using Ultra-Dex's verification tools. This guide covers local git hooks and GitHub Actions.

---

## 🛡️ 1. Local Git Hooks (Pre-Commit)

Prevent bad code from entering your repository by enforcing Ultra-Dex validation before every commit.

### Installation
Run this in your project root:
```bash
npx ultra-dex pre-commit --install
```

### What It Checks
The pre-commit hook runs:
1. **Alignment Check:** Verifies code matches `IMPLEMENTATION-PLAN.md` (min score: 70%).
2. **Structure Validation:** Ensures required files (`CONTEXT.md`, folder structure) exist.
3. **Linting:** Runs standard linting if configured.

### Manual Setup
Create `.husky/pre-commit`:
```bash
#!/bin/sh
npx ultra-dex align --quiet
if [ $? -ne 0 ]; then
  echo "❌ Plan alignment too low. Update IMPLEMENTATION-PLAN.md or the code."
  exit 1
fi
```

---

## 🤖 2. GitHub Actions

Run the full verification suite on every Pull Request.

### Workflow File
Create `.github/workflows/ultra-dex.yml`:

```yaml
name: Ultra-Dex Verification

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
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
      
      - name: Check Alignment
        run: npx ultra-dex align
      
      - name: Run Validation
        run: npx ultra-dex validate
      
      - name: Generate Report
        run: npx ultra-dex export --format json > ultra-dex-report.json
      
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: ultra-dex-report
          path: ultra-dex-report.json
```

### Understanding the Report
The workflow uploads a JSON artifact containing:
- Alignment Score
- Missing Features (Plan vs Code)
- Project Health Status
- Agent Verification Logs

---

## 📈 3. Quality Gates

We recommend these thresholds for a healthy project:

| Metric | Minimum | Recommended |
|--------|---------|-------------|
| Alignment Score | 70% | 90%+ |
| Test Coverage | 50% | 80%+ |
| Documentation | `README.md` only | Full `docs/` folder |

### Failing the Build
To strictly fail the build if the score is low, use:
```bash
npx ultra-dex align --threshold 80
```

---

## 🔄 4. Automated Swarms (Advanced)

You can trigger agent swarms automatically when a specific label is added to a PR.

**Example: Auto-Review**
Add this to your workflow:

```yaml
  ai-review:
    if: contains(github.event.pull_request.labels.*.name, 'ai-review')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Reviewer Agent
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npx ultra-dex run reviewer --task "Review PR #${{ github.event.number }}"
```
