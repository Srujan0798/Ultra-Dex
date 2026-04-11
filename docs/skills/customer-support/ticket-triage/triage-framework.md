# Ticket Triage: Support Ticket Categorization

**Generated:** 2026-04-11  
**Task:** Categorize incoming support tickets

---

## Triage Framework

### Priority Levels

| Priority      | Definition                 | Response Time | Example                      |
| ------------- | -------------------------- | ------------- | ---------------------------- |
| P1 - Critical | Production down, data loss | 1 hour        | CLI crashes, data corruption |
| P2 - High     | Major feature broken       | 4 hours       | Provider routing fails       |
| P3 - Medium   | Feature not working        | 24 hours      | Dashboard display issues     |
| P4 - Low      | Minor issue, enhancement   | 1 week        | Typo, docs clarification     |

---

## Ticket Categories

### Technical Issues (60%)

| Category    | Examples                 | Routing       |
| ----------- | ------------------------ | ------------- |
| Integration | "Provider X not working" | Engineering   |
| Performance | "Slow response times"    | Engineering   |
| Data        | "Missing memory data"    | Engineering   |
| Security    | "Vulnerability found"    | Security team |

### Product Questions (25%)

| Category        | Examples                    | Routing       |
| --------------- | --------------------------- | ------------- |
| Feature request | "Add provider Y"            | Product       |
| How-to          | "How to set up memory"      | Documentation |
| Pricing         | "Enterprise pricing?"       | Sales         |
| Roadmap         | "When is feature X coming?" | Product       |

### Account Issues (15%)

| Category   | Examples            | Routing |
| ---------- | ------------------- | ------- |
| Access     | "Can't login"       | Support |
| Billing    | "Invoice incorrect" | Finance |
| Enterprise | "SSO setup"         | Sales   |

---

## Example Triage

| Ticket                 | Category                | Priority | Routing         |
| ---------------------- | ----------------------- | -------- | --------------- |
| "CLI crashes on run"   | Technical - Integration | P1       | Engineering     |
| "Add DeepSeek support" | Product - Feature       | P3       | Product         |
| "Need SSO for team"    | Account - Enterprise    | P2       | Sales           |
| "How to use memory?"   | Product - How-to        | P4       | Self-serve (KB) |

---

## Duplicate Detection

| Known Issue           | Duplicate Count | Action                           |
| --------------------- | --------------- | -------------------------------- |
| TS error on deploy    | 8               | Link to existing, prioritize fix |
| Provider timeout      | 12              | Engineering investigate          |
| Memory not persisting | 15              | Feature flag, investigate        |

---

**Triage framework ready!** Apply to all incoming tickets.
