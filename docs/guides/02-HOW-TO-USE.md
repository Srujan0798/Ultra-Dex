# How to Use Ultra-Dex

> A phased approach to avoid analysis paralysis while ensuring production-quality output.

---

## The 20% Rule

**Start coding after completing 20% of documentation** (the Foundation phase). Don't wait until everything is perfect - let the plan evolve as you build.

---

## Phase 1: Foundation (Start Here)

**Time:** 30-60 minutes
**Goal:** Establish enough context to begin coding

### Required Sections (8 sections)

| # | Section | What to Fill |
|---|---------|--------------|
| 1 | Idea | One-sentence description |
| 2 | Problem | 3 pain points you're solving |
| 3 | Core Features | Top 5 features (P0 priorities) |
| 4 | Tech Stack | Frontend, backend, database, auth |
| 5 | MVP Scope | What's in v1.0 |
| 6 | Data Model | Core entities (User, Product, etc.) |
| 7 | API Design | 5-10 critical endpoints |
| 8 | First 3 Tasks | Your starting point |

### After Phase 1

```bash
# Generate your implementation plan
ultra-dex generate "Your idea description"

# Or start with a template
ultra-dex scaffold next15-prisma-clerk

# Begin coding!
ultra-dex build
```

---

## Phase 2: Build (As You Code)

**Time:** Ongoing
**Goal:** Add detail as questions arise

### Add These Sections When Needed

| Trigger | Section to Add |
|---------|----------------|
| Building auth flow | Authentication (Section 11) |
| Accepting payments | Payments (Section 12) |
| Deploying | Infrastructure (Section 20) |
| First bug | Testing Strategy (Section 16) |
| Adding team member | Project Management (Section 25) |
| Performance issues | Performance (Section 18) |

### Commands for Phase 2

```bash
# Review code against plan
ultra-dex review

# Check alignment score
ultra-dex align

# Run verification on a task
ultra-dex verify "Implement user registration"

# Let AI suggest next agent
ultra-dex suggest
```

---

## Phase 3: Production (Before Launch)

**Time:** 2-4 hours
**Goal:** Complete remaining sections for production readiness

### Required Before Launch

| # | Section | Why |
|---|---------|-----|
| 15 | Security | Protect user data |
| 16 | Testing | Prevent regressions |
| 17 | Monitoring | Detect issues in production |
| 18 | Performance | Handle real traffic |
| 19 | Scaling | Grow beyond MVP |
| 20 | Infrastructure | Reliable deployment |
| 21 | Disaster Recovery | Handle failures |

### Pre-Launch Checklist

```bash
# Full audit
ultra-dex audit --strict

# 21-step verification
ultra-dex verify

# Check system health
ultra-dex doctor

# Export documentation
ultra-dex export --format html
```

---

## Adapting by Team Size

### Solo Developer

- Focus on Phase 1 completely
- Add Phase 2 sections only when you hit them
- Skip project management sections
- Use `ultra-dex swarm` for parallel thinking

```bash
# Solo workflow
ultra-dex generate "My SaaS idea"
ultra-dex build
ultra-dex swarm "Add user authentication"
```

### Small Team (2-5)

- Complete Phase 1 together
- Assign Phase 2 sections by domain
- Add team communication section
- Use git hooks for standards

```bash
# Team setup
ultra-dex init
ultra-dex hooks --install
ultra-dex team add member@email.com
```

### Enterprise Team (5+)

- Complete all phases upfront
- Add governance sections
- Use sync for shared state
- Set up CI monitoring

```bash
# Enterprise setup
ultra-dex init --enterprise
ultra-dex sync --enable
ultra-dex ci-monitor --port 3003
ultra-dex serve  # Start kernel for all team members
```

---

## Common Patterns

### Pattern 1: AI-First Development

```bash
# 1. Generate plan from idea
ultra-dex generate "A booking platform for dog groomers"

# 2. Let AI build in swarm mode
ultra-dex swarm "Build the core booking flow" --parallel

# 3. Review and iterate
ultra-dex review
```

### Pattern 2: Incremental Enhancement

```bash
# 1. Start with manual init
ultra-dex init

# 2. Add features one at a time
ultra-dex build --task "Add user registration"
ultra-dex build --task "Add booking creation"
ultra-dex build --task "Add payment processing"

# 3. Verify each step
ultra-dex verify
```

### Pattern 3: Migration/Refactor

```bash
# 1. Export current state
ultra-dex export --format json

# 2. Create new plan
ultra-dex generate "Migrate from Express to Next.js"

# 3. Use diff to track progress
ultra-dex diff
```

---

## Key Commands Reference

| Phase | Command | Purpose |
|-------|---------|---------|
| Setup | `ultra-dex init` | Create project structure |
| Setup | `ultra-dex scaffold <template>` | Generate boilerplate |
| Plan | `ultra-dex generate` | AI-generate implementation plan |
| Build | `ultra-dex build` | Interactive development |
| Build | `ultra-dex swarm` | Autonomous agent pipeline |
| Review | `ultra-dex review` | Check code against plan |
| Review | `ultra-dex align` | Get alignment score |
| Verify | `ultra-dex verify` | Run 21-step verification |
| Audit | `ultra-dex audit` | Full project audit |
| Monitor | `ultra-dex serve` | Start active kernel |
| Monitor | `ultra-dex dashboard` | Visual dashboard |

---

## Next Steps

1. **Start with QUICK-START.md** - Fill the 8 foundation sections
2. **Run `ultra-dex generate`** - Let AI expand your plan
3. **Pick your first task** - Use `ultra-dex suggest` for guidance
4. **Build iteratively** - Add documentation as you go

Remember: **Documentation is a living document.** It grows with your project.

---

*Ultra-Dex v3.2.0 - Your Skeleton, Not Your Cage*
