# Ultra-Dex Methodology

> The system that makes Ultra-Dex different from every other template.

---

## The Ultra-Dex Principles

### 1. Atomic Tasks (4-9 Hours)

Every task must be completable in **one focused session**.

| Task Size | Rule |
|-----------|------|
| < 4 hours | Too small - combine with related work |
| 4-9 hours | Perfect - one developer, one session |
| > 9 hours | Too big - break it down |

**Why?** Tasks over 9 hours have hidden complexity. You'll miss edge cases, underestimate effort, and ship bugs.

---

### 2. The 21-Step Verification

Every completed task MUST pass this checklist.

**Total Time: ~2-3 hours of verification per feature task**

```
PLANNING (~20 min)
[ ] 1. Requirements clearly defined (5 min)
[ ] 2. Acceptance criteria written (10 min)
[ ] 3. Dependencies identified (3 min)
[ ] 4. Estimated hours realistic 4-9h (2 min)

IMPLEMENTATION (~30 min review)
[ ] 5. Code follows project conventions (5 min)
[ ] 6. No hardcoded values - use env/constants (5 min)
[ ] 7. Error handling complete (10 min)
[ ] 8. Input validation present (5 min)
[ ] 9. TypeScript types - no `any` (5 min)

QUALITY (~45 min)
[ ] 10. Unit tests written (included in dev time)
[ ] 11. Integration test if API/DB (15 min)
[ ] 12. Edge cases handled (15 min)
[ ] 13. No console.logs left (2 min)
[ ] 14. No commented-out code (2 min)

SECURITY (~15 min)
[ ] 15. No secrets in code (5 min)
[ ] 16. Auth/permissions checked (5 min)
[ ] 17. Input sanitized (5 min)

DOCUMENTATION (~10 min)
[ ] 18. Code is self-documenting (3 min)
[ ] 19. Complex logic has comments (5 min)
[ ] 20. API changes documented (2 min)

FINAL (~15 min)
[ ] 21. Works in production environment (15 min)
```

**Rule:** If any box is unchecked, the task is NOT complete.

---

### 3. Overhead Calculation

Raw estimates are always wrong. Apply these multipliers:

| Factor | Add | When |
|--------|-----|------|
| Testing | +25% | Always |
| Code Review | +10% | Always |
| Context Switching | +15% | If >2 active tasks |
| New Technology | +30% | First time using a tool |
| Integration | +20% | Connecting to external APIs |
| Uncertainty | +20% | Unclear requirements |

**Formula:**
```
Actual Hours = Base Estimate × (1 + sum of applicable factors)
```

**Example:**
- Base estimate: 6 hours
- New tech (+30%) + Testing (+25%) + Review (+10%)
- Actual: 6 × 1.65 = **9.9 hours** → Split into 2 tasks

---

### 4. Production-Ready Definition

A feature is DONE when ALL are true:

**Code Quality:**
- [ ] All 21 steps verified
- [ ] Zero P0/P1 bugs
- [ ] Test coverage >80%

**Performance:**
- [ ] Page load <3s
- [ ] API response <500ms (p95)
- [ ] No memory leaks

**Operations:**
- [ ] Monitoring in place
- [ ] Logs are useful
- [ ] Rollback plan exists

**User:**
- [ ] Works on mobile
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Error messages are helpful

---

## Why This Works

| Other Templates | Ultra-Dex |
|-----------------|-----------|
| "Add auth" (vague) | "Implement Google OAuth with session management" (6h, 21 steps) |
| No verification | Every task has acceptance criteria |
| Estimates are fiction | Overhead calculation = realistic timelines |
| "Done" is undefined | Production-ready checklist = clear finish line |

---

## Apply It

1. **Start small:** Use the [01-QUICK-START.md](../@%20Ultra%20DeX/Saas%20plan/01-QUICK-START.md)
2. **See it in action:** Read [TaskFlow-Complete.md](../@%20Ultra%20DeX/Saas%20plan/Examples/TaskFlow-Complete.md)
3. **Go deep:** Fill out [04-Imp-Template.md](../@%20Ultra%20DeX/Saas%20plan/04-Imp-Template.md)

---

## Navigation

| ← Previous | Current | Next → |
|------------|---------|--------|
| [02-HOW-TO-USE](../@%20Ultra%20DeX/Saas%20plan/02-HOW-TO-USE.md) | **03-METHODOLOGY** | [04-Imp-Template](../@%20Ultra%20DeX/Saas%20plan/04-Imp-Template.md) |
