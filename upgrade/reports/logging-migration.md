# Logging Migration Report
## Console Statements → Logger Class Migration

**Generated:** 2026-03-27  
**Scan Tool:** Qwen CLI (Experimental LSP)  
**Scope:** `src/`, `apps/`, `apps/cli/` directories

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total console statements** | ~4,227 |
| **Files affected** | 400+ |
| **Existing Logger classes** | 6 |
| **Critical migrations** | 6 files |
| **High priority** | 5 files |

---

## 1. Existing Logger Infrastructure

The codebase already has **multiple Logger implementations** available for migration:

| Logger | Location | Features |
|--------|----------|----------|
| **Logger** | `src/platform/cli/ui/logger.js` | Persona-based (professional/fun/doomsday/assistant/robot), theming, quiet mode |
| **Logger** | `apps/cli/lib/ui/logger.js` | Same as above + PII redaction |
| **StructuredLogger** | `src/services/logging/structured-logger.js` | JSON output, file rotation, child loggers, correlation IDs |
| **logger (winston)** | `src/utils/logging.js` | Winston-based, file transports, performance metrics |
| **AuditLogger** | `src/services/audit/audit-logger.ts` | Audit trail, compliance reporting, PPM storage |
| **logger (winston)** | `apps/core-api/middleware/logger.js` | HTTP request logging, winston transports |

---

## 2. Console Statement Counts by Directory

| Directory | console.log | console.error | console.warn | console.debug | **Total** |
|-----------|-------------|---------------|--------------|---------------|-----------|
| **src/** | 1,395 | 455 | 44 | ~0 | **1,895** |
| **apps/** | 1,693 | 603 | 36 | ~0 | **2,332** |
| **GRAND TOTAL** | **~3,088** | **~1,058** | **~80** | **~0** | **~4,227** |

---

## 3. Migration Priority Matrix

### 🔴 Priority 1: CRITICAL (Self-Reference Issues)

These loggers use `console.*` within their own implementation - ironic and should be fixed first.

| File | Line | Statement | Recommended Fix |
|------|------|-----------|-----------------|
| `src/services/audit/audit-logger.ts` | Multiple | `console.log`, `console.error` | Use internal structured methods |
| `src/services/logging/structured-logger.js` | Multiple | `console.error` | Use fallback file transport |
| `src/utils/logging.js` | Multiple | `console.log`, `console.error`, `console.warn` | Bootstrap-only, remove runtime |
| `src/platform/cli/ui/logger.js` | 2 | `console.error` | Use stderr stream directly |
| `apps/cli/lib/ui/logger.js` | 2 | `console.error` | Use stderr stream directly |
| `apps/core-api/middleware/logger.js` | Multiple | `console.log` | Use winston transports only |

### 🟠 Priority 2: HIGH (Security & Compliance)

| File | Count | Types | Context | Recommended Logger |
|------|-------|-------|---------|-------------------|
| `src/services/auth/sso-service.ts` | 5+ | log | SAML, OAuth2, OIDC | AuditLogger |
| `src/services/security/encryption-service.ts` | 5+ | log, warn | Key generation, rotation | AuditLogger + StructuredLogger |
| `src/services/compliance/compliance-service.ts` | 5+ | log | SOC2, GDPR reports | AuditLogger |
| `src/security/enterprise-security.js` | 10+ | log | Security initialization | AuditLogger |
| `src/security/SecurityAuditor.js` | 15+ | log, warn | Penetration tests | AuditLogger |

### 🟡 Priority 3: MEDIUM (Core Services)

| File | Count | Types | Context | Recommended Logger |
|------|-------|-------|---------|-------------------|
| `src/core/orchestration/index.js` | 10+ | log, error, warn | Agent orchestration | StructuredLogger |
| `src/core/orchestration/registry.js` | 5+ | log, error | Agent discovery | StructuredLogger |
| `src/core/reliability/agent-autopsy.js` | 20+ | log | Agent failure recovery | StructuredLogger |
| `src/monitoring/ContinuousMonitor.js` | 20+ | log | Optimization cycles | StructuredLogger |
| `src/services/notifications/notification-service.ts` | 10+ | log, error | Notification channels | StructuredLogger |
| `src/services/collaboration/collaboration-service.ts` | 6+ | log, error | WebSocket sessions | StructuredLogger |
| `apps/core-api/server.js` | 15+ | log, error | Server startup | Winston logger |
| `apps/core-api/routes/webhooks.js` | 7 | log | External webhooks | StructuredLogger |
| `apps/dashboard/server.js` | 15+ | log, error | Dashboard WebSocket | Winston logger |

### 🟢 Priority 4: LOW (CLI & UI)

| File | Count | Context | Recommendation |
|------|-------|---------|----------------|
| `apps/cli/bin/ultra-dex-enhanced.js` | 100+ | CLI tutorial, demo | Keep console OR use CLI Logger |
| `apps/cli/bin/ultra-dex.js` | 5+ | CLI init | Keep console |
| `apps/cli/commands/*.js` | 50+ | Git commands | Use CLI Logger |
| `src/platform/cli/ui/logger.js` | 2 | Logger itself | Keep as-is |

### ⚪ Priority 5: DEFER (By Design)

| Category | Reason |
|----------|--------|
| Test files (`apps/cli/test/*.test.js`) | Test output is appropriate |
| Template examples (`apps/cli/assets/live-templates/**`) | User-facing code samples |
| React error boundaries (`apps/dashboard/src/components/*ErrorBoundary*`) | Frontend error handling |
| Next.js pages (`apps/cloud/app/*/page.jsx`) | Frontend error handling |
| Mobile app (`apps/mobile/App.tsx`) | Frontend initialization |

---

## 4. Logger Mapping Guide

```
┌─────────────────────────────────────────────────────────────────┐
│ Context                    │ Use This Logger                    │
├─────────────────────────────────────────────────────────────────┤
│ CLI user output            │ src/platform/cli/ui/logger.js      │
│ API/Server logging         │ apps/core-api/middleware/logger.js │
│ Audit/Security events      │ src/services/audit/audit-logger.ts │
│ Structured JSON logging    │ src/services/logging/structured-   │
│                            │ logger.js                          │
│ Core services              │ src/utils/logging.js (winston)     │
│ Frontend error boundaries  │ Keep console.error                 │
│ Test files                 │ Keep console.*                     │
│ Template examples          │ Keep console.*                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Migration Phases

