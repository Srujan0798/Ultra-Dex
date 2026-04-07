# Gemini Task Assignment - Diamond State v3.0.0

## 🎉 EXCELLENT NEWS!

The migration has achieved **CRITICAL MASS** at 85% completion!

### Current Status
- **TypeScript Files**: 289 (85%)
- **JavaScript Files**: 53 (15% remaining)
- **Type Errors**: 0 ✅
- **Validation**: 32/32 passing ✅
- **Core Directories**: ALL 100% COMPLETE ✅

Your previous work (Memory + Agents) is DONE and perfect!

---

## 🎯 YOUR NEW ASSIGNMENT: Utils Migration

### Scope
Migrate remaining JS files in `src/core/utils/`

### Files to Migrate (27 files)
```
src/core/utils/
├── dashboard-notifier.js
├── graph.js
├── monitoring.js
├── agents.js
├── prompts.js
├── stream.js
├── telemetry.js
├── error-recovery.js
├── schema-migrator.js
├── files.js
├── token-budget.js
├── logging.js
├── snap-progress.js
├── sync.js
├── prompt-builder.js
├── smart-error.js
├── safe-fs.js
├── smart-errors.js
├── config.js
├── version.js
├── version-check.js
├── reconciler.js
├── config-manager.js
├── profiler.js
├── help.js
├── review-helpers.js
├── performance.js
├── error-handler.js
└── interactive-mode.js
```

---

## 📋 Migration Process

### Step 1: Run Batch Migration
```bash
# Migrate all utils files
node scripts/migrate-batch.js src/core/utils/ --di
```

### Step 2: Fix Type Errors (if any)
```bash
# Check for errors
npm run typecheck 2>&1 | grep "utils/"

# Fix each error by adding:
# - Property declarations
# - Type annotations
# - Interface definitions
```

### Step 3: Validate
```bash
# Run validation
node scripts/validate-migration.js

# Check type errors
npm run typecheck
```

---

## 🚨 IMPORTANT PATTERNS

### Pattern 1: Property Declarations
```typescript
// BEFORE (JS)
class MyClass {
  constructor() {
    this.property = value;
  }
}

// AFTER (TS)
class MyClass {
  private property: Type;
  
  constructor() {
    this.property = value;
  }
}
```

### Pattern 2: Function Parameters
```typescript
// BEFORE (JS)
function myFunc(param1, param2) { }

// AFTER (TS)
function myFunc(param1: string, param2: number): ReturnType { }
```

### Pattern 3: Add DI Decorators
```typescript
// Add to service classes
@singleton()
export class MyService {
  constructor(
    @inject(DI_TOKENS.Logger) private logger: ILogger
  ) {}
}
```

---

## ✅ SUCCESS CRITERIA

- [ ] All 27 utils files migrated to TypeScript
- [ ] 0 type errors
- [ ] All validation checks passing
- [ ] Tests passing (if any exist)

---

## 🆘 ESCALATION

Escalate to Kimi if:
- Complex type definitions needed
- Breaking changes required
- DI wiring issues

Post in `.agent-tasks/ESCALATIONS.md`

---

## ⏱️ TIMELINE

**Target**: 2-3 hours
**Priority**: HIGH (final push to 100%!)

The end is in sight! 🚀
