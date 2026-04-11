# 🔄 Ultra-Dex Skills Bootstrap System

> **Self-improving lifecycle for Claude plugin skills**
> **Version:** 1.0.0 | **Created:** 2026-04-11

---

## 🎯 Purpose

This system enables:

- ✅ Reusable plugin skill setup (no re-pasting)
- ✅ Self-improvement through feedback loops
- ✅ Lifetime lifecycle management
- ✅ Agent-readable context for any persona
- ✅ Future-proof integration support

---

## 📋 Current State (v1.0.0)

### Plugins Implemented

| Plugin             | Skills | Version | Status      |
| ------------------ | ------ | ------- | ----------- |
| Engineering        | 10/10  | 1.0.0   | ✅ Complete |
| Data               | 10/10  | 1.0.0   | ✅ Complete |
| Product Management | 9/9    | 1.0.0   | ✅ Complete |
| Enterprise Search  | 5/5    | 1.0.0   | ✅ Complete |
| Operations         | 9/9    | 1.0.0   | ✅ Complete |
| Customer Support   | 5/5    | 1.0.0   | ✅ Complete |
| Productivity       | 4/4    | 1.0.0   | ✅ Complete |
| Design             | 7/7    | 1.0.0   | ✅ Complete |

**Total:** 54 skills, 84+ files created

---

## 🔄 Lifecycle Cycle

### Phase 1: Bootstrap (Done ✅)

```
User → Provides plugin list → Skills implemented → Documentation created
```

### Phase 2: Execution (Current)

```
Agent reads SYSTEM.md → Uses skills → Creates outputs → Updates docs
```

### Phase 3: Review

```
Check completeness → Identify gaps → Log improvements → Tag version
```

### Phase 4: Update

```
Bump version → Add new skills → Update USAGE-GUIDE → Commit
```

---

## 📖 Agent Context (Read This First)

When any agent/persona joins the project, they MUST read:

1. **`docs/skills/README.md`** - Master index of all plugins
2. **`docs/skills/USAGE-GUIDE.md`** - How to invoke skills
3. **`docs/skills/SYSTEM.md`** - This file (lifecycle + self-improvement)

### Agent Invocation Pattern

```markdown
# At start of session, agent reads:

- docs/skills/README.md (quick overview)
- docs/skills/USAGE-GUIDE.md (skill usage)
- docs/skills/SYSTEM.md (this file)

# Then executes using:

/plugin:skill "context from docs/skills/[plugin]/"
```

---

## 🛠️ Self-Improvement Protocol

### Adding New Plugin

1. Read this SYSTEM.md
2. Check `docs/skills/README.md` for existing plugins
3. Create skill outputs in `docs/skills/[new-plugin]/`
4. Add entries to USAGE-GUIDE.md
5. Update this SYSTEM.md with version bump
6. Update VERIFICATION-REPORT.md

### Updating Existing Plugin

1. Check current version in SYSTEM.md
2. Make changes to relevant skill files
3. Increment patch version (v1.0.0 → v1.0.1)
4. Log changes in CHANGELOG below

### Quality Check

Before marking complete:

- [ ] All skill directories have README.md
- [ ] All skills have output files
- [ ] USAGE-GUIDE.md updated
- [ ] VERIFICATION-REPORT.md reflects changes

---

## 📊 Version Changelog

| Version | Date       | Changes                       |
| ------- | ---------- | ----------------------------- |
| 1.0.0   | 2026-04-11 | Initial: 8 plugins, 54 skills |

---

## 🔗 Key Files

| File                                 | Purpose               |
| ------------------------------------ | --------------------- |
| `docs/skills/README.md`              | Master index          |
| `docs/skills/USAGE-GUIDE.md`         | Skill invocation      |
| `docs/skills/SYSTEM.md`              | Lifecycle (this file) |
| `docs/skills/VERIFICATION-REPORT.md` | Status report         |

---

## 🎓 For Future Agents

> **If you're a new agent joining this project:**
>
> 1. Read `docs/skills/SYSTEM.md` first - it has the lifecycle
> 2. Check `docs/skills/README.md` for what's implemented
> 3. Use `docs/skills/USAGE-GUIDE.md` to invoke skills
> 4. All documentation is in `docs/skills/[plugin]/`
> 5. After completing work, update SYSTEM.md version

> **To add a new plugin skill:**
>
> - Create directory `docs/skills/[plugin-name]/`
> - Add skill outputs following existing pattern
> - Update USAGE-GUIDE.md
> - Update this SYSTEM.md with version

---

**SYSTEM.md - Auto-updates via lifecycle**
**Next Review:** When new plugins added
