# Ultra-Dex Troubleshooting Guide

> Common problems and how to solve them.

---

## 🤯 "I'm feeling overwhelmed by 34 sections!"

**Solution:** You don't need all 34 sections.

1. **Read [02-HOW-TO-USE.md](../@%20Ultra%20DeX/Saas%20plan/02-HOW-TO-USE.md)** first
2. Fill ONLY Sections 1-12 (Phase 1) before coding
3. Start coding after 4-5 hours of planning
4. Come back to other sections as you hit problems

**Think of it this way:** 34 sections exist so nothing is forgotten. You fill them when needed, not all upfront.

---

## 🛑 "I filled QUICK-START but don't know what's next"

**Follow this path:**

```
1. QUICK-START.md ✅ (Done - 5 min)
   ↓
2. Read 02-HOW-TO-USE.md (10 min)
   ↓
3. Fill Sections 1-12 in 04-Imp-Template.md (4-5 hours)
   ↓
4. START CODING 🚀
```

**Key insight:** Most people skip step 2 and go straight to the template. DON'T. The phased approach saves you days.

---

## ⏱️ "The 21-step feels too heavy for my small fix"

**Use the 5-step mini-checklist instead:**

| Step | Question | Time |
|------|----------|------|
| 1. Plan | What exactly am I changing? | 5 min |
| 2. Code | Does it work? Manual test passed? | 1-2 hours |
| 3. Test | Did I add/update tests? | 15 min |
| 4. Document | Any comments needed? | 5 min |
| 5. Deploy | Can I deploy safely? | 10 min |

**When to use 5-step:** Bug fixes, UI tweaks, config changes, docs updates.

**When to use full 21-step:** New features, database changes, API changes, security fixes.

---

## 👤 "I'm a solo developer - can I skip sections?"

**Yes! Here's your minimal path:**

**Must fill:**
- Section 1: High-Level Summary
- Section 2: Core Features
- Section 10: Data Model
- Section 11: API Blueprint
- Section 15: Tech Stack
- Section 16: Implementation Plan (tasks)

**Skip entirely:**
- Sections 23-26: Stakeholder/Compliance (solo = skip)
- Sections 31-34: Advanced (add later if needed)

**Fill when you hit the problem:**
- Section 19: Deployment (when you deploy)
- Section 21: Security (before production)
- Section 27: Error Handling (when you need logging)

---

## 🔗 "The links are broken when I copy files locally"

**Why:** The CLI copies only essential files. Internal links point to files that aren't copied.

**Solutions:**

1. **Use full template option:**
   ```bash
   npx ultra-dex init --include-full-template
   ```

2. **Reference GitHub directly:**
   - Open [Ultra-Dex repo](https://github.com/Srujan0798/Ultra-Dex)
   - Keep it in a browser tab while working

3. **Clone the whole repo:**
   ```bash
   git clone https://github.com/Srujan0798/Ultra-Dex.git
   ```

---

## 🤖 "Which cursor-rules should I load?"

**Quick guide:**

| Working On | Load These |
|------------|------------|
| Starting project | `00-ultra-dex-core.mdc` only |
| Database schema | + `01-database.mdc` |
| API routes | + `02-api.mdc` |
| Authentication | + `03-auth.mdc` |
| React/Vue/Svelte | + `04-frontend.mdc` |
| Stripe/payments | + `05-payments.mdc` |
| Writing tests | + `06-testing.mdc` |

**Rule:** Start with core, add domain rules as you work on that domain.

---

## 📊 "How do I know if I'm on track?"

**Phase 1 complete when:**
- [ ] Sections 1-12 filled
- [ ] First commit pushed
- [ ] Database schema designed
- [ ] Core entity models created

**Phase 2 in progress when:**
- [ ] At least 3 features shipped
- [ ] 21-step used for 5+ tasks
- [ ] API endpoints working

**Phase 3 ready when:**
- [ ] Sections 19-28 filled
- [ ] All tests passing
- [ ] Deployment script working
- [ ] Ready for production

---

## 🚨 Still Stuck?

1. **Check the examples:** [TaskFlow-Complete.md](../@%20Ultra%20DeX/Saas%20plan/Examples/TaskFlow-Complete.md)
2. **Search the section:** Ctrl+F for "SECTION 10" to see how it's filled
3. **Ask your AI:** Paste the section template + your context

---

> **Remember:** Ultra-Dex is a skeleton, not a cage. Modify, skip, and adapt as needed.
