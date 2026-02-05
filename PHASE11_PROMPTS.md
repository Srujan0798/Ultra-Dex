# Ultra-Dex Phase 11 - DevOps & CLI Visual Enhancement

> **Source:** DEPLOYMENT.md, SECURITY.md, PERFORMANCE.md, CLI-ENHANCEMENT-PLAN.md
> **Total:** 15 New Prompts (#96-110)
> **Date:** Feb 5, 2026

---

## 🔵 DEPLOYMENT & INFRASTRUCTURE

---

### PROMPT 96: Docker Configuration Generator

> **Source:** DEPLOYMENT.md (Docker section)
> **Status:** Full templates exist

```
## Task: Create Docker Config Generator

**Files to create:**
- cli/lib/commands/docker.js (NEW)
- templates/docker/Dockerfile (NEW)
- templates/docker/docker-compose.yml (NEW)

**Requirements:**

1. Command:
```bash
ultra-dex docker init
ultra-dex docker compose
```

2. Generate production-ready Dockerfile:
   - Node.js Alpine base
   - Non-root user
   - Health checks
   - Multi-stage build

3. Generate docker-compose.yml:
   - Ultra-Dex service
   - Nginx reverse proxy
   - Volume mounts
   - Network configuration

**Commit:** "feat: Add Docker configuration generator"
```

---

### PROMPT 97: Kubernetes Deployment Generator

> **Source:** DEPLOYMENT.md (K8s section)
> **Status:** Full templates exist

```
## Task: Create Kubernetes Manifest Generator

**Files to create:**
- cli/lib/commands/k8s.js (NEW)
- templates/k8s/deployment.yaml (NEW)
- templates/k8s/service.yaml (NEW)

**Requirements:**

1. Command:
```bash
ultra-dex k8s init
ultra-dex k8s deploy --replicas 2
```

2. Generate deployment.yaml:
   - Resource limits (256Mi/512Mi)
   - Liveness/readiness probes
   - Secret references for API keys
   - Rolling update strategy

3. Generate service.yaml:
   - LoadBalancer type
   - Port mapping

**Commit:** "feat: Add Kubernetes manifest generator"
```

---

### PROMPT 98: Environment Configuration Manager

> **Source:** DEPLOYMENT.md (env section)
> **Status:** Full templates exist

```
## Task: Create Environment Config Manager

**Files to create:**
- cli/lib/commands/env.js (NEW)
- templates/env/.env.production (NEW)
- templates/env/.env.staging (NEW)

**Requirements:**

1. Commands:
```bash
ultra-dex env init
ultra-dex env switch production
ultra-dex env validate
```

2. Generate environment files:
   - API key placeholders
   - Database URLs
   - Security configs
   - Performance configs

3. Validate all required vars are set

**Commit:** "feat: Add environment config manager"
```

---

### PROMPT 99: Monitoring Stack Generator

> **Source:** DEPLOYMENT.md (monitoring section)
> **Status:** Full templates exist

```
## Task: Create Monitoring Stack Generator

**Files to create:**
- cli/lib/commands/monitor.js (NEW)
- templates/monitoring/prometheus.yml (NEW)
- templates/monitoring/grafana-dashboard.json (NEW)

**Requirements:**

1. Commands:
```bash
ultra-dex monitor init
ultra-dex monitor dashboard
```

2. Generate Prometheus config:
   - Scrape configs
   - Ultra-Dex metrics endpoint
   - Alert rules

3. Generate Grafana dashboard:
   - System health panel
   - API response time graph
   - Agent execution metrics

**Commit:** "feat: Add monitoring stack generator"
```

---

## 🟢 SECURITY

---

### PROMPT 100: Security Audit CLI

> **Source:** SECURITY.md (267 lines)
> **Status:** Full guide exists

```
## Task: Create Security Audit Command

**Files to create:**
- cli/lib/commands/security.js (NEW)
- cli/lib/security/validators.js (NEW)

**Requirements:**

1. Commands:
```bash
ultra-dex security audit
ultra-dex security check-secrets
ultra-dex security validate-paths
```

2. Path traversal prevention:
```javascript
const validateSafePath = (input) => {
  if (input.includes('..')) return false;
  const fullPath = path.resolve(process.cwd(), input);
  return fullPath.startsWith(process.cwd());
};
```

3. Forbidden paths check:
   - .git, node_modules, .env, package-lock.json

4. Credential scanning:
   - Detect hardcoded API keys
   - Check for exposed secrets

**Commit:** "feat: Add security audit CLI"
```

---

### PROMPT 101: Credential Manager

> **Source:** SECURITY.md (credential section)
> **Status:** Full guide exists

```
## Task: Create Credential Manager

**Files to create:**
- cli/lib/commands/credentials.js (NEW)
- cli/lib/security/keychain.js (NEW)

**Requirements:**

1. Commands:
```bash
ultra-dex creds set ANTHROPIC_API_KEY
ultra-dex creds list
ultra-dex creds rotate
```

2. Secure storage:
   - Use system keychain (keytar)
   - Never store plaintext

3. Rotation policy:
   - Track credential age
   - Warn when >90 days old

**Commit:** "feat: Add credential manager"
```

---

### PROMPT 102: Plugin Security Scanner

> **Source:** SECURITY.md (plugin section)
> **Status:** Full guide exists

```
## Task: Create Plugin Security Scanner

**Files to create:**
- cli/lib/commands/plugin-scan.js (NEW)
- cli/lib/security/plugin-validator.js (NEW)

**Requirements:**

1. Commands:
```bash
ultra-dex plugin scan <plugin-name>
ultra-dex plugin trust <plugin-name>
```

2. Security checks:
   - Verify source reputation
   - Static code analysis
   - Check for dangerous APIs
   - Monitor sandboxed execution

3. Trust registry for approved plugins

**Commit:** "feat: Add plugin security scanner"
```

---

## 🟡 PERFORMANCE

---

### PROMPT 103: Performance Profiler

> **Source:** PERFORMANCE.md (372 lines)
> **Status:** Full guide exists

```
## Task: Create Performance Profiler

**Files to create:**
- cli/lib/utils/profiler.js (enhance)
- cli/lib/commands/profile.js (NEW)

**Requirements:**

1. Commands:
```bash
ultra-dex profile <command>
ultra-dex profile report
```

2. Profiling functions:
```javascript
export function timeAsync(label, fn) {
  const start = performance.now();
  await fn();
  const duration = performance.now() - start;
  metrics.set(label, duration);
}
```

3. Performance targets:
   | Operation | Target | Critical |
   |-----------|--------|----------|
   | Startup | <100ms | >500ms |
   | File scan | <1s | >5s |
   | Graph build | <3s | >10s |
   | API call | <5s | >15s |

**Commit:** "feat: Add performance profiler"
```

---

### PROMPT 104: Caching System

> **Source:** PERFORMANCE.md (caching section)
> **Status:** Full guide exists

```
## Task: Create Caching System

**Files to create:**
- cli/lib/cache/file-cache.js (NEW)
- cli/lib/cache/graph-cache.js (NEW)

**Requirements:**

1. File cache with TTL:
```javascript
class FileCache {
  constructor(ttl = 30000) {
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  async get(key, fetchFn) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.time) < this.ttl) {
      return cached.value;
    }
    const value = await fetchFn();
    this.cache.set(key, { value, time: Date.now() });
    return value;
  }
}
```

2. Graph cache (30s TTL)
3. API response cache

**Commit:** "feat: Add caching system"
```

