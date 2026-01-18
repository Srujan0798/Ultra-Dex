# How to Use Ultra-Dex

> **The Right Way:** Use Ultra-Dex as a **compass**, not a **checklist**. Fill sections as you need them, not all at once.

---

## The Golden Rule

**Start coding after 20% of documentation.**

Don't fill all 34 sections before writing code. That's the paralysis trap.

---

## Phase-Based Approach

### Phase 1: Foundation (Week 1-2)

**Fill ONLY these sections before coding:**

| Section | What to Fill | Time |
|---------|--------------|------|
| 1. High-Level Summary | 2-sentence description | 10 min |
| 2. Core Features | P0 features only (3-5 max) | 30 min |
| 4. User Personas | 2-3 personas max | 20 min |
| 6. Screen/Page Map | Core screens only | 30 min |
| 10. Data Model | Core entities only | 1 hour |
| 11. API Blueprint | Core endpoints only | 1 hour |
| 12. System Architecture | High-level diagram | 30 min |
| 15. Tech Stack | Your choices | 15 min |

**Total: ~4-5 hours**

**Then START CODING:**
- Set up project structure
- Implement database models from Section 10
- Build API endpoints from Section 11
- Create basic pages from Section 6

---

### Phase 2: Core Development (Week 3-8)

**Fill as you build:**

| Section | When to Fill | How |
|---------|--------------|-----|
| 9. Feature Specs | Before each feature | One feature at a time |
| 16. Implementation Plan | Weekly update | Track progress |
| 20. Test Plan | As you code | Write tests alongside code |

**Use the 21-step as quality gates, not ceremony:**

```
Planning (Steps 1-5):     30 min team meeting
Implementation (6-10):    Developer work
Review (11-15):           PR checklist
Verification (16-21):     QA/staging check
```

---

### Phase 3: Polish (Week 9-12)

**Fill production sections:**

| Section | Fill When |
|---------|-----------|
| 19. Deployment Plan | Before first deploy |
| 21. Security Guidelines | Before production |
| 22. Non-Functional Requirements | Performance tuning |
| 27. Error Handling | After core features |
| 28. Legal & Compliance | Before public launch |

---

## Choose Your Path

### For Solo Developers

**Simplified workflow:**

```
1. Fill Sections 1-12 only (2-3 hours)
2. Skip to Section 16 for tasks
3. Use 5-step mini-checklist (below)
```

#### Solo Developer: 5-Step Mini-Checklist

For bug fixes and small changes, use this simplified version:

| Step | Question | Time |
|------|----------|------|
| 1. Plan | What exactly am I changing? | 5 min |
| 2. Code | Does it work? Manual test passed? | 4-8 hours |
| 3. Test | Did I add/update tests? | 30 min |
| 4. Document | Any comments needed for complex logic? | 10 min |
| 5. Deploy | Can I deploy this without breaking things? | 15 min |

**Use full 21-step for:** New features, security changes, database migrations, API changes.

**Skip these entirely:** Sections 23-26, 31-34 (unless specifically needed)

---

### For Teams (2-10 people)

**Weekly rhythm:**

```
Monday Planning:
- Team huddle (30 min)
- Fill Section 9 for this week's feature
- Break into 4-9 hour tasks

Wednesday Check-in:
- Adjust estimates
- Unblock issues

Friday Review:
- Code review with 21-step checklist
- Update Section 16
- QA verification
```

---

### For Enterprise/Agency

**Use full template but phase it:**

```
Week 1-2:    Sections 1-12 (Foundation)
Week 3-4:    Sections 13-18 (Development Plan)
Week 5-8:    Sections 19-24 (Production Prep)
Week 9-12:   Sections 25-34 (Polish & Compliance)
```

---

## Section Picker by App Type

### B2B SaaS (Stripe, Linear, Notion style)

**High Priority:**
- Section 21: Security Guidelines
- Section 27: Error Handling
- Section 28: Legal & Compliance
- Section 22: Non-Functional Requirements

