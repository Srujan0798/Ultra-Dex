# UNIVERSAL PROJECT IMPLEMENTATION RULES

## 21-Step Verification Framework for Code Editors & AI Agents

---

## ⚠️ MASTER INSTRUCTION (IMMUTABLE)

**Project Structure:**

- Scalable Framework: N Phases × M Sub-implementations × K Tasks
- 21 Verification Steps per Task (mandatory)

**Goal:** Production-ready application with excellence in:

- User Interface (UI)
- User Experience (UX)
- API Design & Performance
- Code Implementation
- Functionality & Features
- User Interactions

---

## 📋 21-STEP VERIFICATION CHECKLIST
>
> Execute for EVERY Task Without Exception

| Step | Action | Description | Est. Time |
|------|--------|-------------|-----------|
| □ 1 | UNDERSTAND | Read and comprehend full requirement | 5-10 min |
| □ 2 | ASSUMPTIONS | List all assumptions explicitly | 3-5 min |
| □ 3 | ANALYZE | Map logic flow and data dependencies | 10-15 min |
| □ 4 | DECOMPOSE | Break into atomic sub-steps | 5-10 min |
| □ 5 | PREPARE | Set up environment, configs, dependencies | 10-20 min |
| □ 6 | IMPLEMENT | Write clean, modular, maintainable code | 30-120 min |
| □ 7 | DOCUMENT | Add inline comments and follow naming conventions | 10-15 min |
| □ 8 | UNIT TEST | Write and run unit tests (Target: 80%+ coverage) | 20-30 min |
| □ 9 | DEBUG | Identify and fix all issues | 15-45 min |
| □ 10 | INTEGRATE | Run integration tests with existing systems | 15-30 min |
| □ 11 | VALIDATE | Verify outputs match expected results | 10-15 min |
| □ 12 | UX CHECK | Ensure usability and WCAG 2.1 accessibility | 15-20 min |
| □ 13 | OPTIMIZE | Improve performance (Target: <3s load, <200ms response) | 20-40 min |
| □ 14 | SECURE | Check for security vulnerabilities (OWASP Top 10) | 15-25 min |
| □ 15 | REFACTOR | Improve code quality and maintainability | 15-30 min |
| □ 16 | ERROR HANDLE | Add comprehensive error handling | 15-20 min |
| □ 17 | DOCUMENT API | Document all functions, APIs, interfaces | 20-30 min |
| □ 18 | VERSION CONTROL | Commit with clear, descriptive message | 5 min |
| □ 19 | BUILD | Compile/bundle and validate build | 5-15 min |
| □ 20 | DEPLOY READY | Prepare for deployment or final delivery | 10-20 min |
| □ 21 | FINAL VERIFY | Run complete end-to-end verification | 15-30 min |

**Total Estimated Time per Task:** 4-9 hours (varies by complexity)

---

## 🚫 NON-NEGOTIABLE RULES

| Rule | Description |
|------|-------------|
| NO STEP SKIPPING | All 21 steps must be completed for every task |
| NO MULTITASKING | Work on one task at a time until completion |
| PROGRESS TRACKING | Update status only after step 21 verification |
| EXPLICIT VERIFICATION | Never assume—always verify each step |
| NO PREMATURE COMPLETION | Even if task seems done, complete all verification steps |
| CONSISTENT FRAMEWORK | Apply 21-step process universally across all tasks |
| DOCUMENTATION REQUIRED | Document decisions, issues, and solutions |
| CODE REVIEW MANDATORY | Peer review required before marking task complete |
| CI/CD INTEGRATION | Automated tests must pass before deployment |
| ROLLBACK PLAN | Document rollback procedure for every deployment |

---

## 🔄 EXECUTION WORKFLOW (Per Task)

### Phase 1: Planning & Analysis

- **Requirement Analysis** - Understand specifications completely
- **Risk Assessment** - Identify and document potential risks
- **Time Estimation** - Estimate task duration based on complexity
- **Dependency Mapping** - Identify all dependencies and blockers

### Phase 2: Implementation

- **Environment Setup** - Configure development environment
- **Code Implementation** - Write clean, modular code
- **Live Integration** - Connect with existing systems in real-time
- **Documentation** - Document inline and update external docs

### Phase 3: Testing & Validation

- **Unit Testing** - Test individual components (80%+ coverage)
- **Integration Testing** - Test system interactions
- **End-to-End Testing** - Test complete user flows
- **360° Testing** - Test from all perspectives (user, system, edge cases)
- **Accessibility Testing** - Verify WCAG 2.1 AA compliance
- **Performance Testing** - Benchmark against defined metrics

### Phase 4: Debugging & Optimization