---

### PROMPT 105: Performance Budget Enforcer

> **Source:** PERFORMANCE.md (budgets section)
> **Status:** Full guide exists

```
## Task: Create Performance Budget Enforcer

**Files to create:**
- cli/lib/commands/budget.js (NEW)
- cli/lib/perf/budget-checker.js (NEW)

**Requirements:**

1. Define budgets:
```javascript
const BUDGETS = {
  'file-scan': 1000,    // 1s
  'graph-build': 3000,  // 3s
  'api-call': 5000,     // 5s
};
```

2. Commands:
```bash
ultra-dex budget check
ultra-dex budget set <operation> <ms>
```

3. Warn on budget violations

**Commit:** "feat: Add performance budget enforcer"
```

---

## 🔴 CLI VISUAL ENHANCEMENT

---

### PROMPT 106: Gradient Banner

> **Source:** CLI-ENHANCEMENT-PLAN.md (Phase 1)
> **Status:** Full code exists

```
## Task: Create Gradient ASCII Banner

**Files to create:**
- cli/lib/commands/banner.js (rewrite)

**Requirements:**

1. Dependencies:
```json
{
  "gradient-string": "^2.0.2",
  "boxen": "^7.1.1"
}
```

2. Gradient colors:
   - #6366f1 → #8b5cf6 → #d946ef

3. Boxed banner with rounded corners

**Commit:** "feat: Add gradient ASCII banner"
```

---

### PROMPT 107: Styled Tables

> **Source:** CLI-ENHANCEMENT-PLAN.md (Phase 4)
> **Status:** Full code exists

