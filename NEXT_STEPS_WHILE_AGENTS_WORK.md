# Next Steps While Labor Agents Work

Your agents (Gemini, Qwen, CLI) are now migrating files. Here's what YOU should do:

---

## 🔍 1. Monitor Progress (Check Every Few Hours)

### Check Migration Status
```bash
node scripts/migration-status.js
```

Expected output shows:
- Files migrated vs remaining
- Progress percentage
- Which agents are ahead/behind

### Check Validation
```bash
node scripts/validate-migration.js
```

Should show:
- ✅ Passed: Increasing number
- ⚠️ Warnings: Should stay low
- ❌ Failed: Should be 0

### Watch for Errors
```bash
# Check if typecheck passes
npm run typecheck 2>&1 | head -50

# Check test status
npm run test:unit 2>&1 | tail -20
```

---

## 🚨 2. Escalation Protocol (When Agents Get Stuck)

### When to Intervene

**Gemini/Qwen/CLI will ask you when:**
1. Type definitions unclear
2. Breaking changes needed  
3. Complex dependency injection
4. Performance concerns
5. Test failures

### How to Handle Escalations

**Problem**: "How do I type this function?"
```typescript
// Agent shows you:
function processData(data) { ... }

// You decide:
function processData(data: unknown): ProcessedResult { ... }
```

**Problem**: "Breaking change needed"
```typescript
// Agent asks if they can change API

// You decide: Maintain backward compat
export const oldAPI = { ... } // Keep
export const newAPI = { ... }  // Add
```

**Problem**: "DI not working"
```typescript
// You check src/core/di/registry.ts
// Add: container.registerSingleton(DI_TOKENS.Service, ...)
```

---

## 🔧 3. Integration Work You Can Do Now

While agents migrate files, you do the complex integration:

### Task A: Update Main Entry Point
Edit `src/index.ts` to use Diamond State:

```typescript
import { initializeDiamondState } from './core/diamond-state.js';

// New initialization
export async function createUltraDex(config) {
  return initializeDiamondState(config);
}

// Backward compat
export const ultraDex = await createUltraDex();
```

### Task B: Create Example Applications
Build examples that use new Diamond State:

```typescript
// examples/diamond-basic-usage.js
import { initializeDiamondState } from '../src/core/index.js';

const diamond = await initializeDiamondState();
const decision = await diamond.semanticRouter.route("Create API");
console.log(decision);
```

### Task C: Performance Benchmarks
Create benchmarks comparing old vs new:

```bash
# Benchmark routing
node benchmarks/routing-benchmark.js

# Benchmark sandboxing
node benchmarks/sandbox-benchmark.js
```

### Task D: Integration Tests
Write tests that verify old+new code work together:

```typescript
// tests/integration/legacy-bridge.test.js
import { legacyBridge } from '../src/core/integration/legacy-bridge.js';

// Test that old API still works
test('legacy memory manager works', async () => {
  const manager = legacyBridge.getLegacyMemoryManager();
  const instance = manager.getInstance();
  assert.ok(instance);
});
```

---

## 📊 4. Daily Checklist

### Morning (Start of Day)
- [ ] Run `node scripts/migration-status.js`
- [ ] Check agent progress
- [ ] Review any overnight escalations
- [ ] Update DI registry if needed

### Mid-Day
- [ ] Run `node scripts/validate-migration.js`
- [ ] Check for new failures
- [ ] Answer agent questions
- [ ] Test migrated modules

### Evening (End of Day)
- [ ] Run full validation
- [ ] Update progress in `.migration-status.json`
- [ ] Commit progress: `git commit -m "migration: Day X progress"`
- [ ] Plan next day's priorities

---

## 🎯 5. Critical Integration Points (You Handle These)

### Point 1: Service Wiring
When agents finish a batch, you wire them together:

```typescript
// In src/core/di/registry.ts
export class DIRegistry {
  static registerAll() {
    // Gemini's work
    container.registerSingleton(DI_TOKENS.MemoryManager, 
      () => new MemoryManager(...));
    
    // Qwen's work  
    container.registerSingleton(DI_TOKENS.AIMetaLayer,
      () => new AIMetaLayer(...));
    
    // CLI's work
    container.registerSingleton(DI_TOKENS.AgentRegistry,
      () => new AgentRegistry(...));
  }
}
```

### Point 2: Legacy Bridge Updates
As services migrate, update bridge:

```typescript
// In src/core/integration/legacy-bridge.ts
getLegacyService(name) {
  switch(name) {
    case 'memory': 
      // Gemini migrated this
      return container.resolve(DI_TOKENS.MemoryManager);
    case 'ai':
      // Qwen migrated this  
      return container.resolve(DI_TOKENS.AIMetaLayer);
    case 'agents':
      // CLI migrated this
      return container.resolve(DI_TOKENS.AgentRegistry);
  }
}
```

### Point 3: Configuration Integration
Update config schema for new services:

```typescript
// In src/core/services/config-service.ts
const diamondConfig = {
  routing: { semanticWeight: 0.7 },
  sandbox: { timeout: 5000 },
  healing: { enabled: true },
  // Add as agents migrate
};
```

---

## ⚡ 6. Quick Commands Reference

```bash
# Check everything
node scripts/migration-status.js && node scripts/validate-migration.js

# See what files remain
find src/core -name "*.js" -not -path "*/node_modules/*" | wc -l

# Check TypeScript compilation
npx tsc --noEmit 2>&1 | head -30

# Run tests
npm run test:unit 2>&1 | tail -30

# Git status
git status --short

# Disk usage
du -sh src/core/
```

---

## 📈 7. Success Metrics

Track these daily:

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| TS Files | 59 | 285 | ⏳ |
| JS Files | 226 | 0 | ⏳ |
| Type Check | ? | Pass | ⏳ |
| Unit Tests | ? | Pass | ⏳ |
| DI Services | 10 | 40+ | ⏳ |

---

## 🎉 8. When Migration Completes

### Final Validation
```bash
# Run full validation
node scripts/validate-migration.js

# Should show:
# ✅ Passed: 50+
# ⚠️  Warnings: 0
# ❌ Failed: 0
```

### Final Commands
```bash
# Update documentation
echo "Migration complete: $(date)" >> DIAMOND_STATE_COMPLETION_REPORT.md

# Commit everything
git add .
git commit -m "feat: Complete Diamond State migration (285 files)"
git tag v3.0.0-diamond

# Run full test suite
npm test

# Build
npm run build

# Celebrate! 🎉
echo "Diamond State Migration COMPLETE!"
```

---

## Summary

**While agents work on file migration, you:**
1. ✅ Monitor progress with scripts
2. ✅ Handle escalations (type decisions, breaking changes)
3. ✅ Do integration work (wiring, examples, benchmarks)
4. ✅ Update DI registry as services complete
5. ✅ Validate and test continuously

**Your job**: Architecture decisions, integration, validation
**Their job**: File-by-file migration labor

Estimated completion: 14-17 days with your oversight.