- **Bug Fixing** - Resolve all identified issues
- **Research Common Issues** - Check documentation and community solutions
- **Performance Optimization** - Improve speed and resource usage
- **Code Quality** - Refactor for maintainability

### Phase 5: Security & Review

- **Security Audit** - Check OWASP Top 10 vulnerabilities
- **Code Review** - Peer review using checklist
- **Monitoring Setup** - Configure alerts and monitoring

### Phase 6: Verification & Delivery

- **UI/UX Validation** - Ensure design and usability standards
- **Functionality Check** - Verify all features work correctly
- **Documentation Review** - Ensure all docs are complete and accurate
- **Final Verification** - Complete end-to-end validation
- **Deployment** - Deploy with rollback plan ready

---

## 📊 QUALITY TARGETS & BENCHMARKS

| Area | Target Standard | Measurement |
|------|-----------------|-------------|
| Code Quality | Clean, modular, well-documented | SonarQube score >80 |
| UI | Polished, professional, responsive | Design system compliance 100% |
| UX | Intuitive, accessible, user-friendly | WCAG 2.1 AA compliance |
| API | Fast, secure, RESTful/GraphQL best practices | Response time <200ms (p95) |
| Performance | Optimized load times and resource usage | Load time <3s, FCP <1.5s |
| Security | Industry-standard security practices | Zero critical vulnerabilities |
| Testing | Comprehensive test coverage | >80% code coverage |
| Documentation | Complete and up-to-date | 100% API documentation |
| Maintainability | Easy to understand and modify | Cyclomatic complexity <10 |
| Accessibility | Keyboard navigation, screen readers | WCAG 2.1 Level AA |
| Build Time | Fast compilation | <5 minutes |
| Bundle Size | Optimized assets | <500KB initial load |

---

## 🎯 CODE REVIEW CHECKLIST
>
> Before marking any task as complete, verify:

### Code Quality

- [ ] Code follows project style guide
- [ ] No code duplication (DRY principle)
- [ ] Functions are single-purpose (SRP)
- [ ] Proper error handling throughout
- [ ] No hardcoded values (use config/env)
- [ ] No commented-out code blocks
- [ ] Meaningful variable/function names

### Testing

- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Code coverage >80%

### Security

- [ ] No sensitive data exposed
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Authentication/authorization checked
- [ ] Dependencies up-to-date (no known vulnerabilities)

### Performance

- [ ] No unnecessary re-renders (React/Vue)
- [ ] Database queries optimized
- [ ] Images optimized/lazy-loaded
- [ ] Code splitting implemented
- [ ] Caching strategy in place
- [ ] No memory leaks

### Documentation

- [ ] Inline comments for complex logic
- [ ] API documentation updated
- [ ] README updated if needed
- [ ] Changelog updated
- [ ] Migration guide (if breaking changes)

### Accessibility

- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Focus management proper
- [ ] Color contrast ratio >4.5:1
- [ ] Screen reader tested

---

## 📝 PROGRESS TRACKING PROTOCOL

### After Each Task Completion

- ✅ Mark task status in implementation tracker
- ✅ Update progress percentage
- ✅ Update risk register if new risks identified
- ✅ Document issues encountered and solutions applied
- ✅ Note optimizations and improvements made
- ✅ Complete code review checklist
- ✅ Commit code with descriptive message following convention
- ✅ Update relevant documentation
- ✅ Update time tracking (actual vs estimated)
- ✅ Notify team/stakeholders if required

### Commit Message Convention

```
[TYPE] Brief description (max 50 chars)

Detailed explanation of changes:
- Detailed change 1
- Detailed change 2
- Why this change was needed

Testing: Unit tests added/passing
Coverage: 85%
Performance: Load time improved by 15%
Verification: All 21 steps completed
Reviewed-by: @reviewer-name
```

### Types

| Type | Description |
|------|-------------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation only |
| style | Code style (formatting, etc.) |
| refactor | Code refactoring |
| perf | Performance improvement |
| test | Adding tests |
| chore | Maintenance tasks |
| security | Security fixes |
| a11y | Accessibility improvements |

---

## 🏷️ STATUS INDICATORS

| Symbol | Status | Description | Action Required |
|--------|--------|-------------|-----------------|
| ○ | Not Started | Task not yet begun | Start planning |
| ◔ | Planning | Steps 1-4 in progress | Complete analysis |
| ◐ | In Progress | Steps 5-15 active | Continue implementation |
| ◕ | Testing | Steps 16-19 in progress | Complete all tests |
| ◙ | Review | Step 20, awaiting review | Conduct code review |
| ● | Completed | Step 21, not yet verified | Run final verification |
| ✓ | Verified | All 21 steps completed | Move to next task |
| ⚠ | Needs Review | Issues found in review | Address feedback |
| 🔄 | Rework | Needs to be redone | Restart from step 1 |
| ✗ | Blocked | Cannot proceed | Resolve blocker |
| 🔒 | Deployed | Live in production | Monitor metrics |