**Lower Priority:**
- Section 29: SEO (less critical for B2B)
- Section 30: i18n (start with one language)

---

### Consumer App (Instagram, TikTok style)

**High Priority:**
- Section 29: SEO Strategy
- Section 30: Internationalization
- Section 32: Real-time Features
- Section 22: Performance (critical for UX)

**Lower Priority:**
- Section 28: Legal (simpler for consumer)
- Section 34: AI/ML (unless core feature)

---

### Marketplace (Airbnb, Uber style)

**High Priority:**
- Section 21: Security (payment handling)
- Section 27: Error Handling (transactions)
- Section 28: Legal (two-sided compliance)
- Section 32: Real-time (matching, notifications)

**Lower Priority:**
- Section 34: AI/ML (add later for recommendations)

---

### Enterprise SaaS (Salesforce, ServiceNow style)

**Use ALL sections, but:**
- Focus heavily on Sections 21-23 (Security, Performance, Risks)
- Section 28: Legal (SOC2, GDPR, etc.)
- Section 31: Feature Flags (enterprise rollouts)

---

## The Living Document Approach

**Don't fill sections you haven't hit yet.**

When you encounter a problem:
1. Open the relevant section
2. Fill it with YOUR specific solution
3. Move on

**Example:**
- Hit a caching issue? Open Section 22 (Non-Functional), fill the caching part
- Adding Stripe? Open Section 11 (API), add payment endpoints
- Need error pages? Open Section 27, fill error handling strategy

---

## Common Mistakes

### Mistake 1: Filling Everything First

**Wrong:** "I'll fill all 34 sections, THEN start coding"
**Right:** "I'll fill 8 sections, code for 2 weeks, fill more as needed"

### Mistake 2: 21-Step for Everything

**Wrong:** Following all 21 steps for a 2-hour bug fix
**Right:** Full 21-step for new features, quick 5-step for fixes

### Mistake 3: Solo Dev Using Team Process

**Wrong:** One person doing team ceremonies alone
**Right:** Adapted solo workflow (see above)

### Mistake 4: Ignoring the Template Entirely

**Wrong:** "Templates are bureaucracy, I'll wing it"
**Right:** Use it as reference when you hit problems

---

## Quick Reference

### Minimum Viable Documentation

If you only have 2 hours:

```
Section 1:  What are you building? (10 min)
Section 2:  Top 3 features (20 min)
Section 10: Core data model (30 min)
Section 11: Main API endpoints (30 min)
Section 15: Tech stack (10 min)
Section 16: First 10 tasks (20 min)
```

Then **start coding**.

---

### When to Reference Each Section

| You're Doing... | Open Section... |
|-----------------|-----------------|
| Starting the project | 1, 2, 15 |
| Designing database | 10 |
| Building APIs | 11 |
| Creating UI | 6, 7, 8 |
| Writing a feature | 9 |
| Planning sprint | 16 |
| Deploying | 19 |
| Writing tests | 20 |
| Security audit | 21 |
| Performance issues | 22 |
| Error handling | 27 |
| Legal/compliance | 28 |
| SEO setup | 29 |
| Adding i18n | 30 |
| Feature flags | 31 |
| Real-time features | 32 |

---

## Summary

1. **Start with 8 sections** (Phase 1)
2. **Code immediately** after foundation
3. **Fill sections as you hit problems**
4. **Adapt 21-step to your team size**
5. **Skip what doesn't apply**
6. **Update docs as you build, not before**

**Ultra-Dex is your compass, not your chains.**

---

*"Do it right the first time, verify it the 21st time - but only for things that matter."*

---

## Navigation

| ← Previous | Current | Next → |
|------------|---------|--------|
| [01-QUICK-START](./01-QUICK-START.md) | **02-HOW-TO-USE** | [03-METHODOLOGY](./03-METHODOLOGY.md) |
