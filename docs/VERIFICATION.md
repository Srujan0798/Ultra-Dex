# 21-Step Verification Checklist

> **Copy this checklist into your PR description or issue tracker**

---

## 🎯 Which Checklist Should I Use?

| Task Type | Use This | Why |
|-----------|----------|-----|
| **New feature** (4-9 hours) | Full 21-step | Production quality required |
| **Bug fix** (<2 hours) | Quick 5-step | Full version is overkill |
| **UI tweak** (no logic change) | Quick 5-step | Low risk change |
| **Database migration** | Full 21-step | High risk, needs all gates |
| **API change** (new/breaking) | Full 21-step | Affects other systems |
| **Security fix** | Full 21-step | Critical - no shortcuts |
| **Docs update** | Skip checklist | Not code |
| **Config change** | Quick 5-step | Low complexity |

---

## For Every Task (Copy & Paste)

```markdown
## 21-Step Verification

### PLANNING (~20 min)
- [ ] 1. **UNDERSTAND** - Requirements clearly defined
- [ ] 2. **ASSUMPTIONS** - Assumptions documented
- [ ] 3. **ANALYZE** - Logic flow mapped
- [ ] 4. **DECOMPOSE** - Broken into subtasks
- [ ] 5. **PREPARE** - Dependencies identified

### IMPLEMENTATION (~2-4 hrs)
- [ ] 6. **IMPLEMENT** - Core functionality complete
- [ ] 7. **DOCUMENT** - Inline comments added
- [ ] 8. **UNIT TEST** - Tests written (80%+ coverage)
- [ ] 9. **DEBUG** - Issues identified and fixed
- [ ] 10. **INTEGRATE** - Works with existing code

### VALIDATION (~30 min)
- [ ] 11. **VALIDATE** - Meets acceptance criteria
- [ ] 12. **UX CHECK** - Usability verified
- [ ] 13. **OPTIMIZE** - Performance acceptable
- [ ] 14. **SECURE** - No vulnerabilities
- [ ] 15. **REFACTOR** - Code quality improved

### DELIVERY (~20 min)
- [ ] 16. **ERROR HANDLE** - Edge cases covered
- [ ] 17. **DOCUMENT API** - API docs updated
- [ ] 18. **VERSION CONTROL** - Commit message clear
- [ ] 19. **BUILD** - Build passes
- [ ] 20. **DEPLOY READY** - Ready for staging
- [ ] 21. **FINAL VERIFY** - End-to-end verified

---

**Task:** [Task name]
**Estimate:** [X hours]
**Actual:** [X hours]
```

---

## Quick Version (For Small Tasks)

```markdown
## Quick Verification (5-step)

- [ ] Code complete and tested
- [ ] No console.log or debug code
- [ ] Error handling added
- [ ] Docs/comments updated
- [ ] Build passes
```

---

## PR Description Template

```markdown
## What
[Brief description of changes]

## Why
[Reason for the change]

## How
[Technical approach]

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Edge cases verified

## 21-Step Status
- Planning: ✅
- Implementation: ✅
- Validation: ✅
- Delivery: ✅

## Screenshots (if UI)
[Add screenshots]
```

---

> **Principle:** "Do it right the first time, verify it the 21st time."
