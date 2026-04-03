# Ultra-Dex Agent Customization Guide

## Overview

This guide shows you how to customize Ultra-Dex agents for your team's specific needs, tech stack, and workflows.

---

## Why Customize?

The default agents work great for general purposes, but customization helps you:

- **Match your tech stack** (React vs Vue, PostgreSQL vs MongoDB)
- **Enforce team standards** (naming conventions, code style)
- **Add domain expertise** (fintech, healthtech, edtech specifics)
- **Integrate with your tools** (your CI/CD, your monitoring)
- **Reflect your processes** (your review workflows, your deployment steps)

---

## Quick Start: 5-Minute Customization

### Step 1: Copy the Base Agent

```bash
# Copy an agent you want to customize
cp .agents/backend.md .agents/backend-custom.md
```

### Step 2: Edit for Your Stack

Open `.agents/backend-custom.md` and modify:

```markdown
# Role: Backend Developer (Your Company Name)

## Your Tech Stack

- **Language:** TypeScript (your version)
- **Framework:** Your preferred framework
- **Database:** Your database of choice
- **ORM:** Your ORM

## Your Standards

- Naming conventions your team uses
- Code style preferences
- Required patterns
```

### Step 3: Test and Refine

Use the customized agent with a real task and refine based on results.

---

## Deep Customization by Section

### 1. Customize Mission Statement

**Original:**

```markdown
## Mission

You are the backend developer agent responsible for implementing API endpoints...
```

**Customized for Your Team:**

```markdown
## Mission

You are the [Company] backend specialist focused on [specific goals like "scalable microservices" or "real-time data processing"].

Key priorities:

1. [Your priority 1]
2. [Your priority 2]
3. [Your priority 3]
```

### 2. Customize Tech Stack

**Add your specific technologies:**

```markdown
## Your Technology Stack

### Required

- Node.js 20.x
- Express 4.x
- PostgreSQL 15+
- Prisma ORM

### Optional (project-dependent)

- Redis for caching
- Kafka for event streaming
- Elasticsearch for search

### Forbidden (without CTO approval)

- No MongoDB (we standardize on PostgreSQL)
- No Mongoose (we use Prisma)
- No callback hell (use async/await)
```

### 3. Customize Code Standards

**Add your team's specific rules:**

```markdown
## [Company] Code Standards

### Naming Conventions

- API functions: `camelCase` with verbs (`getUser`, `createOrder`)
- Components: `PascalCase` (`UserProfile`, `OrderList`)
- Constants: `UPPER_SNAKE_CASE` (`MAX_RETRIES`, `API_VERSION`)
- Files: Match export name (`UserProfile.tsx`)

### Required Patterns

- All functions must have JSDoc comments
- All API endpoints must have rate limiting
- All database queries must use transactions
- All errors must be logged with context

### Forbidden Patterns

- No `any` types in TypeScript
- No console.log in production code
- No hardcoded values (use config)
- No synchronous file operations
```

### 4. Customize Quality Checklists

**Add your specific requirements:**

```markdown
## [Company] Quality Checklist

### Security (Must Pass All)

- [ ] All inputs validated with validator.js
- [ ] All outputs sanitized
- [ ] Rate limiting on all public endpoints
- [ ] CORS configured for allowed origins only
- [ ] No secrets in code (use AWS Secrets Manager)

### Performance (Target Metrics)

- [ ] API response time < 200ms (p95)
- [ ] Database queries < 50ms (p95)
- [ ] Bundle size < 100KB gzipped
- [ ] Lighthouse score > 90

### Testing (Minimum Requirements)

- [ ] Unit test coverage > 80%
- [ ] All critical paths tested
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user workflows
```

### 5. Customize Output Formats

**Match your documentation style:**

```markdown
## Output Format for [Company]

When presenting your implementation:

### 1. Architecture Decision Record (ADR)

Format: [Your ADR template]

### 2. Implementation Plan

- Files to create/modify
- Database migrations needed
- Environment variables required
- Dependencies to install

### 3. Code Structure

[Your preferred structure]

### 4. Testing Strategy

[Your testing approach]

### 5. Deployment Checklist

[Your deployment steps]
```

---

## Industry-SCustomizations

### For Fintech Companies

Add to any agent:

```markdown
## Fintech-Specific Requirements

### Compliance

- PCI DSS compliance for payment data
- SOX compliance for financial reporting
- GDPR compliance for EU customers

### Security

- All data encrypted at rest (AES-256)
- All data encrypted in transit (TLS 1.3)
- No PII in logs
- Audit trail for all financial transactions

### Testing

- Penetration testing required
- Security audit before deployment
- Compliance review for new features
```

### For Healthtech Companies

Add to any agent:

```markdown
## Healthtech-Specific Requirements

### Compliance

- HIPAA compliance mandatory
- PHI handling procedures
- Audit logging for all access

### Security

- End-to-end encryption
- Access controls (role-based)
- Data minimization (collect only what's needed)

### Documentation

- All decisions documented
- All changes traceable
- All access logged
```

### For Enterprise SaaS

