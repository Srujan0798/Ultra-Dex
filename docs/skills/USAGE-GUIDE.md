# 📖 Claude Plugins Skills - Usage Guide

> **How to use these skills with Claude in your project**

---

## Quick Reference: How to Invoke Skills

When working with Claude, use the slash command format:

```
/plugin:skill "your prompt"
```

Example: `/engineering:tech-debt` → "Scan Ultra-Dex for technical debt"

---

## Engineering Skills

| Skill                | Invocation                       | Example Prompt                                  |
| -------------------- | -------------------------------- | ----------------------------------------------- |
| `/architecture`      | `/engineering:architecture`      | "Should we use tsx vs ts-node for test runner?" |
| `/code-review`       | `/engineering:code-review`       | "Review PR #287 for security issues"            |
| `/debug`             | `/engineering:debug`             | "Debug the 64 test failures in Cycle 4"         |
| `/testing-strategy`  | `/engineering:testing-strategy`  | "Design test plan for DI container"             |
| `/system-design`     | `/engineering:system-design`     | "Design distributed mesh deployment"            |
| `/tech-debt`         | `/engineering:tech-debt`         | "Scan codebase for tech debt"                   |
| `/deploy-checklist`  | `/engineering:deploy-checklist`  | "Generate pre-deployment checklist"             |
| `/documentation`     | `/engineering:documentation`     | "Write runbook for production"                  |
| `/standup`           | `/engineering:standup`           | "Summarize last week's commits"                 |
| `/incident-response` | `/engineering:incident-response` | "Handle production outage"                      |

---

## Data Skills

| Skill              | Invocation              | Example Prompt                     |
| ------------------ | ----------------------- | ---------------------------------- |
| `/analyze`         | `/data:analyze`         | "Analyze test results trend"       |
| `/build-dashboard` | `/data:build-dashboard` | "Build dashboard for test metrics" |
| `/explore-data`    | `/data:explore-data`    | "Profile dataset quality"          |
| `/sql-queries`     | `/data:sql-queries`     | "Write query for audit logs"       |
| `/validate-data`   | `/data:validate-data`   | "Validate analysis methodology"    |
| `/create-viz`      | `/data:create-viz`      | "Create chart for usage metrics"   |

---

## Product Management Skills

| Skill                  | Invocation                                | Example Prompt                      |
| ---------------------- | ----------------------------------------- | ----------------------------------- |
| `/write-spec`          | `/product-management:write-spec`          | "Write spec for plugin marketplace" |
| `/roadmap-update`      | `/product-management:roadmap-update`      | "Update Q2-Q4 roadmap"              |
| `/sprint-planning`     | `/product-management:sprint-planning`     | "Plan Sprint 17"                    |
| `/competitive-brief`   | `/product-management:competitive-brief`   | "Compare vs LangChain/CrewAI"       |
| `/stakeholder-update`  | `/product-management:stakeholder-update`  | "Generate exec update"              |
| `/synthesize-research` | `/product-management:synthesize-research` | "Synthesize user interview notes"   |

---

## Operations Skills

| Skill                  | Invocation                        | Example Prompt                  |
| ---------------------- | --------------------------------- | ------------------------------- |
| `/capacity-plan`       | `/operations:capacity-plan`       | "Plan Q3 team capacity"         |
| `/change-request`      | `/operations:change-request`      | "Create CR for Redis migration" |
| `/compliance-tracking` | `/operations:compliance-tracking` | "Track SOC 2 compliance"        |
| `/process-doc`         | `/operations:process-doc`         | "Document bug tracking process" |
| `/risk-assessment`     | `/operations:risk-assessment`     | "Assess v3.2.0 launch risks"    |
| `/runbook`             | `/operations:runbook`             | "Write deployment runbook"      |
| `/vendor-review`       | `/operations:vendor-review`       | "Review Render.com hosting"     |

---

## Enterprise Search Skills

| Skill                  | Invocation                               | Example Prompt                     |
| ---------------------- | ---------------------------------------- | ---------------------------------- |
| `/search`              | `/enterprise-search:search`              | "Find ADR about memory"            |
| `/digest`              | `/enterprise-search:digest`              | "Generate weekly activity digest"  |
| `/knowledge-synthesis` | `/enterprise-search:knowledge-synthesis` | "Synthesize architecture decision" |

---

## Design Skills

| Skill                    | Invocation                     | Example Prompt             |
| ------------------------ | ------------------------------ | -------------------------- |
| `/accessibillity-review` | `/design:accessibility-review` | "Audit dashboard for WCAG" |
| `/design-critique`       | `/design:design-critique`      | "Review CLI interface"     |
| `/design-handsoff`       | `/design:design-handsoff`      | "Generate component specs" |
| `/ux-copy`               | `/design:ux-copy`              | "Write error messages"     |
| `/frontend-design`       | `/design:frontend-design`      | "Create a bold landing page for developers" |

---

## Usage Notes

1. **Context matters** - These docs in `docs/skills/` provide context for the skills
2. **Works best after** - Run skills AFTER reviewing relevant docs in this folder
3. **Combine skills** - Use multiple skills together (e.g., tech-debt + testing-strategy)

---

**Created:** 2026-04-11  
**Use this guide** when invoking skills in future Claude sessions
