# V20 MARKETING DISPATCHES — User Validation & Market Research

> Source: V2.0 Strategic Plan + /marketing:user-acquisition + /marketing:validation
> Depends: Product v6.0.0 COMPLETE
> Skills Used: /marketing:content, /marketing:community, /marketing:growth

---

## PHASE OVERVIEW

**Thesis:** Validate product-market fit before spending resources on scaling. Get honest feedback from real users. Make data-driven decisions on continue/pivot/stop.

**Success Gate:**

```
# Validation Complete
ultra-dex validation:complete → shows decision matrix with data
# Evidence collected:
- 10+ Reddit responses analyzed
- 3-5 user interviews completed
- Decision made: CONTINUE / PIVOT / STOP
```

**Total Windows:** 3 (Validation Week)
**Parallel Safe:** Yes - can run simultaneously

---

## ═══════════════════════════════════════════════

## WEEK: USER VALIDATION SPRINT

## ═══════════════════════════════════════════════

### Gate: Clear evidence of user need OR clear evidence to pivot

---

### [WINDOW M1] KIMI — Community Engagement

Task ID: V20-M1-REDDIT-POSTS
Objective: Post on 3 subreddits to get honest user feedback
Target Files: .protocol/marketing/reddit-posts.md, .protocol/marketing/response-tracker.md
Why this lane: KIMI for systematic execution following established patterns
Power Tier: MEDIUM

Command:

```bash
kimi exec "Post Ultra-Dex validation posts on Reddit"

FILES:
- .protocol/marketing/reddit-posts.md (3 posts prepared)
- .protocol/marketing/response-tracker.md (tracking template)

POSTS TO CREATE:
1. r/LocalLLaMA: "Built AI routing tool for 2 months - is this useful or should I kill it?"
2. r/SaaS: "Built for 2 months, $0 revenue - continue or validate first?"
3. r/Entrepreneur: "Solo dev, 2 months building - am I doing this wrong?"

SUCCESS CRITERIA:
- All 3 posts live within 1 hour
- Tracking file updated with post URLs
- Username recorded for monitoring

FOLLOW-UP TASKS (Hour 1-24):
- Monitor responses every 2 hours
- Reply to every comment with follow-up question
- DM anyone who expresses interest
- Schedule 3-5 user interviews

TRACK IN: .protocol/marketing/response-tracker.md
```

Validation:

```bash
# Verify posts are live
cat .protocol/marketing/response-tracker.md | grep "Post URL"

# Verify tracking is active
cat .protocol/marketing/response-tracker.md | grep "Total Comments"
```

---

### [WINDOW M2] COWRK — User Interview Execution

Task ID: V20-M2-USER-INTERVIEWS
Objective: Conduct 3-5 user interviews to understand actual needs
Target Files: .protocol/marketing/user-interview-script.md, .protocol/marketing/response-tracker.md
Why this lane: COWRK for systematic interview coordination
Power Tier: MEDIUM

Command:

```bash
cowrk exec "Coordinate user interviews for Ultra-Dex validation"

FILES:
- .protocol/marketing/user-interview-script.md (15 questions)
- .protocol/marketing/response-tracker.md (interview tracking)

INTERVIEW SCHEDULE:
Day 1-2: Reach out to 10 interested people from Reddit
Day 3-5: Conduct 3-5 interviews (30 min each)
Day 6: Analyze patterns
Day 7: Make decision

INTERVIEW QUESTIONS (from script):
1. "How many AI providers do you currently use?"
2. "How do you decide which provider/model to use?"
3. "What's your biggest pain point with managing multiple providers?"
4. "Would you pay $50/month for automatic cost optimization?"
5. "What's the ONE feature that would make you try this immediately?"

OUTPUT:
- Interview notes in response-tracker.md
- Pattern analysis: what do all users want?
- Decision recommendation: CONTINUE / PIVOT / STOP

TRACK IN: .protocol/marketing/response-tracker.md
```

Validation:

```bash
# Verify interviews scheduled
cat .protocol/marketing/response-tracker.md | grep "Scheduled"

# Verify interviews completed
cat .protocol/marketing/response-tracker.md | grep "Done"
```

---

### [WINDOW M3] CLAUDE — Decision Documentation

Task ID: V20-M3-DECISION-FRAMEWORK
Objective: Document clear decision based on user feedback
Target Files: .protocol/state/validation-decision.md
Why this lane: CLAUDE for structured decision documentation
Power Tier: MEDIUM

Command:

```bash
claude exec "Document validation decision with evidence"

ANALYZE:
- Reddit response data (from response-tracker.md)
- User interview notes (5 interviews)
- Patterns identified

DECISION MATRIX:
CONTINUE: If 5+ people interested + 3+ willing to pay
  → Strip to ONE feature
  → Delete 90% of code
  → Ship MVP in 2 weeks

PIVOT: If users want something different
  → Identify new direction
  → Keep 20% of code
  → Ship MVP in 2 weeks

STOP: If <3 people interested
  → Document learnings
  → Archive project OR
  → Take job/build nights

OUTPUT: .protocol/state/validation-decision.md
- Executive summary
- Evidence (screenshots/quotes)
- Decision with rationale
- Next steps
- Timeline

PUBLISH: Update all agents on decision
```

Validation:

```bash
# Verify decision documented
cat .protocol/state/validation-decision.md | grep "DECISION:"

# Verify next steps defined
cat .protocol/state/validation-decision.md | grep "Next Steps:"
```

---

## WINDOW SUMMARY

| Window | Agent  | Task            | Status     |
| ------ | ------ | --------------- | ---------- |
| M1     | KIMI   | Reddit posts    | ⏳ Pending |
| M2     | COWRK  | User interviews | ⏳ Pending |
| M3     | CLAUDE | Decision doc    | ⏳ Pending |

**Gate:** Clear evidence-based decision documented

---

## EVIDENCE COLLECTION CHECKLIST

- [ ] Posts live on r/LocalLLaMA, r/SaaS, r/Entrepreneur
- [ ] 10+ total responses collected
- [ ] 3-5 user interviews completed
- [ ] Decision made: CONTINUE / PIVOT / STOP
- [ ] Next steps documented
- [ ] Timeline set

---

## RISK FACTORS

**Low Response Rate:**

- Post at optimal times (8am, 12pm, 6pm EST)
- Cross-post to related communities
- Use Twitter/X as backup

**Negative Feedback:**

- Don't take personally
- Look for patterns
- Negative is data, not failure

**No Clear Signal:**

- Extend by 2 days
- DM more people
- Ask more specific questions

---

## SUCCESS METRICS

| Metric           | Target       | Status |
| ---------------- | ------------ | ------ |
| Reddit posts     | 3            | ⏳     |
| Responses        | 10+          | ⏳     |
| User interviews  | 3-5          | ⏳     |
| Interested users | 5+           | ⏳     |
| Willing to pay   | 3+           | ⏳     |
| Decision         | YES/NO/PIVOT | ⏳     |

---

_Marketing Phase Dispatches v1.0_
_Generated: 2026-04-12_
_Status: PENDING EXECUTION_
