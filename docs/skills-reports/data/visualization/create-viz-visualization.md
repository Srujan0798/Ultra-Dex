# 📊 Data Analysis Context for Ultra-Dex

> **Extracted from organization-wide data analysis workflows**

---

## Overview

This document captures the tribal knowledge around Ultra-Dex's data infrastructure, metrics definitions, and common analysis patterns. It serves as a reference for future data analysis work.

---

## 1. Data Schema

### 1.1 Test Results Schema

**Source:** `tests/*.test.{js,ts}`

**Key Metrics:**

- Test ID (UUID)
- Test Name (string)
- Test Type (enum: unit, integration, e2e, cli)
- Status (enum: pass, fail, skip, todo)
- Duration (ms)
- Failure Message (string)
- Stack Trace (string)
- Test Group (string)
- Timestamp (ISO 8601)
- Environment (string)

**Common Analysis Patterns:**

- Pass rate: `(pass count / total) * 100`
- Flaky rate: `(failures on retry / total runs) * 100`
- Execution time P95/P99
- Group failure rate

**Views Commonly Needed:**

- Executed Tests view: All tests by timestamp
- Failed Tests view: Tests where status = 'fail'
- Flaky Tests view: Tests with multiple failures
- Performance view: Tests sorted by duration

---

### 1.2 Code Quality Schema

**Source:** TypeScript compilation, ESLint, code review outputs

**Key Metrics:**

- Error Count (ERRORs)
- Warning Count (WARNINGs)
- Error Type (syntax, type, lint)
- File Path (string)
- Line Number (int)
- Severity (critical, high, medium, low)
- Rule ID (string)
- Module (string)
- Component (string)

**Common Analysis Patterns:**

- Error density: `errors per 1000 lines`
- Module health: Errors by module
- Severity weight: Weighted score by severity
- Trend analysis: Errors over time

**Views Commonly Needed:**

- Errors by module
- Severity distribution
- Error trends (week-over-week)

---

### 1.3 Security Issues Schema

**Source:** Code review, `npm audit`, security scans

**Key Metrics:**

- Vulnerability ID (string)
- Severity (critical, high, medium, low)
- Description (string)
- CVE (string)
- CVSS Score (decimal)
- Location (file path + line number)
- Type (injection, XSS, etc.)
- Remediation Effort (hours)

**Common Analysis Patterns:**

- Risk score: `CVSS score × affected users`
- P0 count: `severity = critical`
- Exposure window: Time since vulnerability introduced
- Remediation priority: `severity × exposure × effort`

**Views Commonly Needed:**

- Critical vulnerabilities only
- Vulnerabilities by component
- Remediation timeline

---

### 1.4 Technical Debt Schema

**Source:** `TECHNICAL_DEBT_AUDIT.md`

**Key Metrics:**

- Issue ID
- Category (code, architecture, performance, tests, docs, errors)
- Severity (critical, high, medium, low)
- Effort (hours)
- Description
- Current State
- Impact
- Status (todo, in-progress, done)
- Priority (P0, P1, P2, P3)

**Common Analysis Patterns:**

- Debt ratio: `(estimated hours ÷ total codebase lines) × 1000`
- Aging analysis: Oldest issues needing attention
- Priority score: `severity × impact`
- Fix velocity: Issues resolved per sprint
- Blocker analysis: Count of P0 (production-blockers)

**Views Commonly Needed:**

- P0 blockers
- Issues by category
- Engineering effort allocation
- Trend quality (are we reducing or adding debt?)

---

### 1.5 Build Performance Schema

**Source:** CI/CD logs, build metrics

**Key Metrics:**

- Build ID
- Build Duration (s)
- Timestamp
- Status (success, failed, cancelled)
- Build Type (dev, test, prod)
- Steps
- Caching Used (bool)
- Dependencies Used (array)

**Common Analysis Patterns:**

- Build time P95
- Failure rate
- Cache hit/miss impact
- Time-to-deploy
- Dev velocity loss from slow builds

**Views Commonly Needed:**

- Build time trends
- Slowest builds
- Squads experiencing slow dev cycles

---

### 1.6 Dependency Schema

**Source:** `package.json`, `npm audit`

**Key Metrics:**

- Package Name (string)
- Current Version (string)
- Latest Version (string)
- Is Outdated (bool)
- Has Security Vulnerability (bool)
- Type (runtime, dev, peer)
- Last Updated (date)
- Last Owner Notified (date)

**Common Analysis Patterns:**

- Outdated packages: `latest !== current`
- Security exposure: `has_vulnerability = true`
- Tech lag: Days since last update
- Risk score: `implications × time since update`

**Views Commonly Needed:**

- Outdated packages
- Security scan results
- Exposure window

---

## 2. Key Metrics Definitions

### 2.1 Test Quality Metrics

