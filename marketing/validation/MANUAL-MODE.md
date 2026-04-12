# MANUAL VALIDATION MODE

> No Reddit API required. Do everything manually.

---

## QUICK START (No Setup Required)

### Step 1: Copy the Posts (2 minutes)

```bash
# Open this file
cat marketing/validation/reddit-posts.md

# Copy Post 1 (r/LocalLLaMA)
# Copy Post 2 (r/SaaS)
# Copy Post 3 (r/Entrepreneur)
```

### Step 2: Post Manually (5 minutes)

1. Go to https://reddit.com/r/LocalLLaMA/submit
2. Paste the post
3. Click "Post"
4. Repeat for r/SaaS and r/Entrepreneur

### Step 3: Track Responses (Ongoing)

Open: `marketing/validation/response-tracker.md`

- Fill in your Reddit username
- Copy-paste responses as they come
- Mark sentiment (positive/negative/neutral)

### Step 4: Do Interviews (This Week)

Use: `marketing/validation/user-interview-script.md`

- DM interested users manually
- Schedule calls via Calendly (free)
- Take notes in response-tracker.md

### Step 5: Make Decision (Weekend)

Based on data in response-tracker.md:

- **5+ interested** → Continue
- **Different need** → Pivot
- **<3 interested** → Stop

---

## FILES YOU USE

| File                       | Purpose                 |
| -------------------------- | ----------------------- |
| `reddit-posts.md`          | Copy these posts        |
| `response-tracker.md`      | Track all responses     |
| `user-interview-script.md` | Questions to ask        |
| `DECISION.md`              | Final decision template |

---

## TIMELINE

| Day     | Task                        | Time       |
| ------- | --------------------------- | ---------- |
| Day 1   | Post to 3 subreddits        | 10 min     |
| Day 2-3 | Reply to comments, DM users | 30 min/day |
| Day 4-5 | Do 3-5 user interviews      | 1 hour/day |
| Day 6   | Analyze patterns            | 1 hour     |
| Day 7   | Make decision               | 30 min     |

---

## NO AUTOMATION NEEDED

**Skip these files:**

- ❌ `src/automation/` (not needed)
- ❌ Reddit API setup
- ❌ `.env.local` automation variables

**Just use:**

- ✅ Your Reddit account
- ✅ Copy-paste posts
- ✅ Manual tracking

---

## DECISION CRITERIA

### CONTINUE if:

- [ ] 5+ people say "I need this"
- [ ] 3+ willing to pay $50/month
- [ ] Clear feature they want

### PIVOT if:

- [ ] Users want something different
- [ ] Clear alternative direction
- [ ] Existing code reusable

### STOP if:

- [ ] <3 people interested
- [ ] "Use LiteLLM instead"
- [ ] No clear demand

---

## POSTS READY TO COPY

See: `marketing/validation/reddit-posts.md`

---

**Start now: Copy Post 1 and submit to r/LocalLLaMA**
