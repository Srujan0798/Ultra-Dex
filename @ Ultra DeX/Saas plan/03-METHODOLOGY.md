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

Every completed task MUST pass this checklist:

```
PLANNING
[ ] 1. Requirements clearly defined
[ ] 2. Acceptance criteria written
[ ] 3. Dependencies identified
[ ] 4. Estimated hours realistic (4-9h)

IMPLEMENTATION
[ ] 5. Code follows project conventions
[ ] 6. No hardcoded values (use env/constants)
[ ] 7. Error handling complete
[ ] 8. Input validation present
[ ] 9. TypeScript types (no `any`)

QUALITY
[ ] 10. Unit tests written
[ ] 11. Integration test (if API/DB)
[ ] 12. Edge cases handled
[ ] 13. No console.logs left
[ ] 14. No commented-out code

SECURITY
[ ] 15. No secrets in code
[ ] 16. Auth/permissions checked
[ ] 17. Input sanitized

DOCUMENTATION
[ ] 18. Code is self-documenting
[ ] 19. Complex logic has comments
[ ] 20. API changes documented

FINAL
[ ] 21. Works in production environment
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

1. **Start small:** Use the [01-QUICK-START.md](./01-QUICK-START.md)
2. **See it in action:** Read [TaskFlow-Complete.md](./Examples/TaskFlow-Complete.md)
3. **Go deep:** Fill out [04-Imp-Template.md](./04-Imp-Template.md)

---

## Navigation

| ← Previous | Current | Next → |
|------------|---------|--------|
| [02-HOW-TO-USE](./02-HOW-TO-USE.md) | **03-METHODOLOGY** | [04-Imp-Template](./04-Imp-Template.md) |