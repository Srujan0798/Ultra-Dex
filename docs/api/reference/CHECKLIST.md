# Ultra-Dex Checklist

Use this checklist before shipping or running `ultra-dex production-ready`.

## Planning
- [ ] CONTEXT.md updated with current goals, scope, and constraints
- [ ] IMPLEMENTATION-PLAN.md includes milestones and atomic tasks
- [ ] Acceptance criteria documented for each major feature

## Implementation
- [ ] All required files and routes are implemented
- [ ] No placeholder text or TODOs in production paths
- [ ] Feature flags documented (if used)

## Quality
- [ ] Unit tests added/updated
- [ ] Integration tests cover critical workflows
- [ ] Coverage target met (>= 70% by default)

## Security
- [ ] Secrets stored in env vars / vault
- [ ] Access control verified for protected routes
- [ ] Input validation enforced on external endpoints

## Operations
- [ ] CI/CD pipeline configured
- [ ] Monitoring and alerts configured
- [ ] Rollback plan documented