```
## Task: Create Styled Table Utility

**Files to create:**
- cli/lib/utils/tables.js (NEW)

**Requirements:**

1. Dependency: cli-table3

2. Rounded borders:
```javascript
chars: {
  'top-left': '╭', 'top-right': '╮',
  'bottom-left': '╰', 'bottom-right': '╯'
}
```

3. Gradient headers
4. Agent status tables

**Commit:** "feat: Add styled table utilities"
```

---

### PROMPT 108: Progress Bars

> **Source:** CLI-ENHANCEMENT-PLAN.md (Phase 6)
> **Status:** Full code exists

```
## Task: Create Progress Bar Utility

**Files to create:**
- cli/lib/utils/progress.js (NEW)

**Requirements:**

1. Progress bar:
```javascript
const bar = 
  chalk.magenta('█'.repeat(filled)) + 
  chalk.dim('░'.repeat(empty));
```

2. Swarm mode progress:
   - ○ Pending
   - ◉ Current
   - ● Complete

3. Real-time updates

**Commit:** "feat: Add progress bar utilities"
```

---

### PROMPT 109: Theme System

> **Source:** CLI-ENHANCEMENT-PLAN.md (Phase 10)
> **Status:** Full code exists

```
## Task: Create CLI Theme System

**Files to create:**
- cli/lib/config/theme.js (NEW)

**Requirements:**

1. Themes:
   - default (purple/magenta)
   - ocean (cyan/teal)
   - forest (green)

2. Theme switching:
```bash
ultra-dex config --theme ocean
```

3. Styled helper function:
```javascript
export function styled(type, text) {
  return chalk.hex(currentTheme[type])(text);
}
```

**Commit:** "feat: Add CLI theme system"
```

---

### PROMPT 110: Update Notifier

> **Source:** CLI-ENHANCEMENT-PLAN.md (Phase 9)
> **Status:** Full code exists

```
## Task: Add Update Notifier

**Files to update:**
- cli/bin/ultra-dex.js (enhance)

**Requirements:**

1. Dependency: update-notifier

2. Check for updates daily:
```javascript
const notifier = updateNotifier({ 
  pkg, 
  updateCheckInterval: 1000 * 60 * 60 * 24 
});
```

3. Display update box:
```
╭─────────────────────────────────────────╮
│ Update available! 3.0.0 → 3.1.0         │
│ Run npm install -g ultra-dex to update  │
╰─────────────────────────────────────────╯
```

**Commit:** "feat: Add update notifier"
```

---

## 📊 PHASE 11 SUMMARY

| # | Feature | Source | Category |
|---|---------|--------|----------|
| 96 | Docker Generator | DEPLOYMENT.md | 🔵 Ops |
| 97 | K8s Generator | DEPLOYMENT.md | 🔵 Ops |
| 98 | Env Config Manager | DEPLOYMENT.md | 🔵 Ops |
| 99 | Monitoring Stack | DEPLOYMENT.md | 🔵 Ops |
| 100 | Security Audit | SECURITY.md | 🟢 Security |
| 101 | Credential Manager | SECURITY.md | 🟢 Security |
| 102 | Plugin Scanner | SECURITY.md | 🟢 Security |
| 103 | Performance Profiler | PERFORMANCE.md | 🟡 Performance |
| 104 | Caching System | PERFORMANCE.md | 🟡 Performance |
| 105 | Budget Enforcer | PERFORMANCE.md | 🟡 Performance |
| 106 | Gradient Banner | CLI-ENHANCEMENT.md | 🔴 Visual |
| 107 | Styled Tables | CLI-ENHANCEMENT.md | 🔴 Visual |
| 108 | Progress Bars | CLI-ENHANCEMENT.md | 🔴 Visual |
| 109 | Theme System | CLI-ENHANCEMENT.md | 🔴 Visual |
| 110 | Update Notifier | CLI-ENHANCEMENT.md | 🔴 Visual |

---

## 📁 FILES EXTRACTED

**DevOps:**
- `DEPLOYMENT.md` → Prompts 96-99
- `SECURITY.md` → Prompts 100-102
- `PERFORMANCE.md` → Prompts 103-105

**CLI Visual:**
- `CLI-ENHANCEMENT-PLAN.md` → Prompts 106-110

---

**Total Prompts Now: 110**
| Phase | Prompts | Focus |
|-------|---------|-------|
| 5 | #1-15 | New 2026 Trends |
| 6 | #16-35 | Archived Tasks |
| 7 | #36-50 | Advanced AI |
| 8 | #51-65 | Specs + Moonshots |
| 9 | #66-80 | Developer Tools |
| 10 | #81-95 | Templates + Frameworks |
| 11 | #96-110 | DevOps + Visual |

*All prompts copy-paste ready for AI agents!*
