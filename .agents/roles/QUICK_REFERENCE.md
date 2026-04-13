# Ultra-Dex Quick Reference Card

## 🚀 Quick Start (30 seconds)

```bash
cat .agents/backend.md | pbcopy  # Copy agent
# Paste into AI + your context
# Build!
```

## 📋 Agent Cheat Sheet

| Agent      | When to Use                      | Time  |
| ---------- | -------------------------------- | ----- |
| `cto`      | Starting project, tech decisions | 2 min |
| `planner`  | Complex features, timelines      | 2 min |
| `backend`  | API, database, auth              | 5 min |
| `frontend` | UI, components, state            | 5 min |
| `reviewer` | Before merge, quality check      | 3 min |
| `debugger` | Something broken                 | 5 min |
| `devops`   | Deploy to production             | 3 min |
| `auth`     | Security, login, permissions     | 4 min |
| `database` | Schema, migrations, queries      | 4 min |

## 🔥 Common Workflows

1. **Build Feature**: cto → planner → backend → frontend → reviewer
2. **Fix Bug**: debugger → fix → reviewer → deploy
3. **Code Review**: reviewer → fix issues → re-review → merge

## 💡 Pro Tips

- Always include your CONTEXT.md
- Chain agents for best results
- Use reviewer before every merge
- Customize agents for your stack

## 📚 Full Docs

- `QUICKSTART.md` - 30-second guide
- `examples/` - Complete workflows
- `.agents/CUSTOMIZATION.md` - Advanced usage