---

## 📊 RISK REGISTER TEMPLATE
>
> Maintain for each phase/task:

| Risk ID | Description | Probability | Impact | Mitigation Strategy | Owner | Status |
|---------|-------------|-------------|--------|---------------------|-------|--------|
| R-001 | Example: API rate limits | Medium | High | Implement caching | Dev Team | Active |
| R-002 | Example: Third-party dependency | Low | Critical | Have backup solution | Tech Lead | Mitigated |

**Probability:** Low / Medium / High  
**Impact:** Low / Medium / High / Critical

---

## 🎯 SUCCESS METRICS

### Per Task

- [ ] All 21 verification steps completed
- [ ] Zero known bugs or issues
- [ ] Code review passed (all checklist items ✓)
- [ ] Tests passing (unit, integration, E2E)
- [ ] Code coverage >80%
- [ ] Documentation complete
- [ ] Performance benchmarks met
- [ ] Security scan passed (zero critical/high vulnerabilities)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] CI/CD pipeline green

### Per Phase

- [ ] All tasks in phase verified (✓)
- [ ] Integration tests passing
- [ ] No blocking issues
- [ ] Performance metrics within targets
- [ ] Security audit completed
- [ ] Documentation up-to-date
- [ ] Stakeholder approval (if required)
- [ ] Monitoring and alerts configured

### Per Release

- [ ] All phases completed
- [ ] Production deployment successful
- [ ] Rollback plan tested
- [ ] Monitoring dashboards active
- [ ] User acceptance testing passed
- [ ] Zero critical bugs in production
- [ ] Performance targets met in production

---

## 🔧 CI/CD INTEGRATION REQUIREMENTS

### Automated Checks (Must Pass Before Merge)

1. **Linting** - Code style compliance
2. **Unit Tests** - All tests passing
3. **Integration Tests** - System tests passing
4. **Code Coverage** - Minimum 80% coverage
5. **Security Scan** - No critical vulnerabilities
6. **Dependency Audit** - No high-risk dependencies
7. **Build** - Successful compilation
8. **Bundle Size** - Within limits (<500KB)
9. **Performance** - Lighthouse score >90
10. **Accessibility** - aXe audit passing

### Pre-Deployment Checklist

- [ ] All CI checks passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Stakeholders notified

---

## 📚 DOCUMENTATION TEMPLATES

### API Documentation Template

```markdown
## Endpoint Name

**Method:** GET/POST/PUT/DELETE
**URL:** `/api/v1/resource`
**Authentication:** Required/Not Required

### Description
Brief description of what this endpoint does.

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Resource identifier |

### Request Body Example
```json
{
  "field": "value"
}
```

### Response Example

```json
{
  "status": "success",
  "data": {}
}
```

### Error Responses

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |

### Rate Limiting

100 requests per minute per API key

```

### Function Documentation Template:
```javascript
/**
 * Brief description of function purpose
 * 
 * @param {Type} paramName - Description of parameter
 * @returns {Type} Description of return value
 * @throws {ErrorType} Description of when error is thrown
 * 
 * @example
 * functionName(exampleParam);
 * // Returns: expectedOutput
 * 
 * @complexity O(n)
 * @tested Yes - see tests/functionName.test.js
 */
```

---

## 🚨 ROLLBACK PLAN TEMPLATE

### For Each Deployment

#### Pre-Deployment

- [ ] Current version: v1.2.3
- [ ] Target version: v1.3.0
- [ ] Database backup completed: 2024-01-15 10:00 UTC
- [ ] Environment variables documented
- [ ] Dependencies documented

#### Rollback Triggers

- Critical bug affecting >10% users
- Performance degradation >50%
- Security vulnerability discovered
- Data corruption detected

#### Rollback Steps

1. Stop incoming traffic (maintenance mode)
2. Revert code to previous version
3. Restore database from backup (if needed)
4. Run database rollback migrations
5. Verify system health
6. Resume traffic
7. Notify stakeholders

#### Rollback Time Estimate

- **Target:** <15 minutes
- **Maximum:** <30 minutes

#### Post-Rollback

- [ ] Root cause analysis completed
- [ ] Incident report filed
- [ ] Fix implemented and tested
- [ ] Re-deployment plan created

---

## 📈 MONITORING & ALERTS

### Key Metrics to Monitor

**Performance:**

- Response time (p50, p95, p99)
- Request rate
- Error rate
- Database query time
- Cache hit rate

**Infrastructure:**

- CPU usage
- Memory usage
- Disk I/O
- Network bandwidth

**Business:**

