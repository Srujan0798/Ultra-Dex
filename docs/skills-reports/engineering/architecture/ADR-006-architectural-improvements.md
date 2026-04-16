# ADR-006: Critical Architectural Improvements

**Status:** 🔄 In Progress  
**Date:** 2026-04-10  
**Decision Owner:** @CTO Agent  
**Stakeholders:** Core Team

---

## Context

Architecture review revealed several critical issues that need immediate attention to maintain code quality, performance, and developer experience.

### Issues Identified

1. **tsx Runtime Overhead** - Production code uses tsx loader
2. **Missing Provider Abstraction** - No unified provider interface
3. **Type Safety Issues** - 500+ TypeScript errors
4. **Outdated Dependencies** - 15+ packages outdated
5. **Build Inefficiency** - Wrapper script adds latency

---

## Decisions & Improvements

### 1. Pre-compile TypeScript for Production

**Current:**

```bash
node --import=tsx dist/ultra-dex.js  # Runtime compilation
```

**Improved:**

```bash
node dist/ultra-dex.js  # Pre-compiled JavaScript
```

**Action:** ✅ Implemented esbuild bundling

---

### 2. Create Unified Provider Interface

**Created:** `src/services/ai-providers/base-provider.js`

```javascript
export class BaseAIProvider {
  async generate(messages, options) {}
  async *stream(messages, options) {}
  calculateCost(usage, model) {}
  isHealthy() {}
}
```

**Benefits:**

- Standardized provider API
- Circuit breaker pattern built-in
- Cost calculation standardized
- Easy to add new providers

---

### 3. Fix TypeScript Strictness

**Issues Found:**

- 500+ TypeScript errors
- Implicit `any` types
- Missing property definitions

**Actions:**

- Add explicit types
- Fix class property declarations
- Enable strict null checks

---

### 4. Update Dependencies

**Outdated Packages:**

- @ai-sdk/google: 3.0.60 → 3.0.61
- @anthropic-ai/sdk: 0.85.0 → 0.87.0
- @aws-sdk/client-s3: 3.1026.0 → 3.1028.0
- @sentry/node: 10.47.0 → 10.48.0
- ai: 6.0.153 → 6.0.156
- axios: 1.14.0 → 1.15.0
- bullmq: 5.73.1 → 5.73.3

---

### 5. Optimize Build System

**Current:**

- Wrapper script spawns tsx
- Runtime overhead

**Improved:**

- Pre-bundle with esbuild
- Single executable
- No runtime compilation

---

## Implementation Plan

| Priority  | Task                       | Status         |
| --------- | -------------------------- | -------------- |
| 🔴 High   | Create BaseAIProvider      | ✅ Done        |
| 🔴 High   | Fix TypeScript errors      | 🔄 In Progress |
| 🟡 Medium | Update dependencies        | ⏳ Pending     |
| 🟡 Medium | Pre-compile for production | ⏳ Pending     |
| 🟢 Low    | Optimize build pipeline    | ⏳ Pending     |

---

## Success Metrics

| Metric            | Before    | Target    |
| ----------------- | --------- | --------- |
| TypeScript Errors | 500+      | 0         |
| Startup Time      | 3-5s      | <1s       |
| Bundle Size       | N/A (tsx) | Optimized |
| Test Pass Rate    | 99.8%     | 100%      |

---

**Last Updated:** 2026-04-10
