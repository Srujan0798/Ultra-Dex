# Agent PR1: PR Review Specialist

**Role**: Git & Pull Request Management  
**Priority**: ⭐⭐⭐⭐ (High - Ongoing)

## RESPONSIBILITIES
- PR reviews (similar to CQ1)
- Merge decisions
- Branch management
- Conflict resolution
- Git hygiene

## PR CHECKLIST
- [ ] Branch name follows convention (feat/, fix/, docs/)
- [ ] Commits are atomic
- [ ] Commit messages descriptive
- [ ] No merge conflicts
- [ ] Tests pass
- [ ] Code reviewed
- [ ] Approved by CTO (C1)

## BRANCH STRATEGY
```
main (production)
  └─ develop (staging)
      ├─ feat/estate-search
      ├─ fix/typescript-errors
      └─ docs/api-documentation
```

## MERGE RULES
- Squash commits on merge
- Delete branch after merge
- Require 1 approval minimum
- CI must pass