### Phase 1: Fix Self-References (Week 1)
- [ ] `src/services/audit/audit-logger.ts`
- [ ] `src/services/logging/structured-logger.js`
- [ ] `src/utils/logging.js`
- [ ] `src/platform/cli/ui/logger.js`
- [ ] `apps/cli/lib/ui/logger.js`
- [ ] `apps/core-api/middleware/logger.js`

### Phase 2: Security & Auth (Week 2)
- [ ] `src/services/auth/sso-service.ts`
- [ ] `src/services/security/encryption-service.ts`
- [ ] `src/services/compliance/compliance-service.ts`
- [ ] `src/security/enterprise-security.js`
- [ ] `src/security/SecurityAuditor.js`

### Phase 3: Core Orchestration (Week 3)
- [ ] `src/core/orchestration/index.js`
- [ ] `src/core/orchestration/registry.js`
- [ ] `src/core/reliability/agent-autopsy.js`
- [ ] `src/monitoring/ContinuousMonitor.js`
- [ ] `src/monitoring/SystemMonitor.js`

### Phase 4: Services & APIs (Week 4)
- [ ] `src/services/notifications/notification-service.ts`
- [ ] `src/services/collaboration/collaboration-service.ts`
- [ ] `apps/core-api/server.js`
- [ ] `apps/core-api/routes/webhooks.js`
- [ ] `apps/dashboard/server.js`

### Phase 5: CLI Review (Optional)
- [ ] Review CLI output appropriateness
- [ ] Migrate to CLI Logger if needed
- [ ] Keep console for user-facing output

---

## 6. Code Migration Examples

### Before (console.log)
```typescript
// src/services/auth/sso-service.ts
class SSOService {
  initializeSAML() {
    console.log('Initializing SAML configuration');
    // ... config
  }
}
```

### After (AuditLogger)
```typescript
// src/services/auth/sso-service.ts
import { AuditLogger } from '../audit/audit-logger.js';

class SSOService {
  private logger = new AuditLogger('sso-service');
  
  initializeSAML() {
    this.logger.info('SAML_INITIALIZATION', {
      provider: this.config.provider,
      timestamp: new Date().toISOString()
    });
    // ... config
  }
}
```

---

## 7. Key File Paths (Absolute)

### Logger Implementations
- `/Users/srujansai/Desktop/Ultra-Dex/src/platform/cli/ui/logger.js`
- `/Users/srujansai/Desktop/Ultra-Dex/apps/cli/lib/ui/logger.js`
- `/Users/srujansai/Desktop/Ultra-Dex/src/services/logging/structured-logger.js`
- `/Users/srujansai/Desktop/Ultra-Dex/src/utils/logging.js`
- `/Users/srujansai/Desktop/Ultra-Dex/src/services/audit/audit-logger.ts`
- `/Users/srujansai/Desktop/Ultra-Dex/apps/core-api/middleware/logger.js`

### Priority 1 Migration Targets
- `/Users/srujansai/Desktop/Ultra-Dex/src/services/audit/audit-logger.ts`
- `/Users/srujansai/Desktop/Ultra-Dex/src/services/logging/structured-logger.js`
- `/Users/srujansai/Desktop/Ultra-Dex/src/utils/logging.js`

### Priority 2 Migration Targets
- `/Users/srujansai/Desktop/Ultra-Dex/src/core/orchestration/index.js`
- `/Users/srujansai/Desktop/Ultra-Dex/src/security/enterprise-security.js`
- `/Users/srujansai/Desktop/Ultra-Dex/apps/core-api/server.js`

---

## 8. Sign-Off Checklist

- [ ] Phase 1: Self-reference loggers fixed
- [ ] Phase 2: Security/auth services migrated
- [ ] Phase 3: Core orchestration migrated
- [ ] Phase 4: Services & APIs migrated
- [ ] Phase 5: CLI output reviewed
- [ ] All console statements in Priority 1-3 resolved
- [ ] Test coverage for new logger implementations
- [ ] Documentation updated

---

*Report generated by Qwen CLI using experimental LSP syntax tree analysis.*
