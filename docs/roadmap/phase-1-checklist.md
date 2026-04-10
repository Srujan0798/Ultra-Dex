# Phase 1: Foundation — Implementation Checklist

> Status: In Progress | Target: v3.2.0 | Timeline: 8 weeks

---

## ✅ Week 1: Verification & CLI Polish

### CLI Verification
- [ ] Test `ultra-dex --help` output
- [ ] Test `ultra-dex run --help` output
- [ ] Test `ultra-dex swarm --help` output
- [ ] Test `ultra-dex deploy --help` output
- [ ] Test `ultra-dex agents --help` output
- [ ] Test all 42 commands have working --help

### Bug Fixes
- [ ] Fix any CLI --help crashes
- [ ] Fix CLI argument parsing issues
- [ ] Verify fake flags (--stream, --cache) work or remove them

### Architecture Cleanup
- [ ] Identify core→CLI reverse imports
- [ ] Move shared code to proper shared location
- [ ] Break circular dependencies
- [ ] Verify no new architecture violations

### Stub File Cleanup
- [ ] Audit src/core/ for 24 stub files
- [ ] Remove or implement stub files
- [ ] Update imports to reflect changes

**Week 1 Deliverable:** Clean CLI with all 42 commands functional

---

## 🔲 Week 2-3: Redis + Postgres Migration

### Redis Integration
- [ ] Add Redis client dependency (ioredis)
- [ ] Create Redis adapter for MemoryManager
- [ ] Implement L1 cache tier in Redis
- [ ] Implement L2 session storage in Redis
- [ ] Add Redis connection health checks
- [ ] Add Redis configuration (env vars)
- [ ] Write tests for Redis adapter

### Postgres Integration
- [ ] Add Postgres client dependency (pg or drizzle-orm)
- [ ] Design schema for audit logs
- [ ] Design schema for billing/events
- [ ] Design schema for user data
- [ ] Create migration scripts
- [ ] Implement Postgres audit storage
- [ ] Write tests for Postgres integration

### Migration Tools
- [ ] Create SQLite → Postgres migration script
- [ ] Create file-based → Redis migration script
- [ ] Add migration CLI command
- [ ] Test migrations on sample data

### Environment Configuration
- [ ] Add REDIS_URL env variable
- [ ] Add DATABASE_URL env variable
- [ ] Implement storage backend selection logic
- [ ] Default to SQLite/file for local dev
- [ ] Default to Redis/Postgres for production

**Week 2-3 Deliverable:** `ultra-dex run planner -t "hello"` with Redis persistence

---

## 🔲 Week 4: npm Publish

### Package Configuration
- [ ] Update package.json name to @ultra-dex/cli
- [ ] Configure bin entry point
- [ ] Set up files array for npm publish
- [ ] Configure engines (Node.js >= 20)
- [ ] Add publishConfig with access: public

### Pre-publish Checklist
- [ ] Test on clean macOS VM
- [ ] Test on clean Linux VM
- [ ] Test on clean Windows VM
- [ ] Verify global install works
- [ ] Verify all commands work after global install

### npm Registry Setup
- [ ] Create npm account if needed
- [ ] Set up 2FA for npm account
- [ ] Configure npm token for CI/CD
- [ ] Test npm publish --dry-run
- [ ] Publish v3.2.0 to npm

**Week 4 Deliverable:** `npm install -g @ultra-dex/cli && ultra-dex --help` works

---

## 🔲 Week 5: GitHub Public Release

### Repository Preparation
- [ ] Final review of codebase for secrets
- [ ] Remove any hardcoded credentials
- [ ] Verify .gitignore is comprehensive
- [ ] Clean up any sensitive files from history (if needed)

### Documentation
- [ ] Write star-worthy README.md
  - [ ] Hero image/logo
  - [ ] One-line description
  - [ ] Quick install instructions
  - [ ] 30-second demo GIF
  - [ ] Key features list
  - [ ] Usage examples
  - [ ] Provider configuration guide
  - [ ] Links to full documentation
- [ ] Update CONTRIBUTING.md
- [ ] Add MIT License
- [ ] Add CHANGELOG.md with v3.2.0 notes
- [ ] Add SECURITY.md

### GitHub Templates
- [ ] Bug report template
- [ ] Feature request template
- [ ] PR template
- [ ] Issue template config

