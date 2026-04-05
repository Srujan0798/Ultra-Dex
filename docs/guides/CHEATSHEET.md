# Ultra-Dex Cheat Sheet

## 🚀 30-Second Start
```bash
cat .agents/BACKEND.md | pbcopy  # Copy
# Paste in AI + context           # Build!
```

## 📋 Agent Quick Reference

| When You Need | Use This Agent | Time |
|---------------|----------------|------|
| Architecture decision | `cto.md` | 2 min |
| Plan complex feature | `planner.md` | 2 min |
| Build API/Database | `backend.md` | 5 min |
| Create UI Components | `frontend.md` | 5 min |
| Code Review | `reviewer.md` | 3 min |
| Fix Bugs | `debugger.md` | 5 min |
| Deploy | `devops.md` | 3 min |
| Auth/Security | `auth.md` | 4 min |
| Database Schema | `database.md` | 4 min |

## 🔥 Common Patterns

### Build Feature
```
cto → planner → backend → frontend → reviewer
```
**Time:** 15-20 min

### Fix Bug  
```
debugger → fix → reviewer
```
**Time:** 10-15 min

### Code Review
```
reviewer → fix issues → re-review
```
**Time:** 5-10 min

## 💡 Pro Tips

1. **Always provide context** - Your project details matter
2. **Chain agents** - Get best results from sequences
3. **Customize** - Adapt to your stack (see CUSTOMIZATION.md)
4. **Review before merge** - Never skip reviewer agent
5. **Save good outputs** - Build your own library

## 🎯 Example: Auth Feature

```bash
# 1. Get architecture
cat .agents/cto.md | pbcopy
# "Plan auth for Next.js + PostgreSQL"

# 2. Plan it out  
cat .agents/planner.md | pbcopy
# "Break into tasks"

# 3. Build backend
cat .agents/backend.md | pbcopy
# "Implement login/signup"

# 4. Build UI
cat .agents/frontend.md | pbcopy
# "Create forms"

# 5. Quality check
cat .agents/reviewer.md | pbcopy
# "Audit the code"
```

**Result:** Production-ready auth in 20 minutes!

## 📚 Resources

- **Full Guide:** `QUICKSTART.md`
- **Examples:** `examples/` directory
- **Customize:** `.agents/CUSTOMIZATION.md`
- **Contribute:** `CONTRIBUTING.md`
- **FAQ:** `.github/FAQ.md`

## ⚠️ Common Mistakes

❌ Not providing context  
✅ **Do:** Add your project details

❌ Using wrong agent  
✅ **Do:** Check cheat sheet above

❌ Skipping review  
✅ **Do:** Always use reviewer before merge

❌ Generic prompts  
✅ **Do:** Be specific about requirements

---

**Score: 82/100** | **Status:** Production Ready ✅
