# Ultra-Dex v1.8.0 Release Notes

**Release Date:** January 27, 2026

Ultra-Dex v1.8.0 completes the agent library enhancement milestone with a unified agent index, upgraded agent docs with production code examples, and expanded research + learning resources. This release focuses on making the framework more actionable and easier to apply in real-world projects.

---

## Highlights

- ✅ Unified agent quick reference index
- ✅ 5 core agents upgraded with production-ready code examples
- ✅ AI research library consolidated into a single decision guide
- ✅ New learning path for manual execution and onboarding

---

## New Features

### 1) Agent Quick Reference Index
- Added `agents/00-AGENT_INDEX.md` with a tier-based agent lookup table
- Quick guidance on which agent to use for common tasks
- Links to guides, templates, and orchestration examples

### 2) Enhanced Agent Documentation with Code
Upgraded five key agents to include concrete, copy-pasteable production snippets:
- **@Testing** - Jest templates, Playwright E2E workflows, coverage configs
- **@Performance** - Lighthouse CI, bundle size monitoring, query optimization
- **@Security** - OWASP checklist, dependency scanning, security headers
- **@Backend** - REST API patterns, error handling, rate limiting
- **@Database** - Prisma patterns, migration strategies, index optimization

### 3) AI Research Library
- Added `guides/AI-RESEARCH.md` with decision frameworks for embeddings, vector databases, and RAG
- Updated `guides/AI-MODEL-SELECTION.md` with 2026 pricing references

### 4) Learning Path Guide
- Added `guides/LEARNING-PATH.md` to support teams executing Ultra-Dex without AI tools
- Step-by-step manual workflow and graduation path from assisted to independent execution

---

## Migration Guide (from v1.7.x)

**Summary:** v1.8.0 is a non-breaking upgrade. No CLI flags were removed or renamed.

### Recommended Steps
1. Pull latest changes from the main branch.
2. Review the new agent index at `agents/00-AGENT_INDEX.md` to map tasks to agents.
3. Replace any older agent references with the updated examples in the five upgraded agents.
4. Update internal playbooks to reference `guides/AI-RESEARCH.md` and `guides/LEARNING-PATH.md`.

### Compatibility Notes
- All v1.7.x workflows continue to work unchanged.
- No schema, template, or CLI breaking changes were introduced.
- You can adopt the new guides incrementally.

---

## New Features Showcase

### Example 1: Fast Agent Discovery
Use the agent index to locate the right specialist in seconds.

```
open agents/00-AGENT_INDEX.md
```

### Example 2: Production-Ready Security Checklist
Use @Security to harden a SaaS deployment.

```
# Example items found in @Security
- Add security headers (CSP, HSTS, X-Frame-Options)
- Set up dependency scanning in CI
- Run OWASP checklist before launch
```

### Example 3: AI Research Decision Flow
Standardize AI stack choices with the research guide.

```
open guides/AI-RESEARCH.md
```

---

## Thanks

Thanks to the Ultra-Dex community for feedback on agent usability and research depth. v1.9.0 focuses next on collaboration, sync/export workflows, and more production examples.