Add to any agent:

```markdown
## Enterprise SaaS Requirements

### Multi-tenancy

- Tenant isolation mandatory
- Per-tenant configuration
- Tenant-specific billing

### Scalability

- Horizontal scaling required
- Database sharding strategy
- Caching at all layers

### Monitoring

- Error tracking (Sentry)
- Performance monitoring (DataDog)
- Business metrics (revenue, churn)
```

---

## Team-Specific Customizations

### For Small Teams (< 10 people)

Focus on:

- Speed over perfection
- Pragmatic choices
- Minimal bureaucracy

```markdown
## Small Team Priorities

1. Ship fast, iterate faster
2. Document as you go (not before)
3. Automate repetitive tasks
4. Prefer simple solutions
5. Test critical paths only
```

### For Large Teams (> 100 people)

Focus on:

- Consistency
- Documentation
- Coordination

```markdown
## Large Team Priorities

1. Follow established patterns
2. Document everything
3. Communicate changes early
4. Test thoroughly
5. Consider backward compatibility
```

### For Remote-First Teams

Focus on:

- Async communication
- Clear documentation
- Timezone awareness

```markdown
## Remote-First Guidelines

1. Document decisions in writing
2. Record all meetings
3. Over-communicate status
4. Use async-first tools
5. Respect timezones
```

---

## Version Control for Agents

### Track Agent Versions

```bash
.agents/
├── v1/
│   ├── backend.md (original version)
│   └── frontend.md (original version)
├── v2/
│   ├── backend.md (updated for new stack)
│   └── frontend.md (updated for React 18)
└── current -> v2/ (symlink to current version)
```

### Changelog for Agents

Create `.agents/CHANGELOG.md`:

```markdown
# Agent Changelog

## v2.0 (2026-04-03)

- Updated backend agent for Node 20
- Added Prisma ORM examples
- Removed deprecated patterns

## v1.0 (2026-01-01)

- Initial agent versions
- Basic quality checklists
- General tech stack
```

---

## Testing Your Customized Agents

### Test Checklist

1. **Clarity Test**: Can a new team member understand it?
2. **Completeness Test**: Does it cover your use cases?
3. **Consistency Test**: Does it match your actual practices?
4. **Effectiveness Test**: Does it produce better results?

### Get Feedback

```markdown
After using customized agent, ask:

1. Was the output helpful? [1-5]
2. Did it miss anything important? [Open]
3. What would you add/remove? [Open]
4. Would you use this again? [Yes/No]
```

---

## Sharing Custom Agents

### Within Your Team

1. Store in shared repository
2. Document changes in CHANGELOG
3. Train team on usage
4. Collect feedback regularly

### With Community

1. Publish on GitHub
2. Add license (MIT recommended)
3. Document your customizations
4. Share success stories

---

## Common Customization Patterns

### Pattern 1: Stack-Specific Agent

```markdown
# Backend Agent (Next.js + Prisma + PostgreSQL)

## Your Stack

- Runtime: Node.js 20
- Framework: Next.js 14 App Router
- Database: PostgreSQL 15
- ORM: Prisma 5
- Cache: Redis

## Your Patterns

- Use Server Components by default
- Use Prisma for all DB access
- Use Redis for caching
- Use Zod for validation
```

### Pattern 2: Domain-Specific Agent

```markdown
# Backend Agent (E-commerce)

## E-commerce Specifics

- PCI compliance for payments
- Inventory management
- Order state machine
- Shipping integrations
- Tax calculations

## Your Requirements

- Handle high concurrency (Black Friday)
- Support multiple currencies
- Real-time inventory updates
- Fraud detection
```

### Pattern 3: Process-Specific Agent

```markdown
# Backend Agent (Your Company Process)

## Your Development Process

1. Feature branch from main
2. Implement with tests
3. Code review (2 approvals)
4. Deploy to staging
5. QA approval
6. Deploy to production

## Your Tools

- GitLab for version control
- CI/CD: GitLab CI
- Issue tracking: Jira
- Communication: Slack
```

---

## Maintenance

### Regular Reviews

- **Monthly**: Review agent effectiveness
- **Quarterly**: Update for new tech/trends
- **Yearly**: Major revision if needed

### Feedback Loop

```
Use Agent → Collect Feedback → Identify Gaps → Update Agent → Repeat
```

---

## Examples

### Example 1: Customized Backend Agent for Fintech Startup

See: `.agents/backend-fintech-example.md`

### Example 2: Customized Frontend Agent for E-commerce

See: `.agents/frontend-ecommerce-example.md`

### Example 3: Customized DevOps Agent for SaaS

See: `.agents/devops-saas-example.md`

---

## Next Steps

1. **Copy** an agent you use frequently
2. **Identify** 3 things to customize
3. **Make** the changes
4. **Test** with a real task
5. **Refine** based on results
6. **Share** with your team

---

## Need Help?

- Check existing examples in `.agents/examples/`
- Review your team's documentation
- Ask team members for pain points
- Iterate based on feedback

**Remember:** The best agent is the one your team actually uses and improves over time.