### Repository Settings
- [ ] Configure branch protection rules
- [ ] Set up required status checks
- [ ] Configure auto-delete merged branches
- [ ] Enable discussions (optional)
- [ ] Add repository description and tags
- [ ] Add website link (docs.ultra-dex.dev)

### Go Public
- [ ] Make repository public
- [ ] Announce on personal Twitter/X
- [ ] Post to relevant subreddits
- [ ] Share in Discord communities

**Week 5 Deliverable:** Public repo ready for community

---

## 🔲 Week 6: Docker Compose

### Docker Files
- [ ] Optimize Dockerfile
- [ ] Multi-stage build for smaller images
- [ ] Add health checks
- [ ] Configure proper user (non-root)

### Docker Compose
- [ ] Create docker-compose.yml
- [ ] Add Redis service
- [ ] Add Postgres service
- [ ] Add Ultra-Dex CLI service
- [ ] Add Dashboard service (optional)
- [ ] Configure volume mounts
- [ ] Configure networking

### Documentation
- [ ] Docker installation guide
- [ ] Docker compose usage
- [ ] Environment variables reference
- [ ] Troubleshooting guide

### Testing
- [ ] Test on macOS Docker Desktop
- [ ] Test on Linux
- [ ] Test docker-compose up workflow
- [ ] Verify data persistence

**Week 6 Deliverable:** `docker compose up` → full stack running

---

## 🔲 Week 7: Onboarding Wizard

### First-Run Experience
- [ ] Detect first run
- [ ] Interactive configuration wizard
- [ ] Provider selection and setup
- [ ] API key configuration
- [ ] Test connection to providers

### Quickstart
- [ ] Built-in quickstart tutorial
- [ ] Example tasks to try
- [ ] Progress tracking
- [ ] Success confirmation

### Documentation
- [ ] Onboarding guide
- [ ] Troubleshooting first-run issues
- [ ] FAQ for common setup problems

### Testing
- [ ] Test on fresh install (macOS)
- [ ] Test on fresh install (Linux)
- [ ] Test on fresh install (Windows)
- [ ] Time the onboarding flow (< 5 min target)

**Week 7 Deliverable:** New user → first task in <5 minutes

---

## 🔲 Week 8: v3.2.0 Release

### Version Management
- [ ] Update version in package.json
- [ ] Update version in package-lock.json
- [ ] Update version constants in code
- [ ] Create git tag v3.2.0

### Documentation
- [ ] Write CHANGELOG for v3.2.0
- [ ] Update README with new features
- [ ] Update API documentation
- [ ] Update installation instructions

### Release Artifacts
- [ ] Create GitHub Release
- [ ] Attach binaries (if applicable)
- [ ] Publish to npm
- [ ] Push Docker image to Docker Hub
- [ ] Update docs site

### Announcement
- [ ] Write release blog post
- [ ] Post on Twitter/X
- [ ] Post on LinkedIn
- [ ] Share in Discord
- [ ] Submit to Hacker News (Show HN)
- [ ] Submit to relevant newsletters

**Week 8 Deliverable:** v3.2.0 available on all channels

---

## Dependencies & Blockers

### External Dependencies
| Dependency | Status | Notes |
|------------|--------|-------|
| npm account | ⏳ | Create before Week 4 |
| Docker Hub account | ⏳ | Create before Week 6 |
| Render Redis | ⏳ | Set up for production |
| Render Postgres | ⏳ | Set up for production |

### Internal Dependencies
| Task | Depends On | Status |
|------|-----------|--------|
| npm publish | CLI stable | Week 1 |
| GitHub public | npm package ready | Week 4 |
| Docker compose | Redis/Postgres ready | Week 2-3 |
| v3.2.0 release | All above | Week 8 |

---

## Success Criteria

### Technical
- [ ] 100% tests passing
- [ ] 0 TypeScript errors
- [ ] 0 ESLint warnings
- [ ] All 42 CLI commands working
- [ ] Redis/Postgres integration tested

### Adoption
- [ ] 100+ npm weekly downloads
- [ ] 50+ GitHub stars
- [ ] 3+ external contributors (issues/PRs)

### Quality
- [ ] < 5 min onboarding time
- [ ] < 10 min time to first task
- [ ] Zero critical bugs reported
- [ ] Documentation complete

---

## Notes

- Update this checklist as tasks are completed
- Move completed items to ✅ section with completion date
- Add new discovered tasks to 🔲 section
- Review weekly to track progress

---

*Last updated: 2026-04-09*
*Next review: 2026-04-16*