- User signups
- Active users
- Conversion rate
- Feature usage

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | >1% | >5% |
| Response Time (p95) | >500ms | >1000ms |
| CPU Usage | >70% | >90% |
| Memory Usage | >80% | >95% |
| Disk Usage | >80% | >90% |

### Alert Channels

- [ ] Slack/Teams integration
- [ ] Email notifications
- [ ] PagerDuty (for critical)
- [ ] SMS (for production down)

---

## 💡 ACCESSIBILITY STANDARDS (WCAG 2.1 Level AA)

### Must-Have Features

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color contrast ratio ≥4.5:1 (text)
- [ ] Color contrast ratio ≥3:1 (UI components)
- [ ] Keyboard navigation works everywhere
- [ ] Focus indicators visible
- [ ] Skip navigation links
- [ ] Meaningful heading hierarchy (h1-h6)
- [ ] ARIA labels for dynamic content
- [ ] Screen reader tested

### Testing Tools

- aXe DevTools
- WAVE browser extension
- Lighthouse accessibility audit
- NVDA/JAWS screen readers
- Keyboard-only navigation test

---

## 🎯 PERFORMANCE BENCHMARKS

### Target Metrics

| Metric | Target | Measurement Tool |
|--------|--------|------------------|
| First Contentful Paint (FCP) | <1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | <2.5s | Web Vitals |
| Time to Interactive (TTI) | <3.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | <0.1 | Web Vitals |
| First Input Delay (FID) | <100ms | Web Vitals |
| Total Blocking Time (TBT) | <300ms | Lighthouse |
| Speed Index | <3.0s | Lighthouse |
| API Response Time (p95) | <200ms | APM Tool |
| Database Query Time (p95) | <50ms | DB Profiler |

### Optimization Checklist

- [ ] Images optimized (WebP, lazy loading)
- [ ] Code splitting implemented
- [ ] Tree shaking enabled
- [ ] Gzip/Brotli compression
- [ ] CDN configured
- [ ] Browser caching configured
- [ ] Database indexes optimized
- [ ] N+1 queries eliminated
- [ ] Unnecessary re-renders prevented

---

## 📌 AGENT-SPECIFIC INSTRUCTIONS
>
> For AI Code Editors/Agents:

### On Task Start

1. Acknowledge receipt of these rules
2. Confirm understanding of the 21-step framework
3. Ask clarifying questions for ambiguous requirements
4. Estimate time for task completion
5. Identify dependencies and potential blockers
6. Update risk register with new risks

### During Task

1. Follow all 21 steps in sequence
2. Document decisions and reasoning
3. Update progress tracker in real-time
4. Flag issues immediately (don't wait until end)
5. Request code review before step 21
6. Run all automated checks

### On Task Completion

1. Complete entire code review checklist
2. Verify all benchmarks met
3. Update documentation
4. Create detailed commit message
5. Mark status as ✓ only after step 21
6. Report completion with metrics summary

### Red Flags to Report

- ⚠️ Any step taking 3x longer than estimated
- ⚠️ Blockers that prevent progress
- ⚠️ Security vulnerabilities discovered
- ⚠️ Performance targets cannot be met
- ⚠️ Test coverage below 80%
- ⚠️ Accessibility issues found

---

## 🔐 VERSION CONTROL

| Field | Value |
|-------|-------|
| Version | 3.0 (Universal - Complete Edition) |
| Last Updated | December 2024 |
| Applies To | All projects using this framework |
| Authority | Immutable unless explicitly modified by project owner |
| Review Cycle | Quarterly or after major project completion |

---

## 📖 GLOSSARY

| Term | Definition |
|------|------------|
| FCP | First Contentful Paint - time to first content render |
| LCP | Largest Contentful Paint - time to main content render |
| TTI | Time to Interactive - when page becomes fully interactive |
| CLS | Cumulative Layout Shift - visual stability metric |
| FID | First Input Delay - interactivity metric |
| WCAG | Web Content Accessibility Guidelines |
| OWASP | Open Web Application Security Project |
| DRY | Don't Repeat Yourself principle |
| SRP | Single Responsibility Principle |
| CI/CD | Continuous Integration/Continuous Deployment |
| APM | Application Performance Monitoring |

---

## 💫 CORE PRINCIPLES

> ⚡ **REMEMBER:** Quality over speed. Every shortcut taken is a bug deferred.

> 🎯 **PRINCIPLE:** "Do it right the first time, verify it the 21st time."

> 🔒 **COMMITMENT:** Excellence in every line of code, every interaction, every deployment.

---

This framework ensures consistent, high-quality implementation across all projects. Apply these rules universally to every task without exception. Your code is your legacy—make it count.

---

*~ by Srujan Sai Karna {Master OG}*
