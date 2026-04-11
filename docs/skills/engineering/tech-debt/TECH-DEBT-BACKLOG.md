# 🔧 Technical Debt Backlog

**Generated:** 2026-04-10  
**Total Issues:** 156  
**Status:** Prioritized & Ready

---

## 🔴 CRITICAL (Fix Immediately - P0)

### TD-010: Error Handler Duplication

- **Locations:** 4 files with duplicate error handlers
- **Impact:** Maintenance burden, inconsistent behavior
- **Fix:** Consolidate to single error handler
- **Effort:** 4-8 hours
- **Status:** ⏳ Pending

### TD-011: Config Manager Duplication

- **Locations:** 3 implementations
- **Impact:** Config drift, inconsistent settings
- **Fix:** Single source of truth
- **Effort:** 6-10 hours
- **Status:** ⏳ Pending

### TD-020: Security Audit Monolith

- **Location:** src/core/security/audit.ts (884 lines)
- **Impact:** Unmaintainable, difficult to test
- **Fix:** Split into focused modules
- **Effort:** 12-20 hours
- **Status:** ⏳ Pending

### TD-081: Insecure Random ID Generation

- **Location:** Multiple files using `Math.random()`
- **Impact:** Predictable IDs (170 occurrences)
- **Fix:** Use `crypto.randomUUID()`
- **Effort:** 2-4 hours
- **Status:** ⏳ Pending

---

## 🟠 HIGH (Fix This Week - P1)

### TD-040: Silent Error Swallowing

- **Location:** 50+ empty catch blocks
- **Impact:** Errors lost, debugging impossible
- **Fix:** Add error logging
- **Effort:** 4-6 hours
- **Status:** ⏳ Pending

### TD-030: Synchronous File Operations

- **Location:** src/core/agents/checkpoint.ts
- **Impact:** Blocking async context
- **Fix:** Use async fs methods
- **Effort:** 3-5 hours
- **Status:** ⏳ Pending

### TD-021: Unified API Complexity

- **Location:** src/core/memory/unified-api.ts (521 lines)
- **Impact:** Difficult to maintain
- **Fix:** Extract stores to modules
- **Effort:** 10-16 hours
- **Status:** ⏳ Pending

---

## 🟡 MEDIUM (Fix Next Sprint - P2)

### TD-012: Smart Error Duplication

- **Locations:** 4 files
- **Impact:** Confusion about which to use
- **Fix:** Consolidate to single module
- **Effort:** 3-5 hours
- **Status:** ⏳ Pending

### TD-023: Production Server Monolith

- **Location:** src/core/server/production-server.ts (548 lines)
- **Impact:** Server setup too complex
- **Fix:** Split into route modules
- **Effort:** 6-10 hours
- **Status:** ⏳ Pending

---

## Quick Wins (Under 2 Hours)

1. ✅ **Replace `Math.random()`** - Security fix
2. ✅ **Add error logging** - Fix silent failures
3. ✅ **Replace `split('.')`** - Use path.extname()
4. ✅ **Fix TODO imports** - Remove broken imports

---

## 📊 Summary by Priority

| Priority      | Count   | Effort (Hours) |
| ------------- | ------- | -------------- |
| P0 - Critical | 4       | 24-42          |
| P1 - High     | 3       | 17-27          |
| P2 - Medium   | 2       | 9-15           |
| P3 - Low      | 147     | ~200           |
| **Total**     | **156** | **~250-284**   |

---

**Recommendation:** Fix P0 items first (security + maintainability)
