# 📝 PROJECT CHANGELOG - Decision & Change History

> **Purpose:** Track all decisions and changes so nothing is lost.
> Every significant change or decision gets recorded here.

---

## How to Use This File

1. **Add entries at the TOP** (newest first)
2. **Include:** Date, What changed, Why, Who decided
3. **Tag entries:** [DECISION] | [CHANGE] | [ROLLBACK] | [HOTFIX]

---

## Changelog

### [DATE] - [TITLE] `[TAG]`

**What:** [Brief description of what changed]

**Why:** [Reason for the change]

**Impact:** [What this affects]

**Decision By:** [Who made this decision]

**Rollback Plan:** [How to undo if needed]

---

### [YYYY-MM-DD] - Example: Changed Database Provider `[DECISION]`

**What:** Switched from MongoDB to PostgreSQL

**Why:**
- Need for relational data integrity
- Better support for complex queries
- Team has more PostgreSQL experience

**Impact:**
- All database queries need rewriting
- Prisma schema needs updating
- Migration scripts required

**Decision By:** [Lead Dev]

**Rollback Plan:** Keep MongoDB config files for 30 days

---

### [YYYY-MM-DD] - Example: API Rate Limit Increased `[CHANGE]`

**What:** Increased API rate limit from 100 to 500 req/min

**Why:** Users hitting limits during normal usage

**Impact:** May need to scale infrastructure

**Decision By:** [Product Owner]

**Rollback Plan:** Revert env var `RATE_LIMIT=100`

---

### [YYYY-MM-DD] - Example: Reverted Payment Provider `[ROLLBACK]`

**What:** Rolled back from LemonSqueezy to Stripe

**Why:** LemonSqueezy integration had issues with:
- Tax calculation errors
- Missing webhook events
- EU payment failures

**Impact:**
- Payment code reverted to Stripe implementation
- Need to migrate any LemonSqueezy customers

**Decision By:** [CTO]

**Rollback Plan:** N/A (this is a rollback)

---

## Decision Log Summary

| Date | Decision | Category | Status |
|------|----------|----------|--------|
| [DATE] | [Brief decision] | Tech/Business/Design | Active/Superseded |

---

## Architecture Decision Records (ADRs)

### ADR-001: [Decision Title]
- **Status:** Accepted / Superseded / Deprecated
- **Context:** [Why we needed to make this decision]
- **Decision:** [What we decided]
- **Consequences:** [What happens because of this]

---

*Add new entries at the TOP of this file*