**Pass Rate:**

```
pass_rate = (passed_tests ÷ total_tests) × 100
Target: > 99%
```

**Flaky Rate:**

```
flaky_rate = (tests_passed_on_retry ÷ total_test_runs) × 100
Target: < 1%
```

**Coverage:**

```
coverage = (lines_covered ÷ total_lines) × 100
Target: > 80%
```

**Performance:**

```
execution_time = sum(duration_of_all_tests)
Target: < 60 seconds per test file
```

---

### 2.2 Code Quality Metrics

**Error Count:**

```
total_errors = count_of_ALL_error_types
Target: 0 (in strict mode)
```

**Error Density:**

```
error_density = (errors ÷ lines_of_code) × 1000
Target: < 1 error per 1000 lines
```

**Complexity:**

```
cyclomatic_complexity = number_of_paths_through_code
Target: < 10 per function
```

---

### 2.3 Security Risk Metrics

**CVSS Rating:**

```
critical  = score ≥ 9.0
high      = 7.0 ≤ score < 9.0
medium    = 4.0 ≤ score < 7.0
low       = 0.1 ≤ score < 4.0
```

**Exposure Window:**

```
exposure_days = today - vulnerability_report_date
Target: < 30 days for critical issues
```

---

### 2.4 Technical Debt Metrics

**Debt Ratio:**

```
debt_ratio = (estimated_fix_hours ÷ codebase_size_in_lines) × 1000
Target: < 10 hours per 1000 lines
```

**Aging:**

```
age_days = (today - issue_creation_date)
Target: Not to exceed 90 days for high-severity
```

**Blocker Count:**

```
blockers = count_of_P0_issues
Target: 0 (at production time)
```

---

### 2.5 Build Performance Metrics

**Duration P95:**

```
duration_p95 = 95th_percentile_of_build_times
Target: < 30 seconds for dev builds
```

**Failure Rate:**

```
failure_rate = (failed_builds ÷ total_builds) × 100
Target: < 1%
```

**Cache Efficiency:**

```
cache_hit_rate = (cache_hits ÷ total_cache_requests) × 100
Target: > 80%
```

---

### 2.6 Dependency Health Metrics

**Outdated Rate:**

```
outdated_rate = (outdated_packages ÷ total_packages) × 100
Target: < 5%
```

**Security Exposure:**

```
exposed_packages = packages_with_vulnerabilities
Target: 0 for production
```

**Tech Lag:**

```
tech_lag_days = today - package_last_updated
Target: Keep packages updated within 60 days
```

---

## 3. Common Analysis Patterns

### 3.1 Root Cause Analysis Template

When investigating failures:

1. **Reproduce:** Can you reproduce the failure?
2. **Localize:** Where did it fail? (file, line, commit)
3. **Isolate:** What changed? (diff, recent merges)
4. **Time-box:** When did it start? (timeline analysis)
5. **Dependency chain:** What caused the failure? (trace back)
6. **Remediation:** How to fix? (band-aid vs. permanent)

### 3.2 Trend Analysis Template

When analyzing trends:

- **Time-bucket:** Group by day/week/sprint
- **Segment:** Compare by module, team, component
- **Baseline:** Compare to historical average
- **Anomaly detection:** Look for spikes/drops beyond 2 std devs
- **Correlation:** Layer multiple metrics (e.g., did test slow-down accompany coverage increase?)

### 3.3 Comparison Analysis Template

When comparing segments:

- **Control group:** Sane baseline
- **Treatment group:** Segment being analyzed
- **Hold-out:** Untouched group for validation
- **Statistical significance:** Ensure sample sizes are adequate
- **Confounders:** Consider external factors (deploy time, day of week, holidays)

---

## 4. Tribal Knowledge & Gotchas

### 4.1 Test Execution Times

**Fast Tests (< 100ms):**

- Unit tests
- Pure functions
- Mocked external deps
  ⚡ Run on every commit

**Medium Tests (100ms - 2s):**

- Integration tests
- Database operations
- Some API calls
  📝 Run on every PR

**Slow Tests (> 2s):**

- E2E tests
- Real provider calls
- Complex workflows
  ⏱️ Run nightly or pre-deploy only

### 4.2 Flaky Test Patterns

Common causes of flakiness:

1. **Race conditions** → Add explicit waits
2. **External API calls** → Mock responses
3. **Time-based tests** → Freeze time
4. **Random data** → Seed Random Number Generators (RNG)
5. **Concurrent tests** → Use isolated test data
6. **Network timeouts** → Set generous timeouts, retry logic

### 4.3 TypeScript Errors

**Why strict mode enabled:**

- Catches bugs at compile time
- Enables better IDE autocomplete
- Documents code via types
- Team standard: Strict mode is required

**Common error patterns:**

