# 21-Step Task Verification Checklist

> Use this for **EVERY atomic task** (4-9 hour completable units).
> Copy this checklist into your PR or issue tracker.

---

## PLANNING (~20 min)

- [ ] 1. **UNDERSTAND** - Requirements clearly defined (5 min)
- [ ] 2. **ACCEPTANCE** - Acceptance criteria written (10 min)
- [ ] 3. **DEPENDENCIES** - Dependencies identified (3 min)
- [ ] 4. **ESTIMATE** - Estimated hours realistic 4-9h (2 min)

## IMPLEMENTATION (~30 min review)

- [ ] 5. **CONVENTIONS** - Code follows project conventions (5 min)
- [ ] 6. **NO HARDCODE** - No hardcoded values - use env/constants (5 min)
- [ ] 7. **ERRORS** - Error handling complete (10 min)
- [ ] 8. **VALIDATION** - Input validation present (5 min)
- [ ] 9. **TYPES** - TypeScript types - no `any` (5 min)

## QUALITY (~45 min)

- [ ] 10. **UNIT TESTS** - Unit tests written (included in dev time)
- [ ] 11. **INTEGRATION** - Integration test if API/DB (15 min)
- [ ] 12. **EDGE CASES** - Edge cases handled (15 min)
- [ ] 13. **NO LOGS** - No console.logs left (2 min)
- [ ] 14. **NO COMMENTS** - No commented-out code (2 min)

## SECURITY (~15 min)

- [ ] 15. **NO SECRETS** - No secrets in code (5 min)
- [ ] 16. **AUTH** - Auth/permissions checked (5 min)
- [ ] 17. **SANITIZE** - Input sanitized (5 min)

## DOCUMENTATION (~10 min)

- [ ] 18. **SELF-DOC** - Code is self-documenting (3 min)
- [ ] 19. **COMMENTS** - Complex logic has comments (5 min)
- [ ] 20. **API DOCS** - API changes documented (2 min)

## FINAL (~15 min)

- [ ] 21. **PRODUCTION** - Works in production environment (15 min)

---

## When to Use

| Task Type | Checklist | Why |
|-----------|-----------|-----|
| **New feature** (4-9 hours) | Full 21-step | Production quality required |
| **Bug fix** (<2 hours) | 5-step mini | Full version is overkill |
| **Refactor** | Full 21-step | Quality gates matter |
| **Docs update** | Skip | Not code |

## Adaptive Time Estimates

| Task Size | Planning | Implementation | Validation | Delivery |
|-----------|----------|----------------|------------|----------|
| 1 hour (small fix) | 5 min | 30 min | 10 min | 5 min |
| 3 hours (medium) | 10 min | 2 hrs | 20 min | 10 min |
| 6 hours (large feature) | 20 min | 4 hrs | 30 min | 20 min |

**For tasks <2 hours:** Use the 5-step mini-checklist in [02-HOW-TO-USE.md](../@%20Ultra%20DeX/Saas%20plan/02-HOW-TO-USE.md)

---

## How to Use in Git Workflow

### Option 1: GitHub PR Template (Recommended)
```bash
cp CHECKLIST-21-STEP.md .github/PULL_REQUEST_TEMPLATE.md
```
Every PR automatically includes the checklist.

### Option 2: Copy into PR Description
Copy the checklist above into your PR description.

### Option 3: Issue Tracker
Copy into Jira/Linear/GitHub Issues to track per task.

---

**Rule:** If any box is unchecked, the task is NOT complete.