- Missing property declarations (90% of errors)
- Implicit `any` types (95% after fixing props)
- Missing null checks (50% after fixing `any`)

**Fixing approach:**

1. Add property declarations everywhere
2. Add explicit type annotations
3. Add null checks where needed

### 4.4 Security Vulnerabilities

**Math.random() vs crypto.randomUUID():**

- `Math.random()` is predictable
- `crypto.randomUUID()` is cryptographically secure
- Applies to: IDs, tokens, secrets

**Empty catch blocks:**

- Errors become silent failures
- Prevent debugging
- Always log or re-throw

**Direct process.env access:**

- No validation
- Scattered throughout code
- Use centralized env config with validation

---

## 5. Queries Repository

### 5.1 Test Performance Query

```sql
-- Query to identify slowest tests

SELECT
    test_name,
    avg(duration_ms) as avg_duration,
    max(duration_ms) as max_duration,
    count(*) as run_count,
    type
FROM test_runs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY test_name, type
HAVING avg(duration_ms) > 2000
ORDER BY avg_duration DESC
LIMIT 20;
```

---

### 5.2 TypeScript Errors Trend

```sql
-- Track TypeScript error trends

SELECT
    DATE(timestamp) as date,
    COUNT(*) as error_count,
    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
    module
FROM ts_errors
WHERE timestamp > NOW() - INTERVAL '90 days'
GROUP BY DATE(timestamp), module
ORDER BY date ASC;
```

---

### 5.3 Security Vulnerabilities Exposure

```sql
-- Find vulnerabilities open longest

SELECT
    vulnerability_id,
    cve,
    cvss_score,
    DATE(discovered_at) as discovered_date,
    DATEDIFF(NOW(), discovered_at) as days_exposed,
    severity
FROM security_vulnerabilities
WHERE status = 'open'
ORDER BY days_exposed DESC, cvss_score DESC;
```

---

### 5.4 Technical Debt Aging

```sql
-- Find oldest high-debt items

SELECT
    issue_id,
    category,
    severity,
    priority,
    DATE(created_at) as created_date,
    DATEDIFF(NOW(), created_at) as age_days,
    estimated_hours
FROM tech_debt
WHERE status != 'done'
AND severity IN ('critical', 'high')
ORDER BY age_days DESC
LIMIT 50;
```

---

### 5.5 Dependency Risk Score

```sql
-- Calculate dependency risk based on age and vulnerabilities

SELECT
    package_name,
    current_version,
    latest_version,
    DATEDIFF(NOW(), last_updated) as days_behind,
    has_vulnerability,
    (CASE
        WHEN has_vulnerability THEN DATEDIFF(NOW(), last_updated) * 10
        ELSE DATEDIFF(NOW(), last_updated)
    END) as risk_score
FROM dependencies
WHERE is_outdated = true
ORDER BY risk_score DESC;
```

---

## 6. Visualization Guidelines

### 6.1 When to Use Which Chart

**Trends over time → Line chart**

- Test pass rate over 4 weeks
- TypeScript errors over time
- Build duration trends

**Comparisons → Bar chart**

- Issues by category
- Errors by module
- Test duration by type

**Proportions → Pie or donut chart**

- Error distribution across modules
- Security issues by severity
- Test failures by root cause

**Distributions → Histogram or boxplot**

- Test duration distribution
- Error severity spread
- Code complexity distribution

**Relationships → Scatter plot**

- Coverage vs. bugs
- Build time vs. test count
- Review time vs. bug introduction rate

### 6.2 Color Palettes

**Status (stoplight):**

- Success: `#27ae60` (green)
- Warning: `#f39c12` (orange)
- Danger: `#e74c3c` (red)
- Neutral: `#95a5a6` (gray)

**Categories (distinct):**

- Purple: `#9b59b6`
- Blue: `#3498db`
- Green: `#2ecc71`
- Yellow: `#f1c40f`
- Red: `#e74c3c`
- Gray: `#34495e`

**Trends (gradient):**

- Positive: `#27ae60` → `#2ecc71`
- Negative: `#e74c3c` → `#c0392b`
- Neutral: `#95a5a6` → `#7f8c8d`

---

## 7. Deliverables for Ultra-Dex

**As a result of applying data skills to Ultra-Dex:**

**Analysis Reports:** [docs/skills/data/analysis/ultra-dex-data-analysis.md](./analysis/ultra-dex-data--analysis.md)

**Interactive Dashboards:** [docs/skills/data/dashboards/dashboard.html](./dashboards/dashboard.html)

**Next Steps:**

- Fix TypeScript property declarations
- Address the 3 critical security vulnerabilities
- Reduce test execution time
- Update outdated dependencies

---

**Data Context Complete** ✅  
**Visualization Code Ready** 📈  
**Analysis Backlog Clear** 🚀

**Last Updated:** 2026-04-10
